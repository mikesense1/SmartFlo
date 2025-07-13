# SmartFlo Production Deployment Guide

## Environment Configuration

### Required Environment Variables

Create `.env.local` file with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database

# Supabase Configuration (Alternative to direct PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# OpenAI Integration for AI Contract Generation
OPENAI_API_KEY=sk-your_openai_api_key

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key

# Solana Blockchain Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PROGRAM_ID=your_deployed_program_id
PLATFORM_WALLET_PRIVATE_KEY=your_platform_wallet_private_key
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Application Configuration
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret

# Security Configuration
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
CSRF_SECRET=your_csrf_secret

# Monitoring and Error Tracking
SENTRY_DSN=your_sentry_dsn
ANALYTICS_ID=your_analytics_id
```

## Solana Program Deployment

### Prerequisites
- Install Anchor framework: `cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked`
- Configure Solana CLI for mainnet: `solana config set --url mainnet-beta`
- Fund deployment wallet with SOL for transaction fees

### Deployment Steps

1. **Build the program:**
```bash
cd solana/programs/freelance_escrow
anchor build
```

2. **Deploy to mainnet:**
```bash
anchor deploy --provider.cluster mainnet
```

3. **Verify deployment:**
```bash
anchor verify <program-id>
```

4. **Initialize program accounts:**
```bash
# Run initialization script
npm run solana:init-mainnet
```

5. **Update program ID in configuration:**
- Update `SOLANA_PROGRAM_ID` in environment variables
- Update program ID in `client/src/lib/solana.ts`

## Database Setup and Migrations

### Database Schema Deployment

1. **Run migrations in order:**
```bash
# Using Drizzle
npm run db:push

# Or using direct SQL migrations
psql -h hostname -U username -d database -f migrations/001_initial_schema.sql
psql -h hostname -U username -d database -f migrations/002_blockchain_tables.sql
```

2. **Set up Row Level Security (RLS) policies:**
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid()::text = id);

CREATE POLICY "Users can view own contracts" ON contracts
  FOR ALL USING (auth.uid()::text = creator_id OR client_email = auth.email());
```

3. **Create performance indexes:**
```sql
-- Frequently queried fields
CREATE INDEX idx_contracts_creator_id ON contracts(creator_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_milestones_contract_id ON milestones(contract_id);
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_activity_contract_id ON contract_activity(contract_id);

-- Blockchain-specific indexes
CREATE INDEX idx_contracts_solana_address ON contracts(solana_program_address);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
```

4. **Set up automated backups:**
```bash
# Daily backup script
pg_dump $DATABASE_URL > backups/payflow_$(date +%Y%m%d).sql

# Configure automated backup retention
```

## Security Implementation

### API Rate Limiting
```typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs: number, max: number) => 
  rateLimit({
    windowMs,
    max,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });

// Apply to API routes
app.use('/api', createRateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 minutes
```

### CSRF Protection
```typescript
// middleware/csrf.ts
import csrf from 'csurf';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});
```

### Wallet Key Management (AWS KMS)
```typescript
// lib/kms.ts
import { KMSClient, DecryptCommand } from '@aws-sdk/client-kms';

export class SecureKeyManager {
  private kms = new KMSClient({ region: 'us-east-1' });

  async decryptPrivateKey(encryptedKey: string): Promise<string> {
    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(encryptedKey, 'base64')
    });
    
    const response = await this.kms.send(command);
    return response.Plaintext?.toString() || '';
  }
}
```

### Smart Contract Security Audit
- **Automated Testing:** Comprehensive test suite covering all contract functions
- **Formal Verification:** Mathematical proof of contract correctness
- **Third-party Audit:** Professional security audit by blockchain security firm
- **Bug Bounty Program:** Incentivized security testing by the community

## Monitoring and Error Tracking

### Sentry Integration
```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### Application Monitoring
```typescript
// lib/monitoring.ts
export class ApplicationMonitor {
  static logContractCreation(contractId: string, value: number) {
    console.log(`Contract created: ${contractId}, value: $${value}`);
    // Send to monitoring service
  }

