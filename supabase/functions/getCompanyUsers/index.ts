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
    
    let company_id = body.company_id
    
    // If no company_id provided, get it from the user
    if (!company_id) {
      console.log('No company_id in body, fetching from user:', user.id)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (userError) {
        console.error('Error fetching user data:', userError)
        throw new Error(`Kon gebruiker niet ophalen: ${userError.message}`)
      }
      
      console.log('User data:', userData)
      company_id = userData?.company_id
      
      if (!company_id) {
        throw new Error('Gebruiker heeft geen bedrijf gekoppeld')
      }
    }
    
    console.log('Using company_id:', company_id)

    // Get all users for the company
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, company_role, is_painter, created_date, status')
      .eq('company_id', company_id)
      .order('created_date', { ascending: false })

    if (usersError) {
      throw usersError
    }

    console.log('Returning users:', users?.length || 0)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: users || []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('getCompanyUsers error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.stack,
        function: 'getCompanyUsers'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

