#!/bin/bash
echo "🧹 Complete Vite Cache Cleanup voor macOS"
echo "=========================================="

# Stop alle Vite processen
echo "1. Stoppen van Vite processen..."
pkill -f vite || true
sleep 2

# Stop processen op specifieke poorten
echo "2. Stoppen van processen op poorten 5173 en 5180..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:5180 | xargs kill -9 2>/dev/null || true

# Verwijder alle caches
echo "3. Verwijderen van alle caches..."
rm -rf node_modules
rm -rf dist
rm -rf .vite
rm -rf .npm-cache
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -f package-lock.json

# macOS specifiek: clear npm cache
echo "4. macOS: Clearing npm cache..."
npm cache clean --force

# Verwijder mogelijke Vite cache in home directory (macOS)
echo "5. macOS: Clearing user-level caches..."
rm -rf ~/.npm/_cacache 2>/dev/null || true
rm -rf ~/Library/Caches/vite 2>/dev/null || true

# Zoek en verwijder alle .vite folders
echo "6. Zoeken naar andere .vite caches..."
find ~ -name ".vite" -type d -maxdepth 3 2>/dev/null | xargs rm -rf 2>/dev/null || true

echo "✅ Cleanup compleet!"
echo ""

