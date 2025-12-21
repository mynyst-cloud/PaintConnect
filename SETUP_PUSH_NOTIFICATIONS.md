# Push Notifications Setup - PaintConnect

Dit document beschrijft hoe je de push notificaties volledig configureert.

## 1. OneSignal Configuratie

### 1.1 OneSignal Account
1. Ga naar https://onesignal.com en maak een account aan (of log in)
2. Maak een nieuwe app aan genaamd "PaintConnect"
3. Selecteer "Web" als platform

### 1.2 Web Push Configuratie
1. In OneSignal dashboard, ga naar Settings → Platforms → Web
2. Vul in:
   - Site URL: `https://paintcon.vercel.app`
   - Site Name: `PaintConnect`
   - Default Icon URL: `https://paintconnect.be/logo-192.png`
3. Kopieer je **App ID** en **REST API Key**

### 1.3 Environment Variables
Voeg toe aan je `.env` file:
```
VITE_ONESIGNAL_APP_ID=jouw-app-id-hier
```

### 1.4 Supabase Secrets
Voer uit in terminal:
```bash
supabase secrets set ONESIGNAL_APP_ID=jouw-app-id-hier
supabase secrets set ONESIGNAL_REST_API_KEY=jouw-rest-api-key-hier
```

## 2. Database Setup

Voer de volgende SQL uit in Supabase Dashboard → SQL Editor:

```sql
-- Zie: add_push_notifications_system.sql
```

## 3. Edge Functions Deployen

```bash
cd /Users/freshdecor/Downloads/paint-connect-backup
supabase functions deploy sendPushNotification --project-ref hhnbxutsmnkypbwydebo
supabase functions deploy checkInReminders --project-ref hhnbxutsmnkypbwydebo
```

## 4. Cron Job Setup

De `checkInReminders` functie moet elke minuut aangeroepen worden. Kies één van deze opties:

### Optie A: Externe Cron Service (Aanbevolen)
Gebruik een gratis service zoals:
- **cron-job.org** (gratis, betrouwbaar)
- **EasyCron** (gratis tier beschikbaar)

Configureer een job:
- URL: `https://hhnbxutsmnkypbwydebo.supabase.co/functions/v1/checkInReminders`
- Schedule: Elke minuut (`* * * * *`)
- Method: POST
- Headers:
  - `Authorization: Bearer jouw-supabase-anon-key`
  - `Content-Type: application/json`

### Optie B: Vercel Cron
Voeg toe aan `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/trigger-checkin-reminders",
    "schedule": "* * * * *"
  }]
}
```

En maak `api/trigger-checkin-reminders.js`:
```javascript
export default async function handler(req, res) {
  const response = await fetch(
    'https://hhnbxutsmnkypbwydebo.supabase.co/functions/v1/checkInReminders',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  res.json(data);
}
```

### Optie C: Supabase pg_cron (Database Extension)
In SQL Editor:
```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every minute
SELECT cron.schedule(
  'check-in-reminders',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://hhnbxutsmnkypbwydebo.supabase.co/functions/v1/checkInReminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer JOUW_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

## 5. Test de Setup

### Test Push Notificatie
```bash
curl -X POST https://hhnbxutsmnkypbwydebo.supabase.co/functions/v1/sendPushNotification \
  -H "Authorization: Bearer JOUW_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["jouw-user-id"],
    "title": "Test Notificatie",
    "message": "Dit is een test!",
    "notification_type": "general"
  }'
```

### Test Cron Job
```bash
curl -X POST https://hhnbxutsmnkypbwydebo.supabase.co/functions/v1/checkInReminders \
  -H "Authorization: Bearer JOUW_ANON_KEY" \
  -H "Content-Type: application/json"
```

## 6. Flow Samenvatting

1. **Admin maakt project aan** met work_start_time (bijv. 08:00) en work_end_time (bijv. 17:00)
2. **Admin wijst schilders toe** aan het project
3. **Elke minuut** draait de `checkInReminders` cron job
4. **Om 08:00** krijgen toegewezen schilders die nog niet ingecheckt zijn een push:
   > "⏰ Tijd om in te checken! De werkdag bij [Project] begint nu."
5. **Om 17:00** krijgen schilders die nog ingecheckt zijn een push:
   > "🏠 Werkdag eindigt! Vergeet niet uit te checken!"
6. **Schilders** klikken op de notificatie → worden naar Dashboard geleid om in/uit te checken

## Troubleshooting

### Push werkt niet
- Check of de gebruiker push notificaties heeft toegestaan
- Controleer of `push_subscriptions` tabel een entry heeft voor de gebruiker
- Check OneSignal dashboard voor delivery stats

### Cron werkt niet
- Check Edge Function logs in Supabase Dashboard
- Verifieer dat de cron service correct is geconfigureerd
- Test de functie handmatig met curl


