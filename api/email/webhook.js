/**
 * Vercel API Route for Resend Inbound Email Webhook
 * 
 * This endpoint receives emails from Resend Inbound when suppliers
 * send invoices to {company}@facturatie.paintconnect.be
 * 
 * URL: https://paintcon.vercel.app/api/email/webhook
 * 
 * Flow:
 * 1. Resend sends webhook with email data + attachments
 * 2. This route forwards to Supabase Edge Function
 * 3. Edge Function processes PDF with Google Vision + Claude AI
 * 4. Invoice is created and admins are notified
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[email/webhook] Received Resend Inbound webhook');

  try {
    const webhookData = req.body;

    // Log basic info (don't log full attachments)
    console.log('[email/webhook] Email details:', {
      from: webhookData.from,
      to: webhookData.to,
      subject: webhookData.subject,
      attachmentsCount: webhookData.attachments?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Forward to Supabase Edge Function
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://hhnbxutsmnkypbwydebo.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      console.error('[email/webhook] Missing SUPABASE_SERVICE_ROLE_KEY');
      // Still return 200 to Resend so it doesn't retry
      // But log the error
      return res.status(200).json({ 
        success: false, 
        error: 'Server configuration error',
        message: 'Email received but could not be processed'
      });
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/processInboundInvoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[email/webhook] Edge Function error:', {
        status: response.status,
        data
      });
      // Return 200 to Resend to prevent retry loops
      // Log error for debugging
      return res.status(200).json({ 
        success: false, 
        error: 'Processing failed',
        details: data
      });
    }

    console.log('[email/webhook] Processing complete:', data);
    
    return res.status(200).json({
      success: true,
      message: 'Invoice processed successfully',
      ...data
    });

  } catch (error) {
    console.error('[email/webhook] Unexpected error:', error);
    
    // Return 200 to Resend to prevent retry loops
    return res.status(200).json({
      success: false,
      error: 'Unexpected error',
      message: error.message
    });
  }
}

// Configure body parser for larger payloads (PDFs can be big)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb' // Allow up to 25MB for email attachments
    }
  }
};


