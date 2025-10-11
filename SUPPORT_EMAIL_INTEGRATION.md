# Support Email Integration Summary

## Main Support Email: support@getsmartflo.com

This document outlines where the support email `support@getsmartflo.com` is integrated throughout the SmartFlo platform.

---

## Email Templates (All use support@getsmartflo.com)

### 1. Contract Invitation Email
- **File**: `emails/ContractInvitation.tsx`
- **Usage**: Contact link in footer
- **Text**: "Questions? Contact us at support@getsmartflo.com"

### 2. Payment Authorized Email
- **File**: `emails/PaymentAuthorized.tsx`
- **Usage**: Multiple locations
  - Support contact in bullet points
  - Contact link in footer
- **Text**: 
  - "Get Support: Contact us anytime at support@getsmartflo.com"
  - "Questions? Contact us at support@getsmartflo.com"

### 3. Payment Pending Email
- **File**: `emails/PaymentPending.tsx`
- **Usage**: Multiple locations
  - Support contact in action items
  - Urgent contact in footer
- **Text**:
  - "Contact Support: Reach out anytime at support@getsmartflo.com"
  - "Urgent questions? Contact us immediately at support@getsmartflo.com"

### 4. Payment Processed Email
- **File**: `emails/PaymentProcessed.tsx`
- **Usage**: Contact link in footer
- **Text**: "Questions about this charge? Contact us at support@getsmartflo.com"

### 5. Authorization Revoked Email
- **File**: `emails/AuthorizationRevoked.tsx`
- **Usage**: Contact link in footer
- **Text**: "Questions about authorization revocation? Contact us at support@getsmartflo.com"

---

## Frontend Pages

### 1. Payment Authorization Page
- **File**: `client/src/pages/payment-authorization.tsx`
- **Line**: 252
- **Usage**: Emergency contact information
- **Text**: "Email support@getsmartflo.com for immediate cancellation"

### 2. Privacy Policy Page
- **File**: `client/src/pages/privacy-policy.tsx`
- **Line**: 242
- **Usage**: General support contact
- **Text**: "General Support: support@getsmartflo.com"

### 3. Terms of Service Page
- **File**: `client/src/pages/terms-of-service.tsx`
- **Lines**: 63, 190
- **Usage**: Support contact for questions and general support
- **Text**: 
  - "Contacting support at support@getsmartflo.com"
  - "SmartFlo Support: support@getsmartflo.com"

---

## Backend/Server Files

### Email Service
- **File**: `server/email-service.ts`
- **Line**: 354
- **Usage**: Error contact in test email
- **Text**: "If you received this in error, please contact support@getsmartflo.com"

---

## Documentation Files

### 1. Payment Authorization Guide
- **File**: `docs/user-guides/payment-authorization-guide.md`
- **Line**: 419
- **Usage**: Customer support contact information
- **Text**: "Email: support@getsmartflo.com"

### 2. FAQ - Automated Payments
- **File**: `docs/user-guides/faq-automated-payments.md`
- **Line**: 319
- **Usage**: Support team contact
- **Text**: "Email: support@getsmartflo.com (4-hour response time)"

### 3. Troubleshooting Guide
- **File**: `docs/user-guides/troubleshooting-guide.md`
- **Lines**: 473, 583
- **Usage**: Email support contact and quick reference
- **Text**: 
  - "General: support@getsmartflo.com"
  - "Email: support@getsmartflo.com"

---

## Summary

✅ **support@getsmartflo.com** is now consistently integrated across:
- **5 Email Templates** - All transactional emails include support contact
- **3 Frontend Pages** - Terms, Privacy, Payment Authorization
- **1 Backend Service** - Email service error handling
- **3 Documentation Files** - User guides and support documentation

---

## Additional Support Channels

The platform also references these support channels in documentation:
- **Phone**: +1-800-SMARTFLO (762-7835)
- **Live Chat**: Available 24/7 on smartflo.com
- **Help Center**: help.smartflo.com

For security-specific issues, users are directed to:
- **Security Team**: security@smartflo.com
- **Emergency Hotline**: +1-800-762-7835 (24/7)

---

**Last Updated**: January 2024
**Status**: ✅ Fully Integrated
