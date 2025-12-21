# Supabase Edge Functions Deployment Guide

## Vereisten

1. Supabase CLI geïnstalleerd: `npm install -g supabase`
2. Ingelogd bij Supabase: `supabase login`
3. Project gelinkt: `supabase link --project-ref hhnbxutsmnkypbwydebo`

## Environment Variables Instellen

Ga naar je Supabase Dashboard → Settings → Edge Functions en stel de volgende secrets in:

```bash
# Via CLI:
supabase secrets set GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
```

Of via het Dashboard: Project Settings → Edge Functions → Secrets

## Edge Functions Deployen

### Alle functies deployen:

```bash
cd /Users/freshdecor/Downloads/paint-connect-backup

# Deploy alle functies
supabase functions deploy getCompanyUsers
supabase functions deploy getCompanyPainters
supabase functions deploy getTeamActivity
supabase functions deploy getActiveCheckIns
supabase functions deploy getCompanyProjects
supabase functions deploy checkIn
supabase functions deploy checkOut
supabase functions deploy logAppError
```

### Of via een enkele opdracht:

```bash
supabase functions deploy
```

## Functies Testen

Na deployment kun je de functies testen via de Supabase Dashboard:
1. Ga naar Edge Functions
2. Klik op een functie
3. Klik "Test in browser" of "Invoke"

## Troubleshooting

### CORS Errors
Alle functies hebben nu de juiste CORS headers. Als je nog steeds CORS errors krijgt:
1. Check of de functie correct is deployed
2. Controleer de logs in Supabase Dashboard → Edge Functions → Logs

### Authorization Errors
Zorg dat:
1. De user ingelogd is
2. De Authorization header wordt meegestuurd
3. De SUPABASE_SERVICE_ROLE_KEY correct is ingesteld

### Function Not Found
Als de functie niet gevonden wordt:
1. Check of de deployment succesvol was
2. Controleer de functienaam (case-sensitive)
3. Herstart de functie via Dashboard

## Database Tabel Vereist

Vergeet niet om de `check_in_records` tabel aan te maken!
Voer `add_check_in_records.sql` uit in de Supabase SQL Editor.

## Overzicht Functies

| Functie | Beschrijving |
|---------|-------------|
| `getCompanyUsers` | Haalt alle gebruikers van een bedrijf op |
| `getCompanyPainters` | Haalt alle schilders/teamleden op |
| `getTeamActivity` | Haalt team activiteit records op met filters |
| `getActiveCheckIns` | Haalt actieve en recent voltooide check-ins op |
| `getCompanyProjects` | Haalt actieve projecten op voor check-in selectie |
| `checkIn` | Registreert een check-in met GPS en reisberekening |
| `checkOut` | Registreert een check-out met gewerkte tijd |
| `logAppError` | Logt app errors naar database |