  static logPaymentProcessed(paymentId: string, amount: number, method: string) {
    console.log(`Payment processed: ${paymentId}, $${amount} via ${method}`);
    // Send to monitoring service
  }

  static logBlockchainEvent(event: string, transactionId: string) {
    console.log(`Blockchain event: ${event}, tx: ${transactionId}`);
    // Send to monitoring service
  }
}
```

### Health Checks
```typescript
// api/health.ts
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: await checkDatabaseConnection(),
    blockchain: await checkSolanaConnection(),
    stripe: await checkStripeConnection(),
  };

  res.status(200).json(health);
}
```

## Launch Preparation

### Legal Documentation
1. **Terms of Service**
   - User obligations and rights
   - Platform fees and payment terms
   - Intellectual property rights
   - Dispute resolution procedures

2. **Privacy Policy**
   - Data collection and usage
   - Cookie policy
   - Third-party integrations
   - User rights under GDPR/CCPA

### Customer Support System
1. **Help Desk Integration**
   - Ticket management system
   - Knowledge base with FAQs
   - Live chat support
   - Video tutorials

2. **User Onboarding**
   - Interactive platform tour
   - Sample contract templates
   - Payment method setup guides
   - Blockchain wallet connection tutorial

### Analytics and Tracking
```typescript
// lib/analytics.ts
import { Analytics } from '@segment/analytics-node';

export class PayFlowAnalytics {
  private analytics = new Analytics({
    writeKey: process.env.ANALYTICS_WRITE_KEY!,
  });

  trackContractCreated(userId: string, contractValue: number, paymentMethod: string) {
    this.analytics.track({
      userId,
      event: 'Contract Created',
      properties: {
        value: contractValue,
        paymentMethod,
        timestamp: new Date(),
      },
    });
  }

  trackPaymentProcessed(userId: string, amount: number, method: string) {
    this.analytics.track({
      userId,
      event: 'Payment Processed',
      properties: {
        amount,
        method,
        timestamp: new Date(),
      },
    });
  }
}
```

### Status Page Setup
Create a status page to monitor:
- API response times
- Database connectivity
- Blockchain network status
- Payment processor status
- Third-party service integrations

### Launch Campaign Planning
1. **Pre-launch:**
   - Beta user testing
   - Security penetration testing
   - Load testing with expected traffic
   - Content marketing preparation

2. **Launch:**
   - Gradual rollout to prevent system overload
   - Real-time monitoring of all systems
   - Customer support team on standby
   - Marketing campaign activation

3. **Post-launch:**
   - User feedback collection
   - Performance optimization
   - Feature usage analytics
   - Continuous security monitoring

## Production Checklist

### Pre-deployment
- [ ] All environment variables configured
- [ ] Solana program deployed and verified
- [ ] Database migrations completed
- [ ] Security measures implemented
- [ ] Monitoring and logging configured
- [ ] Legal documentation finalized
- [ ] Customer support system ready

### Deployment
- [ ] Application deployed to production
- [ ] DNS and SSL certificates configured
- [ ] Load balancer and CDN setup
- [ ] Backup and disaster recovery tested
- [ ] Performance benchmarks established

### Post-deployment
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Customer support channels active
- [ ] Analytics tracking verified
- [ ] Security monitoring active
- [ ] User onboarding flows tested

## Maintenance and Updates

### Regular Tasks
- **Weekly:** Security updates and dependency patches
- **Monthly:** Performance optimization and monitoring review
- **Quarterly:** Security audit and penetration testing
- **Annually:** Comprehensive system architecture review

### Emergency Procedures
- Incident response plan for security breaches
- System rollback procedures for failed deployments
- Communication plan for system outages
- Disaster recovery procedures for data loss

This production setup ensures SmartFlo is secure, scalable, and ready for real-world freelance payment processing with both traditional and blockchain payment methods.