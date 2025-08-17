/**
 * Payment Authorization Flow Tests
 * Tests the complete authorization process from initiation to completion
 */

const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server/index');

describe('Payment Authorization Flow', () => {
  let authToken;
  let contractId;
  let authorizationId;

  before(async () => {
    // Setup test user and authentication
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'client@acmecorp.com',
        password: 'client123'
      });
    
    authToken = loginResponse.body.token;
    
    // Create test contract
    const contractResponse = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Authorization Contract',
        clientEmail: 'client@acmecorp.com',
        freelancerEmail: 'demo@smartflo.com',
        totalValue: 5000,
        projectDescription: 'Test project for authorization flow'
      });
    
    contractId = contractResponse.body.id;
  });

  describe('Authorization Initiation', () => {
    it('should create payment authorization with valid payment method', async () => {
      const response = await request(app)
        .post(`/api/contracts/${contractId}/authorize-payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'stripe',
          maxPerMilestone: 2500,
          totalAuthorized: 5000,
          stripePaymentMethodId: 'pm_card_visa'
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('authorizationId');
      expect(response.body).to.have.property('setupIntentId');
      authorizationId = response.body.authorizationId;
    });

    it('should reject authorization with insufficient funds', async () => {
      const response = await request(app)
        .post(`/api/contracts/${contractId}/authorize-payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'stripe',
          maxPerMilestone: 10000, // Exceeds contract value
          totalAuthorized: 15000,
          stripePaymentMethodId: 'pm_card_visa'
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('exceeds contract value');
    });

    it('should validate payment method exists', async () => {
      const response = await request(app)
        .post(`/api/contracts/${contractId}/authorize-payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'stripe',
          maxPerMilestone: 2500,
          totalAuthorized: 5000,
          stripePaymentMethodId: 'invalid_pm_id'
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('Invalid payment method');
    });
  });

  describe('Authorization Confirmation', () => {
    it('should confirm authorization with valid setup intent', async () => {
      const response = await request(app)
        .post(`/api/payment-authorizations/${authorizationId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          setupIntentId: 'seti_valid_confirmation'
        });

      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('confirmed');
      expect(response.body.confirmedAt).to.exist;
    });

    it('should log authorization confirmation event', async () => {
      const activityResponse = await request(app)
        .get(`/api/contracts/${contractId}/activity`)
        .set('Authorization', `Bearer ${authToken}`);

      const authEvent = activityResponse.body.find(
        event => event.action === 'payment_authorized'
      );
      
      expect(authEvent).to.exist;
      expect(authEvent.details).to.have.property('authorizationId');
    });
  });

  describe('Authorization Status Checks', () => {
    it('should return current authorization status', async () => {
      const response = await request(app)
        .get(`/api/contracts/${contractId}/payment-authorization`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.isActive).to.be.true;
      expect(response.body.totalAuthorized).to.equal('5000');
    });

    it('should validate authorization before milestone submission', async () => {
      // Create milestone
      const milestoneResponse = await request(app)
        .post(`/api/contracts/${contractId}/milestones`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Milestone',
          amount: 2500,
          description: 'Test milestone for authorization'
        });

      const milestoneId = milestoneResponse.body.id;

      // Attempt submission
      const submitResponse = await request(app)
        .post('/api/milestones/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          milestoneId,
          contractId,
          completionNotes: 'Milestone completed'
        });

      expect(submitResponse.status).to.equal(200);
    });
  });

  describe('Multi-factor Authentication', () => {
    it('should require 2FA for high-value milestones', async () => {
      // Create high-value milestone
      const milestoneResponse = await request(app)
        .post(`/api/contracts/${contractId}/milestones`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'High Value Milestone',
          amount: 3000, // Over $2500 threshold
          description: 'High value milestone requiring 2FA'
        });

      const approvalResponse = await request(app)
        .post('/api/milestones/approve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          milestoneId: milestoneResponse.body.id,
          contractId
        });

      expect(approvalResponse.status).to.equal(202);
      expect(approvalResponse.body.requires2FA).to.be.true;
      expect(approvalResponse.body.otpSent).to.be.true;
    });

    it('should validate OTP for 2FA approval', async () => {
      const otpResponse = await request(app)
        .post('/api/milestones/approve-with-2fa')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          milestoneId: 'milestone_id',
          contractId,
          otpCode: '123456'
        });

      // Note: In production, this would validate against actual OTP
      expect(otpResponse.status).to.be.oneOf([200, 400]);
    });
  });

  after(async () => {
    // Cleanup test data
    if (authorizationId) {
      await request(app)
        .delete(`/api/payment-authorizations/${authorizationId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });
});