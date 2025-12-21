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

    const { project_ids } = await req.json()
    
    if (!project_ids || !Array.isArray(project_ids) || project_ids.length === 0) {
      throw new Error('project_ids array is verplicht')
    }

    const stats: Record<string, any> = {}

    for (const projectId of project_ids) {
      // Get time entries for this project
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('hours')
        .eq('project_id', projectId)

      // Get damages for this project
      const { data: damages } = await supabase
        .from('damages')
        .select('id, status')
        .eq('project_id', projectId)

      // Get material requests for this project
      const { data: materialRequests } = await supabase
        .from('material_requests')
        .select('id, status')
        .eq('project_id', projectId)

      // Get daily updates for this project
      const { data: dailyUpdates } = await supabase
        .from('daily_updates')
        .select('id')
        .eq('project_id', projectId)

      // Calculate total hours
      const totalHours = (timeEntries || []).reduce((sum, entry) => sum + (entry.hours || 0), 0)

      stats[projectId] = {
        total_hours: totalHours,
        damages_count: (damages || []).length,
        open_damages: (damages || []).filter(d => d.status !== 'resolved').length,
        material_requests_count: (materialRequests || []).length,
        pending_requests: (materialRequests || []).filter(r => r.status === 'pending').length,
        daily_updates_count: (dailyUpdates || []).length
      }
    }

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('getProjectStats error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

