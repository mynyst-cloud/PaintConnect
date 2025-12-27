# Subscription Flow Documentation

## Overzicht

Dit document beschrijft de geïmplementeerde flows voor subscription management, trial expiration en payment failures.

## 1. Registratie Flow

### Nieuwe gebruiker registratie → Onboarding → Abonnement

**Flow:**
1. Gebruiker registreert via `/RegistratieCompany`
2. Edge function `registerCompany` wordt aangeroepen
3. Bedrijf wordt aangemaakt met:
   - `subscription_tier: 'starter_trial'`
   - `subscription_status: 'trialing'`
   - `trial_started_at`: huidige datum
   - `trial_ends_at`: +14 dagen
   - `onboarding_status: 'not_started'`
4. Gebruiker wordt doorgestuurd naar Dashboard
5. Onboarding guide wordt getoond (als `onboarding_status === 'not_started'`)
6. Na onboarding: gebruiker kan upgraden via `/Subscription`

**Bestanden:**
- `supabase/functions/registerCompany/index.ts`
- `src/pages/RegistratieCompany.jsx`
- `src/pages/Dashboard.jsx`
- `src/components/dashboard/OnboardingGuide.jsx`

## 2. Trial Expiration Flow

### Wat gebeurt er als een abonnement afloopt?

**Automatische Status Update:**
- Edge function `checkExpiredTrials` controleert dagelijks op verlopen trials
- Trials met `trial_ends_at < NOW()` worden geupdate naar `subscription_status: 'expired'`
- `trial_ended_at` timestamp wordt gezet

**UI Behavior:**
- `TrialExpiredModal` wordt getoond voor bedrijven met:
  - `subscription_status === 'expired'`
  - `subscription_status === 'canceled'`
  - `subscription_status === 'trialing'` maar `trial_ends_at < NOW()`
- Modal blokkeert toegang tot alle pagina's behalve `/Subscription`
- Gebruiker kan upgraden naar betaald abonnement

**Feature Access:**
- Expired companies hebben alleen toegang tot `page_subscription`
- Alle andere features zijn geblokkeerd
- Gecontroleerd in `useFeatureAccess.jsx` en `roles.js`

**Bestanden:**
- `supabase/functions/checkExpiredTrials/index.ts`
- `src/pages/Layout.jsx` (trial expiration check)
- `src/hooks/useFeatureAccess.jsx` (feature blocking)
- `src/config/roles.js` (hasFeatureAccess function)

## 3. Payment Failure Flow

### Wat gebeurt er als schildersbedrijf abonnement niet betaald heeft?

**Mollie Webhook Handling:**
- Bij failed/cancelled/expired payment status:
  - Check of dit een terugkerende betaling is (active subscription)
  - Als ja: update `subscription_status` naar `'past_due'`
  - Zet `payment_failed_at` timestamp
  - Stuur notificatie naar admins

**Grace Period:**
- Bedrijven met `'past_due'` status krijgen 7 dagen grace period
- Grace period start vanaf `payment_failed_at`
- Tijdens grace period: toegang blijft actief (met waarschuwingen)
- Na grace period: behandeld als `'expired'` (toegang geblokkeerd)

**Status Updates:**
- `'active'` → `'past_due'` (bij terugkerende betalingsfout)
- `'past_due'` → `'expired'` (na 7 dagen grace period)
- Notificaties worden verstuurd bij elke statuswijziging

**Bestanden:**
- `supabase/functions/mollieWebhook/index.ts` (payment failure handling)
- `src/pages/Layout.jsx` (grace period logic)
- `src/hooks/useFeatureAccess.jsx` (past_due status checks)

## Database Schema

### Nieuwe Kolommen (toegevoegd via SQL):

```sql
-- Companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ;
ADD COLUMN IF NOT EXISTS trial_ended_at TIMESTAMPTZ;
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;
```

### Subscription Status Values:

- `'trialing'` - In proefperiode (14 dagen)
- `'active'` - Betaald abonnement actief
- `'past_due'` - Betaling mislukt, grace period actief (7 dagen)
- `'expired'` - Trial verlopen of grace period verlopen
- `'canceled'` - Abonnement geannuleerd
- `'pending_activation'` - Wachtend op activatie

## Cron Job Setup

### Optie 1: Vercel Cron (Aanbevolen)

Voeg toe aan `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expired-trials?secret=paintconnect-cron-2024",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Optie 2: Externe Cron Service (cron-job.org)

1. Maak account aan op https://cron-job.org
2. Maak nieuwe cron job:
   - URL: `https://paintcon.vercel.app/api/cron/check-expired-trials?secret=paintconnect-cron-2024`
   - Schedule: Dagelijks om 2:00 AM UTC
   - Method: GET

### Optie 3: Supabase pg_cron (Als beschikbaar)

```sql
SELECT cron.schedule(
  'check-expired-trials',
  '0 2 * * *',
  $$SELECT net.http_post(
    url := 'https://hhnbxutsmnkypbwydebo.supabase.co/functions/v1/checkExpiredTrials',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )$$
);
```

## Edge Function Deployment

```bash
# Deploy checkExpiredTrials function
supabase functions deploy checkExpiredTrials --project-ref hhnbxutsmnkypbwydebo
```

## Testing

### Test Trial Expiration:

1. Maak test bedrijf aan met `trial_ends_at` in het verleden
2. Roep edge function aan: `POST /functions/v1/checkExpiredTrials`
3. Controleer of status is geupdate naar `'expired'`
4. Controleer of `TrialExpiredModal` wordt getoond

### Test Payment Failure:

1. Simuleer failed payment in Mollie webhook
2. Controleer of status is geupdate naar `'past_due'`
3. Controleer of `payment_failed_at` is gezet
4. Test grace period logic (7 dagen)
5. Controleer of toegang wordt geblokkeerd na grace period

### Test Feature Access:

1. Test met `subscription_status: 'expired'`
2. Test met `subscription_status: 'past_due'` (binnen grace period)
3. Test met `subscription_status: 'past_due'` (na grace period)
4. Verifieer dat alleen `page_subscription` toegankelijk is

## Notificaties

### Trial Expired:
- Type: `'trial_expired'`
- Titel: `'⏰ Proefperiode verlopen'`
- Link: `/Subscription`

### Payment Failed (Recurring):
- Type: `'payment_failed_recurring'`
- Titel: `'⚠️ Betaling mislukt - Grace period actief'`
- Link: `/Subscription`

### Payment Failed (Checkout):
- Type: `'payment_failed'`
- Titel: `'❌ Betaling mislukt'`
- Link: `/Subscription`

## Troubleshooting

### Trials worden niet geupdate:
1. Check cron job logs
2. Check edge function logs in Supabase Dashboard
3. Verifieer dat `trial_ends_at` correct is gezet
4. Test edge function handmatig

### Feature access werkt niet:
1. Check `subscription_status` in database
2. Check `useFeatureAccess` hook logs
3. Verifieer `hasFeatureAccess` functie in `roles.js`
4. Check browser console voor errors

### Grace period werkt niet:
1. Verifieer `payment_failed_at` is gezet
2. Check grace period berekening in `Layout.jsx`
3. Test met verschillende datums

## Security

- Cron job endpoint vereist secret parameter
- Edge function vereist service role key
- Feature access checks gebeuren op frontend EN backend
- Database RLS policies beschermen data

## Monitoring

- Check Supabase Edge Function logs dagelijks
- Monitor failed payment notifications
- Track trial expiration rates
- Monitor upgrade conversions na trial expiration



