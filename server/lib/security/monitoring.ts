import { storage } from '../../storage';
import crypto from 'crypto';

interface SecurityEvent {
  id?: string;
  userId: string;
  eventType: '2fa_failed' | '2fa_success' | 'new_device' | 'unusual_payment' | 'recovery_code_used' | 'geographic_anomaly';
  method?: 'email' | 'sms' | 'authenticator' | 'backup_code';
  success: boolean;
  ipAddress?: string;
  deviceFingerprint?: string;
  userAgent?: string;
  amount?: number;
  milestoneId?: string;
  location?: string;
  riskScore: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface SecurityAlert {
  userId: string;
  alertType: 'failed_attempts' | 'new_device' | 'unusual_pattern' | 'geographic_anomaly' | 'high_risk_transaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: Record<string, any>;
}

interface SecurityMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  uniqueDevices: number;
  riskEvents: number;
  averageRiskScore: number;
}

/**
 * Log security events with comprehensive tracking
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    // Store in activities table with enhanced details
    await storage.createActivity({
      contractId: event.milestoneId || 'security-monitoring',
      action: `security_${event.eventType}`,
      actorEmail: `user_${event.userId}`,
      details: JSON.stringify({
        eventType: event.eventType,
        method: event.method,
        success: event.success,
        ipAddress: event.ipAddress,
        deviceFingerprint: event.deviceFingerprint,
        userAgent: event.userAgent,
        amount: event.amount,
        location: event.location,
        riskScore: event.riskScore,
        metadata: event.metadata,
        timestamp: event.createdAt
      })
    });

    // Check for suspicious patterns and trigger alerts
    await checkSecurityPatterns(event);

  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

/**
 * Analyze security patterns and trigger alerts
 */
async function checkSecurityPatterns(event: SecurityEvent): Promise<void> {
  try {
    const userId = event.userId;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get recent security events for this user
    const recentEvents = await getSecurityEvents(userId, oneHourAgo);
    const dailyEvents = await getSecurityEvents(userId, oneDayAgo);

    // Check for failed attempt patterns
    const recentFailures = recentEvents.filter(e => !e.success && e.eventType === '2fa_failed');
    if (recentFailures.length >= 3) {
      await triggerSecurityAlert({
        userId,
        alertType: 'failed_attempts',
        severity: 'high',
        message: `${recentFailures.length} failed 2FA attempts in the last hour`,
        metadata: {
          attempts: recentFailures.length,
          timeWindow: '1 hour',
          lastAttempt: recentFailures[0]?.createdAt
        }
      });
    }

    // Check for new device usage
    if (event.deviceFingerprint && event.success) {
      const knownDevices = await getKnownDevices(userId);
      if (!knownDevices.includes(event.deviceFingerprint)) {
        await triggerSecurityAlert({
          userId,
          alertType: 'new_device',
          severity: 'medium',
          message: 'Payment approved from a new device',
          metadata: {
            deviceFingerprint: event.deviceFingerprint.substring(0, 16) + '...',
            amount: event.amount,
            location: event.location
          }
        });
      }
    }

    // Check for unusual payment patterns
    if (event.amount && event.success) {
      const avgAmount = await getAveragePaymentAmount(userId);
      if (event.amount > avgAmount * 5 && avgAmount > 0) {
        await triggerSecurityAlert({
          userId,
          alertType: 'unusual_pattern',
          severity: 'medium',
          message: 'Payment amount significantly higher than usual',
          metadata: {
            amount: event.amount,
            averageAmount: avgAmount,
            multiplier: Math.round((event.amount / avgAmount) * 10) / 10
          }
        });
      }
    }

    // Check for geographic anomalies (simplified)
    if (event.location && event.success) {
      const recentLocations = dailyEvents
        .filter(e => e.location && e.success)
        .map(e => e.location)
        .slice(0, 10);

      if (recentLocations.length > 0 && !recentLocations.includes(event.location)) {
        await triggerSecurityAlert({
          userId,
          alertType: 'geographic_anomaly',
          severity: 'medium',
          message: 'Payment from unusual geographic location',
          metadata: {
            newLocation: event.location,
            recentLocations: recentLocations.slice(0, 3)
          }
        });
      }
    }

    // Check for high-risk transactions
    if (event.riskScore >= 8) {
      await triggerSecurityAlert({
        userId,
        alertType: 'high_risk_transaction',
        severity: 'critical',
        message: 'High-risk transaction detected',
        metadata: {
          riskScore: event.riskScore,
          amount: event.amount,
          triggers: event.metadata?.riskTriggers || []
        }
      });
    }

  } catch (error) {
    console.error('Error checking security patterns:', error);
  }
}

