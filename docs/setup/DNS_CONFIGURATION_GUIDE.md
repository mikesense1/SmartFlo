# DNS Configuration Guide for SmartFlo Email Infrastructure
**Domain**: getsmartflo.com  
**Email Service**: Resend  
**Sender Address**: noreply@getsmartflo.com  
**Support Address**: support@getsmartflo.com

---

## Overview

This guide provides step-by-step instructions for configuring your DNS records to enable email functionality for SmartFlo. Proper DNS configuration ensures:
- High email deliverability rates (>95%)
- Protection against email spoofing
- Authentication for receiving mail servers
- Compliance with email security best practices

---

## Prerequisites

- Access to your domain registrar or DNS hosting provider (GoDaddy, Cloudflare, Namecheap, Route 53, etc.)
- Admin access to your Resend account
- Basic understanding of DNS record management

---

## Step 1: Verify Domain in Resend

### 1.1 Add Domain to Resend

1. Log in to your Resend dashboard at https://resend.com/domains
2. Click "Add Domain"
3. Enter `getsmartflo.com`
4. Click "Add"

### 1.2 Get DNS Records from Resend

After adding the domain, Resend will provide you with DNS records to configure. You'll see:
- SPF (TXT record)
- DKIM (TXT record) 
- DMARC (TXT record)
- MX records (if you want to receive emails)

Keep this page open - you'll need these values in the next steps.

---

## Step 2: Configure DNS Records

### 2.1 SPF Record (Sender Policy Framework)

SPF verifies that emails are sent from authorized servers.

**Record Type**: TXT  
**Name/Host**: `@` or `getsmartflo.com`  
**Value**: `v=spf1 include:_spf.resend.com ~all`  
**TTL**: 3600 (or default)

**Example in different providers**:

**Cloudflare**:
```
Type: TXT
Name: @
Content: v=spf1 include:_spf.resend.com ~all
TTL: Auto
```

**GoDaddy**:
```
Type: TXT
Host: @
TXT Value: v=spf1 include:_spf.resend.com ~all
TTL: 1 Hour
```

**AWS Route 53**:
```
Type: TXT
Name: getsmartflo.com
Value: "v=spf1 include:_spf.resend.com ~all"
TTL: 3600
```

### 2.2 DKIM Record (DomainKeys Identified Mail)

DKIM adds a digital signature to verify email authenticity.

**Record Type**: TXT  
**Name/Host**: `resend._domainkey` (Resend will provide the exact subdomain)  
**Value**: (Resend will provide a long string starting with `v=DKIM1...`)  
**TTL**: 3600

**Example**:
```
Type: TXT
Name: resend._domainkey
Content: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (example)
TTL: 3600
```

**Important**: Copy the exact value from Resend - DKIM keys are long and must be exact.

### 2.3 DMARC Record (Domain-based Message Authentication)

DMARC specifies how to handle emails that fail SPF/DKIM checks.

**Record Type**: TXT  
**Name/Host**: `_dmarc`  
**Value**: `v=DMARC1; p=none; rua=mailto:support@getsmartflo.com`  
**TTL**: 3600

**DMARC Policy Options**:
- `p=none` - Monitor only (recommended for initial setup)
- `p=quarantine` - Send suspicious emails to spam
- `p=reject` - Reject emails that fail authentication (strictest)

**Recommended DMARC for Production**:
```
v=DMARC1; p=quarantine; pct=100; rua=mailto:support@getsmartflo.com; sp=quarantine; adkim=r; aspf=r
```

