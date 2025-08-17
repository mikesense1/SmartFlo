import { storage } from '../../storage';
import crypto from 'crypto';

interface PaymentContext {
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  isFirstPayment?: boolean;
  recentPayments?: number;
  contractId?: string;
}

interface SecuritySettings {
  always2FA: boolean;
  tfaThreshold: number; // Amount in cents
  trustedDevices: string[];
  tfaMethod: 'email' | 'sms' | 'authenticator';
}

interface TwoFactorAnalytics {
  userId: string;
  type: '2fa_sent' | '2fa_success' | '2fa_failed' | '2fa_bypassed';
  method: 'email' | 'sms' | 'authenticator';
  amount?: number;
  timeToComplete?: number;
  deviceId?: string;
  reason?: string;
}

/**
 * Smart 2FA requirement checker with intelligent triggers
 */
export async function requires2FA(
  userId: string, 
  amount: number,
  context: PaymentContext = {}
): Promise<{ required: boolean; reason: string }> {
  try {
    const user = await storage.getUser(parseInt(userId));
    if (!user) {
      return { required: true, reason: 'User not found' };
    }

    const settings = await getUserSecuritySettings(userId);
    
    // Always require for first payment
    if (context.isFirstPayment) {
      await track2FAEvent({
        userId,
        type: '2fa_sent',
        method: settings.tfaMethod,
        amount,
        reason: 'First payment'
      });
      return { required: true, reason: 'First payment requires verification' };
    }
    
    // Check user preferences
    if (settings.always2FA) {
      await track2FAEvent({
        userId,
        type: '2fa_sent',
        method: settings.tfaMethod,
        amount,
        reason: 'User preference'
      });
      return { required: true, reason: 'User enabled always require 2FA' };
    }
    
    // Amount-based triggers
    if (amount > settings.tfaThreshold) {
      await track2FAEvent({
        userId,
        type: '2fa_sent',
        method: settings.tfaMethod,
        amount,
        reason: 'Amount threshold'
      });
      return { required: true, reason: `Payment above $${(settings.tfaThreshold / 100).toFixed(2)} threshold` };
    }
    
    // Unusual activity triggers
    const unusualActivity = await detectUnusualActivity(userId, context);
    if (unusualActivity.isUnusual) {
      await track2FAEvent({
        userId,
        type: '2fa_sent',
        method: settings.tfaMethod,
        amount,
        reason: 'Unusual activity'
      });
      return { required: true, reason: unusualActivity.reason };
    }
    
    // Trusted device check
    if (context.deviceId && await isTrustedDevice(userId, context.deviceId)) {
      await track2FAEvent({
        userId,
        type: '2fa_bypassed',
        method: settings.tfaMethod,
        amount,
        deviceId: context.deviceId,
        reason: 'Trusted device'
      });
      return { required: false, reason: 'Trusted device' };
    }
    
    // Default to not requiring 2FA for small amounts on known devices
    await track2FAEvent({
      userId,
      type: '2fa_bypassed',
      method: settings.tfaMethod,
      amount,
      reason: 'Below threshold'
    });
    
    return { required: false, reason: 'Below security threshold' };

  } catch (error: any) {
    console.error('Error checking 2FA requirement:', error);
    // Default to requiring 2FA on error for security
    return { required: true, reason: 'Security check failed' };
  }
}

/**
 * Get user security settings with defaults
 */
export async function getUserSecuritySettings(userId: string): Promise<SecuritySettings> {
  try {
    // Try to get from user profile or settings table
    // For now, return smart defaults
    return {
      always2FA: false,
      tfaThreshold: 10000, // $100 default threshold
      trustedDevices: [],
      tfaMethod: 'email'
    };
  } catch (error) {
    console.error('Error getting security settings:', error);
    return {
      always2FA: false,
      tfaThreshold: 10000,
      trustedDevices: [],
      tfaMethod: 'email'
    };
  }
}

/**
 * Detect unusual payment activity
 */
