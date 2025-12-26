import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GEMINI_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY') // Use GOOGLE_VISION_API_KEY (same key works for Gemini)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Niet geautoriseerd' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create user client for RLS-aware queries and auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user from auth using user client (not admin client)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('[aiChatAgent] Auth error:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Gebruiker niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create admin client for ai_conversations access (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, conversation_id, message } = await req.json()

    if (action === 'add_message') {
      // Get conversation
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('ai_conversations')
        .select('*')
        .eq('id', conversation_id)
        .eq('user_id', user.id)
        .single()

      if (convError || !conversation) {
        return new Response(
          JSON.stringify({ success: false, error: 'Conversation niet gevonden' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      // Fetch user context
      let userData = null
      let companyData = null
      let userProjects: any[] = []

      try {
        // Get user data with RLS-aware client
        const { data: fetchedUserData, error: userDataError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!userDataError && fetchedUserData) {
          userData = fetchedUserData

          // Get company data
          if (userData.company_id) {
            const { data: company, error: companyError } = await supabase
              .from('companies')
              .select('*')
              .eq('id', userData.company_id)
              .single()

            if (!companyError && company) {
              companyData = company

              // Get user projects
              const isAdmin = userData.company_role === 'admin' || userData.company_role === 'owner'
              
              if (isAdmin) {
                // Admin: get all company projects
                const { data: projects, error: projectsError } = await supabase
                  .from('projects')
                  .select('*')
                  .eq('company_id', companyData.id)
                  .order('created_at', { ascending: false })
                  .limit(10)

                if (!projectsError && projects) {
                  userProjects = projects.filter((p: any) => !p.is_dummy)
                }
              } else {
                // Painter: get assigned projects (client-side filter for contains)
                const { data: allProjects, error: projectsError } = await supabase
                  .from('projects')
                  .select('*')
                  .eq('company_id', companyData.id)
                  .order('created_at', { ascending: false })
                  .limit(50)

                if (!projectsError && allProjects) {
                  // Client-side filter for assigned_painters array
                  userProjects = allProjects.filter((p: any) => {
                    if (p.is_dummy) return false
                    const assignedPainters = Array.isArray(p.assigned_painters) ? p.assigned_painters : []
                    return assignedPainters.includes(userData.email)
                  })
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('[aiChatAgent] Error fetching user context:', error)
      }

      // Build user context string
      let userContext = ''
      if (userData) {
        userContext = `\n\n=== ECHTE DATA - GEBRUIK DIT EXACT ===\n`
        userContext += `Gebruiker: ${userData.full_name || userData.email}\n`
        userContext += `E-mail: ${userData.email}\n`
        userContext += `Rol: ${userData.company_role || 'painter'}\n`
        
        if (companyData) {
          userContext += `Bedrijf: ${companyData.name}\n`
          userContext += `Abonnement: ${companyData.subscription_tier || 'N/A'}\n`
        }
        
        if (userProjects.length > 0) {
          userContext += `\nProjecten (${userProjects.length}):\n`
          userProjects.forEach((p: any, i: number) => {
            userContext += `${i + 1}. ${p.project_name || 'Naamloos project'} - ${p.status || 'N/A'}\n`
          })
        } else {
          userContext += `\nProjecten: Geen projecten toegewezen\n`
        }
        userContext += `\n=== EINDE ECHTE DATA ===\n\n`
      }

      // Build conversation history
      const conversationHistory = (conversation.messages || []).map((msg: any) => {
        if (msg.role === 'user' && msg === message) {
          // Add user context to the current user message
          return {
            role: 'user',
            parts: [{ text: `${userContext}${msg.content}` }]
          }
        }
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }
      })

      // If this is the first message, add user context
      if (conversationHistory.length === 0 && message.role === 'user') {
        conversationHistory.push({
          role: 'user',
          parts: [{ text: `${userContext}${message.content}` }]
        })
      }

      // System instruction
      const systemInstruction = `Je bent de PaintConnect AI assistent. Je helpt schildersbedrijven met het gebruik van de PaintConnect applicatie.

BELANGRIJKE REGELS:
1. Beantwoord ALLEEN vragen over PaintConnect functionaliteiten
2. Gebruik ALLEEN de ECHTE DATA die wordt gegeven - verzin NOOIT data
3. Als je geen toegang hebt tot specifieke data, zeg dat duidelijk
4. Wees vriendelijk, professioneel en behulpzaam
5. Geef concrete, praktische antwoorden

PaintConnect functionaliteiten:
- Dashboard: overzicht van projecten, materialen, beschadigingen
- Planning: maand/week planning met projecten, taken, voertuigen, onderaannemers
- Projecten: projectbeheer met updates, foto's, materialen, beschadigingen
- Materialen: materiaalbeheer en aanvragen
- Team: schilders uitnodigen en beheren
- Klantportaal: klanten kunnen projecten volgen
- Check-in/out: GPS-gebaseerde check-in bij projecten
- Analytics: rapportages en statistieken

Voorbeelden van goede antwoorden:
Vraag: "Hoe maak ik een project aan?"
Antwoord: "Ga naar de Planning pagina en klik op '+ Project plannen'. Vul de projectgegevens in zoals projectnaam, klant, adres, start- en einddatum."

Vraag: "Welke projecten heb ik?"
Antwoord: [Gebruik de ECHTE DATA uit de context - toon de projecten die zijn gegeven]

Gebruik altijd de ECHTE DATA die wordt gegeven. Verzin NOOIT projectnamen, klantnamen of andere informatie.`

      // Call Gemini API
      const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: conversationHistory,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          }
        })
      })

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text()
        console.error('[aiChatAgent] Gemini API error:', errorText)
        throw new Error(`Gemini API error: ${geminiResponse.status}`)
      }

      const geminiData = await geminiResponse.json()
      const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, ik kon geen antwoord genereren.'

      // Add AI response to conversation
      const updatedMessages = [
        ...(conversation.messages || []),
        message,
        { role: 'assistant', content: aiResponse }
      ]

      const { data: updatedConversation, error: updateError } = await supabaseAdmin
        .from('ai_conversations')
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation_id)
        .select()
        .single()

      if (updateError) {
        console.error('[aiChatAgent] Error updating conversation:', updateError)
        throw updateError
      }

      return new Response(
        JSON.stringify({ success: true, conversation: updatedConversation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Unknown action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  } catch (error) {
    console.error('[aiChatAgent] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Onbekende fout' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
