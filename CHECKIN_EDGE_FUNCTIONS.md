# Check-in/Check-out Systeem - Supabase Edge Functions

Dit document beschrijft de benodigde Supabase Edge Functions voor het check-in/out systeem.

## Vereiste Environment Variables

```
GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## 1. checkIn

**Doel:** Registreert een check-in voor een gebruiker op een project.

**Aanroep:**
```javascript
const response = await base44.functions.invoke('checkIn', {
  project_id: 'uuid',
  latitude: 52.3676,
  longitude: 4.9041,
  notes: 'Optionele notities'
});
```

**Implementatie:**

```typescript
// supabase/functions/checkIn/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      throw new Error('Niet ingelogd')
    }

    const { project_id, latitude, longitude, notes } = await req.json()

    // Haal gebruiker en project data op
    const { data: userData } = await supabase
      .from('users')
      .select('*, companies(home_address, home_latitude, home_longitude)')
      .eq('id', user.id)
      .single()

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single()

    if (!project) {
      throw new Error('Project niet gevonden')
    }

    // Bereken afstand van werf (haversine formule)
    const distanceFromSite = calculateDistance(
      latitude, longitude,
      project.latitude, project.longitude
    )

    // Reverse geocode de locatie
    const locationName = await reverseGeocode(latitude, longitude)

    // Bereken reistijd & afstand met Google Maps Directions API
    let travelOutbound = null
    if (userData?.home_latitude && userData?.home_longitude) {
      travelOutbound = await calculateTravelInfo(
        userData.home_latitude, userData.home_longitude,
        latitude, longitude
      )
    }

    // Maak check-in record aan
    const { data: checkIn, error } = await supabase
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
        within_range: distanceFromSite <= 200, // binnen 200m
        is_on_time: isOnTime(project.expected_start_time),
        notes,
        travel_outbound: travelOutbound
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Check-in succesvol!',
        record: checkIn 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// Helper: Haversine afstandsberekening (in meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // aarde radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Helper: Google Maps Directions API call
async function calculateTravelInfo(
  fromLat: number, fromLng: number, 
  toLat: number, toLng: number
) {
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

// Helper: Reverse geocoding
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

function isOnTime(expectedStartTime?: string): boolean {
  if (!expectedStartTime) return true
  const now = new Date()
  const expected = new Date()
  const [hours, minutes] = expectedStartTime.split(':').map(Number)
  expected.setHours(hours, minutes, 0, 0)
  // 15 minuten speling
  return now <= new Date(expected.getTime() + 15 * 60 * 1000)
}
```

## 2. checkOut

**Doel:** Registreert een check-out en berekent gewerkte tijd + terugreis.

**Aanroep:**
```javascript
const response = await base44.functions.invoke('checkOut', { notes: 'Werk afgerond' });
```

**Implementatie:**

```typescript
// supabase/functions/checkOut/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // ... CORS headers & auth check (zelfde als checkIn)

  const { notes } = await req.json()

  // Vind actieve check-in
  const { data: activeCheckIn } = await supabase
    .from('check_in_records')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'checked_in')
    .single()

  if (!activeCheckIn) {
    throw new Error('Geen actieve check-in gevonden')
  }

  const checkOutTime = new Date()
  const checkInTime = new Date(activeCheckIn.check_in_time)
  const durationMinutes = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000)

  // Bereken terugreis
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

  // Bereken totale reisgegevens
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
  const { data: updatedRecord, error } = await supabase
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

  if (error) throw error

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Check-out succesvol! Gewerkt: ${Math.floor(durationMinutes/60)}u ${durationMinutes%60}m`,
      record: updatedRecord 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
```

## 3. getActiveCheckIns

**Doel:** Haalt alle actieve en recent voltooide check-ins op voor TeamActivityFeed.

**Aanroep:**
```javascript
const response = await base44.functions.invoke('getActiveCheckIns', {});
```

**Response:**
```json
{
  "success": true,
  "active": [...],
  "completed": [...],
  "debug": { "company_id": "...", "active_count": 3, "completed_count": 5 }
}
```

## 4. getTeamActivity

**Doel:** Haalt gepagineerde team activiteit op met filters.

**Aanroep:**
```javascript
const response = await base44.functions.invoke('getTeamActivity', {
  company_id: 'uuid',
  page: 1,
  limit: 50,
  filters: {
    date_from: '2025-01-01',
    date_to: '2025-01-31',
    project_id: 'uuid',
    user_id: 'uuid',
    status: 'all',
    on_time_status: 'all'
  }
});
```

## 5. getCompanyProjects

**Doel:** Haalt alle actieve projecten op voor project selectie bij check-in.

**Response:** Array van projecten met `id`, `project_name`, `client_name`.

## 6. getCompanyPainters

**Doel:** Haalt alle teamleden op voor filtering in TeamActiviteit.

---

## Database Vereisten

Voer `add_check_in_records.sql` uit in de Supabase SQL Editor om de tabel aan te maken.

## Users Tabel Uitbreiding

Voeg de volgende kolommen toe aan de `users` tabel voor thuisadres (voor reisberekening):

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_longitude DECIMAL(11, 8);
```

## Deploy Edge Functions

```bash
# Deploy alle functions
supabase functions deploy checkIn
supabase functions deploy checkOut
supabase functions deploy getActiveCheckIns
supabase functions deploy getTeamActivity
supabase functions deploy getCompanyProjects
supabase functions deploy getCompanyPainters
```