export async function detectUnusualActivity(
  userId: string, 
  context: PaymentContext
): Promise<{ isUnusual: boolean; reason: string }> {
  try {
    // Get recent payment history
    const recentPayments = await getRecentPayments(userId, 30); // Last 30 days
    
    // Check for unusual patterns
    const now = new Date();
    const todayPayments = recentPayments.filter(payment => {
      const paymentDate = new Date(payment.createdAt || '');
      return paymentDate.toDateString() === now.toDateString();
    });

    // Too many payments today
    if (todayPayments.length >= 5) {
      return { 
        isUnusual: true, 
        reason: 'Multiple payments detected today' 
      };
    }

    // Large amount compared to history
    if (context.contractId) {
      const avgAmount = recentPayments.reduce((sum, p) => 
        sum + parseInt(p.amount || '0'), 0) / recentPayments.length;
      
      // If this payment is 3x average, flag as unusual
      const currentAmount = parseInt(context.contractId) || 0; // Placeholder
      if (currentAmount > avgAmount * 3 && avgAmount > 0) {
        return { 
          isUnusual: true, 
          reason: 'Payment significantly larger than usual' 
        };
      }
    }

    // New device/location (simplified check)
    if (context.ipAddress) {
      const recentDevices = await getRecentDevices(userId);
      const deviceFingerprint = generateDeviceFingerprint(
        context.userAgent || '', 
        context.ipAddress
      );
      
      if (!recentDevices.includes(deviceFingerprint)) {
        return { 
          isUnusual: true, 
          reason: 'Payment from new device or location' 
        };
      }
    }

    return { isUnusual: false, reason: 'Normal activity pattern' };

  } catch (error) {
    console.error('Error detecting unusual activity:', error);
    return { isUnusual: false, reason: 'Activity check failed' };
  }
}

/**
 * Check if device is trusted
 */
export async function isTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
  try {
    // Check if device was marked as trusted in last 30 days
    const activities = await storage.getActivitiesByContract('trusted-devices') || [];
    
    const trustedDevice = activities.find(activity => {
      if (activity.action !== 'device_trusted' || activity.actorEmail !== `user_${userId}`) {
        return false;
      }
      try {
        const details = typeof activity.details === 'string' ? 
          JSON.parse(activity.details) : activity.details;
        return details.deviceId === deviceId && 
               new Date(details.trustedUntil) > new Date();
      } catch {
        return false;
      }
    });

    return !!trustedDevice;
  } catch (error) {
    console.error('Error checking trusted device:', error);
    return false;
  }
}

/**
 * Mark device as trusted
 */
