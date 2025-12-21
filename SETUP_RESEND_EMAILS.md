# Resend Email Setup voor PaintConnect

## Overzicht

De schilder uitnodigings-flow gebruikt Resend voor het versturen van e-mails. Dit document beschrijft de complete setup.

## 1. Resend Account Setup

### Stap 1: Account aanmaken
1. Ga naar [resend.com](https://resend.com)
2. Maak een account aan of log in
3. Ga naar **API Keys** in het dashboard

### Stap 2: API Key aanmaken
1. Klik op **Create API Key**
2. Naam: `PaintConnect Production`
3. Permissions: **Full Access**
4. Kopieer de API key (begint met `re_`)

### Stap 3: Domein Verifiëren
1. Ga naar **Domains** → **Add Domain**
2. Voer in: `notifications.paintconnect.be`
3. Voeg de DNS records toe aan je domein:
   - **MX Record**: `feedback-smtp.eu-west-1.amazonses.com`
   - **TXT Record (SPF)**: `v=spf1 include:amazonses.com ~all`
   - **CNAME Records** voor DKIM (3 stuks)

4. Wacht tot domein geverifieerd is (groen vinkje)

## 2. Supabase Secrets Instellen

```bash
# Installeer Supabase CLI indien nodig
npm install -g supabase

# Link je project
supabase link --project-ref hhnbxutsmnkypbwydebo

# Stel de Resend API key in
supabase secrets set RESEND_API_KEY=re_JOUW_API_KEY_HIER
```

## 3. Edge Functions Deployen

```bash
# Deploy alle invite-gerelateerde functions
supabase functions deploy invitePainter
supabase functions deploy acceptInvitation
```

## 4. Database Migratie

Run de SQL in `update_pending_invites_table.sql` in de Supabase SQL Editor.

## 5. Flow Testen

### Test 1: Uitnodiging Versturen
1. Ga naar **AccountSettings** → **Team** tab
2. Klik op **+ Nieuw Teamlid**
3. Vul e-mail in en klik **Verstuur Uitnodiging**
4. Check of e-mail aankomt

### Test 2: Uitnodiging Accepteren
1. Open de e-mail
2. Klik op **Uitnodiging Accepteren**
3. Log in met Google of Magic Link
4. Controleer dat je toegevoegd bent aan het team

## Troubleshooting

### E-mail komt niet aan
- Check Resend dashboard voor delivery logs
- Controleer of domein geverifieerd is
- Check spam folder

### "Resend niet geconfigureerd" error
- Controleer of `RESEND_API_KEY` secret is ingesteld
- Redeploy de Edge Function na secrets wijzigen

### "Uitnodiging niet gevonden"
- Token is verlopen (7 dagen geldig)
- Uitnodiging al geaccepteerd
- Verkeerde e-mail gebruikt bij inloggen

## E-mail Templates

De e-mail templates zijn inline gedefinieerd in de Edge Functions:
- `invitePainter/index.ts` - Uitnodigings e-mail

### Aanpassen van Templates
1. Open `supabase/functions/invitePainter/index.ts`
2. Zoek de `getInviteEmailHtml` functie
3. Pas de HTML aan
4. Redeploy: `supabase functions deploy invitePainter`

## Verstuurde E-mails

| Type | Van | Onderwerp |
|------|-----|-----------|
| Uitnodiging | noreply@notifications.paintconnect.be | "{Naam} nodigt u uit voor {Bedrijf} op PaintConnect" |

## Kosten

Resend pricing (2024):
- Free tier: 3.000 emails/maand
- Pro: $20/maand voor 50.000 emails

## Security

- API keys nooit in frontend code
- Alle e-mail versturen via Edge Functions
- Tokens verlopen na 7 dagen
- E-mail matching bij acceptatie

