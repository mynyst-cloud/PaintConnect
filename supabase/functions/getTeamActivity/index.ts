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

    // Get request body
    const { company_id, page = 1, limit = 50, filters = {} } = await req.json()
    
    if (!company_id) {
      throw new Error('company_id is verplicht')
    }

    const offset = (page - 1) * limit

    // Build query for check-in records
    let query = supabase
      .from('check_in_records')
      .select('*', { count: 'exact' })
      .eq('company_id', company_id)
      .order('check_in_time', { ascending: false })

    // Apply filters
    if (filters.date_from) {
      query = query.gte('check_in_time', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('check_in_time', filters.date_to + 'T23:59:59')
    }
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id)
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    if (filters.on_time_status === 'on_time') {
      query = query.eq('is_on_time', true)
    } else if (filters.on_time_status === 'late') {
      query = query.eq('is_on_time', false)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: records, error: recordsError, count } = await query

    if (recordsError) {
      throw recordsError
    }

    // Calculate stats
    const today = new Date().toISOString().split('T')[0]
    
    const { data: allRecords } = await supabase
      .from('check_in_records')
      .select('duration_minutes, is_on_time, total_travel_time, total_travel_distance')
      .eq('company_id', company_id)
      .gte('check_in_time', filters.date_from || today)
      .lte('check_in_time', (filters.date_to || today) + 'T23:59:59')

    const stats = {
      total_records: count || 0,
      total_hours: 0,
      avg_hours_per_checkin: 0,
      on_time_percentage: 0,
      total_travel_time: 0,
      total_travel_distance: 0,
      avg_travel_time_per_checkin: 0,
      avg_travel_distance_per_checkin: 0
    }

    if (allRecords && allRecords.length > 0) {
      const totalMinutes = allRecords.reduce((sum, r) => sum + (r.duration_minutes || 0), 0)
      const onTimeCount = allRecords.filter(r => r.is_on_time).length
      const totalTravelTime = allRecords.reduce((sum, r) => sum + (r.total_travel_time || 0), 0)
      const totalTravelDistance = allRecords.reduce((sum, r) => sum + (r.total_travel_distance || 0), 0)

      stats.total_hours = Math.round(totalMinutes / 60 * 10) / 10
      stats.avg_hours_per_checkin = Math.round(totalMinutes / allRecords.length / 60 * 10) / 10
      stats.on_time_percentage = Math.round(onTimeCount / allRecords.length * 100)
      stats.total_travel_time = totalTravelTime
      stats.total_travel_distance = Math.round(totalTravelDistance * 10) / 10
      stats.avg_travel_time_per_checkin = Math.round(totalTravelTime / allRecords.length)
      stats.avg_travel_distance_per_checkin = Math.round(totalTravelDistance / allRecords.length * 10) / 10
    }

    return new Response(
      JSON.stringify({
        success: true,
        records: records || [],
        stats,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('getTeamActivity error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})



