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

    const { record_id } = await req.json()
    
    if (!record_id) {
      throw new Error('record_id is verplicht')
    }

    // Get the check-in record to verify ownership
    const { data: record, error: fetchError } = await supabase
      .from('check_in_records')
      .select('user_id, company_id')
      .eq('id', record_id)
      .single()

    if (fetchError || !record) {
      throw new Error('Check-in record niet gevonden')
    }

    // Get user's company_id
    const { data: userData } = await supabase
      .from('users')
      .select('company_id, company_role')
      .eq('id', user.id)
      .single()

    // Only admin of same company can delete
    const isAdmin = userData?.company_role === 'admin' && userData?.company_id === record.company_id

    if (!isAdmin) {
      throw new Error('Alleen admins kunnen check-in records verwijderen')
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('check_in_records')
      .delete()
      .eq('id', record_id)

    if (deleteError) {
      throw deleteError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('deleteCheckInRecord error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})


