import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Niet geautoriseerd')
    }

    // Get request body (safely parse JSON)
    let body = {}
    try {
      const text = await req.text()
      if (text && text.length > 0) {
        body = JSON.parse(text)
      }
    } catch (e) {
      console.log('No JSON body or empty body, continuing...')
    }
    
    // Get user's company and check if painter
    console.log('Fetching user data for user:', user.id)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, company_role, email')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      throw new Error(`Kon gebruiker niet ophalen: ${userError.message}`)
    }
    
    if (!userData?.company_id) {
      throw new Error('Gebruiker heeft geen bedrijf gekoppeld')
    }

    const company_id = body.company_id || userData.company_id
    const isPainter = userData.company_role === 'painter'
    
    console.log('Fetching projects for company:', company_id, 'isPainter:', isPainter)

    // Build query for active projects
    let query = supabase
      .from('projects')
      .select('id, project_name, client_name, full_address, latitude, longitude, status, assigned_painters')
      .eq('company_id', company_id)
      .in('status', ['in_uitvoering', 'planning', 'nieuw'])
      .order('project_name', { ascending: true })

    const { data: projects, error: projectsError } = await query

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      throw new Error(`Kon projecten niet ophalen: ${projectsError.message}`)
    }

    console.log('Found projects:', projects?.length || 0)

    // Filter projects for painters - only show assigned projects
    let filteredProjects = projects || []
    if (isPainter && userData.email) {
      const beforeFilter = filteredProjects.length
      filteredProjects = filteredProjects.filter(project => {
        const assignedPainters = project.assigned_painters || []
        return assignedPainters.includes(userData.email)
      })
      console.log(`Filtered projects for painter: ${beforeFilter} -> ${filteredProjects.length}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        projects: filteredProjects
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('getCompanyProjects error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    })
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
        details: error.details,
        projects: [] 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

