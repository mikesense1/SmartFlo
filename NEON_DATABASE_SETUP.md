# Neon PostgreSQL Setup for SmartFlo

## Step 1: Create Neon Account

1. Go to **https://neon.tech**
2. Click "Sign Up" or "Get Started"
3. Sign up with GitHub, Google, or email
4. Verify your email if using email signup

## Step 2: Create Database Project

1. After login, click **"Create Project"**
2. Fill in project details:
   - **Project Name**: `SmartFlo` or `smartflo-production`
   - **Database Name**: `smartflo` 
   - **Region**: Choose closest to your users (US East, EU, etc.)
3. Click **"Create Project"**

## Step 3: Get Connection String

### Option A: From Dashboard
1. In your project dashboard, find **"Connection Details"**
2. Select **"Pooled connection"** (recommended for Vercel)
3. Copy the connection string that looks like:
   ```
   postgresql://username:password@hostname/database?sslmode=require
   ```

### Option B: From Connection Tab
1. Click **"Connection"** in the left sidebar
2. Choose **"Pooled connection"**
3. Select **"Parameters"** or **"Connection string"**
4. Copy the full connection string

## Step 4: Connection String Format

Your Neon connection string will look like:
```
postgresql://[username]:[password]@[hostname]/[database]?sslmode=require
```

Example:
```
postgresql://smartflo_user:AbCdEfGh123456@ep-cool-lab-123456.us-east-1.aws.neon.tech/smartflo?sslmode=require
```

## Step 5: Set Environment Variable

### For Vercel:
```bash
vercel env add DATABASE_URL production
# Paste your Neon connection string when prompted
```

### For Replit (current development):
1. Go to "Secrets" tab in Replit
2. Add new secret:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string

## Step 6: Test Connection

```bash
# Test in your development environment
npm run dev

# Check if database connects successfully in logs
```

## Neon Features for SmartFlo

- **Serverless**: Perfect for Vercel deployment
- **Autoscaling**: Handles traffic spikes automatically  
- **Branching**: Create database branches for testing
- **Connection Pooling**: Built-in pooling for better performance
- **SSL**: Secure connections by default

## Important Notes

1. **Free Tier**: Neon offers generous free tier perfect for SmartFlo
2. **Connection Limits**: Use pooled connections for production
3. **SSL Required**: Always include `?sslmode=require` in connection string
4. **Branching**: You can create separate branches for development/production

## Troubleshooting

### Connection Issues:
- Ensure `sslmode=require` is in connection string
- Use **pooled connection** for Vercel deployment
- Check IP allowlist (Neon allows all by default)

### Performance:
- Use connection pooling (already configured in SmartFlo)
- Consider upgrading plan if you hit connection limits

---

**Your SmartFlo database will be ready once you complete these steps!**