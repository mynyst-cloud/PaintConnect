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

    const { start_date, end_date, project_id } = await req.json()

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      throw new Error('Gebruiker heeft geen bedrijf gekoppeld')
    }

    // Build query for materials usage
    let query = supabase
      .from('materials_usage')
      .select(`
        *,
        material:material_id (name, unit, category),
        project:project_id (project_name)
      `)
      .eq('company_id', userData.company_id)
      .order('created_date', { ascending: false })

    if (start_date) {
      query = query.gte('created_date', start_date)
    }
    if (end_date) {
      query = query.lte('created_date', end_date)
    }
    if (project_id) {
      query = query.eq('project_id', project_id)
    }

    const { data: usageRecords, error } = await query

    if (error) {
      console.error('Query error:', error)
      // Return empty data if table doesn't exist yet
      if (error.code === '42P01') {
        return new Response(
          JSON.stringify({ 
            success: true, 
            records: [],
            totals: {},
            message: 'Materials usage table not yet created'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      throw error
    }

    // Calculate totals per material
    const materialTotals: Record<string, { name: string; unit: string; total: number }> = {}
    
    for (const record of (usageRecords || [])) {
      const materialId = record.material_id
      if (!materialTotals[materialId]) {
        materialTotals[materialId] = {
          name: record.material?.name || 'Onbekend',
          unit: record.material?.unit || 'stuks',
          total: 0
        }
      }
      materialTotals[materialId].total += record.quantity || 0
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        records: usageRecords || [],
        totals: materialTotals
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('getMaterialConsumption error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

