# Database Alignment Guide: Replit → Neon → Vercel

## Current Setup Issue
You have **3 different database configurations** that need to be aligned:
1. **Replit Development** - Uses your Replit DATABASE_URL secret
2. **Neon SmartFlo Database** - Your main production database
3. **Vercel Deployment** - May be using a different DATABASE_URL

## Step-by-Step Alignment Process

### Step 1: Get Your Neon SmartFlo Database URL
1. Go to https://console.neon.tech
2. Select your **SmartFlo** database project
3. Go to **Dashboard** → **Connection Details**
4. Copy the **Connection String** (starts with `postgresql://`)
5. It should look like: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/smartflo?sslmode=require`

### Step 2: Update Replit Environment
Your Replit already has a DATABASE_URL secret. We need to update it:

**Current Replit DATABASE_URL**: `(already exists as secret)`

**To update it:**
1. In Replit, go to your project settings
2. Find the DATABASE_URL secret
3. Replace it with your Neon SmartFlo connection string

### Step 3: Update Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your SmartFlo project
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL` (or add it if missing)
5. Set it to the **same Neon SmartFlo connection string**
6. Make sure it's set for **Production**, **Preview**, and **Development**

### Step 4: Verify Database Schema
Once all environments point to the same database, push your schema:
```bash
npm run db:push
```

### Step 5: Create Demo Users in Neon SmartFlo Database
1. Open Neon Console → SQL Editor
2. Run the script from `CREATE_DEMO_USERS.sql`:

```sql
-- Demo users for SmartFlo
INSERT INTO users (email, full_name, password_hash, user_type, subscription_tier, total_contracts_value, is_email_verified) 
VALUES 
('demo@smartflo.com', 'Sarah Johnson', '$2b$12$sXEcbAKKdnfV7WliKj.fyeVoPlvz8CroO4Da16xCr5.j6/4sNLViG', 'freelancer', 'free', '0', true),
('client@acmecorp.com', 'Michael Chen', '$2b$12$3yavMwhLmqzt8q0EU73PW.kU3frJA0IsBOPqxftuO2JLQ0BKXPvvi', 'client', 'free', '0', true)
ON CONFLICT (email) DO NOTHING;
```

## Verification Steps

### Check Replit Development
```bash
# In Replit console
echo $DATABASE_URL
```

### Check Vercel Production
Visit: `https://getsmartflo.com/api/health`
Should show the same database and user count

### Check Neon Console
Run in SQL Editor:
```sql
SELECT email, full_name, user_type FROM users;
```

## Result
After alignment:
- ✅ Replit development uses Neon SmartFlo database
- ✅ Vercel production uses Neon SmartFlo database  
- ✅ All demo users exist in one central database
- ✅ Login works in both development and production

## Troubleshooting

**If login still fails after alignment:**
1. Check `https://getsmartflo.com/api/debug/users` - should show demo users
2. Verify DATABASE_URL format includes `?sslmode=require`
3. Restart Vercel deployment after updating environment variables

**Database connection issues:**
- Make sure Neon database is not paused
- Check connection string has correct credentials
- Verify SSL mode is enabled