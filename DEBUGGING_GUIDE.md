# PaintConnect Local Development Debugging Guide

## Repository Information
- **GitHub Repository**: https://github.com/mynyst-cloud/PaintConnect.git
- **Current Commit**: `1cfe852` (Fix: laatste aanpassingen voor foto upload en planning form)
- **Production URL**: https://paintcon.vercel.app/Dashboard

## Issues Found & Fixed

### 1. Environment Variable Usage
**Problem**: Code was using `process.env.NODE_ENV` which doesn't work reliably in Vite browser code.

**Fixed Files**:
- `src/components/utils/errorHandler.jsx` - Changed to `import.meta.env.DEV` and `import.meta.env.PROD`
- `src/components/utils/productionConfig.jsx` - Changed to `import.meta.env.DEV`

### 2. Service Worker Caching
The app uses service workers which can cache old versions. This is likely the main cause of seeing old versions locally.

## Step-by-Step Setup Instructions

### Option 1: Automated Setup (Recommended)
```bash
cd /Users/freshdecor/Downloads/paint-connect-backup
./debug-setup.sh
```

### Option 2: Manual Setup

#### Step 1: Verify Git Repository
```bash
cd /Users/freshdecor/Downloads/paint-connect-backup
git fetch origin
git status
```

If you're not on the latest commit:
```bash
git reset --hard origin/main
```

#### Step 2: Clean Everything
```bash
# Remove node_modules and build artifacts
rm -rf node_modules
rm -rf dist
rm -rf .vite
rm -rf .npm-cache
rm -f package-lock.json
```

#### Step 3: Fresh Install
```bash
npm install
```

#### Step 4: Clear Browser Cache & Service Workers
**IMPORTANT**: This is crucial for seeing the latest version!

**Chrome/Edge**:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage" in left sidebar
4. Check all boxes
5. Click "Clear site data"
6. Or use Incognito/Private mode for testing

**Firefox**:
1. DevTools > Storage tab
2. Right-click and "Delete All"
3. Or use Private mode

#### Step 5: Start Dev Server
```bash
npm run dev
```

## Testing & Comparison

### Test Development Mode
```bash
npm run dev
# Open http://localhost:5173/Dashboard
```

### Test Production Build Locally
```bash
npm run build
npm run preview
# Open http://localhost:4173/Dashboard
```

### Compare with Production
- Production: https://paintcon.vercel.app/Dashboard
- Local Dev: http://localhost:5173/Dashboard
- Local Preview: http://localhost:4173/Dashboard

## Common Issues & Solutions

### Issue: Still seeing old version after cleanup
**Solution**: 
1. Clear browser cache (see Step 4 above)
2. Unregister service workers:
   - DevTools > Application > Service Workers
   - Click "Unregister" for all workers
3. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

### Issue: Dev server shows different code than production
**Possible Causes**:
1. **Service Worker Cache**: Most likely cause - clear as described above
2. **Browser Cache**: Hard refresh or use incognito mode
3. **Different Environment Variables**: Check `.env` files (none found in repo)
4. **Build Cache**: Already handled by cleanup script

### Issue: Environment variables not working
**Note**: Vite uses `import.meta.env.*` not `process.env.*` in browser code.
- Development mode: `import.meta.env.DEV` (true) or `import.meta.env.MODE === 'development'`
- Production mode: `import.meta.env.PROD` (true) or `import.meta.env.MODE === 'production'`

## Debugging Checklist

- [ ] Git repository is synced with origin/main
- [ ] node_modules cleaned and reinstalled
- [ ] Vite cache cleared (.vite directory removed)
- [ ] Browser cache cleared
- [ ] Service workers unregistered
- [ ] Tested in incognito/private mode
- [ ] Compared dev mode vs production build locally
- [ ] Checked browser console for errors
- [ ] Verified network tab shows correct file versions

## Code Differences Between Dev and Production

The app uses environment detection in several places:
- `src/components/utils/errorHandler.jsx` - Different error logging in dev vs prod
- `src/components/utils/productionConfig.jsx` - Production-specific configurations
- `src/components/utils/usePWA.jsx` - Service worker registration (may behave differently)

## Next Steps if Issue Persists

1. Check browser console for specific errors
2. Compare network requests between local and production
3. Check if specific features/components are different
4. Verify all environment variables are set correctly
5. Check if there are any build-time differences in vite.config.js

## Useful Commands

```bash
# Check current git commit
git log --oneline -1

# See what Vercel is deploying (check Vercel dashboard for commit SHA)
git log --oneline | grep [Vercel-commit-sha]

# Clear Vite cache only
rm -rf node_modules/.vite .vite

# Check for uncommitted changes
git status

# View differences from origin
git diff origin/main
```






