import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { storage } from '../../storage';
import type { Activity } from '../../../shared/schema';

interface PaymentOTP {
  id: string;
  userId: string;
  code: string;
  amount: number;
  milestoneId: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

interface SecurityEvent {
  type: 'payment_2fa_success' | 'payment_2fa_failed' | 'payment_2fa_generated' | 'account_locked';
  userId: string;
  milestoneId?: string;
  amount?: number;
  error?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generate and send OTP for payment approval
 */
export async function sendPaymentOTP(userId: string, milestoneId: string, amount: number): Promise<{ sent: boolean; expiresAt: string; otpId: string }> {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const hashedOTP = await bcrypt.hash(otp, 10);

  // Store OTP in database (using activities table as temporary storage)
  const otpRecord = await storage.createActivity({
    contractId: milestoneId, // Using contractId field for milestoneId
    action: 'payment_otp_generated',
    actorEmail: `user_${userId}`,
    details: JSON.stringify({
      hashedCode: hashedOTP,
      amount,
      expiresAt: expiresAt.toISOString(),
      used: false
    })
  });

  // Get user info for email
  const user = await storage.getUser(parseInt(userId));
  if (!user) {
    throw new Error('User not found');
  }

  // Send email with OTP
  try {
    const { EmailService } = await import('../../email-service');
    const emailService = EmailService.getInstance();
    
    // Use the payment pending template for OTP delivery
    await emailService.sendPaymentPending({
      clientName: user.username,
      clientEmail: user.email,
      contractTitle: 'Payment Security Verification',
      milestoneTitle: '2FA Verification Code',
      amount: `$${(amount / 100).toFixed(2)}`,
      paymentMethod: 'Security Code',
      contractId: milestoneId,
      milestoneId: otpRecord.id,
      chargeDate: 'Verification Required',
      timeRemaining: `Code: ${otp} (expires in 10 minutes)`
    });

    // Log security event
    await logSecurityEvent({
      type: 'payment_2fa_generated',
      userId,
      milestoneId,
      amount,
      timestamp: new Date().toISOString()
    });

    return {
      sent: true,
      expiresAt: expiresAt.toISOString(),
      otpId: otpRecord.id
    };

  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error('Failed to send verification code');
  }
}

/**
 * Verify OTP for payment approval
 */
export async function verifyPaymentOTP(userId: string, milestoneId: string, otpCode: string): Promise<{ valid: boolean; otpId?: string }> {
  try {
    // Get recent OTP records for this user and milestone
    const activities = await storage.getActivitiesByContract(milestoneId) || [];
    
    // Find the most recent unused OTP for this user
    const otpRecord = activities
      .filter(activity => {
        if (activity.action !== 'payment_otp_generated' || activity.actorEmail !== `user_${userId}`) {
          return false;
        }
        try {
          const details = typeof activity.details === 'string' ? JSON.parse(activity.details) : activity.details;
          return details.used === false;
        } catch {
          return false;
        }
      })
      .sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())[0];

    if (!otpRecord) {
      await logSecurityEvent({
        type: 'payment_2fa_failed',
        userId,
        milestoneId,
        error: 'No valid OTP found',
        timestamp: new Date().toISOString()
      });
      return { valid: false };
    }

    // Parse OTP details
    const otpDetails = typeof otpRecord.details === 'string' ? JSON.parse(otpRecord.details) : otpRecord.details;

    // Check if OTP has expired
    const expiresAt = new Date(otpDetails.expiresAt);
    if (new Date() > expiresAt) {
      await logSecurityEvent({
        type: 'payment_2fa_failed',
        userId,
        milestoneId,
        error: 'OTP expired',
        timestamp: new Date().toISOString()
      });
      return { valid: false };
    }

    // Verify OTP code
    const isValid = await bcrypt.compare(otpCode, otpDetails.hashedCode);
    
    if (isValid) {
      // Mark OTP as used
      await storage.createActivity({
        contractId: milestoneId,
        action: 'payment_otp_used',
        actorEmail: `user_${userId}`,
        details: JSON.stringify({
          otpId: otpRecord.id,
          usedAt: new Date().toISOString()
        })
      });

      await logSecurityEvent({
        type: 'payment_2fa_success',
        userId,
        milestoneId,
        timestamp: new Date().toISOString()
      });

      return { valid: true, otpId: otpRecord.id };
    } else {
      await logSecurityEvent({
        type: 'payment_2fa_failed',
        userId,
        milestoneId,
        error: 'Invalid OTP code',
        timestamp: new Date().toISOString()
      });

      return { valid: false };
    }

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    await logSecurityEvent({
      type: 'payment_2fa_failed',
      userId,
      milestoneId,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return { valid: false };
  }
}

/**
 * Check if user has 2FA enabled and required for this payment
 */
export async function is2FARequired(userId: string, amount: number): Promise<boolean> {
  try {
    const user = await storage.getUser(parseInt(userId));
    if (!user) return false;

    // For now, require 2FA for all payments over $100
    // This could be made configurable per user in the future
    const threshold = 10000; // $100 in cents
    
    return amount >= threshold;
  } catch (error: any) {
    console.error('Error checking 2FA requirement:', error);
    return true; // Default to requiring 2FA on error
  }
}

/**
 * Generate device fingerprint for trusted device feature
 */
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  const fingerprint = `${userAgent}-${ip}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Log security events
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    await storage.createActivity({
      contractId: event.milestoneId || 'security-event',
      action: `security_${event.type}`,
      actorEmail: `user_${event.userId}`,
      details: JSON.stringify({
        ...event,
        timestamp: event.timestamp
      })
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(private windowMs: number = 15 * 60 * 1000, private max: number = 5) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (attempt.count >= this.max) {
      return false;
    }

    attempt.count++;
    return true;
  }

  getRemainingAttempts(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt || Date.now() > attempt.resetTime) {
      return this.max;
    }
    return Math.max(0, this.max - attempt.count);
  }
}

export const otpRateLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes