# SmartFlo Production Deployment Commands

## Prerequisites
Make sure you have:
- Fixed all authentication issues (✓ completed)
- All AI endpoints working (✓ completed)
- Production build passing (✓ verified)

## Git Push to Deploy

### 1. Check current status
```bash
git status
```

### 2. Add all changes
```bash
git add .
```

### 3. Commit with deployment message
```bash
git commit -m "Production deployment: Fixed Vercel project naming and authentication

- CRITICAL FIX: Resolved project name transition from payflow to smartflo
- Updated authentication validation across ALL API endpoints (index, contracts, users)
- Fixed CORS headers for production cookie authentication
- Added debugging logs to track authentication flow
- Enabled project name validation fallback for seamless transition
- All authentication and contract creation issues resolved"
```

### 4. Push to main branch (triggers Vercel deployment)
```bash
git push origin main
```

## Vercel Environment Variables Required
Make sure these are set in Vercel dashboard:
- `DATABASE_URL` - Your Neon database connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `SESSION_SECRET` - Random secret for sessions
- `NODE_ENV=production`

## Production URLs
- Main site: https://getsmartflo.com
- Vercel deployment: https://smartflo.vercel.app

## Test Users for Production
- Freelancer: demo@smartflo.com / test123
- Client: client@smartflo.com / test123

## Post-Deployment Testing
1. Test user authentication
2. Test AI contract generation
3. Test contract creation flow
4. Verify all endpoints are working

## Deployment Status
Check deployment status at: https://vercel.com/dashboard