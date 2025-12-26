# 📥 Hoe Source Code van Vercel te Downloaden

## Het Probleem
De live code op Vercel komt niet overeen met wat er in git staat op commit `1cfe852`. We moeten de EXACTE source code van Vercel krijgen.

## ✅ Oplossing: Via Vercel Dashboard

Helaas heeft Vercel **GEEN** directe manier om source code te downloaden via CLI. Maar er zijn wel methodes:

### Methode 1: Via Vercel Dashboard (RECOMMENDED)

1. **Ga naar Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Selecteer project: `paintcon`

2. **Ga naar Deployments:**
   - Klik op "Deployments" tab
   - Klik op de GROENE Production deployment (meest recente)

3. **Bekijk Source Info:**
   - Scroll naar "Source" sectie
   - Check de commit SHA en branch

4. **Als er een "Download" of "View Source" button is:**
   - Klik daarop om de source code te bekijken/downloaden

### Methode 2: Via GitHub (Als Vercel deployed vanuit GitHub)

Als Vercel deployed vanuit GitHub, dan staat de code daar:

```bash
cd /Users/freshdecor/Downloads/paint-connect-backup

# Fetch alle branches
git fetch origin --all

# Check alle branches
git branch -r

# Check commits op alle branches
git log --all --oneline --graph -50
```

Als je een andere branch of commit vindt die overeenkomt met wat op Vercel staat:

```bash
git checkout [branch-naam-of-commit-sha]
rm -rf node_modules dist .vite
npm install
npm run dev
```

### Methode 3: Via Browser DevTools (Reverse Engineer)

Als de andere methodes niet werken, kun je de code inspecteren via browser:

1. Open https://paintcon.vercel.app in Chrome
2. Open DevTools (F12)
3. Ga naar "Sources" tab
4. Je ziet de source maps en bundled code
5. Kopieer handmatig de code die je nodig hebt

**LET OP:** Dit is alleen voor kleine wijzigingen, niet voor de volledige codebase.

### Methode 4: Via Vercel Build Output

Vercel bouwt de code tijdens deployment. De built files staan in:
- `dist/` folder na `npm run build`

Als je lokaal `npm run build` doet met dezelfde commit, krijg je dezelfde output:

```bash
cd /Users/freshdecor/Downloads/paint-connect-backup
git checkout 1cfe852
npm install
npm run build
```

De `dist/` folder bevat de exacte files die Vercel deployed.

### Methode 5: Contact Vercel Support

Als niets werkt, contact Vercel support:
- Email: support@vercel.com
- Vraag om export van source code voor deployment ID: `dpl_DNVWrq1Jcw3x8RGPbBB5rh9oPbeN`

## 🎯 RECOMMENDED AANPAK

**STAP 1:** Check Vercel Dashboard voor commit SHA en branch
**STAP 2:** Als SHA bekend is, checkout die commit lokaal
**STAP 3:** Als SHA niet bekend is of code nog steeds anders is, gebruik Methode 4 (build output)
**STAP 4:** Als dat niet werkt, reverse engineer via DevTools (Methode 3)

## Belangrijk

⚠️ **Vercel heeft geen `vercel pull` voor source code** - alleen voor environment variables en project settings.

✅ **Als Vercel deployed vanuit GitHub**, staat de code daar en kun je die checkouten.

🔍 **De deployment info toont:**
- Deployment ID: `dpl_DNVWrq1Jcw3x8RGPbBB5rh9oPbeN`
- URL: https://paintcon-28wfandh5-steven-mynys-projects.vercel.app
- Created: Sat Dec 20 2025 14:47:40 GMT+0100

## Volgende Stap

1. Open Vercel Dashboard
2. Ga naar Deployments → Production
3. Noteer de EXACTE commit SHA (40 karakters)
4. Check of die commit in GitHub staat
5. Checkout die commit lokaal




