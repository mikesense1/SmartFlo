import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '../../db';
import { paymentOTPs, users, milestones } from '@shared/schema';
import { eq, and, gte, lt } from 'drizzle-orm';

interface SendOTPOptions {
  userId: string;
  milestoneId: string;
  amount: number;
  ipAddress?: string;
  userAgent?: string;
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
export async function sendPaymentOTP(options: SendOTPOptions): Promise<{ sent: boolean; expiresAt: string; otpId: string }> {
  const { userId, milestoneId, amount, ipAddress, userAgent } = options;
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const hashedOTP = await bcrypt.hash(otp, 10);

  // Get user info for email
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new Error('User not found');
  }

  // Get milestone info
  const [milestone] = await db.select().from(milestones).where(eq(milestones.id, milestoneId)).limit(1);
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  // Store OTP in database
  const [otpRecord] = await db.insert(paymentOTPs).values({
    userId,
    milestoneId,
    code: hashedOTP,
    amount: amount.toString(),
    expiresAt,
    used: false,
    failedAttempts: "0",
    ipAddress,
    userAgent,
  }).returning();

  // Send email with OTP
  try {
    const { EmailService } = await import('../../email-service');
    const emailService = EmailService.getInstance();
    
    // Use the payment pending template for OTP delivery
    await emailService.sendPaymentPending({
      clientName: user.fullName,
      clientEmail: user.email,
      contractTitle: 'Payment Security Verification',
      milestoneTitle: milestone.title,
      amount: `$${(amount / 100).toFixed(2)}`,
      paymentMethod: 'Security Code',
      contractId: milestone.contractId,
      milestoneId: milestoneId,
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

    console.log(`[2FA] Generated OTP for ${user.email}: ${otp} (expires in 10 min)`);

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
export async function verifyPaymentOTP(userId: string, milestoneId: string, otpCode: string): Promise<{ valid: boolean; otpId?: string; error?: string }> {
  try {
    // Find the most recent unused OTP for this user and milestone
    const otpRecords = await db
      .select()
      .from(paymentOTPs)
      .where(and(
        eq(paymentOTPs.userId, userId),
        eq(paymentOTPs.milestoneId, milestoneId),
        eq(paymentOTPs.used, false),
        gte(paymentOTPs.expiresAt, new Date())
      ))
      .orderBy(paymentOTPs.createdAt)
      .limit(1);

    if (otpRecords.length === 0) {
      await logSecurityEvent({
        type: 'payment_2fa_failed',
        userId,
        milestoneId,
        error: 'No valid OTP found or OTP has expired',
        timestamp: new Date().toISOString()
      });
      return { valid: false, error: 'No valid OTP found or OTP has expired' };
    }

    const otpRecord = otpRecords[0];

    // Check if OTP has too many failed attempts
    const failedAttempts = parseInt(otpRecord.failedAttempts);
    if (failedAttempts >= 3) {
      await logSecurityEvent({
        type: 'payment_2fa_failed',
        userId,
        milestoneId,
        error: 'Too many failed attempts',
        timestamp: new Date().toISOString()
      });
      return { valid: false, error: 'Too many failed attempts. Please request a new code.' };
    }

    // Verify OTP code
    const isValid = await bcrypt.compare(otpCode, otpRecord.code);
    
    if (isValid) {
      // Mark OTP as used
      await db
        .update(paymentOTPs)
        .set({
          used: true,
          usedAt: new Date()
        })
        .where(eq(paymentOTPs.id, otpRecord.id));

      await logSecurityEvent({
        type: 'payment_2fa_success',
        userId,
        milestoneId,
        timestamp: new Date().toISOString()
      });

      return { valid: true, otpId: otpRecord.id };
    } else {
      // Increment failed attempts
      await db
        .update(paymentOTPs)
        .set({ failedAttempts: (failedAttempts + 1).toString() })
        .where(eq(paymentOTPs.id, otpRecord.id));

      await logSecurityEvent({
        type: 'payment_2fa_failed',
        userId,
        milestoneId,
        error: 'Invalid OTP code',
        timestamp: new Date().toISOString()
      });

      return { valid: false, error: 'Invalid code. Please try again.' };
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
    return { valid: false, error: 'Failed to verify OTP' };
  }
}

/**
 * Check if user has 2FA enabled and required for this payment
 */
export async function is2FARequired(userId: string, amount: number): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
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
    console.log('[Security Event]', event);
    // TODO: Integrate with proper security monitoring/logging system
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