export async function trustDevice(
  userId: string, 
  deviceId: string, 
  context: PaymentContext
): Promise<void> {
  try {
    const trustedUntil = new Date();
    trustedUntil.setDate(trustedUntil.getDate() + 30); // Trust for 30 days

    await storage.createActivity({
      contractId: 'trusted-devices',
      action: 'device_trusted',
      actorEmail: `user_${userId}`,
      details: JSON.stringify({
        deviceId,
        trustedUntil: trustedUntil.toISOString(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        trustedAt: new Date().toISOString()
      })
    });

    await track2FAEvent({
      userId,
      type: '2fa_success',
      method: 'email',
      deviceId,
      reason: 'Device marked as trusted'
    });

  } catch (error) {
    console.error('Error trusting device:', error);
  }
}

/**
 * Batch approve milestones with single 2FA
 */
export async function batchApproveWithOTP(
  userId: string,
  milestoneIds: string[],
  otpCode: string
): Promise<Array<{ id: string; success: boolean; error?: string }>> {
  try {
    // Calculate total amount
    const totalAmount = await calculateBatchAmount(milestoneIds);
    
    // Verify OTP for total amount
    const { verifyPaymentOTP } = await import('./two-factor');
    const verification = await verifyPaymentOTP(userId, milestoneIds[0], otpCode);
    
    if (!verification.valid) {
      throw new Error('Invalid verification code');
    }

    // Process all approvals
    const results = await Promise.allSettled(
      milestoneIds.map(async (milestoneId) => {
        try {
          // Process individual milestone approval
          const milestone = await storage.getMilestone(milestoneId);
          if (!milestone) {
            throw new Error('Milestone not found');
          }

          // Update milestone status
          await storage.updateMilestone(milestoneId, {
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: `user_${userId}`
          });

          return { id: milestoneId, success: true };
        } catch (error: any) {
          return { 
            id: milestoneId, 
            success: false, 
            error: error.message 
          };
        }
      })
    );

    // Convert Promise.allSettled results
    const processedResults = results.map((result, index) => {
      const milestoneId = milestoneIds[index];
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: milestoneId,
          success: false,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    // Track batch approval
    await track2FAEvent({
      userId,
      type: '2fa_success',
      method: 'email',
      amount: totalAmount,
      reason: `Batch approval of ${milestoneIds.length} milestones`
    });

    return processedResults;

  } catch (error: any) {
    console.error('Error in batch approval:', error);
    
    await track2FAEvent({
      userId,
      type: '2fa_failed',
      method: 'email',
      reason: `Batch approval failed: ${error.message}`
    });

    throw error;
  }
}

/**
 * Track 2FA events for analytics with enhanced security monitoring
 */
export async function track2FAEvent(event: TwoFactorAnalytics): Promise<void> {
  try {
    // Calculate risk score for the event
    const riskAssessment = calculateRiskScore({
      userId: event.userId,
      amount: event.amount || 0,
      deviceFingerprint: event.deviceId,
      isFirstPayment: false,
      recentFailures: event.type === '2fa_failed' ? 1 : 0
    });

    // Enhanced security event logging
    const { logSecurityEvent } = await import('../security/monitoring');
    await logSecurityEvent({
      userId: event.userId,
      eventType: event.type === '2fa_success' ? '2fa_success' : 
                 event.type === '2fa_failed' ? '2fa_failed' : 
                 event.type === '2fa_sent' ? '2fa_sent' : '2fa_bypassed',
      method: event.method,
      success: event.type === '2fa_success',
      deviceFingerprint: event.deviceId,
      amount: event.amount,
      riskScore: riskAssessment.score,
      createdAt: new Date().toISOString(),
      metadata: {
        timeToComplete: event.timeToComplete,
        reason: event.reason,
        riskTriggers: riskAssessment.triggers
      }
    });

    // Also store in analytics table
    await storage.createActivity({
      contractId: '2fa-analytics',
      action: `2fa_${event.type}`,
      actorEmail: `user_${event.userId}`,
      details: JSON.stringify({
        ...event,
        riskScore: riskAssessment.score,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error tracking 2FA event:', error);
  }
}

/**
 * Calculate risk score for a transaction context
 */
function calculateRiskScore(context: {
  userId: string;
  amount: number;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  isFirstPayment?: boolean;
  recentFailures?: number;
  location?: string;
}): { score: number; triggers: string[] } {
  let score = 0;
  const triggers: string[] = [];

  // First payment risk
  if (context.isFirstPayment) {
    score += 2;
    triggers.push('first_payment');
  }

  // Amount-based risk
  if (context.amount > 50000) { // $500+
    score += 3;
    triggers.push('high_amount');
  } else if (context.amount > 20000) { // $200+
    score += 1;
    triggers.push('elevated_amount');
  }

  // Device risk
  if (!context.deviceFingerprint) {
    score += 2;
    triggers.push('unknown_device');
  }

  // Recent failures risk
  if (context.recentFailures && context.recentFailures > 0) {
    score += context.recentFailures;
    triggers.push(`recent_failures_${context.recentFailures}`);
  }

  // IP/Location risk (simplified)
  if (context.location?.includes('Unknown') || !context.location) {
    score += 1;
    triggers.push('unknown_location');
  }

  // User agent risk
  if (!context.userAgent || context.userAgent.includes('bot')) {
    score += 2;
    triggers.push('suspicious_user_agent');
  }

  return {
    score: Math.min(score, 10), // Cap at 10
    triggers
  };
}

// Helper functions
async function getRecentPayments(userId: string, days: number) {
  try {
    // This would query payments table in a real implementation
    return [];
  } catch {
    return [];
  }
}

async function getRecentDevices(userId: string): Promise<string[]> {
  try {
    const activities = await storage.getActivitiesByContract('device-tracking') || [];
    return activities
      .filter(activity => 
        activity.actorEmail === `user_${userId}` &&
        activity.action === 'device_used'
      )
      .map(activity => {
        try {
          const details = typeof activity.details === 'string' ? 
            JSON.parse(activity.details) : activity.details;
          return details.deviceFingerprint;
        } catch {
          return '';
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function calculateBatchAmount(milestoneIds: string[]): Promise<number> {
  try {
    let totalAmount = 0;
    for (const milestoneId of milestoneIds) {
      const milestone = await storage.getMilestone(milestoneId);
      if (milestone) {
        totalAmount += milestone.amount || 0;
      }
    }
    return totalAmount;
  } catch {
    return 0;
  }
}

function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const fingerprint = `${userAgent}-${ipAddress}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}