# SmartFlo Deployment Commands

## Git Push to Deploy on Vercel

### 1. Initialize Git Repository (if not already done)
```bash
git init
```

### 2. Add Vercel Remote Repository
```bash
# Replace 'your-username' with your actual GitHub username
git remote add origin https://github.com/your-username/smartflo.git
```

### 3. Stage All Files
```bash
git add .
```

### 4. Commit Changes
```bash
git commit -m "Deploy SmartFlo: Fixed Vercel compatibility with consolidated API architecture"
```

### 5. Push to Deploy
```bash
# Push to main branch (triggers Vercel deployment)
git push -u origin main
```

## Alternative: Deploy Directly from Replit

If you prefer to deploy directly from Replit:

```bash
# Create a new branch for deployment
git checkout -b deploy

# Stage and commit
git add .
git commit -m "Production-ready SmartFlo with optimized serverless functions"

# Push to trigger Vercel deployment
git push origin deploy
```

## Vercel CLI Alternative (Optional)

If you have Vercel CLI installed:

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy directly
vercel --prod
```

## Important Notes:

- **Function Limit**: Now using only 3 serverless functions (within Vercel's 12-function limit)
- **Environment Variables**: Make sure to set these in Vercel dashboard:
  - `DATABASE_URL` - Your Neon PostgreSQL connection string
  - `OPENAI_API_KEY` - Your OpenAI API key
  - Any other secrets your app needs

- **Domain**: Once deployed, your app will be available at:
  - `https://smartflo.vercel.app` (default)
  - `https://getsmartflo.com` (if custom domain configured)

## Post-Deployment Checklist:

1. ✅ Verify app loads correctly
2. ✅ Test user registration/login 
3. ✅ Test contract creation flow
4. ✅ Check database connections
5. ✅ Verify API endpoints work