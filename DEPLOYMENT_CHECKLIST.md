# SmartFlo Deployment Checklist

## Pre-Deployment Steps

### 1. Code Preparation
- [ ] All environment variables moved to .env.example
- [ ] .gitignore file properly configured
- [ ] No sensitive data in code
- [ ] Build process works locally (`npm run build`)

### 2. GitHub Setup
- [ ] Create new GitHub repository
- [ ] Initialize Git: `git init`
- [ ] Add all files: `git add .`
- [ ] Commit: `git commit -m "Initial commit: SmartFlo platform"`
- [ ] Add remote: `git remote add origin https://github.com/USERNAME/REPO.git`
- [ ] Push: `git push -u origin main`

### 3. Database Setup
- [ ] Production PostgreSQL database ready
- [ ] Database URL accessible from Vercel
- [ ] Run migrations if needed: `npm run db:push`

## Vercel Deployment Steps

### 1. Account Setup
- [ ] Sign up/login to Vercel.com
- [ ] Connect GitHub account

### 2. Project Import
- [ ] Click "New Project" in Vercel
- [ ] Import your GitHub repository
- [ ] Configure build settings:
  - Framework: **Vite**
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

### 3. Environment Variables
Add these in Vercel Project Settings > Environment Variables:

**Required:**
- [ ] `DATABASE_URL` - Your PostgreSQL connection string
- [ ] `NODE_ENV` - Set to "production"

**Optional (for full features):**
- [ ] `OPENAI_API_KEY` - For AI contract generation
- [ ] `STRIPE_SECRET_KEY` - For payments
- [ ] `STRIPE_PUBLISHABLE_KEY` - For frontend
- [ ] `SOLANA_RPC_URL` - For blockchain features

### 4. Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors

## Post-Deployment Testing

### 1. Basic Functionality
- [ ] Website loads successfully
- [ ] Navigation works
- [ ] Database connection active
- [ ] API endpoints responding

### 2. Feature Testing
- [ ] User registration/login
- [ ] Contract creation
- [ ] Dashboard displays data
- [ ] Payment flows (if configured)

### 3. Production Optimization
- [ ] Check Vercel function logs
- [ ] Monitor performance metrics
- [ ] Verify environment variables
- [ ] Test database queries

## Quick Commands Reference

```bash
# Local build test
npm run build

# Push to GitHub
git add .
git commit -m "Deploy to production"
git push

# Database migration (if needed)
npm run db:push
```

## Common Issues & Solutions

### Build Failures
- Check package.json scripts
- Verify all dependencies installed
- Review Vercel build logs

### Database Issues
- Confirm DATABASE_URL format
- Check network permissions
- Verify SSL settings

### Environment Variables
- Ensure all required variables set
- Check variable names match exactly
- Restart deployment after changes

## Success Criteria
- [ ] Application loads without errors
- [ ] Core features functional
- [ ] Database operations working
- [ ] Performance acceptable
- [ ] Error logging configured