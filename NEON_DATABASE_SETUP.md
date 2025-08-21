# Neon Database Setup for SmartFlo

## Demo User Configuration

Your SmartFlo user accounts are fully integrated with your Neon PostgreSQL database. Here's how to manage them:

### Current Demo Users in Development

✅ **Freelancer Account:**
- Email: `demo@smartflo.com`
- Password: `test123`
- Full Name: Sarah Johnson
- Type: freelancer

✅ **Client Account:**
- Email: `client@acmecorp.com`  
- Password: `client123`
- Full Name: Michael Chen
- Type: client

### Setting Up Production Database

The Vercel deployment likely uses a different Neon database URL than development. To fix the login issues:

#### Option 1: Use Neon Database Console
1. Go to your Neon console at https://console.neon.tech
2. Select your production database
3. Open the SQL Editor
4. Run the SQL script from `CREATE_DEMO_USERS.sql`

#### Option 2: Environment Variable Check
Verify your Vercel environment variables:
- `DATABASE_URL` should point to your production Neon database
- Make sure it's the same database you want to use

### Database Schema
Your users table structure:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'freelancer' or 'client'
  company_name TEXT,
  freelance_type TEXT DEFAULT 'other',
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  total_contracts_value DECIMAL NOT NULL DEFAULT '0',
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Troubleshooting Login Issues

1. **Check database connection**: Visit `/api/health` on your Vercel deployment
2. **Verify users exist**: Visit `/api/debug/users` to see all users in production
3. **Password hashes**: Make sure password hashes are properly bcrypt encrypted

### Manual User Creation

You can also create users directly in Neon console:
```sql
-- Create freelancer
INSERT INTO users (email, full_name, password_hash, user_type, subscription_tier, total_contracts_value, is_email_verified) 
VALUES ('demo@smartflo.com', 'Sarah Johnson', '$2b$12$sXEcbAKKdnfV7WliKj.fyeVoPlvz8CroO4Da16xCr5.j6/4sNLViG', 'freelancer', 'free', '0', true);

-- Create client  
INSERT INTO users (email, full_name, password_hash, user_type, subscription_tier, total_contracts_value, is_email_verified)
VALUES ('client@acmecorp.com', 'Michael Chen', '$2b$12$3yavMwhLmqzt8q0EU73PW.kU3frJA0IsBOPqxftuO2JLQ0BKXPvvi', 'client', 'free', '0', true);
```

The login should work once the demo users exist in your production Neon database!