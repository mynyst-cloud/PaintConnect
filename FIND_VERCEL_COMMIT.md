# Hoe de juiste Vercel Commit te vinden

## Probleem
De lokale code komt niet overeen met wat er op Vercel (https://paintcon.vercel.app/Dashboard) deployed is.

## Oplossing: Vind de exacte commit die Vercel gebruikt

### Stap 1: Check Vercel Dashboard
1. Ga naar https://vercel.com/dashboard
2. Selecteer het project "paintcon"
3. Ga naar het tabblad **"Deployments"**
4. Klik op de meest recente **Production** deployment (groene indicator)
5. Scroll naar beneden naar **"Source"** sectie
6. Noteer de **Commit SHA** (bijvoorbeeld: `a256090abc123...`)

### Stap 2: Check welke branch deze commit heeft
Na het vinden van de commit SHA, voer dit uit in de terminal:

```bash
cd /Users/freshdecor/Downloads/paint-connect-backup
git fetch --all
git log --all --oneline | grep [COMMIT_SHA]
```

### Stap 3: Checkout naar die commit
```bash
git checkout [COMMIT_SHA]
# Of als het op een branch staat:
git checkout [BRANCH_NAME]
```

### Stap 4: Herinstalleer dependencies
```bash
rm -rf node_modules dist .vite
npm install
npm run dev
```

## Alternatief: Vercel CLI gebruiken

Als je Vercel CLI hebt geïnstalleerd:

```bash
# Installeer Vercel CLI (als je het nog niet hebt)
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Pull latest deployment info
vercel inspect [deployment-url]
```

## Belangrijke Informatie

- **Huidige branch**: `2025-12-20-0cus` (lokaal, niet op remote)
- **Remote main branch**: `1cfe852` (oudere versie)
- **Vercel deployed waarschijnlijk**: Een andere commit die we nog moeten vinden

## Als je de commit hash hebt gevonden

Stuur me de commit hash en ik help je om naar die exacte versie te switchen!


