import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Color mapping based on project names from DUMMY_PROJECT_DATA
const PROJECT_COLOR_MAP: Record<string, string> = {
  'Villa Renovatie - Familie De Groot': 'blue',
  'Penthouse Amsterdam - Interieur': 'green',
  'Boutique Hotel Lobby': 'purple',
  'Moderne Loft - Centrum': 'orange',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    let body: { company_id?: string } = {}
    try {
      const text = await req.text()
      if (text) body = JSON.parse(text)
    } catch (e) {
      console.log('[updateDummyProjectColors] No body provided')
    }

    const companyId = body.company_id
    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'company_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('[updateDummyProjectColors] Updating dummy project colors for company:', companyId)

    // Get all dummy projects for this company
    const { data: dummyProjects, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, project_name, calendar_color')
      .eq('company_id', companyId)
      .eq('is_dummy', true)

    if (fetchError) {
      console.error('[updateDummyProjectColors] Error fetching dummy projects:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!dummyProjects || dummyProjects.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0, message: 'No dummy projects found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`[updateDummyProjectColors] Found ${dummyProjects.length} dummy projects`)

    // Update each dummy project with the correct color
    const updatedProjects = []
    for (const project of dummyProjects) {
      const color = PROJECT_COLOR_MAP[project.project_name]
      
      if (!color) {
        console.log(`[updateDummyProjectColors] No color mapping found for: "${project.project_name}"`)
        continue
      }

      // Always update to ensure correct color (even if already set)
      console.log(`[updateDummyProjectColors] Updating "${project.project_name}" from "${project.calendar_color || 'none'}" to "${color}"`)
      
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('projects')
        .update({ calendar_color: color })
        .eq('id', project.id)
        .select()
        .single()

      if (updateError) {
        console.error(`[updateDummyProjectColors] Error updating project ${project.id}:`, updateError)
        continue
      }

      updatedProjects.push(updated)
      console.log(`[updateDummyProjectColors] Successfully updated "${project.project_name}" to color: ${color}`)
    }

    console.log(`[updateDummyProjectColors] Updated ${updatedProjects.length} dummy projects`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: updatedProjects.length, 
        projects: updatedProjects 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[updateDummyProjectColors] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

