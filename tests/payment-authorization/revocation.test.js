/**
 * Payment Authorization Revocation Tests
 * Tests client ability to revoke payment authorizations
 */

const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server/index');

describe('Payment Authorization Revocation', () => {
  let clientToken;
  let freelancerToken;
  let contractId;
  let authorizationId;

  before(async () => {
    // Setup client session
    const clientLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'client@acmecorp.com',
        password: 'client123'
      });
    clientToken = clientLogin.body.token;

    // Setup freelancer session
    const freelancerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@smartflo.com',
        password: 'demo123'
      });
    freelancerToken = freelancerLogin.body.token;
  });

  describe('Immediate Revocation', () => {
    it('should allow client to revoke active authorization', async () => {
      const response = await request(app)
        .post(`/api/payment-authorizations/${authorizationId}/revoke`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          reason: 'client_request',
          effectiveImmediately: true
        });

      expect(response.status).to.equal(200);
      expect(response.body.status).to.equal('revoked');
      expect(response.body.revokedAt).to.exist;
    });

    it('should prevent new milestone approvals after revocation', async () => {
      const approvalResponse = await request(app)
        .post('/api/milestones/approve')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          milestoneId: 'test_milestone_id',
          contractId: contractId
        });

      expect(approvalResponse.status).to.equal(403);
      expect(approvalResponse.body.error).to.include('authorization revoked');
    });

    it('should notify freelancer of revocation', async () => {
      const notificationResponse = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${freelancerToken}`);

      const revocationNotice = notificationResponse.body.find(
        n => n.type === 'authorization_revoked'
      );
      
      expect(revocationNotice).to.exist;
      expect(revocationNotice.contractId).to.equal(contractId);
    });
  });

  describe('Scheduled Revocation', () => {
    it('should schedule future revocation date', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const response = await request(app)
        .post(`/api/payment-authorizations/${authorizationId}/revoke`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          reason: 'project_completion',
          effectiveDate: futureDate.toISOString()
        });

      expect(response.status).to.equal(200);
      expect(response.body.scheduledRevocation).to.exist;
      expect(new Date(response.body.scheduledRevocation)).to.be.above(new Date());
    });

    it('should allow milestone processing before scheduled revocation', async () => {
      const approvalResponse = await request(app)
        .post('/api/milestones/approve')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          milestoneId: 'test_milestone_id',
          contractId: contractId
        });

      expect(approvalResponse.status).to.equal(200);
    });

    it('should enforce revocation on scheduled date', async () => {
      // Simulate time passage (would be handled by cron job in production)
      const response = await request(app)
        .post('/api/system/process-scheduled-revocations')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.processedCount).to.be.at.least(0);
    });
  });

  describe('Partial Revocation', () => {
    it('should reduce authorized amount without full revocation', async () => {
      const response = await request(app)
        .patch(`/api/payment-authorizations/${authorizationId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          totalAuthorized: 3000, // Reduce from 5000
          reason: 'scope_change'
        });

      expect(response.status).to.equal(200);
      expect(response.body.totalAuthorized).to.equal('3000');
      expect(response.body.isActive).to.be.true;
    });

    it('should prevent approvals exceeding reduced limit', async () => {
      const approvalResponse = await request(app)
        .post('/api/milestones/approve')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          milestoneId: 'high_value_milestone',
          contractId: contractId,
          amount: 4000 // Exceeds new limit of 3000
        });

      expect(approvalResponse.status).to.equal(400);
      expect(approvalResponse.body.error).to.include('exceeds authorized amount');
    });
  });

  describe('Emergency Revocation', () => {
    it('should handle security-related emergency revocation', async () => {
      const response = await request(app)
        .post(`/api/payment-authorizations/${authorizationId}/emergency-revoke`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          reason: 'security_breach',
          details: 'Suspected unauthorized access'
        });

      expect(response.status).to.equal(200);
      expect(response.body.emergencyRevocation).to.be.true;
      expect(response.body.securityFlag).to.be.true;
    });

    it('should freeze all pending payments on emergency revocation', async () => {
      const paymentsResponse = await request(app)
        .get(`/api/contracts/${contractId}/payments`)
        .set('Authorization', `Bearer ${clientToken}`);

      const pendingPayments = paymentsResponse.body.filter(
        p => p.status === 'pending'
      );
      
      expect(pendingPayments.every(p => p.frozen === true)).to.be.true;
    });

    it('should trigger security investigation workflow', async () => {
      const investigationResponse = await request(app)
        .get('/api/security/investigations')
        .set('Authorization', `Bearer ${clientToken}`);

      const securityCase = investigationResponse.body.find(
        case => case.triggerEvent === 'emergency_revocation'
      );
      
      expect(securityCase).to.exist;
      expect(securityCase.status).to.equal('active');
    });
  });

  describe('Audit and Compliance', () => {
    it('should log all revocation events with full audit trail', async () => {
      const auditResponse = await request(app)
        .get(`/api/audit/authorization-events/${authorizationId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      const revocationEvent = auditResponse.body.find(
        event => event.action === 'authorization_revoked'
      );
      
      expect(revocationEvent).to.exist;
      expect(revocationEvent.actorId).to.exist;
      expect(revocationEvent.reason).to.exist;
      expect(revocationEvent.ipAddress).to.exist;
    });

    it('should maintain revocation records for compliance', async () => {
      const complianceResponse = await request(app)
        .get('/api/compliance/revocation-records')
        .set('Authorization', `Bearer ${clientToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        });

      expect(complianceResponse.status).to.equal(200);
      expect(complianceResponse.body.records).to.be.an('array');
      expect(complianceResponse.body.totalRevocations).to.be.a('number');
    });
  });
});