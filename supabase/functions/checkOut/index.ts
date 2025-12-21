import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
    const { notes } = await req.json()

    // Find active check-in
    const { data: activeCheckIn, error: checkInError } = await supabase
      .from('check_in_records')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'checked_in')
      .single()

    if (checkInError || !activeCheckIn) {
      throw new Error('Geen actieve check-in gevonden')
    }

    // Calculate duration
    const checkOutTime = new Date()
    const checkInTime = new Date(activeCheckIn.check_in_time)
    const durationMinutes = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000)

    // Calculate return travel (from site back to home)
    let travelReturn = null
    if (activeCheckIn.latitude && activeCheckIn.longitude) {
      const { data: userData } = await supabase
        .from('users')
        .select('home_latitude, home_longitude')
        .eq('id', user.id)
        .single()

      if (userData?.home_latitude && userData?.home_longitude) {
        travelReturn = await calculateTravelInfo(
          activeCheckIn.latitude, activeCheckIn.longitude,
          userData.home_latitude, userData.home_longitude
        )
      }
    }

    // Calculate total travel
    let totalTravelTime = 0
    let totalTravelDistance = 0

    if (activeCheckIn.travel_outbound) {
      totalTravelTime += activeCheckIn.travel_outbound.duration_min || 0
      totalTravelDistance += activeCheckIn.travel_outbound.distance_km || 0
    }
    if (travelReturn) {
      totalTravelTime += travelReturn.duration_min || 0
      totalTravelDistance += travelReturn.distance_km || 0
    }

    // Update check-in record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('check_in_records')
      .update({
        check_out_time: checkOutTime.toISOString(),
        status: 'checked_out',
        duration_minutes: durationMinutes,
        check_out_notes: notes,
        travel_return: travelReturn,
        total_travel_time: totalTravelTime,
        total_travel_distance: totalTravelDistance
      })
      .eq('id', activeCheckIn.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    const hours = Math.floor(durationMinutes / 60)
    const mins = durationMinutes % 60
    const durationText = hours > 0 ? `${hours}u ${mins}m` : `${mins}m`

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Check-out succesvol! Gewerkt: ${durationText}`,
        record: updatedRecord 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('checkOut error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

