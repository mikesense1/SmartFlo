# SmartFlo - Vercel Deployment Guide

## Prerequisites
- Vercel CLI installed globally
- GitHub repository set up
- Environment variables ready

## Method 1: Deploy via Vercel CLI (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Build the Project
```bash
# Build for production
npm run build

# Verify build completed successfully
ls -la dist/
```

### Step 3: Login to Vercel
```bash
vercel login
```

### Step 4: Deploy to Production
```bash
# Deploy to production (getsmartflo.com)
vercel --prod

# Or if first time deployment:
vercel deploy --prod
```

### Step 5: Set Environment Variables
```bash
# Set required environment variables
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
vercel env add NODE_ENV

# Or add them through the Vercel dashboard
```

## Method 2: Deploy via GitHub Integration (Automatic)

### Step 1: Push to GitHub
```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Add contract document viewing functionality for production"

# Push to main branch
git push origin main
```

### Step 2: Vercel Auto-Deploy
- Vercel will automatically detect the push
- Build and deploy will happen automatically
- Check deployment status at https://vercel.com/dashboard

## Method 3: Manual Deployment Commands

### Complete Deployment Sequence
```bash
# 1. Ensure all dependencies are installed
npm install

# 2. Build the application
npm run build

# 3. Test the build locally (optional)
npm start

# 4. Deploy to Vercel
vercel deploy --prod

# 5. Set custom domain (if needed)
vercel domains add getsmartflo.com

# 6. Verify deployment
curl https://getsmartflo.com/api/contracts
```

## Environment Variables Setup

### Required Variables for Production:
```bash
# Database connection (Neon Database)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# OpenAI API key for contract generation
OPENAI_API_KEY=sk-your-openai-key-here

# Production environment
NODE_ENV=production
```

### Set via Vercel CLI:
```bash
vercel env add DATABASE_URL production
# Enter your Neon database URL when prompted

vercel env add OPENAI_API_KEY production  
# Enter your OpenAI API key when prompted

vercel env add NODE_ENV production
# Enter: production
```

## Domain Configuration

### Link Custom Domain:
```bash
# Add your domain to the project
vercel domains add getsmartflo.com

# Verify domain is linked
vercel domains ls
```

## Verification Commands

### Test Production Endpoints:
```bash
# Test main API
curl https://getsmartflo.com/api/contracts

# Test contract document endpoint (replace {id} with actual contract ID)
curl https://getsmartflo.com/api/contracts/{id}/document

# Test frontend
curl https://getsmartflo.com/
```

## Deployment Status Check

### Monitor Deployment:
```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Get deployment URL
vercel inspect
```

## Quick Deploy Command (All-in-One)

```bash
# Single command deployment
npm run build && vercel --prod
```

## Troubleshooting

### If deployment fails:
```bash
# Check logs
vercel logs --follow

# Redeploy with verbose output
vercel --prod --debug

# Clear Vercel cache and redeploy
vercel --prod --force
```

### Database connection issues:
```bash
# Verify environment variables are set
vercel env ls

# Test database connection locally
npm run dev
```

---

**Your SmartFlo application with contract document viewing is now production-ready for deployment at getsmartflo.com!**