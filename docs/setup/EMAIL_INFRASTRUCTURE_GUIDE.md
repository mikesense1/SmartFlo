# SmartFlo Email Infrastructure Documentation
**Platform**: Automated Freelance Payment & Escrow  
**Email Service**: Resend  
**Sender Address**: noreply@getsmartflo.com  
**Support Address**: support@getsmartflo.com

---

## Table of Contents
1. [Overview](#overview)
2. [Email Architecture](#email-architecture)
3. [Setup Instructions](#setup-instructions)
4. [Email Types & Triggers](#email-types--triggers)
5. [Template System](#template-system)
6. [Testing & Validation](#testing--validation)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Troubleshooting](#troubleshooting)

---

## Overview

SmartFlo uses Resend as its transactional email service provider. The platform sends automated emails for:
- User authentication (2FA codes)
- Contract workflows (invitations, approvals, completions)
- Payment notifications (authorized, pending, processed)
- Security alerts (unusual activity, new devices)
- Contact form submissions
- System notifications

### Key Features
- ✅ React-based email templates with @react-email/components
- ✅ Email event tracking and analytics
- ✅ Automatic retry logic for failed deliveries
- ✅ Secure API key management via environment variables
- ✅ Professional HTML/plain-text dual formatting
- ✅ SPF/DKIM/DMARC authentication for deliverability

---

## Email Architecture

### Email Service Layer
```
├── server/
│   ├── email-service.ts          # Main email service (singleton)
│   └── email-routes.ts            # API endpoints for email testing
├── emails/
│   ├── ContractInvitation.tsx     # Client contract invitation email
│   ├── PaymentAuthorized.tsx      # Payment authorization confirmation
│   ├── PaymentPending.tsx         # Pending payment notification
│   ├── PaymentProcessed.tsx       # Payment completion confirmation
│   ├── AuthorizationRevoked.tsx   # Revocation notification
│   ├── PaymentVerification.tsx    # 2FA code email
│   └── ContactFormSubmission.tsx  # Support contact form email
```

### Service Design Pattern
The email service uses a singleton pattern to ensure consistent configuration:

```typescript
// server/email-service.ts
export class EmailService {
  private static instance: EmailService;
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }
  
  // Email methods...
}

export const emailService = EmailService.getInstance();
```

---

## Setup Instructions

### Step 1: Environment Configuration

Add Resend API key to your environment:

```bash
# In Replit Secrets or .env file
RESEND_API_KEY=re_your_api_key_here
```

**Getting a Resend API Key:**
1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Navigate to "API Keys" in dashboard
3. Click "Create API Key"
4. Copy the key (starts with `re_`)
5. Add to your Replit Secrets as `RESEND_API_KEY`

### Step 2: DNS Configuration

Configure your domain's DNS records for email authentication. See [DNS_CONFIGURATION_GUIDE.md](./DNS_CONFIGURATION_GUIDE.md) for detailed instructions.

**Required DNS Records:**
- SPF: `v=spf1 include:_spf.resend.com ~all`
- DKIM: (provided by Resend after domain verification)
- DMARC: `v=DMARC1; p=none; rua=mailto:support@getsmartflo.com`

**Verification:**
```bash
# Check SPF
dig TXT getsmartflo.com

# Check DKIM
dig TXT resend._domainkey.getsmartflo.com

# Check DMARC
dig TXT _dmarc.getsmartflo.com
```

### Step 3: Verify Integration

Test email delivery after setup:

```bash
# Using the API (requires authentication)
curl -X POST https://your-app-url.com/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

Or use the built-in test function:
```typescript
import { emailService } from './server/email-service';

const result = await emailService.sendTestEmail('your@email.com', 'Test User');
console.log(result); // { success: true, messageId: '...' }
```

---

## Email Types & Triggers

### 1. Contract Invitation
**Trigger**: Freelancer creates contract and sends to client  
**Recipient**: Client email  
**Template**: `ContractInvitation.tsx`  
**From**: noreply@getsmartflo.com

**Content**:
- Freelancer name and contract details
- Total contract value
- Payment method information
- Link to review and authorize payment

**API Call**:
```typescript
await emailService.sendContractInvitation({
  clientName: "John Doe",
  clientEmail: "john@company.com",
  freelancerName: "Jane Smith",
  contractTitle: "Website Development",
  totalValue: "$5,000.00",
  contractId: "contract-uuid",
  paymentMethod: "Credit Card"
});
```

### 2. Payment Authorized
**Trigger**: Client authorizes payment method  
**Recipient**: Client email  
**Template**: `PaymentAuthorized.tsx`

**Content**:
- Authorization confirmation
- Payment method details
- Contract summary
- Security information

### 3. Payment Pending
**Trigger**: Freelancer submits milestone for approval  
**Recipient**: Client email  
**Template**: `PaymentPending.tsx`

**Content**:
- Milestone title and amount
- Auto-approval timeline (48 hours)
- Link to approve/review milestone
- Payment method charged

### 4. Payment Processed
**Trigger**: Milestone payment completed  
**Recipient**: Both client and freelancer  
**Template**: `PaymentProcessed.tsx`

**Content**:
- Payment confirmation
- Transaction ID
- Amount charged
- Receipt information

### 5. Payment Verification (2FA)
**Trigger**: Client approves milestone requiring 2FA  
**Recipient**: Client email  
**Template**: `PaymentVerification.tsx`

**Content**:
- 6-digit verification code
- Expiration time (10 minutes)
- Security notice
- Contract and milestone details

**Implementation**:
```typescript
await emailService.sendPaymentVerification({
  clientName: "John Doe",
  clientEmail: "john@company.com",
  verificationCode: "123456",
  amount: "$500.00",
  milestoneTitle: "Homepage Design",
  contractTitle: "Website Development",
  expiresInMinutes: 10
});
```

### 6. Authorization Revoked
**Trigger**: Payment authorization is revoked  
**Recipient**: Client email  
**Template**: `AuthorizationRevoked.tsx`

**Content**:
- Revocation confirmation
- Remaining balance (if any)
- Impact on pending milestones
- Re-authorization instructions

### 7. Contact Form Submission
**Trigger**: User submits contact form  
**Recipient**: support@getsmartflo.com  
**Template**: `ContactFormSubmission.tsx`

**Content**:
- Sender name and email
- Subject line
- Message body
- Submission timestamp

**API Endpoint**:
```typescript
POST /api/contact
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "subject": "Question about payments",
  "message": "I have a question..."
}
```

### 8. Security Alerts
**Trigger**: Automated security monitoring  
**Recipients**: User email (affected account)  
**Format**: Plain HTML (not React template)

**Alert Types**:
- Failed 2FA attempts (3+ in 1 hour)
- New device payment approval
- Unusual payment patterns
- Geographic anomalies

**Implementation**:
```typescript
// In server/lib/security/monitoring.ts
await sendEmail(
  user.email,
  "Security Alert: Multiple Failed Verification Attempts",
  `We detected ${attempts} failed payment verification attempts...`
);
```

---

## Template System

### Using @react-email/components

All email templates use React components for maintainability:

```typescript
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Link
} from '@react-email/components';

export default function EmailTemplate({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Preview>Preview text shown in email inbox</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={heading}>Hello {name}</Text>
            <Button href="https://getsmartflo.com">
              Click Here
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

### Styling Best Practices

1. **Inline Styles**: Use inline styles (email clients don't support `<style>` tags well)
2. **Tables for Layout**: Use tables for complex layouts (better client support)
3. **Limited CSS**: Stick to basic CSS properties (no flexbox, grid, transforms)
4. **Test Across Clients**: Always test in Gmail, Outlook, Yahoo, Apple Mail

### Common Styles Pattern

```typescript
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 20px',
};
```

---

## Testing & Validation

### Local Development Testing

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Test API Endpoint**:
   ```bash
   curl -X POST http://localhost:5000/api/email/test \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

3. **Check Resend Dashboard**:
   - Navigate to https://resend.com/emails
   - View sent emails, delivery status, and any errors

### Email Deliverability Testing

Use these tools to verify email setup:

1. **Mail Tester** (https://www.mail-tester.com)
   - Send test email to provided address
   - Get spam score (aim for 10/10)
   - Check DNS, content, authentication

2. **GlockApps** (https://glockapps.com)
   - Spam filter testing across providers
   - Inbox placement reporting

3. **Email on Acid** (https://www.emailonacid.com)
   - Preview in 90+ email clients
   - Spam testing and deliverability

### Integration Testing

Test complete email workflows:

```typescript
// Test contract invitation flow
describe('Email Integration Tests', () => {
  it('should send contract invitation email', async () => {
    const result = await emailService.sendContractInvitation({
      clientName: "Test Client",
      clientEmail: "test@example.com",
      freelancerName: "Test Freelancer",
      contractTitle: "Test Contract",
      totalValue: "$1,000.00",
      contractId: "test-123",
      paymentMethod: "Credit Card"
    });
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});
```

---

## Monitoring & Analytics

### Resend Dashboard Metrics

Monitor in https://resend.com/emails:
- **Total Sent**: Number of emails dispatched
- **Delivered**: Successfully delivered to inbox
- **Bounced**: Failed deliveries (soft/hard bounces)
- **Opened**: Recipient opened email
- **Clicked**: Recipient clicked link in email
- **Spam Complaints**: Marked as spam

### Email Event Tracking

Resend provides webhooks for email events:

```typescript
// Configure webhook endpoint
app.post('/api/webhooks/resend', async (req, res) => {
  const { type, data } = req.body;
  
  switch (type) {
    case 'email.sent':
      // Email dispatched
      break;
    case 'email.delivered':
      // Delivered to recipient
      break;
    case 'email.bounced':
      // Delivery failed
      break;
    case 'email.opened':
      // Recipient opened
      break;
    case 'email.clicked':
      // Link clicked
      break;
  }
  
  res.json({ received: true });
});
```

### Alert Thresholds

Set up monitoring alerts for:
- **Bounce rate > 5%**: Investigate email list quality
- **Spam complaint rate > 0.1%**: Review email content
- **Delivery rate < 95%**: Check DNS configuration
- **API errors**: Resend service issues

---

## Troubleshooting

### Issue: Emails Not Sending

**Symptoms**: API returns success but no email received

**Debugging Steps**:
1. Check RESEND_API_KEY is set correctly
2. Verify domain in Resend dashboard
3. Check Resend logs for errors
4. Verify recipient email is valid

**Solutions**:
```typescript
// Add detailed logging
const result = await emailService.sendContractInvitation(data);
console.log('Email result:', result);
if (!result.success) {
  console.error('Email error:', result.error);
}
```

### Issue: Emails in Spam Folder

**Possible Causes**:
- DNS records not configured correctly
- Poor sender reputation
- Spammy email content

**Solutions**:
1. Verify SPF/DKIM/DMARC records
2. Check spam score with Mail Tester
3. Review email content for spam triggers:
   - Avoid ALL CAPS in subject
   - Reduce exclamation marks!!!
   - Include physical address
   - Add unsubscribe link (for marketing emails)

### Issue: Template Not Rendering

**Symptoms**: Broken layout or missing content

**Common Causes**:
1. JSX syntax errors in template
2. Missing props
3. Incompatible CSS properties

**Solutions**:
```typescript
// Test template rendering locally
import { render } from '@react-email/render';
import EmailTemplate from './emails/EmailTemplate';

const html = render(<EmailTemplate name="Test" />);
console.log(html); // View generated HTML
```

### Issue: High Bounce Rate

**Types of Bounces**:
- **Soft Bounce**: Temporary issue (inbox full, server down)
- **Hard Bounce**: Permanent issue (invalid email, domain doesn't exist)

**Solutions**:
- Validate email addresses before sending
- Remove hard bounces from mailing list
- Monitor Resend bounce logs
- Implement email validation on signup

---

## API Reference

### Email Service Methods

#### sendContractInvitation()
```typescript
emailService.sendContractInvitation({
  clientName: string;
  clientEmail: string;
  freelancerName: string;
  contractTitle: string;
  totalValue: string;
  contractId: string;
  paymentMethod: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }>
```

#### sendPaymentAuthorized()
```typescript
emailService.sendPaymentAuthorized({
  clientName: string;
  clientEmail: string;
  contractTitle: string;
  paymentMethod: string;
  contractId: string;
  authorizationDate: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }>
```

#### sendPaymentVerification()
```typescript
emailService.sendPaymentVerification({
  clientName: string;
  clientEmail: string;
  verificationCode: string;
  amount: string;
  milestoneTitle: string;
  contractTitle: string;
  expiresInMinutes?: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }>
```

#### sendContactFormSubmission()
```typescript
emailService.sendContactFormSubmission({
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }>
```

---

## Security Best Practices

1. **Never Log Email Content**: Avoid logging sensitive information
2. **Use Environment Variables**: Store API keys securely
3. **Rate Limiting**: Prevent email bombing attacks
4. **Validate Inputs**: Sanitize all user-provided data
5. **HTTPS Only**: Always use encrypted connections
6. **Audit Trail**: Log all email sends for compliance

---

## Performance Optimization

1. **Async Processing**: Send emails asynchronously to avoid blocking
2. **Batch Sending**: Group multiple emails when possible
3. **Template Caching**: Cache compiled templates
4. **Error Handling**: Implement retry logic for failures
5. **Queue System**: Use job queue for high-volume sending

---

## Compliance & Legal

### CAN-SPAM Act Requirements
- Include physical postal address
- Clear "From" identification
- Accurate subject lines
- Opt-out mechanism for marketing emails
- Honor unsubscribe requests within 10 days

### GDPR Compliance
- Obtain consent before sending marketing emails
- Provide data access/deletion upon request
- Secure email data storage
- Document processing activities

---

## Additional Resources

- **Resend Documentation**: https://resend.com/docs
- **React Email Documentation**: https://react.email/docs
- **Email Best Practices**: https://www.litmus.com/blog/
- **Deliverability Guide**: https://sendgrid.com/resource/email-deliverability-guide/

---

**Last Updated**: January 2025  
**Maintainer**: SmartFlo Technical Team  
**Next Review**: April 2025
