import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// High-end interior photos from Unsplash (free to use)
const DUMMY_PROJECT_DATA = [
  {
    project_name: 'Villa Renovatie - Familie De Groot',
    client_name: 'Familie De Groot',
    description: 'Luxe woonkamer en hal volledig opnieuw geschilderd in warm wit en accent kleuren.',
    status: 'in_uitvoering',
    progress_percentage: 65,
    photo_urls: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    ]
  },
  {
    project_name: 'Penthouse Amsterdam - Interieur',
    client_name: 'Dhr. Bakker',
    description: 'Volledig penthouse project met custom kleuradvies en hoogwaardige afwerking.',
    status: 'planning',
    progress_percentage: 10,
    photo_urls: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    ]
  },
  {
    project_name: 'Boutique Hotel Lobby',
    client_name: 'Hotel Majestic',
    description: 'Stijlvolle lobby en receptieruimte met klassieke accenten en moderne afwerking.',
    status: 'nieuw',
    progress_percentage: 0,
    photo_urls: [
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    ]
  },
  {
    project_name: 'Moderne Loft - Centrum',
    client_name: 'Mevr. Jansen',
    description: 'Industriële loft met wit stucwerk en contrast accenten. Plafond en muren.',
    status: 'afgerond',
    progress_percentage: 100,
    photo_urls: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80',
    ]
  }
];

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
      console.log('[seedDummyProjects] No body provided')
    }

    const companyId = body.company_id
    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'company_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('[seedDummyProjects] Seeding for company:', companyId)

    // Check if dummy projects already exist
    const { data: existingDummies } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_dummy', true)

    if (existingDummies && existingDummies.length > 0) {
      console.log('[seedDummyProjects] Dummy projects already exist:', existingDummies.length)
      return new Response(
        JSON.stringify({ success: true, count: existingDummies.length, message: 'Dummy projects already exist' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create dummy projects
    const today = new Date()
    const createdProjects = []

    for (let i = 0; i < DUMMY_PROJECT_DATA.length; i++) {
      const data = DUMMY_PROJECT_DATA[i]
      const startDate = new Date(today)
      startDate.setDate(startDate.getDate() - (i * 7))
      
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 14 + (i * 3))

      const projectData = {
        company_id: companyId,
        project_name: data.project_name,
        client_name: data.client_name,
        client_email: `demo${i + 1}@example.com`,
        address: `Voorbeeldstraat ${100 + i * 25}, 1000 AA Amsterdam`,
        start_date: startDate.toISOString().split('T')[0],
        expected_end_date: endDate.toISOString().split('T')[0],
        status: data.status,
        progress_percentage: data.progress_percentage,
        description: data.description,
        photo_urls: data.photo_urls,
        is_dummy: true,
        estimated_hours: 40 + (i * 10),
        actual_hours: Math.floor((40 + (i * 10)) * (data.progress_percentage / 100))
      }

      const { data: project, error } = await supabaseAdmin
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) {
        console.error('[seedDummyProjects] Error creating project:', error)
        continue
      }

      createdProjects.push(project)
      console.log('[seedDummyProjects] Created:', project.project_name)
    }

    console.log('[seedDummyProjects] Created', createdProjects.length, 'dummy projects')

    return new Response(
      JSON.stringify({ success: true, count: createdProjects.length, projects: createdProjects }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[seedDummyProjects] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

