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

    // Get user's company
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, company_role')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.company_id) {
      throw new Error('Gebruiker heeft geen bedrijf')
    }

    const today = new Date().toISOString().split('T')[0]

    // Get active check-ins (status = checked_in)
    const { data: activeCheckIns, error: activeError } = await supabase
      .from('check_in_records')
      .select('*')
      .eq('company_id', userData.company_id)
      .eq('status', 'checked_in')
      .order('check_in_time', { ascending: false })

    if (activeError) {
      throw activeError
    }

    // Get completed check-ins from today
    const { data: completedCheckIns, error: completedError } = await supabase
      .from('check_in_records')
      .select('*')
      .eq('company_id', userData.company_id)
      .eq('status', 'checked_out')
      .gte('check_in_time', today)
      .order('check_out_time', { ascending: false })
      .limit(20)

    if (completedError) {
      throw completedError
    }

    return new Response(
      JSON.stringify({
        success: true,
        active: activeCheckIns || [],
        completed: completedCheckIns || [],
        debug: {
          company_id: userData.company_id,
          active_count: activeCheckIns?.length || 0,
          completed_count: completedCheckIns?.length || 0
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('getActiveCheckIns error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

