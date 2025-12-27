# Deploy Instructies - Invite-only Mode

## ✅ Voltooid

1. ✅ **Git Commit & Push**
   - Commit: `8ccd4c1`
   - Alle invite-gerelateerde bestanden zijn gecommit en gepusht naar GitHub
   - Vercel zal automatisch de landingpage updaten

2. ✅ **Edge Function Gedeployed**
   - `submitInviteRequest` function is gedeployed naar Supabase
   - URL: `https://supabase.com/dashboard/project/hhnbxutsmnkypbwydebo/functions`

## ⚠️ Nog Te Doen

### 1. SQL Migratie Uitvoeren

De `invite_requests` tabel moet nog aangemaakt worden in Supabase:

**Via Supabase Dashboard:**
1. Ga naar: https://supabase.com/dashboard/project/hhnbxutsmnkypbwydebo
2. Klik op **SQL Editor** in het menu
3. Klik op **New Query**
4. Kopieer de inhoud van `supabase/migrations/create_invite_requests_table.sql`
5. Plak in de SQL editor
6. Klik op **Run** (of druk op Cmd/Ctrl + Enter)

**Of via CLI (als gelinkt):**
```bash
cd /Users/freshdecor/Downloads/paint-connect-backup
supabase db push
```

### 2. Environment Variable Controleren (Optioneel)

De Edge Function gebruikt `OWNER_EMAIL` voor notificaties. Standaard gebruikt het `mynysteven@gmail.com`.

Als je dit wilt aanpassen:
1. Ga naar Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Voeg toe: `OWNER_EMAIL=jouw-email@voorbeeld.nl`
3. (Re-deploy de function als je dit aanpast)

**Let op:** `RESEND_API_KEY` moet al aanwezig zijn (gebruikt door andere functies).

## Testen

1. **Test Invite Pagina:**
   - Ga naar: `https://paintconnect.be/invite` (na Vercel deploy)
   - Vul het formulier in
   - Verzend het formulier

2. **Check Database:**
   - Ga naar Supabase Dashboard → Table Editor
   - Zoek `invite_requests` tabel
   - Controleer of de data is opgeslagen

3. **Check Email:**
   - Controleer `mynysteven@gmail.com` voor een notificatie email

## Files Geüpdatet

- ✅ `landingpage/src/app/invite/page.tsx` (nieuw)
- ✅ `landingpage/src/app/page.tsx` (alle CTA links)
- ✅ `landingpage/src/components/Navigation.tsx` (alle CTA links)
- ✅ `supabase/functions/submitInviteRequest/index.ts` (nieuw)
- ✅ `supabase/migrations/create_invite_requests_table.sql` (nieuw)

