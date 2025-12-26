#!/bin/bash

echo "📥 Download Source Code van Vercel"
echo "===================================="
echo ""
echo "Dit script download de EXACTE source code zoals Vercel die heeft,"
echo "inclusief eventuele uncommitted changes."
echo ""

cd /Users/freshdecor/Downloads/paint-connect-backup

# Check of vercel CLI beschikbaar is
if ! command -v npx &> /dev/null; then
    echo "❌ npx niet gevonden. Installeer Node.js eerst."
    exit 1
fi

echo "Stap 1: Login op Vercel..."
echo "   Volg de instructies in de browser..."
npx vercel login

echo ""
echo "Stap 2: Link dit project aan Vercel..."
echo "   Project ID: prj_1Qbyn6pYoAuR7Ij6K29ei6MOcurA"
echo "   Volg de instructies..."
npx vercel link

echo ""
echo "Stap 3: Pull production source code..."
npx vercel pull --yes --environment=production

echo ""
echo "✅ Klaar!"
echo ""
echo "Check nu of er nieuwe bestanden zijn binnengekomen:"
echo "  git status"
echo ""
echo "Als er nieuwe wijzigingen zijn, zijn dit de uncommitted changes"
echo "die op Vercel stonden maar niet in git."




