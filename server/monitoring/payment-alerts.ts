/**
 * Payment Authorization Monitoring and Alerting System
 * Real-time monitoring for payment anomalies and security threats
 */

import { EventEmitter } from 'events';
import { db } from '../db';
import { 
  paymentAuthorizations, 
  payments, 
  users, 
  contracts,
  auditLogs 
} from '@shared/schema';
import { eq, and, gte, count, sql, desc } from 'drizzle-orm';

interface AlertConfig {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  threshold: number;
  timeWindow: number; // in minutes
  cooldown: number; // in minutes
}

interface AlertEvent {
  alertId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
  userId?: string;
  contractId?: string;
  ipAddress?: string;
}

class PaymentMonitoringService extends EventEmitter {
  private alertConfigs: AlertConfig[] = [
    {
      id: 'failed_auth_attempts',
      name: 'Failed Authorization Attempts',
      description: 'Multiple failed payment authorization attempts',
      severity: 'high',
      enabled: true,
      threshold: 3,
      timeWindow: 60, // 1 hour
      cooldown: 30 // 30 minutes
    },
    {
      id: 'unusual_payment_patterns',
      name: 'Unusual Payment Patterns',
      description: 'Unusual payment amounts or frequency detected',
      severity: 'medium',
      enabled: true,
      threshold: 5,
      timeWindow: 1440, // 24 hours
      cooldown: 60 // 1 hour
    },
    {
      id: 'high_value_authorizations',
      name: 'High Value Authorizations',
      description: 'Authorization requests above threshold amount',
      severity: 'medium',
      enabled: true,
      threshold: 10000, // $10,000
      timeWindow: 0, // Immediate
      cooldown: 0 // No cooldown
    },
    {
      id: 'multiple_failed_payments',
      name: 'Multiple Failed Payments',
      description: 'Multiple payment failures for the same user',
      severity: 'high',
      enabled: true,
      threshold: 3,
      timeWindow: 360, // 6 hours
      cooldown: 60 // 1 hour
    },
    {
      id: 'revocation_spikes',
      name: 'Authorization Revocation Spikes',
      description: 'Unusual increase in authorization revocations',
      severity: 'medium',
      enabled: true,
      threshold: 10,
      timeWindow: 1440, // 24 hours
      cooldown: 120 // 2 hours
    },
    {
      id: 'geographic_anomalies',
      name: 'Geographic Anomalies',
      description: 'Payment attempts from unusual locations',
      severity: 'medium',
      enabled: true,
      threshold: 1,
      timeWindow: 60, // 1 hour
      cooldown: 30 // 30 minutes
    },
    {
      id: 'velocity_abuse',
      name: 'Payment Velocity Abuse',
      description: 'Too many payment attempts in short time period',
      severity: 'high',
      enabled: true,
      threshold: 5,
      timeWindow: 15, // 15 minutes
      cooldown: 60 // 1 hour
    }
  ];

  private alertCooldowns: Map<string, Date> = new Map();

  constructor() {
    super();
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Monitor every 5 minutes
    setInterval(() => {
      this.runMonitoringChecks();
    }, 5 * 60 * 1000);

    console.log('Payment monitoring service started');
  }

  private async runMonitoringChecks(): Promise<void> {
    try {
      await Promise.all([
        this.checkFailedAuthorizationAttempts(),
        this.checkUnusualPaymentPatterns(),
        this.checkHighValueAuthorizations(),
        this.checkMultipleFailedPayments(),
        this.checkRevocationSpikes(),
        this.checkGeographicAnomalies(),
        this.checkVelocityAbuse()
      ]);
    } catch (error) {
      console.error('Error in monitoring checks:', error);
      await this.generateAlert({
        alertId: 'monitoring_system_error',
        severity: 'critical',
        title: 'Monitoring System Error',
        description: `Payment monitoring system encountered an error: ${error.message}`,
        metadata: { error: error.message, stack: error.stack },
        timestamp: new Date()
      });
    }
  }

