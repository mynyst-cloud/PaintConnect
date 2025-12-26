import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/23346926a_Colorlogo-nobackground.png'

function generateReminderEmailHtml(
  reminderType: 'day3_project' | 'day5_team' | 'day7_final',
  companyName: string,
  userName: string,
  baseUrl: string = 'https://paintconnect.be'
): string {
  const content = {
    day3_project: {
      title: 'Start met je eerste project',
      message: `Beste ${userName},<br><br>Je hebt PaintConnect al 3 dagen, maar nog geen projecten aangemaakt. Start vandaag met je eerste project en ontdek hoe PaintConnect je helpt bij het beheren van je schilderwerk.<br><br><strong>Tip:</strong> Ga naar de Planning pagina en klik op "+ Project plannen" om te beginnen.`,
      cta: 'Maak je eerste project aan',
      ctaUrl: `${baseUrl}/Planning`
    },
    day5_team: {
      title: 'Nodig je team uit',
      message: `Beste ${userName},<br><br>Je gebruikt PaintConnect al 5 dagen! Om optimaal gebruik te maken van alle functies, nodig je schilders uit om deel te nemen aan je projecten.<br><br><strong>Tip:</strong> Ga naar Dashboard en klik op "Schilder uitnodigen" om je teamleden toe te voegen.`,
      cta: 'Nodig schilders uit',
      ctaUrl: `${baseUrl}/Dashboard`
    },
    day7_final: {
      title: 'Laatste tips voor optimaal gebruik',
      message: `Beste ${userName},<br><br>Je proefperiode loopt al 7 dagen! Hier zijn enkele tips om het meeste uit PaintConnect te halen:<br><br>• Plan je projecten in de Planning pagina<br>• Vraag materialen aan via Materialen<br>• Laat klanten hun projecten volgen via het Klantportaal<br>• Gebruik GPS check-in/out voor je schilders<br><br>Heb je vragen? Bekijk onze FAQ of neem contact op.`,
      cta: 'Bekijk alle functies',
      ctaUrl: `${baseUrl}/Dashboard`
    }
  }[reminderType]

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="PaintConnect" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${content.title}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 30px 0;">
                ${content.message}
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${content.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                  ${content.cta} →
                </a>
              </div>
              
              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 25px; margin-top: 30px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0 0 10px 0;">
                  <a href="${baseUrl}/FAQ" style="color: #6b7280; text-decoration: none; margin: 0 10px;">FAQ</a>
                  <span style="color: #d1d5db;">|</span>
                  <a href="mailto:support@paintconnect.be" style="color: #6b7280; text-decoration: none; margin: 0 10px;">Support</a>
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Get current date in CET timezone
    const now = new Date()
    const cetDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }))
    const today = new Date(cetDate.getFullYear(), cetDate.getMonth(), cetDate.getDate())
    
    console.log('[sendOnboardingReminders] Processing reminders for:', today.toISOString().split('T')[0])

    // Get all companies in trial
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('subscription_status', 'trialing')
      .not('trial_started_at', 'is', null)

    if (companiesError) {
      throw companiesError
    }

    if (!companies || companies.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No companies in trial', companiesChecked: 0, remindersSent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const results: any[] = []
    const skipped: any[] = []

    for (const company of companies) {
      if (!company.trial_started_at) {
        skipped.push({ companyId: company.id, companyName: company.name, reason: 'No trial_started_at date' })
        continue
      }

      // Calculate days since registration in CET
      const trialStartDate = new Date(company.trial_started_at)
      const cetTrialStart = new Date(trialStartDate.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }))
      const trialStart = new Date(cetTrialStart.getFullYear(), cetTrialStart.getMonth(), cetTrialStart.getDate())
      
      const daysSinceRegistration = Math.floor((today.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24))

      // Check if company is on a reminder day (3, 5, or 7)
      if (![3, 5, 7].includes(daysSinceRegistration)) {
        skipped.push({ 
          companyId: company.id, 
          companyName: company.name, 
          reason: `Not on reminder day (${daysSinceRegistration} days old, need 3, 5, or 7)`,
          daysSinceRegistration 
        })
        continue
      }

      // Determine reminder type
      let reminderType: 'day3_project' | 'day5_team' | 'day7_final' = 'day3_project'
      if (daysSinceRegistration === 5) {
        reminderType = 'day5_team'
      } else if (daysSinceRegistration === 7) {
        reminderType = 'day7_final'
      }

      // Check if reminder should be sent
      let shouldSend = false

      if (reminderType === 'day3_project') {
        // Check if company has projects (excluding dummies)
        const { data: projects } = await supabaseAdmin
          .from('projects')
          .select('id')
          .eq('company_id', company.id)
          .or('is_dummy.is.null,is_dummy.eq.false')
        
        if (!projects || projects.length === 0) {
          shouldSend = true
        }
      } else if (reminderType === 'day5_team') {
        // Check if company has active non-admin users
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('company_id', company.id)
          .eq('status', 'active')
          .neq('company_role', 'admin')
        
        if (!users || users.length === 0) {
          shouldSend = true
        }
      } else if (reminderType === 'day7_final') {
        // Always send final reminder
        shouldSend = true
      }

      if (!shouldSend) {
        skipped.push({ 
          companyId: company.id, 
          companyName: company.name, 
          reason: `Criteria already met for ${reminderType}` 
        })
        continue
      }

      // Get company admin email
      const { data: adminUser } = await supabaseAdmin
        .from('users')
        .select('email, full_name')
        .eq('company_id', company.id)
        .eq('company_role', 'admin')
        .limit(1)
        .single()

      if (!adminUser || !adminUser.email) {
        skipped.push({ 
          companyId: company.id, 
          companyName: company.name, 
          reason: 'No admin user found' 
        })
        continue
      }

      // Send reminder email
      try {
        const emailHtml = generateReminderEmailHtml(
          reminderType,
          company.name,
          adminUser.full_name || adminUser.email.split('@')[0],
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
            to: [adminUser.email],
            subject: `PaintConnect: ${reminderType === 'day3_project' ? 'Start met je eerste project' : reminderType === 'day5_team' ? 'Nodig je team uit' : 'Laatste tips voor optimaal gebruik'}`,
            html: emailHtml
          })
        })

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error(`[sendOnboardingReminders] Failed to send email to ${adminUser.email}:`, errorText)
          skipped.push({ 
            companyId: company.id, 
            companyName: company.name, 
            reason: `Email send failed: ${errorText}` 
          })
          continue
        }

        results.push({
          companyId: company.id,
          companyName: company.name,
          email: adminUser.email,
          reminderType,
          daysSinceRegistration
        })

        console.log(`[sendOnboardingReminders] Sent ${reminderType} reminder to ${adminUser.email} for company ${company.name}`)
      } catch (emailError) {
        console.error(`[sendOnboardingReminders] Error sending email:`, emailError)
        skipped.push({ 
          companyId: company.id, 
          companyName: company.name, 
          reason: `Email error: ${emailError.message}` 
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${companies.length} companies, sent ${results.length} reminders`,
        companiesChecked: companies.length,
        remindersSent: results.length,
        results,
        skipped
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('[sendOnboardingReminders] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Onbekende fout' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
