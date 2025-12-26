import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Register Company Edge Function
 * 
 * Creates a new company and links it to the current user.
 * Also generates a unique inbound email address for receiving invoices.
 */

// CORS whitelist
const ALLOWED_ORIGINS = [
  'https://paintconnect.be',
  'https://www.paintconnect.be',
  'https://paintcon.vercel.app'
]

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})

// Rate limiting (in-memory, simple implementation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 3 // Max 3 registrations per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  userLimit.count++
  return { allowed: true }
}

// Input sanitization
function sanitizeString(input: string | null | undefined, maxLength: number = 255): string {
  if (!input) return ''
  
  let sanitized = String(input)
    .trim()
    .substring(0, maxLength)
    // Remove potential XSS patterns
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
  
  return sanitized
}

/**
 * Generate a unique inbound email address for the company
 * Format: {sanitized-company-name}{2-random-digits}@facturatie.paintconnect.be
 */
function generateInboundEmail(companyName: string): string {
  // Sanitize company name: lowercase, remove special chars, replace spaces with dashes
  const sanitized = companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .substring(0, 20) // Limit length
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes

  // Add 2 random digits for uniqueness
  const randomDigits = Math.floor(Math.random() * 90 + 10) // 10-99

  return `${sanitized}${randomDigits}@facturatie.paintconnect.be`
}