  private async checkFailedAuthorizationAttempts(): Promise<void> {
    const config = this.alertConfigs.find(c => c.id === 'failed_auth_attempts');
    if (!config?.enabled || this.isInCooldown(config.id)) return;

    const cutoffTime = new Date(Date.now() - config.timeWindow * 60 * 1000);

    try {
      // Check for users with multiple failed authorization attempts
      const failedAttempts = await db
        .select({
          userId: auditLogs.userId,
          count: count(),
          userEmail: users.email,
          lastAttempt: sql<Date>`MAX(${auditLogs.timestamp})`
        })
        .from(auditLogs)
        .innerJoin(users, eq(auditLogs.userId, users.id))
        .where(and(
          eq(auditLogs.eventType, 'authorization_failed'),
          gte(auditLogs.timestamp, cutoffTime)
        ))
        .groupBy(auditLogs.userId, users.email)
        .having(sql`COUNT(*) >= ${config.threshold}`);

      for (const attempt of failedAttempts) {
        await this.generateAlert({
          alertId: config.id,
          severity: config.severity,
          title: 'Multiple Failed Authorization Attempts',
          description: `User ${attempt.userEmail} has ${attempt.count} failed authorization attempts in the last ${config.timeWindow} minutes`,
          metadata: {
            userId: attempt.userId,
            userEmail: attempt.userEmail,
            attemptCount: attempt.count,
            lastAttempt: attempt.lastAttempt,
            timeWindow: config.timeWindow
          },
          timestamp: new Date(),
          userId: attempt.userId
        });
      }

      if (failedAttempts.length > 0) {
        this.setCooldown(config.id, config.cooldown);
      }
    } catch (error) {
      console.error('Error checking failed authorization attempts:', error);
    }
  }

  private async checkUnusualPaymentPatterns(): Promise<void> {
    const config = this.alertConfigs.find(c => c.id === 'unusual_payment_patterns');
    if (!config?.enabled || this.isInCooldown(config.id)) return;

    const cutoffTime = new Date(Date.now() - config.timeWindow * 60 * 1000);

    try {
      // Check for users with unusually high payment frequency
      const unusualPatterns = await db
        .select({
          userId: payments.contractId,
          count: count(),
          totalAmount: sql<number>`SUM(CAST(${payments.amount} AS DECIMAL))`,
          userEmail: users.email
        })
        .from(payments)
        .innerJoin(contracts, eq(payments.contractId, contracts.id))
        .innerJoin(users, eq(contracts.clientId, users.id))
        .where(gte(payments.createdAt, cutoffTime))
        .groupBy(payments.contractId, users.email)
        .having(sql`COUNT(*) >= ${config.threshold}`);

      for (const pattern of unusualPatterns) {
        await this.generateAlert({
          alertId: config.id,
          severity: config.severity,
          title: 'Unusual Payment Pattern Detected',
          description: `User ${pattern.userEmail} has ${pattern.count} payments totaling $${pattern.totalAmount} in the last ${config.timeWindow} minutes`,
          metadata: {
            userEmail: pattern.userEmail,
            paymentCount: pattern.count,
            totalAmount: pattern.totalAmount,
            timeWindow: config.timeWindow
          },
          timestamp: new Date(),
          userId: pattern.userId
        });
      }

      if (unusualPatterns.length > 0) {
        this.setCooldown(config.id, config.cooldown);
      }
    } catch (error) {
      console.error('Error checking unusual payment patterns:', error);
    }
  }

