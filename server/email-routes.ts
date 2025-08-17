import { Router } from 'express';
import { emailService } from './email-service';
import { requireAuth } from './auth';

const router = Router();

/**
 * Test email endpoint - requires authentication
 */
router.post('/test', requireAuth, async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const result = await emailService.sendTestEmail(email, name);
    
    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Test email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to send test email'
      });
    }
  } catch (error) {
    console.error('Email test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error'
    });
  }
});

/**
 * Send contract invitation - internal API
 */
router.post('/contract-invitation', requireAuth, async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      freelancerName,
      contractTitle,
      totalValue,
      contractId,
      paymentMethod
    } = req.body;

    // Validate required fields
    const requiredFields = {
      clientName,
      clientEmail,
      freelancerName,
      contractTitle,
      totalValue,
      contractId,
      paymentMethod
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    const result = await emailService.sendContractInvitation({
      clientName,
      clientEmail,
      freelancerName,
      contractTitle,
      totalValue,
      contractId,
      paymentMethod
    });

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Contract invitation sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to send contract invitation'
      });
    }
  } catch (error) {
    console.error('Contract invitation email error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error'
    });
  }
});

/**
 * Send payment authorized confirmation - internal API
 */
router.post('/payment-authorized', requireAuth, async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      contractTitle,
      paymentMethod,
      contractId,
      authorizationDate
    } = req.body;

    const result = await emailService.sendPaymentAuthorized({
      clientName,
      clientEmail,
      contractTitle,
      paymentMethod,
      contractId,
      authorizationDate: authorizationDate || new Date().toLocaleString()
    });

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Payment authorization email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to send payment authorization email'
      });
    }
  } catch (error) {
    console.error('Payment authorized email error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error'
    });
  }
});

/**
 * Send payment pending notice - internal API
 */
router.post('/payment-pending', requireAuth, async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      contractTitle,
      milestoneTitle,
      amount,
      paymentMethod,
      contractId,
      milestoneId,
      chargeDate,
      timeRemaining
    } = req.body;

    const result = await emailService.sendPaymentPending({
      clientName,
      clientEmail,
      contractTitle,
      milestoneTitle,
      amount,
      paymentMethod,
      contractId,
      milestoneId,
      chargeDate,
      timeRemaining
    });

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Payment pending email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to send payment pending email'
      });
    }
  } catch (error) {
    console.error('Payment pending email error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error'
    });
  }
});

/**
 * Send payment processed receipt - internal API
 */
router.post('/payment-processed', requireAuth, async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      contractTitle,
      milestoneTitle,
      amount,
      paymentMethod,
      transactionId,
      processedDate,
      contractId,
      milestoneId
    } = req.body;

    const result = await emailService.sendPaymentProcessed({
      clientName,
      clientEmail,
      contractTitle,
      milestoneTitle,
      amount,
      paymentMethod,
      transactionId,
      processedDate,
      contractId,
      milestoneId
    });

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Payment processed email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to send payment processed email'
      });
    }
  } catch (error) {
    console.error('Payment processed email error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error'
    });
  }
});

/**
 * Send authorization revoked confirmation - internal API
 */
router.post('/authorization-revoked', requireAuth, async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      contractTitle,
      revocationDate,
      contractId,
      remainingBalance,
      reason
    } = req.body;

    const result = await emailService.sendAuthorizationRevoked({
      clientName,
      clientEmail,
      contractTitle,
      revocationDate: revocationDate || new Date().toLocaleString(),
      contractId,
      remainingBalance,
      reason: reason || 'Requested by client'
    });

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Authorization revoked email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to send authorization revoked email'
      });
    }
  } catch (error) {
    console.error('Authorization revoked email error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Internal server error'
    });
  }
});

export default router;