// Welcome email HTML generator
function generateWelcomeEmailHtml(companyName: string, userName: string, email: string, password: string | null, inboundEmail: string, baseUrl: string = 'https://paintconnect.be'): string {
  const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png'
  
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welkom bij PaintConnect</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="PaintConnect" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Welkom bij PaintConnect!</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Beste ${userName},
              </p>
              
              <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                Welkom bij PaintConnect! Je bedrijf <strong>${companyName}</strong> is succesvol geregistreerd. Je kunt nu beginnen met het beheren van je schilderprojecten.
              </p>
              
              <!-- Login Details -->
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <h2 style="color: #065f46; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">Je inloggegevens:</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #047857; font-size: 14px;"><strong>E-mail:</strong></td>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px;">${email}</td>
                  </tr>
                  ${password ? `
                  <tr>
                    <td style="padding: 8px 0; color: #047857; font-size: 14px;"><strong>Wachtwoord:</strong></td>
                    <td style="padding: 8px 0; color: #065f46; font-size: 14px;">${password}</td>
                  </tr>
                  ` : `
                  <tr>
                    <td colspan="2" style="padding: 8px 0; color: #047857; font-size: 14px;">Je kunt inloggen met je e-mailadres via magic link.</td>
                  </tr>
                  `}
                </table>
              </div>
              
              <!-- Trial Information -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <h2 style="color: #92400e; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">🎁 Proefperiode</h2>
                <p style="color: #78350f; font-size: 14px; line-height: 1.6; margin: 0;">
                  Je hebt nu toegang tot een <strong>14-dagen gratis proefperiode</strong> met alle Professional functies. Maak optimaal gebruik van deze tijd om PaintConnect te ontdekken!
                </p>
              </div>
              
              <!-- Inbound Email -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <h2 style="color: #1e40af; font-size: 18px; font-weight: 600; margin: 0 0 10px 0;">📧 Facturatie E-mailadres</h2>
                <p style="color: #1e3a8a; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                  Je unieke factuure-mailadres (enkel voor Professional):
                </p>
                <p style="background: #ffffff; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 14px; color: #1e40af; margin: 0; word-break: break-all;">
                  <strong>${inboundEmail}</strong>
                </p>
                <p style="color: #1e3a8a; font-size: 13px; line-height: 1.6; margin: 10px 0 0 0;">
                  Stuur facturen naar dit adres en ze worden automatisch verwerkt in PaintConnect.
                </p>
              </div>
              
              <!-- Features Overview -->
              <div style="margin: 30px 0;">
                <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">Wat kun je doen met PaintConnect?</h2>
                
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                  <tr>
                    <td style="padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                      <h3 style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">📊 Dashboard</h3>
                      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">Overzicht van al je projecten, materialen en beschadigingen op één plek.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                      <h3 style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">📅 Planning</h3>
                      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">Plan je projecten, taken, voertuigen en onderaannemers in maand- en weekweergave.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                      <h3 style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">📁 Projectenbeheer</h3>
                      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">Beheer al je projecten met updates, foto's, materialen en beschadigingen.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                      <h3 style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">📦 Materiaalbeheer</h3>
                      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">Vraag materialen aan, beheer voorraad en volg leveringen.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                      <h3 style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">👥 Team Communicatie</h3>
                      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">Nodig schilders uit en communiceer via de team chat.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                      <h3 style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">🏠 Klantportaal</h3>
                      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">Laat klanten hun projecten volgen met updates, foto's en beschadigingen.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                      <h3 style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">📍 GPS Check-in/out</h3>
                      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">Schilders kunnen in- en uitchecken bij projecten met GPS verificatie.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px;">
                      <h3 style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">📈 Analytics & Rapportages</h3>
                      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0;">Bekijk statistieken en genereer rapportages over je projecten.</p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Support & Resources -->
              <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center;">
                <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">💬 Support & Resources</h2>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                  Heb je vragen? Bekijk onze <a href="${baseUrl}/FAQ" style="color: #10b981; text-decoration: none; font-weight: 600;">FAQ</a> of neem contact op via <a href="mailto:support@paintconnect.be" style="color: #10b981; text-decoration: none; font-weight: 600;">support@paintconnect.be</a>
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                  Ga naar Dashboard →
                </a>
              </div>
              
              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 25px; margin-top: 30px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0 0 10px 0;">
                  <a href="${baseUrl}/FAQ" style="color: #6b7280; text-decoration: none; margin: 0 10px;">FAQ</a>
                  <span style="color: #d1d5db;">|</span>
                  <a href="${baseUrl}/PrivacyPolicy" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                  <span style="color: #d1d5db;">|</span>
                  <a href="${baseUrl}/TermsOfService" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Algemene Voorwaarden</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                  © 2025 PaintConnect. Alle rechten voorbehouden.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const responseHeaders = corsHeaders(origin)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: responseHeaders })
  }

  try {
    // Get authorization header to identify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Niet geautoriseerd' }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create Supabase client with user's auth
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Create admin client for operations that need elevated privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current user from auth
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      console.error('[registerCompany] Auth error:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Gebruiker niet gevonden' }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('[registerCompany] Request from user:', user.id, user.email)

    // Rate limiting check
    const rateLimitResult = checkRateLimit(user.id)
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Te veel registratiepogingen. Probeer het later opnieuw.' 
        }),
        { 
          headers: { 
            ...responseHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter || 3600)
          }, 
          status: 429 
        }
      )
    }

    // Parse request body
    const body = await req.json()
    const {
      first_name,
      last_name,
      company_name,
      email,
      vat_number,
      phone_number,
      street,
      house_number,
      postal_code,
      city,
      country
    } = body

    // Sanitize all input
    const sanitizedCompanyName = sanitizeString(company_name, 100)
    const sanitizedEmail = sanitizeString(email, 254)
    const sanitizedVat = sanitizeString(vat_number, 50)
    const sanitizedPhone = sanitizeString(phone_number, 50)
    const sanitizedStreet = sanitizeString(street, 200)
    const sanitizedHouseNumber = sanitizeString(house_number, 20)
    const sanitizedPostalCode = sanitizeString(postal_code, 20)
    const sanitizedCity = sanitizeString(city, 100)
    const sanitizedCountry = sanitizeString(country, 50)
    const sanitizedFirstName = sanitizeString(first_name, 100)
    const sanitizedLastName = sanitizeString(last_name, 100)

    // Validate required fields
    if (!sanitizedCompanyName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bedrijfsnaam is verplicht' }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!sanitizedFirstName || !sanitizedLastName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Voornaam en naam zijn verplicht' }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geldig e-mailadres is verplicht' }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!sanitizedPhone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Telefoonnummer is verplicht' }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!sanitizedCountry || (sanitizedCountry !== 'Nederland' && sanitizedCountry !== 'België')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Land moet Nederland of België zijn' }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!sanitizedPostalCode || !sanitizedCity) {
      return new Response(
        JSON.stringify({ success: false, error: 'Postcode en plaats zijn verplicht' }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!sanitizedVat) {
      return new Response(
        JSON.stringify({ success: false, error: 'BTW nummer is verplicht' }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate VAT number format based on country
    if (sanitizedCountry === 'België') {
      const beVatPattern = /^BE[0-9]{10}$/
      if (!beVatPattern.test(sanitizedVat.replace(/\s/g, ''))) {
        return new Response(
          JSON.stringify({ success: false, error: 'BTW nummer moet formaat BE0123456789 hebben' }),
          { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    } else if (sanitizedCountry === 'Nederland') {
      const nlVatPattern = /^NL[0-9]{9}B[0-9]{2}$/
      if (!nlVatPattern.test(sanitizedVat.replace(/\s/g, ''))) {
        return new Response(
          JSON.stringify({ success: false, error: 'BTW nummer moet formaat NL123456789B01 hebben' }),
          { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Validate street and house_number (mutually required)
    if ((sanitizedStreet && !sanitizedHouseNumber) || (!sanitizedStreet && sanitizedHouseNumber)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Straat en huisnummer moeten beide ingevuld zijn' }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if user already has a company
    const { data: existingUserCheck } = await supabaseAdmin
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (existingUserCheck?.company_id) {
      console.log('[registerCompany] User already has company:', existingUserCheck.company_id)
      return new Response(
        JSON.stringify({ success: false, error: 'Gebruiker heeft al een bedrijf' }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Generate unique inbound email address
    let inboundEmail = generateInboundEmail(company_name)
    
    // Check if email is unique, if not regenerate with different random digits
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('inbound_email_address', inboundEmail)
        .single()
      
      if (!existing) break
      
      inboundEmail = generateInboundEmail(company_name)
      attempts++
    }

    console.log('[registerCompany] Generated inbound email:', inboundEmail)

    // Create company
    // Note: created_at is handled automatically by Supabase, don't include it
    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    
    const companyData: Record<string, any> = {
      name: sanitizedCompanyName,
      email: sanitizedEmail || user.email,
      vat_number: sanitizedVat || null,
      phone_number: sanitizedPhone || null,
      street: sanitizedStreet || null,
      house_number: sanitizedHouseNumber || null,
      postal_code: sanitizedPostalCode || null,
      city: sanitizedCity || null,
      country: sanitizedCountry || 'België',
      inbound_email_address: inboundEmail,
      subscription_tier: 'starter_trial', // FIXED: Use 'starter_trial' instead of 'free'
      subscription_status: 'trialing',
      onboarding_status: 'not_started', // FIXED: Set onboarding status so onboarding can start
      trial_started_at: now.toISOString(), // FIXED: Set trial start time
      trial_ends_at: trialEndsAt.toISOString() // FIXED: Set trial end time (14 days)
    }
    
    console.log('[registerCompany] Creating company with data:', {
      name: companyData.name,
      subscription_tier: companyData.subscription_tier,
      subscription_status: companyData.subscription_status,
      onboarding_status: companyData.onboarding_status,
      has_trial_started: !!companyData.trial_started_at,
      has_trial_ends: !!companyData.trial_ends_at
    })

    // Try to insert company with all fields
    // If some columns don't exist, we'll retry without them
    let company = null
    let companyError = null

    // First attempt: with all fields (trial_started_at, trial_ends_at, onboarding_status)
    const { data: companyWithAllFields, error: errorWithAllFields } = await supabaseAdmin
      .from('companies')
      .insert(companyData)
      .select()
      .single()

    if (errorWithAllFields) {
      const errorCode = errorWithAllFields.code || ''
      const errorMessage = errorWithAllFields.message || ''
      
      console.warn('[registerCompany] Insert with all fields failed:', errorCode, errorMessage)
      
      // If error is about missing columns, try with minimal fields
      if (errorCode.includes('PGRST')) {
        console.warn('[registerCompany] Some columns may not exist, trying with minimal fields...')
        
        // Minimal company data - only required fields
        // CRITICAL: Always include subscription_tier, subscription_status, trial dates, and onboarding_status even in minimal fallback
        const minimalCompanyData: Record<string, any> = {
          name: companyData.name,
          email: companyData.email,
          inbound_email_address: companyData.inbound_email_address,
          subscription_tier: 'starter_trial', // CRITICAL: Always set to starter_trial
          subscription_status: 'trialing', // CRITICAL: Always set to trialing
          trial_started_at: companyData.trial_started_at, // CRITICAL: Set trial start time
          trial_ends_at: companyData.trial_ends_at, // CRITICAL: Set trial end time (14 days)
          onboarding_status: 'not_started' // CRITICAL: Set onboarding status so onboarding can start
        }
        
        console.log('[registerCompany] Using minimal company data (fallback):', {
          subscription_tier: minimalCompanyData.subscription_tier,
          subscription_status: minimalCompanyData.subscription_status,
          has_trial_started: !!minimalCompanyData.trial_started_at,
          has_trial_ends: !!minimalCompanyData.trial_ends_at,
          onboarding_status: minimalCompanyData.onboarding_status
        })
        
        // Only add optional fields if they were provided
        if (companyData.vat_number) minimalCompanyData.vat_number = companyData.vat_number
        if (companyData.phone_number) minimalCompanyData.phone_number = companyData.phone_number
        if (companyData.street) minimalCompanyData.street = companyData.street
        if (companyData.house_number) minimalCompanyData.house_number = companyData.house_number
        if (companyData.postal_code) minimalCompanyData.postal_code = companyData.postal_code
        if (companyData.city) minimalCompanyData.city = companyData.city
        if (companyData.country) minimalCompanyData.country = companyData.country
        
        const { data: companyMinimal, error: errorMinimal } = await supabaseAdmin
          .from('companies')
          .insert(minimalCompanyData)
          .select()
          .single()

        if (errorMinimal) {
          companyError = errorMinimal
          console.error('[registerCompany] Minimal insert also failed:', errorMinimal)
        } else {
          company = companyMinimal
          console.log('[registerCompany] Company created with minimal fields:', {
            id: company.id,
            subscription_tier: company.subscription_tier,
            subscription_status: company.subscription_status,
            onboarding_status: company.onboarding_status,
            has_trial_started: !!company.trial_started_at,
            has_trial_ends: !!company.trial_ends_at
          })
        }
      } else {
        companyError = errorWithAllFields
      }
    } else {
      company = companyWithAllFields
      console.log('[registerCompany] Company created successfully with all fields:', {
        id: company.id,
        name: company.name,
        subscription_tier: company.subscription_tier,
        subscription_status: company.subscription_status,
        onboarding_status: company.onboarding_status,
        has_trial_started: !!company.trial_started_at,
        has_trial_ends: !!company.trial_ends_at
      })
    }

    if (companyError) {
      console.error('[registerCompany] Error creating company:', companyError)
      console.error('[registerCompany] Company error code:', companyError.code)
      console.error('[registerCompany] Company error details:', JSON.stringify(companyError))
      return new Response(
        JSON.stringify({ success: false, error: 'Kon bedrijf niet aanmaken: ' + (companyError.message || companyError.code || 'Onbekende fout') }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('[registerCompany] Company created:', company.id, company.name)

    // Check if user already exists and what their current company_role is
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, company_role, company_id')
      .eq('id', user.id)
      .single()

    // Build base user data - always include these fields
    // Note: created_date is handled automatically by Supabase or set by User.me(), don't include it
    // IMPORTANT: Always set company_role to 'admin' (not 'owner') to satisfy check constraint
    const fullName = `${sanitizedFirstName} ${sanitizedLastName}`.trim()
    const userData: Record<string, any> = {
      id: user.id,
      email: sanitizedEmail || user.email,
      full_name: fullName || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      company_id: company.id,
      company_role: 'admin', // Must be 'admin', not 'owner' - check constraint doesn't allow 'owner'
      status: 'active'
    }

    if (existingUser) {
      console.log('[registerCompany] Existing user found:', {
        id: existingUser.id,
        current_company_role: existingUser.company_role,
        current_company_id: existingUser.company_id
      })
      
      // If user already has a company, don't allow registration
      if (existingUser.company_id && existingUser.company_id !== company.id) {
        // Clean up the company we just created
        try {
          await supabaseAdmin.from('companies').delete().eq('id', company.id)
        } catch (cleanupError) {
          console.error('[registerCompany] Error cleaning up company:', cleanupError)
        }
        
        return new Response(
          JSON.stringify({ success: false, error: 'Gebruiker heeft al een bedrijf' }),
          { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      // User exists - use UPDATE instead of UPSERT to ensure all fields are updated
      // This is critical to override any 'owner' role that might exist
      console.log('[registerCompany] User exists, using UPDATE instead of UPSERT to ensure company_role is set correctly')
      
      // CRITICAL: First, explicitly update company_role to 'admin' in a separate query
      // This ensures the constraint is satisfied before updating other fields
      if (existingUser.company_role === 'owner') {
        console.log('[registerCompany] CRITICAL: User has "owner" role, updating to "admin" first in separate query...')
        const { error: roleUpdateError } = await supabaseAdmin
          .from('users')
          .update({ company_role: 'admin' })
          .eq('id', user.id)
        
        if (roleUpdateError) {
          console.error('[registerCompany] Error updating company_role from owner to admin:', roleUpdateError)
          // Try to clean up company
          try {
            await supabaseAdmin.from('companies').delete().eq('id', company.id)
          } catch (cleanupError) {
            console.error('[registerCompany] Error cleaning up company:', cleanupError)
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Kon company_role niet updaten: ${roleUpdateError.message || roleUpdateError.code || 'Onbekende fout'}` 
            }),
            { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        } else {
          console.log('[registerCompany] Successfully updated company_role from owner to admin')
        }
      }
      
      // Now update all other fields
      // First, try with user_type
      const userDataWithType = {
        ...userData,
        user_type: 'painter_company'
      }
      
      // Remove company_role from userDataWithType since we already set it
      delete userDataWithType.company_role
      
      console.log('[registerCompany] Attempting user UPDATE with user_type (company_role already set)...')
      console.log('[registerCompany] User data to update:', JSON.stringify(userDataWithType, null, 2))
      
      const { data: updatedUserWithType, error: updateErrorWithType } = await supabaseAdmin
        .from('users')
        .update(userDataWithType)
        .eq('id', user.id)
        .select()
        .single()
      
      if (updateErrorWithType) {
        const errorCode = updateErrorWithType.code || ''
        const errorMessage = updateErrorWithType.message || ''
        
        // If error is about user_type column, try without it
        if (errorCode.includes('PGRST') && errorMessage.includes('user_type')) {
          console.warn('[registerCompany] Update with user_type failed, trying without it...')
          
          // Remove company_role from userData since we already set it
          const userDataWithoutType = { ...userData }
          delete userDataWithoutType.company_role
          
          console.log('[registerCompany] User data to update (without user_type, company_role already set):', JSON.stringify(userDataWithoutType, null, 2))
          
          const { data: updatedUser, error: updateError } = await supabaseAdmin
            .from('users')
            .update(userDataWithoutType)
            .eq('id', user.id)
            .select()
            .single()
          
          if (updateError) {
            console.error('[registerCompany] Error updating user:', updateError)
            console.error('[registerCompany] Error code:', updateError.code)
            console.error('[registerCompany] Error message:', updateError.message)
            console.error('[registerCompany] Error details:', JSON.stringify(updateError))
            
            // Try to clean up company
            try {
              await supabaseAdmin.from('companies').delete().eq('id', company.id)
            } catch (cleanupError) {
              console.error('[registerCompany] Error cleaning up company:', cleanupError)
            }
            
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `Kon gebruiker niet koppelen aan bedrijf: ${updateError.message || updateError.code || 'Onbekende fout'}` 
              }),
              { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          } else {
            console.log('[registerCompany] User updated successfully (without user_type)')
          }
        } else {
          console.error('[registerCompany] Error updating user:', updateErrorWithType)
          console.error('[registerCompany] Error code:', updateErrorWithType.code)
          console.error('[registerCompany] Error message:', updateErrorWithType.message)
          console.error('[registerCompany] Error details:', JSON.stringify(updateErrorWithType))
          
          // Try to clean up company
          try {
            await supabaseAdmin.from('companies').delete().eq('id', company.id)
          } catch (cleanupError) {
            console.error('[registerCompany] Error cleaning up company:', cleanupError)
          }
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Kon gebruiker niet koppelen aan bedrijf: ${updateErrorWithType.message || updateErrorWithType.code || 'Onbekende fout'}` 
            }),
            { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
      } else {
        console.log('[registerCompany] User updated successfully (with user_type)')
      }
      
      // Skip the UPSERT logic below since we already updated
      // Continue to storage bucket creation
    } else {
      // User doesn't exist - use UPSERT to create
      console.log('[registerCompany] User does not exist, using UPSERT to create')

    // Try to upsert with user_type first (if column exists)
    let userUpsertError = null
    const userDataWithType = {
      ...userData,
      user_type: 'painter_company'
    }

    console.log('[registerCompany] Attempting user upsert with user_type...')
    console.log('[registerCompany] User data to upsert:', JSON.stringify(userDataWithType, null, 2))
    
    const { data: upsertedUser, error: upsertErrorWithType } = await supabaseAdmin
      .from('users')
      .upsert(userDataWithType, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    // If error is PGRST204 (column not found), try without user_type
    if (upsertErrorWithType) {
      const errorCode = upsertErrorWithType.code || ''
      const errorMessage = upsertErrorWithType.message || ''
      
      console.warn('[registerCompany] Upsert with user_type failed:', errorCode, errorMessage)
      
      // PGRST204 = column not found in schema cache, try without user_type
      if (errorCode.includes('PGRST') && errorMessage.includes('user_type')) {
        console.log('[registerCompany] user_type column not found, trying without it...')
        
        console.log('[registerCompany] User data to upsert (without user_type):', JSON.stringify(userData, null, 2))
        
        const { data: upsertedUserNoType, error: upsertErrorNoType } = await supabaseAdmin
          .from('users')
          .upsert(userData, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single()

        if (upsertErrorNoType) {
          userUpsertError = upsertErrorNoType
          console.error('[registerCompany] Upsert without user_type also failed:', upsertErrorNoType)
        } else {
          console.log('[registerCompany] User linked successfully (without user_type)')
        }
      } else {
        // Other error - fail
        userUpsertError = upsertErrorWithType
        console.error('[registerCompany] Upsert error (not column related):', upsertErrorWithType)
      }
    } else {
      console.log('[registerCompany] User linked successfully (with user_type)')
    }

    // If there was an error, clean up and return
    if (userUpsertError) {
      console.error('[registerCompany] Error linking user to company:', userUpsertError)
      console.error('[registerCompany] Error code:', userUpsertError.code)
      console.error('[registerCompany] Error message:', userUpsertError.message)
      console.error('[registerCompany] Error details:', JSON.stringify(userUpsertError))
      
      // Try to clean up company
      try {
        await supabaseAdmin.from('companies').delete().eq('id', company.id)
        console.log('[registerCompany] Company cleaned up after user error')
      } catch (cleanupError) {
        console.error('[registerCompany] Error cleaning up company:', cleanupError)
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Kon gebruiker niet koppelen aan bedrijf: ${userUpsertError.message || userUpsertError.code || 'Onbekende fout'}` 
        }),
        { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create storage bucket for invoices (if not exists) - non-blocking
    try {
      const { error: bucketError } = await supabaseAdmin.storage.createBucket('supplier-invoices', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
      })
      if (bucketError && !bucketError.message.includes('already exists')) {
        console.warn('[registerCompany] Could not create storage bucket:', bucketError.message)
      } else {
        console.log('[registerCompany] Storage bucket ready')
      }
    } catch (bucketErr) {
      // Non-critical, just log
      console.warn('[registerCompany] Storage bucket error (non-critical):', bucketErr)
    }

    console.log('[registerCompany] Registration successful for company:', company.id)

    // Send welcome email (non-blocking)
    try {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
      if (RESEND_API_KEY) {
        const emailHtml = generateWelcomeEmailHtml(
          company.name,
          fullName,
          sanitizedEmail || user.email,
          null, // No password for magic link users
          company.inbound_email_address,
          'https://paintconnect.be'
        )

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'PaintConnect <noreply@notifications.paintconnect.be>',
            to: [sanitizedEmail || user.email],
            subject: `Welkom bij PaintConnect, ${fullName}!`,
            html: emailHtml
          })
        })

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error('[registerCompany] Failed to send welcome email:', errorText)
          
          // Create notification for Super Admins about email failure
          try {
            const { data: superAdmins } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('company_role', 'super_admin')
            
            if (superAdmins && superAdmins.length > 0) {
              const notifications = superAdmins.map((admin: any) => ({
                user_id: admin.id,
                type: 'system',
                title: 'Welkomstmail niet verzonden',
                message: `Welkomstmail voor ${company.name} (${sanitizedEmail || user.email}) kon niet worden verzonden: ${errorText}`,
                metadata: {
                  company_id: company.id,
                  company_name: company.name,
                  user_email: sanitizedEmail || user.email,
                  error: errorText
                }
              }))
              
              await supabaseAdmin.from('notifications').insert(notifications)
            }
          } catch (notifError) {
            console.error('[registerCompany] Failed to create notification:', notifError)
          }
        } else {
          console.log('[registerCompany] Welcome email sent successfully')
        }
      }
    } catch (emailError) {
      console.error('[registerCompany] Error sending welcome email (non-critical):', emailError)
      // Don't fail registration if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        company_id: company.id,
        company_name: company.name,
        inbound_email: company.inbound_email_address
      }),
      { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[registerCompany] Unexpected error:', error)
    console.error('[registerCompany] Error stack:', error?.stack)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Er is een onverwachte fout opgetreden',
        details: error?.toString()
      }),
      { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