  private async checkHighValueAuthorizations(): Promise<void> {
    const config = this.alertConfigs.find(c => c.id === 'high_value_authorizations');
    if (!config?.enabled) return;

    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // Last hour

    try {
      const highValueAuths = await db
        .select({
          id: paymentAuthorizations.id,
          contractId: paymentAuthorizations.contractId,
          totalAuthorized: paymentAuthorizations.totalAuthorized,
          clientEmail: users.email,
          contractTitle: contracts.title,
          authorizedAt: paymentAuthorizations.authorizedAt
        })
        .from(paymentAuthorizations)
        .innerJoin(users, eq(paymentAuthorizations.clientId, users.id))
        .innerJoin(contracts, eq(paymentAuthorizations.contractId, contracts.id))
        .where(and(
          gte(paymentAuthorizations.authorizedAt, cutoffTime),
          sql`CAST(${paymentAuthorizations.totalAuthorized} AS DECIMAL) >= ${config.threshold}`
        ));

      for (const auth of highValueAuths) {
        await this.generateAlert({
          alertId: config.id,
          severity: config.severity,
          title: 'High Value Authorization',
          description: `High value authorization of $${auth.totalAuthorized} by ${auth.clientEmail} for contract "${auth.contractTitle}"`,
          metadata: {
            authorizationId: auth.id,
            contractId: auth.contractId,
            contractTitle: auth.contractTitle,
            clientEmail: auth.clientEmail,
            authorizedAmount: auth.totalAuthorized,
            threshold: config.threshold
          },
          timestamp: new Date(),
          contractId: auth.contractId
        });
      }
    } catch (error) {
      console.error('Error checking high value authorizations:', error);
    }
  }

  private async checkMultipleFailedPayments(): Promise<void> {
    const config = this.alertConfigs.find(c => c.id === 'multiple_failed_payments');
    if (!config?.enabled || this.isInCooldown(config.id)) return;

    const cutoffTime = new Date(Date.now() - config.timeWindow * 60 * 1000);

    try {
      const failedPayments = await db
        .select({
          contractId: payments.contractId,
          count: count(),
          clientEmail: users.email,
          contractTitle: contracts.title
        })
        .from(payments)
        .innerJoin(contracts, eq(payments.contractId, contracts.id))
        .innerJoin(users, eq(contracts.clientId, users.id))
        .where(and(
          eq(payments.status, 'failed'),
          gte(payments.createdAt, cutoffTime)
        ))
        .groupBy(payments.contractId, users.email, contracts.title)
        .having(sql`COUNT(*) >= ${config.threshold}`);

      for (const failure of failedPayments) {
        await this.generateAlert({
          alertId: config.id,
          severity: config.severity,
          title: 'Multiple Failed Payments',
          description: `${failure.count} failed payments for contract "${failure.contractTitle}" by ${failure.clientEmail}`,
          metadata: {
            contractId: failure.contractId,
            contractTitle: failure.contractTitle,
            clientEmail: failure.clientEmail,
            failureCount: failure.count,
            timeWindow: config.timeWindow
          },
          timestamp: new Date(),
          contractId: failure.contractId
        });
      }

      if (failedPayments.length > 0) {
        this.setCooldown(config.id, config.cooldown);
      }
    } catch (error) {
      console.error('Error checking multiple failed payments:', error);
    }
  }

  private async checkRevocationSpikes(): Promise<void> {
    const config = this.alertConfigs.find(c => c.id === 'revocation_spikes');
    if (!config?.enabled || this.isInCooldown(config.id)) return;

    const cutoffTime = new Date(Date.now() - config.timeWindow * 60 * 1000);

    try {
      const revocationCount = await db
        .select({
          count: count()
        })
        .from(paymentAuthorizations)
        .where(and(
          sql`${paymentAuthorizations.revokedAt} IS NOT NULL`,
          gte(paymentAuthorizations.revokedAt, cutoffTime)
        ));

      const totalRevocations = revocationCount[0]?.count || 0;

      if (totalRevocations >= config.threshold) {
        await this.generateAlert({
          alertId: config.id,
          severity: config.severity,
          title: 'Authorization Revocation Spike',
          description: `${totalRevocations} authorization revocations in the last ${config.timeWindow} minutes (threshold: ${config.threshold})`,
          metadata: {
            revocationCount: totalRevocations,
            threshold: config.threshold,
            timeWindow: config.timeWindow
          },
          timestamp: new Date()
        });

        this.setCooldown(config.id, config.cooldown);
      }
    } catch (error) {
      console.error('Error checking revocation spikes:', error);
    }
  }

