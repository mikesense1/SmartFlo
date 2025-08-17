/**
 * Failed Payment Handling Tests
 * Tests system behavior when payments fail
 */

const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server/index');

describe('Failed Payment Handling', () => {
  let authToken;
  let contractId;
  let milestoneId;

  before(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'client@acmecorp.com',
        password: 'client123'
      });
    
    authToken = loginResponse.body.token;
  });

  describe('Card Decline Handling', () => {
    it('should handle insufficient funds decline', async () => {
      const response = await request(app)
        .post('/api/payments/process-escrow')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'test_contract_id',
          milestoneId: 'test_milestone_id',
          amount: 2500,
          paymentMethod: 'stripe',
          stripePaymentMethodId: 'pm_card_chargeDeclinedInsufficientFunds'
        });

      expect(response.status).to.equal(400);
      expect(response.body.errorCode).to.equal('card_declined');
      expect(response.body.declineCode).to.equal('insufficient_funds');
      expect(response.body.retryable).to.be.true;
    });

    it('should handle expired card decline', async () => {
      const response = await request(app)
        .post('/api/payments/process-escrow')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'test_contract_id',
          milestoneId: 'test_milestone_id',
          amount: 2500,
          paymentMethod: 'stripe',
          stripePaymentMethodId: 'pm_card_chargeDeclinedExpiredCard'
        });

      expect(response.status).to.equal(400);
      expect(response.body.errorCode).to.equal('card_declined');
      expect(response.body.declineCode).to.equal('expired_card');
      expect(response.body.retryable).to.be.false;
      expect(response.body.requiresNewPaymentMethod).to.be.true;
    });

    it('should handle generic card decline', async () => {
      const response = await request(app)
        .post('/api/payments/process-escrow')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'test_contract_id',
          milestoneId: 'test_milestone_id',
          amount: 2500,
          paymentMethod: 'stripe',
          stripePaymentMethodId: 'pm_card_chargeDeclined'
        });

      expect(response.status).to.equal(400);
      expect(response.body.errorCode).to.equal('card_declined');
      expect(response.body.retryable).to.be.true;
    });
  });

  describe('Retry Logic', () => {
    it('should implement exponential backoff for retries', async () => {
      const response = await request(app)
        .post('/api/payments/retry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: 'failed_payment_id',
          retryAttempt: 1
        });

      expect(response.status).to.equal(202);
      expect(response.body.nextRetryAt).to.exist;
      expect(response.body.retryDelay).to.be.at.least(60); // At least 1 minute
    });

    it('should limit maximum retry attempts', async () => {
      const response = await request(app)
        .post('/api/payments/retry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: 'failed_payment_id',
          retryAttempt: 4 // Exceeds max of 3
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('maximum retry attempts exceeded');
    });

    it('should pause milestone approvals after multiple failures', async () => {
      const response = await request(app)
        .get(`/api/contracts/${contractId}/payment-status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.milestonesBlocked).to.be.true;
      expect(response.body.blockReason).to.equal('payment_failures');
      expect(response.body.failureCount).to.be.at.least(3);
    });
  });

  describe('Alternative Payment Methods', () => {
    it('should suggest backup payment method on failure', async () => {
      const response = await request(app)
        .get('/api/payment-methods/alternatives')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          contractId: 'test_contract_id',
          excludeFailedMethod: 'pm_failed_card'
        });

      expect(response.status).to.equal(200);
      expect(response.body.alternatives).to.be.an('array');
      expect(response.body.alternatives.length).to.be.at.least(1);
    });

    it('should allow switching to crypto payment on card failure', async () => {
      const response = await request(app)
        .post('/api/payment-authorizations/switch-method')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'test_contract_id',
          newPaymentMethod: 'usdc',
          walletAddress: '7xKX9nR4mP3cQ8vY6tL1sE9fN4cW7aZ5qM8uJ3rT6vH3nD'
        });

      expect(response.status).to.equal(200);
      expect(response.body.authorizationUpdated).to.be.true;
      expect(response.body.newPaymentMethod).to.equal('usdc');
    });
  });

  describe('Notification System', () => {
    it('should notify client of payment failure immediately', async () => {
      const response = await request(app)
        .get('/api/notifications/recent')
        .set('Authorization', `Bearer ${authToken}`);

      const failureNotification = response.body.find(
        n => n.type === 'payment_failed'
      );
      
      expect(failureNotification).to.exist;
      expect(failureNotification.priority).to.equal('high');
      expect(failureNotification.actionRequired).to.be.true;
    });

    it('should send email alert for critical payment failures', async () => {
      const emailResponse = await request(app)
        .get('/api/emails/sent')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          type: 'payment_failure_alert'
        });

      expect(emailResponse.body.emails).to.be.an('array');
      expect(emailResponse.body.emails.length).to.be.at.least(1);
    });

    it('should notify freelancer of payment delays', async () => {
      const freelancerNotificationResponse = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer freelancerToken`)
        .query({
          contractId: 'test_contract_id'
        });

      const delayNotification = freelancerNotificationResponse.body.find(
        n => n.type === 'payment_delayed'
      );
      
      expect(delayNotification).to.exist;
    });
  });

  describe('Fraud Detection', () => {
    it('should flag suspicious payment patterns', async () => {
      const response = await request(app)
        .post('/api/fraud/analyze-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethodId: 'pm_suspicious_card',
          amount: 2500,
          contractId: 'test_contract_id'
        });

      expect(response.status).to.equal(200);
      expect(response.body.riskScore).to.be.a('number');
      expect(response.body.riskFactors).to.be.an('array');
    });

    it('should require additional verification for high-risk payments', async () => {
      const response = await request(app)
        .post('/api/payments/process-escrow')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'test_contract_id',
          milestoneId: 'test_milestone_id',
          amount: 2500,
          paymentMethodId: 'pm_high_risk_card'
        });

      expect(response.status).to.equal(202);
      expect(response.body.requiresVerification).to.be.true;
      expect(response.body.verificationMethods).to.include('3ds');
    });
  });

  describe('Recovery Procedures', () => {
    it('should provide payment recovery options', async () => {
      const response = await request(app)
        .get('/api/payments/recovery-options')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          failedPaymentId: 'payment_123'
        });

      expect(response.status).to.equal(200);
      expect(response.body.options).to.include('retry_payment');
      expect(response.body.options).to.include('update_payment_method');
      expect(response.body.options).to.include('contact_support');
    });

    it('should escalate to manual review after multiple failures', async () => {
      const response = await request(app)
        .post('/api/payments/escalate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'test_contract_id',
          failureCount: 5,
          reason: 'repeated_payment_failures'
        });

      expect(response.status).to.equal(200);
      expect(response.body.escalated).to.be.true;
      expect(response.body.supportTicketId).to.exist;
    });
  });
});