#!/bin/bash
echo "📥 Download Source Code van Vercel"
echo "===================================="
echo ""

cd /Users/freshdecor/Downloads/paint-connect-backup

# Check of Vercel CLI geïnstalleerd is
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI niet gevonden. Installeren..."
    npm install -g vercel
fi

echo "1. Login op Vercel (volg de instructies)..."
vercel login

echo ""
echo "2. Link dit project aan Vercel..."
vercel link

echo ""
echo "3. Pull de source code van de production deployment..."
vercel pull --yes --environment=production

echo ""
echo "✅ Klaar! Check of er nieuwe bestanden zijn binnengekomen."
echo ""
echo "Als dit niet werkt, probeer dan:"
echo "  vercel pull --yes"




