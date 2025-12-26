# Belangrijke Branch Informatie

## ✅ HUIDIGE STATUS (Laatste Update: 2025-12-26 20:30:00)

### Actieve Branch:
- **Main branch**: Commit `3f3d690` (nieuwste versie met alle functies)
- **Laatste feature**: Project kleuren in Planning en WeekPlanning
- **Status**: ✅ Alle wijzigingen zijn gecommit en gepusht naar GitHub

### Backup Informatie:
- **Backup tag**: Zie `git tag` voor laatste backup tags
- **GitHub**: Alle commits zijn gepusht naar `origin/main`
- **Working tree**: Clean (geen uncommitted changes)

### Historische Informatie:
- **Oude branch**: `2025-12-20-0cus` (verouderd, niet meer in gebruik)

### Belangrijke Commands:

```bash
# Controleren op welke branch je zit
git branch --show-current

# Controleren of alles gepusht is
git status

# Laatste commit bekijken
git log --oneline -1

# Backup tags bekijken
git tag --list "backup-*"

# Naar een specifieke backup terugkeren (indien nodig)
git checkout <tag-name>
```

### Recente Features (Main Branch):
- ✅ Project kleuren in Planning (maandkalender)
- ✅ Project kleuren in WeekPlanning (weekkalender)
- ✅ Dummy projecten met verschillende kleuren (blue, green, purple, orange)
- ✅ Auto-update van dummy project kleuren
- ✅ Edge function voor kleur updates (`updateDummyProjectColors`)
- ✅ OneSignal push notifications
- ✅ Material extraction uit facturen
- ✅ Offerte Agent (🎙️)
- ✅ Verbeterde error handling

### Vercel Deployment:
- **Branch**: `main` (standaard)
- **Automatische deployment**: Bij elke push naar `main`
- **Laatste deployment**: Check Vercel dashboard voor status

### Backup Strategie:
1. ✅ Alle commits zijn gepusht naar GitHub (`origin/main`)
2. ✅ Version tags worden aangemaakt voor belangrijke milestones
3. ✅ Working tree blijft clean (geen uncommitted changes)
4. ✅ Gebruik `git tag` om alle backups te zien

### Herstel Procedure (indien nodig):
```bash
# Naar laatste commit gaan
git checkout main
git pull origin main

# Naar specifieke backup tag gaan
git checkout <backup-tag-name>

# Volledige repository terugzetten
git checkout main
git reset --hard origin/main
```





