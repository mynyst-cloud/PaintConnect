#!/bin/bash

# PaintConnect Local Development Debug & Setup Script
# This script helps ensure your local environment matches production

set -e

echo "🔍 PaintConnect Debug & Setup Script"
echo "======================================"
echo ""

# Repository information
REPO_URL="https://github.com/mynyst-cloud/PaintConnect.git"
CURRENT_DIR=$(pwd)

echo "📋 Current Status:"
echo "   Repository: $REPO_URL"
git log --oneline -1
echo "   Branch: $(git branch --show-current)"
echo ""

# Step 1: Verify git state
echo "✅ Step 1: Checking git repository state..."
git fetch origin
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    echo "⚠️  WARNING: Local commit differs from remote!"
    echo "   Local:  $LOCAL_COMMIT"
    echo "   Remote: $REMOTE_COMMIT"
    echo ""
    read -p "Do you want to reset to match origin/main? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Resetting to origin/main..."
        git reset --hard origin/main
        echo "   ✅ Reset complete"
    fi
else
    echo "   ✅ Local code matches origin/main"
fi
echo ""

# Step 2: Clean build artifacts and cache
echo "🧹 Step 2: Cleaning build artifacts and cache..."
rm -rf node_modules
rm -rf dist
rm -rf .vite
rm -rf .npm-cache
rm -f package-lock.json
echo "   ✅ Cleanup complete"
echo ""

# Step 3: Reinstall dependencies
echo "📦 Step 3: Installing dependencies..."
npm install
echo "   ✅ Dependencies installed"
echo ""

# Step 4: Clear Vite cache specifically
echo "🗑️  Step 4: Clearing Vite cache..."
rm -rf node_modules/.vite 2>/dev/null || true
echo "   ✅ Vite cache cleared"
echo ""

echo "✨ Setup complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Clear your browser cache and service workers:"
echo "      - Chrome/Edge: DevTools > Application > Clear storage > Clear site data"
echo "      - Or use Incognito/Private mode"
echo ""
echo "   2. Start the dev server:"
echo "      npm run dev"
echo ""
echo "   3. If issues persist, test production build:"
echo "      npm run build"
echo "      npm run preview"
echo ""
echo "   4. Compare with production:"
echo "      Production: https://paintcon.vercel.app/Dashboard"
echo ""



