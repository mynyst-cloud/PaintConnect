import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Haversine distance calculation (in meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Google Maps Directions API call for travel info
async function calculateTravelInfo(
  fromLat: number, fromLng: number, 
  toLat: number, toLng: number
): Promise<{ distance_km: number; duration_min: number; start_address: string; end_address: string } | null> {
  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
  if (!apiKey) return null

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&mode=driving&key=${apiKey}`
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.status === 'OK' && data.routes.length > 0) {
      const route = data.routes[0].legs[0]
      return {
        distance_km: route.distance.value / 1000,
        duration_min: Math.round(route.duration.value / 60),
        start_address: route.start_address,
        end_address: route.end_address
      }
    }
  } catch (e) {
    console.error('Travel calculation error:', e)
  }
  return null
}

// Reverse geocoding
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
  if (!apiKey) return null

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address
    }
  } catch (e) {
    console.error('Geocoding error:', e)
  }
  return null
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
    const { project_id, latitude, longitude, notes } = await req.json()
    
    if (!project_id || !latitude || !longitude) {
      throw new Error('project_id, latitude en longitude zijn verplicht')
    }

    // Check for existing active check-in
    const { data: existingCheckIn } = await supabase
      .from('check_in_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'checked_in')
      .single()

    if (existingCheckIn) {
      throw new Error('Je bent al ingecheckt. Check eerst uit voordat je opnieuw incheckt.')
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name, email, company_id, home_latitude, home_longitude')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw new Error('Gebruikersgegevens niet gevonden')
    }

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_name, full_address, latitude, longitude, expected_start_time')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      throw new Error('Project niet gevonden')
    }

    // Calculate distance from site
    let distanceFromSite = null
    if (project.latitude && project.longitude) {
      distanceFromSite = calculateDistance(
        latitude, longitude,
        parseFloat(project.latitude), parseFloat(project.longitude)
      )
    }

    // Reverse geocode the location
    const locationName = await reverseGeocode(latitude, longitude)

    // Calculate outbound travel (from home to site)
    let travelOutbound = null
    if (userData.home_latitude && userData.home_longitude) {
      travelOutbound = await calculateTravelInfo(
        userData.home_latitude, userData.home_longitude,
        latitude, longitude
      )
    }

    // Determine if on time
    let isOnTime = true
    if (project.expected_start_time) {
      const now = new Date()
      const expected = new Date()
      const [hours, minutes] = project.expected_start_time.split(':').map(Number)
      expected.setHours(hours, minutes, 0, 0)
      // 15 minutes grace period
      isOnTime = now <= new Date(expected.getTime() + 15 * 60 * 1000)
    }

    // Create check-in record
    const { data: checkIn, error: insertError } = await supabase
      .from('check_in_records')
      .insert({
        user_id: user.id,
        user_name: userData.full_name,
        user_email: userData.email,
        company_id: userData.company_id,
        project_id: project_id,
        project_name: project.project_name,
        project_address: project.full_address,
        check_in_time: new Date().toISOString(),
        status: 'checked_in',
        latitude,
        longitude,
        location_name: locationName,
        distance_from_site: distanceFromSite,
        within_range: distanceFromSite ? distanceFromSite <= 200 : true,
        is_on_time: isOnTime,
        expected_start_time: project.expected_start_time,
        notes,
        travel_outbound: travelOutbound
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Check-in succesvol!',
        record: checkIn 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('checkIn error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

