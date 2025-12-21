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

    const { start_date, end_date, format = 'csv' } = await req.json()

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id, company_role')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id || userData?.company_role !== 'admin') {
      throw new Error('Alleen admins kunnen exporteren')
    }

    // Build query
    let query = supabase
      .from('check_in_records')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('check_in_time', { ascending: false })

    if (start_date) {
      query = query.gte('check_in_time', start_date)
    }
    if (end_date) {
      query = query.lte('check_in_time', end_date)
    }

    const { data: records, error } = await query

    if (error) throw error

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Datum', 'Medewerker', 'Project', 'Check-in', 'Check-out', 'Duur (uren)', 'Locatie', 'Status']
      const rows = (records || []).map(r => [
        new Date(r.check_in_time).toLocaleDateString('nl-NL'),
        r.user_name || '',
        r.project_name || '',
        new Date(r.check_in_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '-',
        r.total_hours ? r.total_hours.toFixed(2) : '-',
        r.location_name || '',
        r.status || ''
      ])

      const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')

      return new Response(
        JSON.stringify({ success: true, data: csv, filename: `team-activiteit-${new Date().toISOString().split('T')[0]}.csv` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, records }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('exportTeamActivity error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})


