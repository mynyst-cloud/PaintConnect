# 🔥 COMPLETE CACHE FIX - macOS + Vite + Browser

## Het Probleem
De lokale dev server toont nog steeds een oude versie ondanks alle cleanup. Dit is waarschijnlijk een combinatie van:
1. Browser cache op macOS die hardnekkig is
2. Service Workers die blijven cachen
3. Vite HMR die oude modules cached

## NUCLEAR OPTION - Complete Fix

### STAP 1: Stop ALLES
```bash
# Stop alle node/vite processen
pkill -9 node
pkill -9 vite
lsof -ti:5173,5180,3000,4173 | xargs kill -9 2>/dev/null || true
```

### STAP 2: Clear ALL Browser Data (Chrome/Safari)
**Chrome:**
1. Cmd+Shift+Delete
2. Kies "Alle tijd" voor tijdbereik
3. Vink ALLES aan:
   - Browsegeschiedenis
   - Cookies en andere sitegegevens
   - Cached images en files
   - Service Workers
4. Klik "Gegevens wissen"

**OF via DevTools:**
1. Open DevTools (Cmd+Option+I)
2. Application tab
3. Storage → Clear site data (ALLES)
4. Service Workers → Unregister ALL
5. Cache Storage → Delete ALL

### STAP 3: Gebruik een NIEUWE Browser of Profiel
Maak een compleet nieuw Chrome profiel aan OF gebruik Safari in Private mode.

### STAP 4: Check de EXACTE code die Vercel heeft

De beste manier om te zien wat er op Vercel staat:
1. Ga naar https://vercel.com/dashboard
2. Selecteer project "paintcon"
3. Ga naar Deployments
4. Klik op Production deployment
5. Kijk naar de "Source" sectie
6. Check de EXACTE commit SHA (volledige 40 karakters)

Als die SHA hetzelfde is als 1cfe852, dan is de code hetzelfde en is het 100% een cache probleem.

### STAP 5: Test met Production Build Lokaal
```bash
# Build de productie versie
npm run build

# Preview de productie build
npm run preview
```

Open dan http://localhost:4173 - dit zou EXACT moeten matchen met wat Vercel deployed.

Als dit WEL werkt, dan is het probleem specifiek de dev server cache.
Als dit NIET werkt, dan is de code daadwerkelijk anders.

### STAP 6: Check Environment Variables
Mogelijk gebruikt Vercel andere environment variables die het gedrag veranderen.
Check Vercel Dashboard → Project Settings → Environment Variables

### STAP 7: Als alles faalt - Download Source van Vercel
```bash
# Installeer Vercel CLI lokaal (al gedaan)
npx vercel login
npx vercel link
npx vercel pull --yes --environment=production
```

Dit download de exacte source code zoals Vercel die heeft.

## Test Checklist
- [ ] Alle node processen gestopt
- [ ] Browser cache compleet gewist
- [ ] Service Workers unregistered
- [ ] Nieuwe browser profiel of private mode gebruikt
- [ ] Production build lokaal getest (npm run build && npm run preview)
- [ ] Nieuwe poort gebruikt (5180)
- [ ] Vercel commit SHA vergeleken met lokale commit
- [ ] Environment variables gecheckt





