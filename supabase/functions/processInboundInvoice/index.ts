import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Process Inbound Invoice Edge Function
 * 
 * Receives webhook from Resend Inbound when an email is sent to
 * {company}@facturatie.paintconnect.be
 * 
 * Flow:
 * 1. Parse incoming email from Resend webhook
 * 2. Find company by inbound email address
 * 3. Extract PDF attachments
 * 4. Upload PDFs to Supabase Storage
 * 5. Call Google Cloud Vision API for OCR
 * 6. Use Claude API to extract structured invoice data
 * 7. Create SupplierInvoice record
 * 8. Notify company admins
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Invoice extraction schema for Claude
const INVOICE_EXTRACTION_PROMPT = `Je bent een expert in het analyseren van leveranciersfacturen voor schildersbedrijven.
Analyseer de volgende OCR-tekst van een factuur en extraheer ALLE relevante informatie.

Retourneer een JSON object met exact deze structuur:
{
  "supplier": {
    "name": "Naam leverancier",
    "address": "Volledig adres",
    "vat_number": "BTW nummer indien aanwezig",
    "email": "Email indien aanwezig",
    "phone": "Telefoonnummer indien aanwezig",
    "iban": "IBAN bankrekeningnummer indien aanwezig",
    "bic": "BIC code indien aanwezig"
  },
  "invoice": {
    "number": "Factuurnummer",
    "date": "YYYY-MM-DD formaat",
    "due_date": "YYYY-MM-DD formaat indien aanwezig",
    "reference": "Referentie/PO nummer indien aanwezig",
    "document_type": "factuur|creditnota|leveringsbon|pakbon|afhaalbon|bestelbon|offerte|onbekend"
  },
  "totals": {
    "subtotal_excl_vat": 0.00,
    "vat_amount": 0.00,
    "total_incl_vat": 0.00,
    "discount_total": 0.00
  },
  "payment": {
    "method": "overschrijving|bancontact|cash|onbekend",
    "structured_reference": "Gestructureerde mededeling +++XXX/XXXX/XXXXX+++ indien aanwezig",
    "payment_terms": "Betalingstermijn in dagen indien vermeld"
  },
  "line_items": [
    {
      "sku": "Artikelnummer/productcode",
      "name": "Productnaam/omschrijving",
      "quantity": 1,
      "unit": "stuk|liter|m2|kg|rol|doos|pak|meter",
      "gross_unit_price": 0.00,
      "discount": 0,
      "unit_price": 0.00,
      "total_price": 0.00,
      "vat_rate": 21,
      "category": "verf|primer|lak|klein_materiaal|toebehoren|gereedschap|onbekend"
    }
  ],
  "confidence": 0.95,
  "notes": "Eventuele opmerkingen of waarschuwingen over de extractie"
}

BELANGRIJKE REGELS:
- Alle prijzen in EUR, 2 decimalen
- unit_price = brutoprijs MINUS korting
- total_price = unit_price * quantity
- Categoriseer producten zo goed mogelijk (verf, primer, lak, klein_materiaal, toebehoren)
- Als iets onduidelijk is, gebruik confidence < 0.8 en leg uit in notes
- Datums ALTIJD in YYYY-MM-DD formaat
- BTW-tarieven in België: meestal 21%, soms 6%

OCR TEKST:
`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const webhookPayload = await req.json()
    
    // Resend Inbound wraps email data in a 'data' object
    // Structure: { type: "email.received", data: { to, from, subject, attachments, ... } }
    const emailData = webhookPayload.data || webhookPayload
    
    console.log('[processInboundInvoice] Received webhook:', {
      type: webhookPayload.type,
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      attachmentsCount: emailData.attachments?.length || 0
    })

    // Extract recipient email (the inbound address)
    const toEmail = Array.isArray(emailData.to) 
      ? emailData.to[0]?.toLowerCase() 
      : emailData.to?.toLowerCase()
    
    if (!toEmail) {
      console.error('[processInboundInvoice] No recipient email found in:', emailData)
      return new Response(
        JSON.stringify({ success: false, error: 'No recipient email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('[processInboundInvoice] Looking for company with inbound email:', toEmail)

    // Find company by inbound email address
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, inbound_email_address')
      .eq('inbound_email_address', toEmail)
      .single()

    if (companyError || !company) {
      console.error('[processInboundInvoice] Company not found for email:', toEmail, companyError)
      return new Response(
        JSON.stringify({ success: false, error: 'Company not found for this email address', email: toEmail }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('[processInboundInvoice] Found company:', company.name, company.id)

    // Get sender info - Resend uses string for 'from', not object
    const fromEmail = typeof emailData.from === 'string' ? emailData.from : (emailData.from?.address || 'unknown')
    const fromName = typeof emailData.from === 'string' ? emailData.from.split('@')[0] : (emailData.from?.name || 'unknown')
    const subject = emailData.subject || 'Geen onderwerp'

    // Check for PDF attachments - Resend uses content_type, not contentType
    const attachments = emailData.attachments || []
    const pdfAttachments = attachments.filter((att: any) => 
      att.content_type === 'application/pdf' || 
      att.contentType === 'application/pdf' || 
      att.filename?.toLowerCase().endsWith('.pdf')
    )

    if (pdfAttachments.length === 0) {
      console.log('[processInboundInvoice] No PDF attachments, creating record with email body only')
      
      // Create invoice record without PDF
      const { data: invoice, error: invoiceError } = await supabase
        .from('supplier_invoices')
        .insert({
          company_id: company.id,
          supplier_name: fromName,
          supplier_email: fromEmail,
          invoice_number: null,
          invoice_date: new Date().toISOString().split('T')[0],
          total_amount: 0,
          status: 'needs_manual_review',
          notes: `Email ontvangen zonder PDF bijlage.\n\nOnderwerp: ${subject}\n\nInhoud:\n${emailData.text || emailData.html || 'Geen inhoud'}`,
          source: 'email_inbound',
          original_email_subject: subject,
          original_email_from: fromEmail
        })
        .select()
        .single()

      if (invoiceError) {
        console.error('[processInboundInvoice] Error creating invoice record:', invoiceError)
        throw invoiceError
      }

      // Notify admins
      await notifyAdmins(supabase, company.id, fromName, 'Geen PDF bijlage - handmatige verwerking vereist')

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email received but no PDF attachment found',
          invoice_id: invoice.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Process each PDF attachment
    const processedInvoices = []
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    // #region DEBUG: Log full attachment structure
    console.log('[DEBUG-HYP-A] Full emailData keys:', Object.keys(emailData))
    console.log('[DEBUG-HYP-B] email_id value:', emailData.email_id)
    console.log('[DEBUG-HYP-B] id value:', emailData.id)
    console.log('[DEBUG-HYP-C] RESEND_API_KEY present:', !!RESEND_API_KEY)
    console.log('[DEBUG-HYP-D] Raw attachments:', JSON.stringify(pdfAttachments.map((a: any) => ({
      filename: a.filename,
      id: a.id,
      hasContent: !!a.content,
      hasData: !!a.data,
      content_type: a.content_type,
      size: a.size,
      keys: Object.keys(a)
    }))))
    // #endregion
    
    for (const attachment of pdfAttachments) {
      try {
        console.log('[processInboundInvoice] Processing attachment:', attachment.filename, 'ID:', attachment.id)
        
        let pdfContent: Uint8Array | null = null
        
        // Check if content is included directly (base64)
        if (attachment.content) {
          console.log('[DEBUG-HYP-D] Using base64 content from webhook, length:', attachment.content.length)
          pdfContent = Uint8Array.from(atob(attachment.content), c => c.charCodeAt(0))
        } 
        // Fetch attachments from Resend Inbound API (correct endpoint per Resend support)
        else {
          // Try different email_id fields
          const emailId = emailData.email_id || emailData.id || emailData.message_id
          console.log('[DEBUG-HYP-B] Resolved emailId:', emailId, 'from fields:', {
            email_id: emailData.email_id,
            id: emailData.id,
            message_id: emailData.message_id
          })
          
          if (emailId && RESEND_API_KEY) {
            console.log('[processInboundInvoice] Fetching attachments from Resend Inbound API...')
            
            // Correct endpoint for inbound/receiving emails
            const attachmentUrl = `https://api.resend.com/emails/receiving/${emailId}/attachments`
            console.log('[DEBUG-HYP-C] Fetching URL:', attachmentUrl)
            
            const attachmentsResponse = await fetch(attachmentUrl, {
              headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
            })
            
            console.log('[DEBUG-HYP-C] Response status:', attachmentsResponse.status)
            
            if (attachmentsResponse.ok) {
              const attachmentsData = await attachmentsResponse.json()
              console.log('[DEBUG-HYP-E] Attachments API response structure:', {
                hasData: !!attachmentsData.data,
                isArray: Array.isArray(attachmentsData),
                keys: Object.keys(attachmentsData),
                preview: JSON.stringify(attachmentsData).substring(0, 800)
              })
              
              // Find this attachment by ID or filename
              const attachmentsList = attachmentsData?.data || (Array.isArray(attachmentsData) ? attachmentsData : [])
              console.log('[DEBUG-HYP-E] Attachments list length:', attachmentsList.length)
              
              const fullAttachment = attachmentsList.find((a: any) => 
                a.id === attachment.id || a.filename === attachment.filename
              )
              
              if (fullAttachment) {
                console.log('[DEBUG-HYP-E] Found matching attachment:', {
                  hasContent: !!fullAttachment.content,
                  hasData: !!fullAttachment.data,
                  hasDownloadUrl: !!fullAttachment.download_url,
                  keys: Object.keys(fullAttachment)
                })
              }
              
              if (fullAttachment?.content) {
                console.log('[processInboundInvoice] Found attachment content!')
                pdfContent = Uint8Array.from(atob(fullAttachment.content), c => c.charCodeAt(0))
              } else if (fullAttachment?.data) {
                // Some APIs return data instead of content
                console.log('[processInboundInvoice] Found attachment data!')
                pdfContent = Uint8Array.from(atob(fullAttachment.data), c => c.charCodeAt(0))
              } else if (fullAttachment?.download_url) {
                // Resend Inbound returns a signed download_url for attachments
                console.log('[processInboundInvoice] Fetching PDF from download_url...')
                console.log('[DEBUG-FIX] download_url:', fullAttachment.download_url.substring(0, 100))
                
                const pdfResponse = await fetch(fullAttachment.download_url)
                
                if (pdfResponse.ok) {
                  const pdfBuffer = await pdfResponse.arrayBuffer()
                  pdfContent = new Uint8Array(pdfBuffer)
                  console.log('[DEBUG-FIX] PDF downloaded successfully, size:', pdfContent.length, 'bytes')
                } else {
                  console.error('[DEBUG-FIX] Failed to download PDF:', pdfResponse.status, await pdfResponse.text())
                }
              } else {
                console.log('[DEBUG-HYP-E] Attachment found but no content/download_url:', Object.keys(fullAttachment || {}))
              }
            } else {
              const errorText = await attachmentsResponse.text()
              console.log('[DEBUG-HYP-C] Could not fetch attachments:', attachmentsResponse.status, errorText)
            }
          } else {
            console.log('[DEBUG-HYP-B/C] Missing emailId or API key:', { emailId, hasApiKey: !!RESEND_API_KEY })
          }
        }
        
        // If we still don't have content, create a placeholder record
        if (!pdfContent) {
          console.log('[processInboundInvoice] No attachment content available, creating placeholder')
          
          // Create invoice record without PDF content
          const { data: invoice, error: invoiceError } = await supabase
            .from('supplier_invoices')
            .insert({
              company_id: company.id,
              supplier_name: fromName,
              supplier_email: fromEmail,
              invoice_number: null,
              invoice_date: new Date().toISOString().split('T')[0],
              total_amount: 0,
              status: 'needs_manual_review',
              notes: `PDF bijlage gedetecteerd maar kon niet worden gedownload.\n\nBestand: ${attachment.filename}\nOnderwerp: ${subject}\n\nUpload de factuur handmatig.`,
              original_filename: attachment.filename,
              source: 'email_inbound',
              original_email_subject: subject,
              original_email_from: fromEmail
            })
            .select()
            .single()

          if (!invoiceError && invoice) {
            processedInvoices.push(invoice)
          }
          continue // Skip to next attachment
        }
        
        // Upload to Supabase Storage
        const fileName = `${company.id}/${Date.now()}_${attachment.filename}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('supplier-invoices')
          .upload(fileName, pdfContent, {
            contentType: 'application/pdf',
            upsert: false
          })

        if (uploadError) {
          console.error('[processInboundInvoice] Upload error:', uploadError)
          throw uploadError
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('supplier-invoices')
          .getPublicUrl(fileName)

        console.log('[processInboundInvoice] PDF uploaded:', publicUrl)

        // Call Google Vision API for OCR
        const ocrText = await performOCR(pdfContent)
        console.log('[processInboundInvoice] OCR completed, text length:', ocrText.length)

        // Extract structured data using Claude
        const extractedData = await extractInvoiceData(ocrText)
        console.log('[processInboundInvoice] Data extracted:', {
          supplier: extractedData.supplier?.name,
          invoiceNumber: extractedData.invoice?.number,
          total: extractedData.totals?.total_incl_vat,
          lineItems: extractedData.line_items?.length
        })

        // Determine status based on confidence
        let status = 'pending_review'
        if (extractedData.confidence < 0.7) {
          status = 'needs_manual_review'
        } else if (extractedData.confidence < 0.9) {
          status = 'needs_quick_review'
        }

        // Create SupplierInvoice record
        const { data: invoice, error: invoiceError } = await supabase
          .from('supplier_invoices')
          .insert({
            company_id: company.id,
            supplier_name: extractedData.supplier?.name || fromName,
            supplier_email: extractedData.supplier?.email || fromEmail,
            supplier_address: extractedData.supplier?.address,
            supplier_vat_number: extractedData.supplier?.vat_number,
            supplier_iban: extractedData.supplier?.iban,
            supplier_bic: extractedData.supplier?.bic,
            invoice_number: extractedData.invoice?.number,
            invoice_date: extractedData.invoice?.date || new Date().toISOString().split('T')[0],
            due_date: extractedData.invoice?.due_date,
            reference: extractedData.invoice?.reference,
            document_type: extractedData.invoice?.document_type || 'factuur',
            total_amount: extractedData.totals?.total_incl_vat || 0,
            subtotal_excl_vat: extractedData.totals?.subtotal_excl_vat,
            vat_amount: extractedData.totals?.vat_amount,
            discount_total: extractedData.totals?.discount_total,
            line_items: extractedData.line_items || [],
            status: status,
            confidence_score: extractedData.confidence,
            notes: extractedData.notes,
            pdf_file_url: publicUrl,
            original_filename: attachment.filename,
            source: 'email_inbound',
            original_email_subject: subject,
            original_email_from: fromEmail,
            payment_method: extractedData.payment?.method,
            structured_reference: extractedData.payment?.structured_reference,
            ocr_raw_text: ocrText.substring(0, 10000) // Store first 10k chars for debugging
          })
          .select()
          .single()

        if (invoiceError) {
          console.error('[processInboundInvoice] Error creating invoice:', invoiceError)
          throw invoiceError
        }

        console.log('[processInboundInvoice] Invoice created:', invoice.id)
        processedInvoices.push(invoice)

        // Create or update Supplier record
        await upsertSupplier(supabase, company.id, extractedData.supplier)

      } catch (attachmentError) {
        console.error('[processInboundInvoice] Error processing attachment:', attachment.filename, attachmentError)
        
        // Create error record
        await supabase
          .from('supplier_invoices')
          .insert({
            company_id: company.id,
            supplier_name: fromName,
            supplier_email: fromEmail,
            status: 'processing_error',
            notes: `Fout bij verwerken: ${attachmentError.message}`,
            original_filename: attachment.filename,
            source: 'email_inbound',
            original_email_subject: subject,
            original_email_from: fromEmail
          })
      }
    }

    // Notify admins about new invoices
    if (processedInvoices.length > 0) {
      const supplierName = processedInvoices[0].supplier_name
      const totalAmount = processedInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      await notifyAdmins(
        supabase, 
        company.id, 
        supplierName, 
        `${processedInvoices.length} factuur(en) ontvangen - Totaal: €${totalAmount.toFixed(2)}`
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedInvoices.length} invoice(s)`,
        invoices: processedInvoices.map(inv => ({ id: inv.id, supplier: inv.supplier_name, total: inv.total_amount }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[processInboundInvoice] Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/**
 * Perform OCR using Google Cloud Vision API
 */
async function performOCR(pdfContent: Uint8Array): Promise<string> {
  const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY')
  
  if (!GOOGLE_VISION_API_KEY) {
    throw new Error('GOOGLE_VISION_API_KEY not configured')
  }

  // Convert PDF to base64
  const base64Content = btoa(String.fromCharCode(...pdfContent))

  // Call Google Vision API
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64Content },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
        }]
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[performOCR] Vision API error:', errorText)
    throw new Error(`Vision API error: ${response.status}`)
  }

  const result = await response.json()
  
  // Extract full text from response
  const fullText = result.responses?.[0]?.fullTextAnnotation?.text || ''
  
  if (!fullText) {
    console.warn('[performOCR] No text extracted from document')
    return ''
  }

  return fullText
}

/**
 * Extract structured invoice data using Google Gemini API (FREE!)
 */
async function extractInvoiceData(ocrText: string): Promise<any> {
  // Use same API key as Vision - Gemini is part of Google AI
  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY')
  
  if (!GOOGLE_API_KEY) {
    console.warn('[extractInvoiceData] GOOGLE_API_KEY not configured, returning basic structure')
    return {
      supplier: { name: 'Onbekend' },
      invoice: { document_type: 'onbekend' },
      totals: {},
      payment: {},
      line_items: [],
      confidence: 0.3,
      notes: 'Google Gemini API niet geconfigureerd - handmatige invoer vereist'
    }
  }

  try {
    // Use Gemini 1.5 Flash (free tier, fast, good for structured extraction)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: INVOICE_EXTRACTION_PROMPT + ocrText
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
            responseMimeType: "application/json"
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[extractInvoiceData] Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    console.log('[extractInvoiceData] Gemini response length:', content.length)
    
    // Parse JSON from response (Gemini might wrap it in markdown code blocks)
    let jsonContent = content
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonContent = jsonMatch[1]
    }
    // Also try without json tag
    const plainMatch = content.match(/```\s*([\s\S]*?)\s*```/)
    if (!jsonMatch && plainMatch) {
      jsonContent = plainMatch[1]
    }
    
    return JSON.parse(jsonContent.trim())
    
  } catch (error) {
    console.error('[extractInvoiceData] Error:', error)
    return {
      supplier: { name: 'Onbekend' },
      invoice: { document_type: 'onbekend' },
      totals: {},
      payment: {},
      line_items: [],
      confidence: 0.3,
      notes: `Extractie fout: ${error.message}`
    }
  }
}

/**
 * Create or update Supplier record
 */
async function upsertSupplier(supabase: any, companyId: string, supplierData: any): Promise<void> {
  if (!supplierData?.name) return

  try {
    // Check if supplier exists
    const { data: existing } = await supabase
      .from('suppliers')
      .select('id')
      .eq('company_id', companyId)
      .ilike('name', supplierData.name)
      .single()

    if (existing) {
      // Update existing supplier with any new info
      await supabase
        .from('suppliers')
        .update({
          email: supplierData.email || undefined,
          phone: supplierData.phone || undefined,
          address: supplierData.address || undefined,
          vat_number: supplierData.vat_number || undefined,
          iban: supplierData.iban || undefined,
          bic: supplierData.bic || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      // Create new supplier
      await supabase
        .from('suppliers')
        .insert({
          company_id: companyId,
          name: supplierData.name,
          email: supplierData.email,
          phone: supplierData.phone,
          address: supplierData.address,
          vat_number: supplierData.vat_number,
          iban: supplierData.iban,
          bic: supplierData.bic,
          is_active: true
        })
    }
  } catch (error) {
    console.error('[upsertSupplier] Error:', error)
    // Non-critical, continue
  }
}

/**
 * Notify company admins about new invoice
 */
async function notifyAdmins(supabase: any, companyId: string, supplierName: string, details: string): Promise<void> {
  try {
    // Get admin users for this company
    const { data: admins } = await supabase
      .from('users')
      .select('id, email')
      .eq('company_id', companyId)
      .in('company_role', ['admin', 'owner'])

    if (!admins || admins.length === 0) return

    // Create notifications
    const notifications = admins.map((admin: any) => ({
      user_id: admin.id,
      recipient_email: admin.email,
      company_id: companyId,
      type: 'invoice_received',
      message: `Nieuwe factuur ontvangen van ${supplierName}`,
      link_to: '/MateriaalBeheer?tab=facturen',
      read: false,
      triggering_user_name: supplierName,
      created_at: new Date().toISOString()
    }))

    await supabase
      .from('notifications')
      .insert(notifications)

    console.log('[notifyAdmins] Notified', admins.length, 'admins')
  } catch (error) {
    console.error('[notifyAdmins] Error:', error)
    // Non-critical, continue
  }
}

