# 📥 Download Source Code van Vercel

## Het Probleem
De code op commit `1cfe852` (zowel lokaal als op Vercel) komt NIET overeen met wat er live staat. Dit betekent dat Vercel uncommitted changes heeft die direct zijn geüpload zonder git commit.

## Oplossing: Download Source van Vercel

### Methode 1: Via Script (Aanbevolen)

```bash
cd /Users/freshdecor/Downloads/paint-connect-backup
./pull-from-vercel.sh
```

### Methode 2: Handmatig

```bash
cd /Users/freshdecor/Downloads/paint-connect-backup

# Stap 1: Login op Vercel
npx vercel login

# Stap 2: Link project (gebruik project ID: prj_1Qbyn6pYoAuR7Ij6K29ei6MOcurA)
npx vercel link

# Stap 3: Pull production source code
npx vercel pull --yes --environment=production
```

## Wat Dit Doet

`vercel pull` download de EXACTE source code zoals Vercel die heeft:
- ✅ Inclusief uncommitted changes
- ✅ Inclusief eventuele build-time transformaties
- ✅ Overschrijft lokale bestanden met Vercel versie

## Na Het Downloaden

1. Check wat er veranderd is:
   ```bash
   git status
   git diff
   ```

2. Als de wijzigingen correct zijn, commit ze:
   ```bash
   git add .
   git commit -m "Sync met Vercel production versie"
   ```

3. Test lokaal:
   ```bash
   npm install
   npm run dev
   ```

## Belangrijk

⚠️ **LET OP**: `vercel pull` overschrijft je lokale bestanden. Zorg dat je belangrijke lokale wijzigingen eerst committed of stashed.

## Alternatief: Check Vercel Build Logs

Als `vercel pull` niet werkt:
1. Ga naar Vercel Dashboard → Deployments → Production
2. Klik op "Build Logs"
3. Check of er build-time wijzigingen zijn





