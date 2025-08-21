# How to Check Your Production Database (Vercel Deployment)

## Method 1: Use Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your SmartFlo project
3. Go to **Settings** → **Environment Variables**
4. Look for `DATABASE_URL` - this shows your production database connection

## Method 2: Check Database via API Endpoints
I've added debug endpoints to your deployment. Visit these URLs:

### Health Check
`https://getsmartflo.com/api/health`
Shows:
- Database connection status
- User count in production
- Environment info

### Debug Users
`https://getsmartflo.com/api/debug/users`
Shows:
- All users in your production database
- Reveals if demo users exist

## Method 3: Neon Console Direct Access
1. Go to https://console.neon.tech
2. Find your production database (check the connection string matches Vercel's `DATABASE_URL`)
3. Use SQL Editor to run:
```sql
SELECT email, full_name, user_type, created_at FROM users;
```

## Method 4: Vercel Logs
1. In Vercel dashboard → your project
2. Go to **Functions** tab
3. Click on any API function
4. View logs to see database connection attempts

## Common Issues

**If demo users don't exist in production:**
- Your Vercel `DATABASE_URL` points to a different/empty database
- Demo users were only created in development database
- Need to run the SQL script from `CREATE_DEMO_USERS.sql` in production

**If database connection fails:**
- Check `DATABASE_URL` environment variable in Vercel
- Verify Neon database is active and accessible
- Check for network/timeout issues

## Quick Fix
Once you identify which database Vercel is using, run this in that database's SQL editor:
```sql
-- Insert demo users
INSERT INTO users (email, full_name, password_hash, user_type, subscription_tier, total_contracts_value, is_email_verified) 
VALUES 
('demo@smartflo.com', 'Sarah Johnson', '$2b$12$sXEcbAKKdnfV7WliKj.fyeVoPlvz8CroO4Da16xCr5.j6/4sNLViG', 'freelancer', 'free', '0', true),
('client@acmecorp.com', 'Michael Chen', '$2b$12$3yavMwhLmqzt8q0EU73PW.kU3frJA0IsBOPqxftuO2JLQ0BKXPvvi', 'client', 'free', '0', true)
ON CONFLICT (email) DO NOTHING;
```

The login will work once demo users exist in your production database!