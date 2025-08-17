/**
 * Dispute Process Tests
 * Tests the complete dispute resolution workflow
 */

const { expect } = require('chai');
const request = require('supertest');
const app = require('../../server/index');

describe('Dispute Process', () => {
  let clientToken;
  let freelancerToken;
  let adminToken;
  let contractId;
  let milestoneId;
  let disputeId;

  before(async () => {
    // Setup user sessions
    const clientLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'client@acmecorp.com',
        password: 'client123'
      });
    clientToken = clientLogin.body.token;

    const freelancerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@smartflo.com',
        password: 'demo123'
      });
    freelancerToken = freelancerLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@smartflo.com',
        password: 'admin123'
      });
    adminToken = adminLogin.body.token;
  });

  describe('Dispute Initiation', () => {
    it('should allow client to initiate dispute within 48 hours', async () => {
      const response = await request(app)
        .post('/api/disputes/create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contractId: 'test_contract_id',
          milestoneId: 'test_milestone_id',
          disputeType: 'quality_issue',
          description: 'Work does not meet agreed specifications',
          evidence: [
            {
              type: 'document',
              url: 'https://example.com/evidence.pdf',
              description: 'Original requirements document'
            }
          ]
        });

      expect(response.status).to.equal(201);
      expect(response.body.disputeId).to.exist;
      expect(response.body.status).to.equal('open');
      disputeId = response.body.disputeId;
    });

    it('should prevent dispute initiation after 48-hour window', async () => {
      const response = await request(app)
        .post('/api/disputes/create')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          contractId: 'old_contract_id',
          milestoneId: 'old_milestone_id', // Approved > 48 hours ago
          disputeType: 'quality_issue',
          description: 'Late dispute attempt'
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('dispute window expired');
    });

    it('should freeze payment immediately upon dispute', async () => {
      const paymentResponse = await request(app)
        .get(`/api/payments/status/${milestoneId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(paymentResponse.body.status).to.equal('frozen');
      expect(paymentResponse.body.disputeId).to.equal(disputeId);
    });
  });

  describe('Freelancer Response', () => {
    it('should notify freelancer of dispute', async () => {
      const notificationResponse = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${freelancerToken}`);

      const disputeNotification = notificationResponse.body.find(
        n => n.type === 'dispute_initiated'
      );
      
      expect(disputeNotification).to.exist;
      expect(disputeNotification.disputeId).to.equal(disputeId);
    });

    it('should allow freelancer to respond to dispute', async () => {
      const response = await request(app)
        .post(`/api/disputes/${disputeId}/respond`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          response: 'Work was completed according to specifications',
          evidence: [
            {
              type: 'screenshot',
              url: 'https://example.com/completed-work.png',
              description: 'Screenshots of completed deliverables'
            }
          ],
          proposedResolution: 'full_payment'
        });

      expect(response.status).to.equal(200);
      expect(response.body.responseSubmitted).to.be.true;
    });

    it('should allow freelancer to propose partial resolution', async () => {
      const response = await request(app)
        .post(`/api/disputes/${disputeId}/propose-resolution`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          resolutionType: 'partial_refund',
          refundAmount: 500,
          completionAmount: 2000,
          reasoning: 'Minor revisions needed, majority of work completed'
        });

      expect(response.status).to.equal(200);
      expect(response.body.proposalSubmitted).to.be.true;
    });
  });

  describe('Automated Resolution Attempts', () => {
    it('should attempt automated resolution for minor disputes', async () => {
      const response = await request(app)
        .post('/api/disputes/auto-resolve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          disputeId: disputeId
        });

      expect(response.status).to.equal(200);
      expect(response.body.autoResolutionAttempted).to.be.true;
    });

    it('should suggest mediation for complex disputes', async () => {
      const response = await request(app)
        .get(`/api/disputes/${disputeId}/resolution-options`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.body.options).to.include('mediation');
      expect(response.body.options).to.include('admin_review');
      expect(response.body.estimatedTimeframes).to.exist;
    });
  });

  describe('Admin Resolution', () => {
    it('should allow admin to review dispute details', async () => {
      const response = await request(app)
        .get(`/api/admin/disputes/${disputeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.clientClaim).to.exist;
      expect(response.body.freelancerResponse).to.exist;
      expect(response.body.evidence).to.be.an('array');
    });

    it('should allow admin to make resolution decision', async () => {
      const response = await request(app)
        .post(`/api/admin/disputes/${disputeId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'partial_client_favor',
          refundAmount: 750,
          freelancerAmount: 1750,
          reasoning: 'Work partially completed but requires minor revisions',
          adminNotes: 'Client expectations were higher than communicated requirements'
        });

      expect(response.status).to.equal(200);
      expect(response.body.resolved).to.be.true;
      expect(response.body.refundProcessed).to.be.true;
    });

    it('should process payment according to resolution', async () => {
      const paymentResponse = await request(app)
        .get(`/api/payments/status/${milestoneId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(paymentResponse.body.status).to.equal('partially_refunded');
      expect(paymentResponse.body.refundAmount).to.equal('750');
      expect(paymentResponse.body.freelancerAmount).to.equal('1750');
    });
  });

  describe('Appeal Process', () => {
    it('should allow party to appeal admin decision', async () => {
      const response = await request(app)
        .post(`/api/disputes/${disputeId}/appeal`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          appealReason: 'decision_unfair',
          additionalEvidence: [
            {
              type: 'communication',
              url: 'https://example.com/client-approval.pdf',
              description: 'Email chain showing client approval of work'
            }
          ],
          requestedOutcome: 'full_payment'
        });

      expect(response.status).to.equal(201);
      expect(response.body.appealId).to.exist;
      expect(response.body.status).to.equal('appeal_pending');
    });

    it('should limit number of appeals per dispute', async () => {
      const response = await request(app)
        .post(`/api/disputes/${disputeId}/appeal`)
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send({
          appealReason: 'second_appeal_attempt'
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('maximum appeals exceeded');
    });
  });

  describe('Compliance and Documentation', () => {
    it('should maintain complete dispute audit trail', async () => {
      const auditResponse = await request(app)
        .get(`/api/audit/dispute-events/${disputeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(auditResponse.body.events).to.be.an('array');
      expect(auditResponse.body.events.length).to.be.at.least(5);
      
      const requiredEvents = ['dispute_created', 'freelancer_responded', 'admin_resolved'];
      requiredEvents.forEach(eventType => {
        const event = auditResponse.body.events.find(e => e.eventType === eventType);
        expect(event).to.exist;
      });
    });

    it('should generate dispute resolution report', async () => {
      const reportResponse = await request(app)
        .get(`/api/disputes/${disputeId}/report`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(reportResponse.status).to.equal(200);
      expect(reportResponse.body.disputeSummary).to.exist;
      expect(reportResponse.body.timeline).to.be.an('array');
      expect(reportResponse.body.financialImpact).to.exist;
    });

    it('should track dispute metrics for platform improvement', async () => {
      const metricsResponse = await request(app)
        .get('/api/admin/dispute-metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          period: 'last_30_days'
        });

      expect(metricsResponse.body.totalDisputes).to.be.a('number');
      expect(metricsResponse.body.resolutionRate).to.be.a('number');
      expect(metricsResponse.body.averageResolutionTime).to.be.a('number');
      expect(metricsResponse.body.commonDisputeTypes).to.be.an('array');
    });
  });

  describe('Prevention and Learning', () => {
    it('should flag contracts with high dispute risk', async () => {
      const riskResponse = await request(app)
        .get('/api/contracts/dispute-risk-analysis')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          contractId: 'test_contract_id'
        });

      expect(riskResponse.body.riskScore).to.be.a('number');
      expect(riskResponse.body.riskFactors).to.be.an('array');
      expect(riskResponse.body.recommendations).to.be.an('array');
    });

    it('should provide dispute prevention tips', async () => {
      const tipsResponse = await request(app)
        .get('/api/help/dispute-prevention')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(tipsResponse.body.tips).to.be.an('array');
      expect(tipsResponse.body.tips.length).to.be.at.least(5);
    });
  });
});