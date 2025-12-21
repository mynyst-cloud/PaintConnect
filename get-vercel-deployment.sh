#!/bin/bash

# Script om de EXACTE deployment info van Vercel op te halen

echo "🔍 Vercel Deployment Info Ophalen"
echo "=================================="
echo ""
echo "Dit script helpt je de EXACTE versie te vinden die Vercel deployed."
echo ""

# Project ID uit .vercel/project.json
PROJECT_ID="prj_1Qbyn6pYoAuR7Ij6K29ei6MOcurA"
PROJECT_NAME="paintcon"

echo "📋 Opties om de deployment info te krijgen:"
echo ""
echo "OPTIE 1: Via Vercel Dashboard (AANBEVOLEN)"
echo "-------------------------------------------"
echo "1. Ga naar: https://vercel.com/dashboard"
echo "2. Selecteer project: $PROJECT_NAME"
echo "3. Klik op 'Deployments' tab"
echo "4. Klik op de GROENE Production deployment"
echo "5. Scroll naar 'Source' sectie"
echo "6. Kopieer de COMPLETE commit SHA (niet alleen de eerste 7 karakters!)"
echo "7. Voer dan dit commando uit:"
echo "   git fetch origin && git checkout [COMPLETE_COMMIT_SHA]"
echo ""

echo "OPTIE 2: Via Vercel CLI (als geïnstalleerd)"
echo "--------------------------------------------"
echo "npm i -g vercel"
echo "vercel login"
echo "vercel inspect https://paintcon.vercel.app"
echo ""

echo "OPTIE 3: Direct via API (als je een Vercel token hebt)"
echo "-------------------------------------------------------"
echo "curl -H 'Authorization: Bearer YOUR_VERCEL_TOKEN' \\"
echo "  'https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&limit=1&target=production'"
echo ""

echo "⚠️  BELANGRIJK:"
echo "   - Je moet de COMPLETE commit SHA hebben (40 karakters)"
echo "   - Niet alleen de korte versie (7 karakters)"
echo "   - Bijvoorbeeld: 1cfe852aec04e3f998046a6c5a193d90cb4adf76"
echo ""

echo "Zodra je de complete commit SHA hebt, voer dit uit:"
echo "  git fetch origin"
echo "  git checkout [COMPLETE_COMMIT_SHA]"
echo "  rm -rf node_modules dist .vite"
echo "  npm install"
echo "  npm run dev"
echo ""


