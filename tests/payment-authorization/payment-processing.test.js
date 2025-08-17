/**
 * Payment Processing Tests
 * Tests the complete payment lifecycle from escrow to release
 */

const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server/index');

describe('Payment Processing', () => {
  let authToken;
  let contractId;
  let milestoneId;
  let paymentId;

  before(async () => {
    // Setup authenticated session
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'client@acmecorp.com',
        password: 'client123'
      });
    
    authToken = loginResponse.body.token;
  });

  describe('Escrow Processing', () => {
    it('should process payment to escrow on milestone approval', async () => {
      const response = await request(app)
        .post('/api/payments/process-escrow')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'test_contract_id',
          milestoneId: 'test_milestone_id',
          amount: 2500,
          paymentMethod: 'stripe'
        });

      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('escrowed');
      expect(response.body.escrowTxId).to.exist;
      paymentId = response.body.paymentId;
    });

    it('should create blockchain escrow account for USDC payments', async () => {
      const response = await request(app)
        .post('/api/payments/process-escrow')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'test_contract_id',
          milestoneId: 'test_milestone_id',
          amount: 2500,
          paymentMethod: 'usdc',
          walletAddress: '7xKX9nR4mP3cQ8vY6tL1sE9fN4cW7aZ5qM8uJ3rT6vH3nD'
        });

      expect(response.status).to.equal(200);
      expect(response.body.escrowAccount).to.exist;
      expect(response.body.blockchainTx).to.exist;
    });

    it('should handle insufficient funds gracefully', async () => {
      const response = await request(app)
        .post('/api/payments/process-escrow')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: 'test_contract_id',
          milestoneId: 'test_milestone_id',
          amount: 10000, // Exceeds authorized amount
          paymentMethod: 'stripe'
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('insufficient authorized funds');
    });
  });

  describe('Payment Release', () => {
    it('should release payment on milestone completion', async () => {
      const response = await request(app)
        .post('/api/payments/release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: 'test_payment_id',
          milestoneId: 'test_milestone_id',
          freelancerWallet: '7xKX9nR4mP3cQ8vY6tL1sE9fN4cW7aZ5qM8uJ3rT6vH3nD'
        });

      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('released');
      expect(response.body.releaseTxId).to.exist;
    });

    it('should apply platform fees correctly', async () => {
      const response = await request(app)
        .post('/api/payments/release')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: 'test_payment_id',
          milestoneId: 'test_milestone_id',
          amount: 2500
        });

      expect(response.body.platformFee).to.exist;
      expect(response.body.freelancerAmount).to.be.below(2500);
      expect(response.body.feeBreakdown).to.have.property('platformFee');
      expect(response.body.feeBreakdown).to.have.property('processingFee');
    });

    it('should notify parties of payment release', async () => {
      const notificationResponse = await request(app)
        .get('/api/notifications/recent')
        .set('Authorization', `Bearer ${authToken}`);

      const paymentNotification = notificationResponse.body.find(
        n => n.type === 'payment_released'
      );
      
      expect(paymentNotification).to.exist;
    });
  });

  describe('Payment Failures', () => {
    it('should handle card declined scenarios', async () => {
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
      expect(response.body.error).to.include('declined');
      expect(response.body.retryable).to.be.true;
    });

    it('should pause milestone approval on payment failures', async () => {
      const response = await request(app)
        .get(`/api/contracts/${contractId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.paymentIssues).to.exist;
      expect(response.body.canApproveMilestones).to.be.false;
    });

    it('should log payment failure events', async () => {
      const auditResponse = await request(app)
        .get('/api/audit/payment-events')
        .set('Authorization', `Bearer ${authToken}`);

      const failureEvent = auditResponse.body.find(
        event => event.eventType === 'payment_failed'
      );
      
      expect(failureEvent).to.exist;
      expect(failureEvent.errorCode).to.exist;
    });
  });

  describe('Refund Processing', () => {
    it('should process full refund for cancelled milestones', async () => {
      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: 'test_payment_id',
          reason: 'milestone_cancelled',
          amount: 2500
        });

      expect(response.status).to.equal(200);
      expect(response.body.refundId).to.exist;
      expect(response.body.status).to.equal('refunded');
    });

    it('should handle partial refunds for disputes', async () => {
      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentId: 'test_payment_id',
          reason: 'dispute_resolution',
          amount: 1250 // Partial refund
        });

      expect(response.status).to.equal(200);
      expect(response.body.refundAmount).to.equal(1250);
    });
  });
});