/**
 * Trigger security alert and send notification
 */
async function triggerSecurityAlert(alert: SecurityAlert): Promise<void> {
  try {
    // Store alert in database
    await storage.createActivity({
      contractId: 'security-alerts',
      action: `alert_${alert.alertType}`,
      actorEmail: `user_${alert.userId}`,
      details: JSON.stringify({
        alertType: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        metadata: alert.metadata,
        timestamp: new Date().toISOString()
      })
    });

    // Send email notification
    const user = await storage.getUser(parseInt(alert.userId));
    if (user?.email) {
      await sendSecurityAlert(user.email, alert);
    }

    // Log for admin monitoring
    console.warn(`Security Alert [${alert.severity.toUpperCase()}]: ${alert.message} for user ${alert.userId}`);

  } catch (error) {
    console.error('Error triggering security alert:', error);
  }
}

/**
 * Send security alert email
 */
async function sendSecurityAlert(email: string, alert: SecurityAlert): Promise<void> {
  try {
    const { EmailService } = await import('../../email-service');
    const emailService = EmailService.getInstance();

    const subject = getAlertSubject(alert);
    const body = getAlertBody(alert);

    // Use existing email template for security alerts
    await emailService.sendPaymentPending({
      clientName: 'Security Team',
      clientEmail: email,
      contractTitle: 'Security Alert',
      milestoneTitle: alert.message,
      amount: alert.metadata.amount ? `$${(alert.metadata.amount / 100).toFixed(2)}` : 'N/A',
      paymentMethod: 'Security Notification',
      contractId: 'security-alert',
      milestoneId: Date.now().toString(),
      chargeDate: 'Immediate Review Required',
      timeRemaining: `Alert Type: ${alert.alertType} | Severity: ${alert.severity.toUpperCase()}`
    });

  } catch (error) {
    console.error('Error sending security alert email:', error);
  }
}

/**
 * Calculate risk score for a transaction
 */