**Example**:
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=none; rua=mailto:support@getsmartflo.com
TTL: 3600
```

---

## Step 3: Verify DNS Configuration

### 3.1 DNS Propagation Time

After adding DNS records:
- **Minimum wait time**: 1-4 hours
- **Maximum wait time**: 24-48 hours
- **Typical time**: 2-6 hours

### 3.2 Check DNS Propagation

Use these tools to verify your DNS records are live:

1. **DNS Checker** (https://dnschecker.org)
   - Select "TXT" record type
   - Enter your domain: `getsmartflo.com`
   - Look for SPF, DKIM, and DMARC records

2. **MX Toolbox** (https://mxtoolbox.com)
   - SPF Check: https://mxtoolbox.com/spf.aspx
   - DKIM Check: https://mxtoolbox.com/dkim.aspx
   - DMARC Check: https://mxtoolbox.com/dmarc.aspx

3. **Command Line (Terminal)**
   ```bash
   # Check SPF record
   dig TXT getsmartflo.com +short

   # Check DKIM record (replace with your actual DKIM selector)
   dig TXT resend._domainkey.getsmartflo.com +short

   # Check DMARC record
   dig TXT _dmarc.getsmartflo.com +short
   ```

### 3.3 Verify in Resend Dashboard

1. Return to Resend dashboard at https://resend.com/domains
2. Click on `getsmartflo.com`
3. You should see green checkmarks next to each DNS record
4. Status should show "Verified"

**If verification fails**:
- Double-check DNS record values match exactly
- Wait longer for DNS propagation
- Contact your DNS provider support
- Check for typos in record names/values

---

## Step 4: Test Email Delivery

### 4.1 Send Test Email

Once domain is verified, test email delivery:

1. Navigate to your SmartFlo admin dashboard
2. Use the test email endpoint (if available)
3. Or use Resend's dashboard to send a test email

### 4.2 Test to Multiple Providers

Send test emails to:
- Gmail: test@gmail.com
- Outlook: test@outlook.com
- Yahoo: test@yahoo.com
- Your own email

**Check for**:
- ✅ Email arrives in inbox (not spam)
- ✅ "From" shows as "noreply@getsmartflo.com"
- ✅ No security warnings
- ✅ Email headers show SPF/DKIM pass

### 4.3 Check Email Headers

In Gmail:
1. Open the test email
2. Click three dots (⋮) → Show original
3. Look for:
   ```
   SPF: PASS
   DKIM: PASS
   DMARC: PASS
   ```

In Outlook:
1. Open the test email
2. File → Properties
3. Look in Internet headers for authentication results

---

## Step 5: Monitor Email Deliverability

### 5.1 Resend Analytics

Monitor in Resend dashboard:
- Sent emails
- Delivered rate
- Bounced emails
- Spam complaints
- Open rates

### 5.2 Email Reputation

Check your domain reputation:
- **Google Postmaster Tools**: https://postmaster.google.com
- **Microsoft SNDS**: https://sendersupport.olc.protection.outlook.com/snds/

### 5.3 DMARC Reports

DMARC reports will be sent to `support@getsmartflo.com`:
- Review weekly/monthly
- Check for authentication failures
- Identify unauthorized senders
- Adjust policy as needed

---

## Troubleshooting

### Issue: Domain Not Verifying

**Possible Causes**:
1. DNS records not propagated yet (wait 24-48 hours)
2. Incorrect DNS record values
3. DNS caching issues

**Solutions**:
- Use `dig` or `nslookup` to verify records
- Clear DNS cache: `sudo dscacheutil -flushcache` (Mac)
- Contact DNS provider support

### Issue: Emails Going to Spam

**Possible Causes**:
1. SPF/DKIM/DMARC not configured correctly
2. Low sender reputation (new domain)
3. Email content triggers spam filters

**Solutions**:
- Verify all DNS records are correct
- Warm up your sending domain (start with low volume)
- Improve email content (avoid spam trigger words)
- Check blacklists: https://mxtoolbox.com/blacklists.aspx

### Issue: DKIM Verification Failing

**Possible Causes**:
1. DKIM value truncated or incorrect
2. DNS provider adding quotes incorrectly
3. Line breaks in DKIM value

**Solutions**:
- Remove all spaces and line breaks from DKIM value
- Some providers require quotes around value, some don't
- Contact Resend support for exact DKIM value

### Issue: High Bounce Rate

**Possible Causes**:
1. Invalid recipient email addresses
2. Emails being rejected by recipient servers
3. SPF/DKIM failures

**Solutions**:
- Validate email addresses before sending
- Check bounce reasons in Resend dashboard
- Verify DNS records are correct

---

## DNS Record Summary

Quick reference for all required DNS records:

| Record Type | Name/Host | Value/Content | TTL | Purpose |
|-------------|-----------|---------------|-----|---------|
| TXT | @ | v=spf1 include:_spf.resend.com ~all | 3600 | SPF authentication |
| TXT | resend._domainkey | v=DKIM1; k=rsa; p=... | 3600 | DKIM signature |
| TXT | _dmarc | v=DMARC1; p=none; rua=mailto:support@getsmartflo.com | 3600 | DMARC policy |

---

## Additional Security Recommendations

### 1. Enable BIMI (Brand Indicators for Message Identification)

BIMI displays your brand logo in supported email clients:

**Record Type**: TXT  
**Name/Host**: `default._bimi`  
**Value**: `v=BIMI1; l=https://getsmartflo.com/logo.svg; a=https://getsmartflo.com/vmc.pem`

### 2. Set Up MTA-STS (Mail Transfer Agent Strict Transport Security)

Enforces TLS encryption for email delivery:

1. Create `mta-sts.getsmartflo.com` subdomain
2. Host `.well-known/mta-sts.txt` file
3. Add TXT record for reporting

### 3. Implement DANE (DNS-Based Authentication of Named Entities)

Add TLSA records for additional email security (advanced).

---

## Best Practices

1. **Start with `p=none` DMARC policy**, monitor for 2-4 weeks, then move to `p=quarantine`
2. **Monitor DMARC reports** regularly for unauthorized sending attempts
3. **Keep SPF record under 255 characters** to avoid DNS lookup limits
4. **Use subdomains for different email types** (e.g., marketing.getsmartflo.com)
5. **Implement email authentication** for all sending domains and subdomains
6. **Test regularly** - Send test emails weekly to major providers
7. **Monitor reputation** - Check Google Postmaster Tools monthly
8. **Keep records updated** - If you change email providers, update DNS immediately

---

## Support Resources

- **Resend Documentation**: https://resend.com/docs
- **SPF Validator**: https://www.kitterman.com/spf/validate.html
- **DKIM Validator**: https://dkimvalidator.com
- **DMARC Analyzer**: https://dmarc.org/resources/deployment-tools/
- **Email Deliverability Guide**: https://www.mail-tester.com

---

## Next Steps

After completing DNS configuration:
1. ✅ Wait for DNS propagation (1-24 hours)
2. ✅ Verify domain in Resend dashboard
3. ✅ Send test emails to multiple providers
4. ✅ Check email headers for SPF/DKIM/DMARC pass
5. ✅ Monitor deliverability for first week
6. ✅ Adjust DMARC policy after monitoring period
7. ✅ Set up DMARC report analysis
8. ✅ Configure production email templates

---

**Last Updated**: January 2025  
**Maintainer**: SmartFlo Technical Team  
**Review Frequency**: Quarterly or when email provider changes
