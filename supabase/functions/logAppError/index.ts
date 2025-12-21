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

    // Get request body
    const errorData = await req.json()
    
    // Log error to app_errors table
    const { error: insertError } = await supabase
      .from('app_errors')
      .insert({
        error_message: errorData.message || 'Unknown error',
        error_stack: errorData.stack,
        error_type: errorData.type || 'runtime',
        url: errorData.url,
        user_agent: errorData.userAgent,
        user_id: errorData.userId,
        company_id: errorData.companyId,
        additional_data: errorData.additionalData,
        created_date: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error logging app error:', insertError)
      // Don't throw - we don't want to fail silently for error logging
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('logAppError error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