  private async checkGeographicAnomalies(): Promise<void> {
    const config = this.alertConfigs.find(c => c.id === 'geographic_anomalies');
    if (!config?.enabled || this.isInCooldown(config.id)) return;

    const cutoffTime = new Date(Date.now() - config.timeWindow * 60 * 1000);

    try {
      // This would require geolocation data from IP addresses
      // For now, we'll simulate with a basic IP address change detection
      const ipChanges = await db
        .select({
          userId: auditLogs.userId,
          ipAddress: auditLogs.ipAddress,
          userEmail: users.email,
          eventCount: count()
        })
        .from(auditLogs)
        .innerJoin(users, eq(auditLogs.userId, users.id))
        .where(and(
          eq(auditLogs.eventType, 'payment_authorization'),
          gte(auditLogs.timestamp, cutoffTime),
          sql`${auditLogs.ipAddress} IS NOT NULL`
        ))
        .groupBy(auditLogs.userId, auditLogs.ipAddress, users.email)
        .having(sql`COUNT(DISTINCT ${auditLogs.ipAddress}) > 3`); // Multiple IPs

      for (const change of ipChanges) {
        await this.generateAlert({
          alertId: config.id,
          severity: config.severity,
          title: 'Geographic Anomaly Detected',
          description: `User ${change.userEmail} has payment activity from multiple IP addresses in short time period`,
          metadata: {
            userId: change.userId,
            userEmail: change.userEmail,
            ipAddress: change.ipAddress,
            timeWindow: config.timeWindow
          },
          timestamp: new Date(),
          userId: change.userId,
          ipAddress: change.ipAddress
        });
      }

      if (ipChanges.length > 0) {
        this.setCooldown(config.id, config.cooldown);
      }
    } catch (error) {
      console.error('Error checking geographic anomalies:', error);
    }
  }

  private async checkVelocityAbuse(): Promise<void> {
    const config = this.alertConfigs.find(c => c.id === 'velocity_abuse');
    if (!config?.enabled || this.isInCooldown(config.id)) return;

    const cutoffTime = new Date(Date.now() - config.timeWindow * 60 * 1000);

    try {
      const velocityAbuse = await db
        .select({
          userId: auditLogs.userId,
          count: count(),
          userEmail: users.email,
          ipAddress: auditLogs.ipAddress
        })
        .from(auditLogs)
        .innerJoin(users, eq(auditLogs.userId, users.id))
        .where(and(
          sql`${auditLogs.eventType} IN ('payment_authorization', 'payment_attempt')`,
          gte(auditLogs.timestamp, cutoffTime)
        ))
        .groupBy(auditLogs.userId, users.email, auditLogs.ipAddress)
        .having(sql`COUNT(*) >= ${config.threshold}`);

      for (const abuse of velocityAbuse) {
        await this.generateAlert({
          alertId: config.id,
          severity: config.severity,
          title: 'Payment Velocity Abuse',
          description: `User ${abuse.userEmail} has ${abuse.count} payment attempts in ${config.timeWindow} minutes`,
          metadata: {
            userId: abuse.userId,
            userEmail: abuse.userEmail,
            attemptCount: abuse.count,
            timeWindow: config.timeWindow,
            ipAddress: abuse.ipAddress
          },
          timestamp: new Date(),
          userId: abuse.userId,
          ipAddress: abuse.ipAddress
        });
      }

      if (velocityAbuse.length > 0) {
        this.setCooldown(config.id, config.cooldown);
      }
    } catch (error) {
      console.error('Error checking velocity abuse:', error);
    }
  }

