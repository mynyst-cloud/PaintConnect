# Belangrijke Branch Informatie

## ⚠️ CRITIEK: Verkeerde Branch Gevonden

Het probleem was **NIET** een cache probleem, maar dat je op de verkeerde git branch zat!

### Situatie:
- **Main branch**: Commit `1cfe852` (oude versie zonder nieuwe functies)
- **Productie branch**: `2025-12-20-0cus` met commit `a256090` (nieuwste versie met alle functies)

### Oplossing:
Je bent nu overschakeld naar de branch `2025-12-20-0cus` die **26 commits voorloopt** op main en alle nieuwe functies bevat.

### Belangrijke Commands:

```bash
# Controleren op welke branch je zit
git branch --show-current

# Als je per ongeluk terug naar main gaat:
git checkout 2025-12-20-0cus

# Als je de nieuwste code wilt hebben:
git checkout 2025-12-20-0cus
rm -rf node_modules dist .vite
npm install
npm run dev
```

### Nieuwe Features in deze Branch:
- ✅ OneSignal push notifications
- ✅ Material extraction uit facturen
- ✅ Offerte Agent (🎙️)
- ✅ Verbeterde error handling
- ✅ Environment variable fixes
- ✅ En 26+ andere updates

### Vercel Deployment:
Vercel is waarschijnlijk geconfigureerd om te deployen vanuit de `2025-12-20-0cus` branch, niet vanuit `main`. Check je Vercel dashboard om te bevestigen welke branch er wordt gebruikt voor deployment.

### Aanbeveling:
Overweeg om deze branch te mergen naar `main` of om `main` te updaten naar deze commit, zodat er geen verwarring meer is over welke branch de "production" versie is.


