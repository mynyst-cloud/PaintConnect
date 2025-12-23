import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
      console.log('[deleteDummyProjects] No body provided')
    }

    const companyId = body.company_id
    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'company_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('[deleteDummyProjects] Deleting for company:', companyId)

    // Delete all dummy projects for this company
    const { data: deleted, error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('company_id', companyId)
      .eq('is_dummy', true)
      .select('id, project_name')

    if (error) {
      console.error('[deleteDummyProjects] Error:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('[deleteDummyProjects] Deleted', deleted?.length || 0, 'dummy projects')

    return new Response(
      JSON.stringify({ success: true, count: deleted?.length || 0, deleted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[deleteDummyProjects] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

