# PaintConnect Documentatie

Volledige documentatie voor alle functies van PaintConnect.

## Ontwikkeling

```bash
# Installeer dependencies
npm install

# Start development server
npm run dev

# Build voor productie
npm run build

# Start productie server
npm start
```

## Deployment

Deze docs app kan worden gedeployed naar Vercel op het subdomain `docs.paintconnect.be`.

### Vercel Setup

1. Maak een nieuw project aan in Vercel
2. Koppel de `docs` folder als root directory
3. Configureer het subdomain `docs.paintconnect.be`
4. Deploy automatisch bij elke push naar de main branch

### Environment Variables

Geen environment variables nodig voor deze statische docs site.

## Structuur

- `/app` - Next.js App Router pagina's
- `/components` - React components
- `/lib` - Utility functies en data
- `/public` - Statische assets

## Documentatie toevoegen

1. Voeg een nieuwe pagina toe in `/app/[categorie]/[pagina]/page.tsx`
2. Voeg de pagina toe aan `lib/docs-data.ts`
3. De pagina wordt automatisch opgenomen in de navigatie

## Styling

De styling is consistent met de PaintConnect landing page en gebruikt:
- Tailwind CSS
- Custom CSS variabelen voor kleuren
- Dark mode support
- Responsive design
