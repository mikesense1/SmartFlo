# Vercel Database Debug Guide

## Current Issue
- Demo users exist in development database
- Vercel deployment logs show "User not found in database: client@acmecorp.com"
- Need to verify if demo users exist in production database

## Debug Steps Added

### 1. Health Check Endpoint
Added `/api/health` endpoint to verify:
- Database connection status
- User count in database
- Environment variables

### 2. Debug Users Endpoint  
Added `/api/debug/users` endpoint to:
- List all users in the database
- Verify demo users exist in production
- Check user data structure

### 3. Enhanced Logging
Added detailed logging to track:
- Storage import success
- User lookup attempts
- Query results

## Testing the Fix

### Step 1: Check Database Health
Visit: `https://your-vercel-domain.com/api/health`

Expected response:
```json
{
  "status": "healthy",
  "database": "connected", 
  "userCount": 2,
  "env": "production"
}
```

### Step 2: Verify Demo Users
Visit: `https://your-vercel-domain.com/api/debug/users`

Should show both demo users:
- `demo@smartflo.com` (freelancer)
- `client@acmecorp.com` (client)

### Step 3: Test Login
If users exist, login should work with:
- Email: `client@acmecorp.com`
- Password: `client123`

## Possible Issues

1. **Different Database**: Vercel might be using a different DATABASE_URL
2. **Missing Demo Data**: Demo users not seeded in production database
3. **Connection Issues**: Database timeout or connection problems
4. **Schema Mismatch**: Field name conflicts between dev and production

## Next Actions

Based on debug endpoint results:
- If userCount = 0: Need to seed demo data in production
- If users missing: Create demo users in production database  
- If users exist: investigate query/connection issues

## Demo User Credentials

**Updated passwords:**
- `demo@smartflo.com` / `test123` (freelancer)
- `client@acmecorp.com` / `client123` (client)