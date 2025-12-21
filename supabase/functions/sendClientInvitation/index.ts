import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Niet geautoriseerd')
    }

    const { client_email, client_name, project_id, project_name } = await req.json()
    
    if (!client_email) {
      throw new Error('client_email is verplicht')
    }

    // Get user and company info
    const { data: userData } = await supabase
      .from('users')
      .select('company_id, full_name')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      throw new Error('Gebruiker heeft geen bedrijf gekoppeld')
    }

    // Get company info
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', userData.company_id)
      .single()

    // Create a unique token for the invitation
    const invitationToken = crypto.randomUUID()

    // Create client invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('client_invitations')
      .insert({
        email: client_email,
        client_name: client_name || client_email,
        project_id,
        project_name,
        company_id: userData.company_id,
        invited_by: user.id,
        token: invitationToken,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dagen
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      throw new Error('Kon uitnodiging niet aanmaken')
    }

    // Here you would send the actual email via Resend or similar
    // For now, we just create the invitation record
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      try {
        const portalUrl = `${Deno.env.get('APP_URL') || 'https://paintcon.vercel.app'}/klantportaal/${invitationToken}`
        
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'PaintConnect <noreply@paintconnect.be>',
            to: client_email,
            subject: `${company?.name || 'Uw schildersbedrijf'} - Bekijk uw project`,
            html: `
              <h2>Hallo ${client_name || 'klant'},</h2>
              <p>${userData.full_name} van ${company?.name || 'uw schildersbedrijf'} heeft u uitgenodigd om de voortgang van uw project te bekijken.</p>
              ${project_name ? `<p><strong>Project:</strong> ${project_name}</p>` : ''}
              <p><a href="${portalUrl}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Bekijk project</a></p>
              <p>Deze link is 7 dagen geldig.</p>
              <p>Met vriendelijke groet,<br>${company?.name || 'PaintConnect'}</p>
            `
          })
        })
      } catch (emailError) {
        console.error('Error sending email:', emailError)
        // Don't fail the whole request, just log the error
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation,
        message: 'Uitnodiging verzonden' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('sendClientInvitation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})


