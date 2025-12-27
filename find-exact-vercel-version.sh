#!/bin/bash

# Script om de EXACTE versie te vinden die Vercel deployed

echo "🔍 EXACTE VERCEL VERSIE ZOEKEN"
echo "================================"
echo ""

echo "⚠️  BELANGRIJK: Je hebt commit 1cfe852 gegeven, maar die komt niet overeen"
echo "   met wat er live staat. Dit betekent dat Vercel waarschijnlijk:"
echo "   - Een andere commit gebruikt"
echo "   - Uncommitted changes heeft geüpload"
echo "   - Of een andere branch deployed"
echo ""

echo "📋 STAP 1: Haal de EXACTE commit SHA uit Vercel Dashboard"
echo "----------------------------------------------------------"
echo ""
echo "1. Ga naar: https://vercel.com/dashboard"
echo "2. Project: paintcon"
echo "3. Tab: 'Deployments'"
echo "4. Klik op de GROENE Production deployment"
echo "5. Scroll naar 'Source' → 'Commit'"
echo "6. Kopieer de VOLLEDIGE SHA (40 karakters)"
echo ""
echo "   Voorbeeld volledige SHA:"
echo "   1cfe852aec04e3f998046a6c5a193d90cb4adf76"
echo ""
echo "   (Niet alleen: 1cfe852)"
echo ""

echo "📋 STAP 2: Check of die commit bestaat in je repo"
echo "---------------------------------------------------"
echo ""
echo "Voer dit uit met de SHA die je uit Vercel hebt gekopieerd:"
echo ""
echo "  git fetch origin --all"
echo "  git log --all --oneline | grep [SHA_UIT_VERCEL]"
echo ""
echo "Als de commit NIET gevonden wordt, dan heeft Vercel uncommitted changes!"
echo ""

echo "📋 STAP 3A: Als de commit WEL bestaat"
echo "--------------------------------------"
echo ""
echo "  git checkout [COMPLETE_SHA]"
echo "  rm -rf node_modules dist .vite"
echo "  npm install"
echo "  npm run dev"
echo ""

echo "📋 STAP 3B: Als de commit NIET bestaat (uncommitted changes op Vercel)"
echo "------------------------------------------------------------------------"
echo ""
echo "Dan moet je de source code van Vercel downloaden:"
echo ""
echo "1. Ga naar Vercel Dashboard > Deployments"
echo "2. Klik op Production deployment"
echo "3. Klik op 'Source' tab"
echo "4. Download de source code (als er een download link is)"
echo ""
echo "OF probeer via Vercel CLI:"
echo ""
echo "  npm i -g vercel"
echo "  vercel login"
echo "  vercel pull"
echo ""

echo "📋 ALTERNATIEF: Check welke branch Vercel gebruikt"
echo "---------------------------------------------------"
echo ""
echo "1. Vercel Dashboard > Project Settings > Git"
echo "2. Kijk welke branch is ingesteld als 'Production Branch'"
echo "3. Check of die branch bestaat in je repo:"
echo ""
echo "  git branch -a | grep [BRANCH_NAME]"
echo ""