  private async generateAlert(alertEvent: AlertEvent): Promise<void> {
    try {
      // Log the alert
      console.log(`[ALERT] ${alertEvent.severity.toUpperCase()}: ${alertEvent.title}`);
      console.log(`Description: ${alertEvent.description}`);
      console.log(`Metadata:`, alertEvent.metadata);

      // Store alert in database
      await this.storeAlert(alertEvent);

      // Send notifications based on severity
      await this.sendNotifications(alertEvent);

      // Emit event for real-time systems
      this.emit('alert', alertEvent);

      // Auto-remediation for critical alerts
      if (alertEvent.severity === 'critical') {
        await this.handleCriticalAlert(alertEvent);
      }

    } catch (error) {
      console.error('Error generating alert:', error);
    }
  }

  private async storeAlert(alertEvent: AlertEvent): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId: alertEvent.userId,
        eventType: 'security_alert',
        eventData: {
          alertId: alertEvent.alertId,
          severity: alertEvent.severity,
          title: alertEvent.title,
          description: alertEvent.description,
          metadata: alertEvent.metadata
        },
        ipAddress: alertEvent.ipAddress,
        userAgent: 'MonitoringSystem/1.0',
        timestamp: alertEvent.timestamp
      });
    } catch (error) {
      console.error('Error storing alert:', error);
    }
  }

  private async sendNotifications(alertEvent: AlertEvent): Promise<void> {
    // Implementation would send to:
    // - Slack channels based on severity
    // - Email alerts to security team
    // - SMS for critical alerts
    // - Dashboard notifications

    const channels = this.getNotificationChannels(alertEvent.severity);
    
    for (const channel of channels) {
      try {
        await this.sendToChannel(channel, alertEvent);
      } catch (error) {
        console.error(`Error sending to ${channel}:`, error);
      }
    }
  }

  private getNotificationChannels(severity: string): string[] {
    switch (severity) {
      case 'critical':
        return ['slack-critical', 'email-security', 'sms-oncall', 'dashboard'];
      case 'high':
        return ['slack-security', 'email-security', 'dashboard'];
      case 'medium':
        return ['slack-security', 'dashboard'];
      case 'low':
        return ['dashboard'];
      default:
        return ['dashboard'];
    }
  }

  private async sendToChannel(channel: string, alertEvent: AlertEvent): Promise<void> {
    // Implementation would send to specific channels
    console.log(`Sending alert to ${channel}:`, {
      title: alertEvent.title,
      severity: alertEvent.severity,
      timestamp: alertEvent.timestamp
    });
  }

  private async handleCriticalAlert(alertEvent: AlertEvent): Promise<void> {
    // Auto-remediation for critical alerts
    switch (alertEvent.alertId) {
      case 'monitoring_system_error':
        // Restart monitoring components
        break;
      case 'massive_payment_failure':
        // Pause payment processing
        break;
      case 'security_breach_detected':
        // Activate incident response
        break;
    }
  }

  private isInCooldown(alertId: string): boolean {
    const cooldownEnd = this.alertCooldowns.get(alertId);
    return cooldownEnd ? new Date() < cooldownEnd : false;
  }

  private setCooldown(alertId: string, minutes: number): void {
    const cooldownEnd = new Date(Date.now() + minutes * 60 * 1000);
    this.alertCooldowns.set(alertId, cooldownEnd);
  }

  // Public methods for external access
  public async getAlerts(filters?: {
    severity?: string;
    timeRange?: { start: Date; end: Date };
    userId?: string;
  }): Promise<any[]> {
    // Implementation to retrieve alerts from database
    return [];
  }

  public async updateAlertConfig(alertId: string, config: Partial<AlertConfig>): Promise<void> {
    const index = this.alertConfigs.findIndex(c => c.id === alertId);
    if (index !== -1) {
      this.alertConfigs[index] = { ...this.alertConfigs[index], ...config };
    }
  }

  public getAlertConfigs(): AlertConfig[] {
    return this.alertConfigs;
  }
}

// Export singleton instance
export const paymentMonitoring = new PaymentMonitoringService();