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
    const body = await req.json().catch(() => ({}))
    let company_id = body.company_id
    
    // If no company_id provided, get it from the user
    if (!company_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      company_id = userData?.company_id
      
      if (!company_id) {
        throw new Error('Gebruiker heeft geen bedrijf')
      }
    }

    // Get all painters/team members for the company
    const { data: painters, error: paintersError } = await supabase
      .from('users')
      .select('id, email, full_name, company_role, is_painter, created_date, status, home_address, home_latitude, home_longitude')
      .eq('company_id', company_id)
      .order('full_name', { ascending: true })

    if (paintersError) {
      throw paintersError
    }

    console.log('Returning painters:', painters?.length || 0)
    
    return new Response(
      JSON.stringify(painters || []),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('getCompanyPainters error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

