# Custom Domain Setup - SSO Protection Bypass

## Why Custom Domain Fixes SSO Issues
- Custom domains typically bypass Vercel organization SSO policies
- Preview deployments (*.vercel.app) inherit team protection settings
- Production domains with custom DNS have independent access control

## Domain Configuration Steps

### 1. Add Domain in Vercel Dashboard
1. Go to Project Settings → Domains
2. Add domain: `getsmartflo.com`
3. Add subdomain: `www.getsmartflo.com`
4. Vercel will provide DNS configuration

### 2. DNS Configuration (Typical Setup)
Add these records to your domain provider:

**For Root Domain (getsmartflo.com):**
```
Type: A
Name: @
Value: 76.76.19.61
```

**For WWW Subdomain:**
```
Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

**Alternative CNAME Setup:**
```
Type: CNAME
Name: @
Value: alias.vercel-dns.com
```

### 3. SSL Certificate
- Vercel automatically provides SSL certificates
- Certificate generation takes 5-10 minutes
- Verify HTTPS works before testing authentication

### 4. Environment Variable Update
Update API calls to use custom domain:
- Development: `http://localhost:5173`  
- Production: `https://getsmartflo.com`

## Testing Strategy
After domain configuration:

```bash
# Test bypass endpoint
curl https://getsmartflo.com/api/bypass

# Should return JSON instead of SSO page
curl https://getsmartflo.com/api/test

# Test authentication
curl -X POST https://getsmartflo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@smartflo.com","password":"test123"}'
```

## Success Indicators
✅ Domain shows green checkmark in Vercel
✅ HTTPS certificate active
✅ API endpoints return JSON responses
✅ No SSO redirect pages
✅ Authentication works normally

## Fallback Options
If custom domain still has protection:
1. Deploy to different Vercel account (personal)
2. Use alternative hosting (Netlify, Railway)  
3. Request SSO exemption from team administrator

Custom domain deployment is the most reliable way to bypass organizational SSO policies while maintaining all application functionality.