export function calculateRiskScore(context: {
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

/**
 * Get security events for a user within a time period
 */
async function getSecurityEvents(userId: string, since: Date): Promise<SecurityEvent[]> {
  try {
    const activities = await storage.getActivitiesByContract('security-monitoring') || [];
    
    return activities
      .filter(activity => {
        if (!activity.action.startsWith('security_') || activity.actorEmail !== `user_${userId}`) {
          return false;
        }
        const createdAt = new Date(activity.createdAt || '');
        return createdAt >= since;
      })
      .map(activity => {
        try {
          const details = typeof activity.details === 'string' ? 
            JSON.parse(activity.details) : activity.details;
          return {
            id: activity.id,
            userId,
            eventType: details.eventType,
            method: details.method,
            success: details.success,
            ipAddress: details.ipAddress,
            deviceFingerprint: details.deviceFingerprint,
            userAgent: details.userAgent,
            amount: details.amount,
            milestoneId: details.milestoneId,
            location: details.location,
            riskScore: details.riskScore,
            createdAt: details.timestamp,
            metadata: details.metadata
          };
        } catch {
          return null;
        }
      })
      .filter((event): event is SecurityEvent => event !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error('Error getting security events:', error);
    return [];
  }
}

/**
 * Get known devices for a user
 */
async function getKnownDevices(userId: string): Promise<string[]> {
  try {
    const activities = await storage.getActivitiesByContract('trusted-devices') || [];
    
    return activities
      .filter(activity => 
        activity.action === 'device_trusted' && 
        activity.actorEmail === `user_${userId}`
      )
      .map(activity => {
        try {
          const details = typeof activity.details === 'string' ? 
            JSON.parse(activity.details) : activity.details;
          return details.deviceId;
        } catch {
          return null;
        }
      })
      .filter((deviceId): deviceId is string => deviceId !== null);

  } catch (error) {
    console.error('Error getting known devices:', error);
    return [];
  }
}

/**
 * Get average payment amount for a user
 */
async function getAveragePaymentAmount(userId: string): Promise<number> {
  try {
    // This would query actual payment records in a real implementation
    // For now, return a placeholder average
    return 15000; // $150 average
  } catch {
    return 0;
  }
}

/**
 * Get security metrics for admin dashboard
 */
export async function getSecurityMetrics(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<SecurityMetrics> {
  try {
    const now = new Date();
    const timeAgo = new Date();
    
    switch (timeframe) {
      case 'week':
        timeAgo.setDate(now.getDate() - 7);
        break;
      case 'month':
        timeAgo.setDate(now.getDate() - 30);
        break;
      default:
        timeAgo.setDate(now.getDate() - 1);
    }

    const activities = await storage.getActivitiesByContract('security-monitoring') || [];
    const relevantEvents = activities.filter(activity => {
      if (!activity.action.startsWith('security_')) return false;
      const createdAt = new Date(activity.createdAt || '');
      return createdAt >= timeAgo;
    });

    const totalAttempts = relevantEvents.length;
    const successfulAttempts = relevantEvents.filter(activity => {
      try {
        const details = typeof activity.details === 'string' ? 
          JSON.parse(activity.details) : activity.details;
        return details.success === true;
      } catch {
        return false;
      }
    }).length;

    const failedAttempts = totalAttempts - successfulAttempts;
    
    const uniqueDevices = new Set(
      relevantEvents.map(activity => {
        try {
          const details = typeof activity.details === 'string' ? 
            JSON.parse(activity.details) : activity.details;
          return details.deviceFingerprint;
        } catch {
          return null;
        }
      }).filter(Boolean)
    ).size;

    const riskEvents = relevantEvents.filter(activity => {
      try {
        const details = typeof activity.details === 'string' ? 
          JSON.parse(activity.details) : activity.details;
        return (details.riskScore || 0) >= 7;
      } catch {
        return false;
      }
    }).length;

    const riskScores = relevantEvents.map(activity => {
      try {
        const details = typeof activity.details === 'string' ? 
          JSON.parse(activity.details) : activity.details;
        return details.riskScore || 0;
      } catch {
        return 0;
      }
    }).filter(score => score > 0);

    const averageRiskScore = riskScores.length > 0 ? 
      riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length : 0;

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      uniqueDevices,
      riskEvents,
      averageRiskScore: Math.round(averageRiskScore * 100) / 100
    };

  } catch (error) {
    console.error('Error getting security metrics:', error);
    return {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      uniqueDevices: 0,
      riskEvents: 0,
      averageRiskScore: 0
    };
  }
}

/**
 * Get security alerts for admin dashboard
 */
export async function getSecurityAlerts(limit = 50): Promise<Array<{
  id: string;
  userId: string;
  alertType: string;
  severity: string;
  message: string;
  metadata: any;
  createdAt: string;
}>> {
  try {
    const activities = await storage.getActivitiesByContract('security-alerts') || [];
    
    return activities
      .filter(activity => activity.action.startsWith('alert_'))
      .slice(0, limit)
      .map(activity => {
        try {
          const details = typeof activity.details === 'string' ? 
            JSON.parse(activity.details) : activity.details;
          return {
            id: activity.id,
            userId: activity.actorEmail.replace('user_', ''),
            alertType: details.alertType,
            severity: details.severity,
            message: details.message,
            metadata: details.metadata,
            createdAt: details.timestamp
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error('Error getting security alerts:', error);
    return [];
  }
}

// Helper functions for alert formatting
function getAlertSubject(alert: SecurityAlert): string {
  switch (alert.alertType) {
    case 'failed_attempts':
      return 'Security Alert: Multiple Failed Login Attempts';
    case 'new_device':
      return 'Security Alert: New Device Payment';
    case 'unusual_pattern':
      return 'Security Alert: Unusual Payment Pattern';
    case 'geographic_anomaly':
      return 'Security Alert: Payment from New Location';
    case 'high_risk_transaction':
      return 'Critical Security Alert: High-Risk Transaction';
    default:
      return 'Security Alert: Account Activity';
  }
}

function getAlertBody(alert: SecurityAlert): string {
  let body = `${alert.message}\n\n`;
  
  if (alert.metadata.amount) {
    body += `Amount: $${(alert.metadata.amount / 100).toFixed(2)}\n`;
  }
  
  if (alert.metadata.location) {
    body += `Location: ${alert.metadata.location}\n`;
  }
  
  if (alert.metadata.riskScore) {
    body += `Risk Score: ${alert.metadata.riskScore}/10\n`;
  }
  
  body += '\nIf this was not you, please contact support immediately.\n';
  body += 'Review your account activity at: /dashboard/payment-methods';
  
  return body;
}

export { SecurityEvent, SecurityAlert, SecurityMetrics };