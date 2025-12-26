# 🔒 Veilig Opslaan - Checklist

## Status Check

### 1. Git Status
```bash
git status
```

### 2. Wat is er nog NIET gecommit:
- ✅ `src/pages/Planning.jsx` - GEÏMPLEMENTEERD & GEPUSHT
- ✅ `src/pages/Projecten.jsx` - GEÏMPLEMENTEERD & GEPUSHT
- ⚠️  `src/components/support/AISupportWidget.jsx` - NIET GECOMMIT
- ⚠️  `src/components/ui/toast.jsx` - NIET GECOMMIT
- ⚠️  `src/lib/supabase.js` - NIET GECOMMIT
- ⚠️  `src/pages/AISupportChat.jsx` - NIET GECOMMIT
- ⚠️  `src/pages/Dashboard.jsx` - NIET GECOMMIT
- ⚠️  `supabase/functions/registerCompany/index.ts` - NIET GECOMMIT
- ⚠️  `vercel.json` - NIET GECOMMIT
- ⚠️  `api/cron/send-onboarding-reminders.js` - NIEUW BESTAND
- ⚠️  `create_ai_conversations_table.sql` - NIEUW BESTAND
- ⚠️  `supabase/functions/aiChatAgent/` - NIEUWE FUNCTIE
- ⚠️  `supabase/functions/sendOnboardingReminders/` - NIEUWE FUNCTIE

## Aanbevolen Stappen

### Stap 1: Review Wijzigingen
Bekijk alle wijzigingen voordat je ze commit:
```bash
git diff src/pages/Dashboard.jsx
git diff supabase/functions/registerCompany/index.ts
# etc.
```

### Stap 2: Commit Alle Wijzigingen
```bash
# Option A: Commit alles in één keer
git add .
git commit -m "Complete update: AI chat, onboarding reminders, dummy projects, dashboard improvements"

# Option B: Commit in logische groepen
git add src/pages/Dashboard.jsx src/components/
git commit -m "Dashboard en component updates"
git add supabase/functions/
git commit -m "Edge functions: registerCompany, aiChatAgent, sendOnboardingReminders"
git add api/cron/ create_ai_conversations_table.sql
git commit -m "Cron jobs en database migrations"
```

### Stap 3: Push naar GitHub
```bash
git push origin main
```

### Stap 4: Maak een Version Tag (aanbevolen)
```bash
# Maak een tag voor deze versie
git tag -a v1.0.0 -m "Stable release: Dummy projects, AI chat, onboarding reminders"
git push origin v1.0.0
```

### Stap 5: Verifieer op GitHub
1. Ga naar: https://github.com/mynyst-cloud/PaintConnect
2. Controleer dat alle commits zichtbaar zijn
3. Controleer dat alle bestanden aanwezig zijn

### Stap 6: Verifieer Vercel Deployment
1. Ga naar: https://vercel.com/dashboard
2. Controleer dat de deployment succesvol is
3. Test de live versie

### Stap 7: Lokale Backup (optioneel)
```bash
# Maak een lokale backup
cd /Users/freshdecor/Downloads
cp -r paint-connect-backup paint-connect-backup-backup-$(date +%Y%m%d)
```

## Belangrijk

- ✅ **GitHub** = Primaire backup (cloud)
- ✅ **Vercel** = Live deployment (automatisch van GitHub)
- ✅ **Lokaal (Cursor)** = Je werkende kopie
- ✅ **Git Tag** = Punt om terug te keren (als backup)

## Als er iets misgaat

### Terug naar laatste commit:
```bash
git reset --hard HEAD
```

### Terug naar een specifieke versie:
```bash
git log --oneline
git checkout [COMMIT_HASH]
```

### Pull van GitHub:
```bash
git pull origin main
```

