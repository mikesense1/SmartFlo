import { storage } from './storage';
import { EmailService } from './email-service';
// Authorization monitoring without external cron dependency
// Using built-in setInterval for simplicity

interface AuthorizationAlert {
  type: 'expiring' | 'expired' | 'failed_payment' | 'usage_limit';
  contractId: string;
  authorizationId: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export class AuthorizationMonitor {
  private static instance: AuthorizationMonitor;
  private emailService: EmailService;
  private monitoring: boolean = false;

  private constructor() {
    this.emailService = EmailService.getInstance();
  }

  public static getInstance(): AuthorizationMonitor {
    if (!AuthorizationMonitor.instance) {
      AuthorizationMonitor.instance = new AuthorizationMonitor();
    }
    return AuthorizationMonitor.instance;
  }

  /**
   * Start monitoring authorization status
   */
  public startMonitoring() {
    if (this.monitoring) {
      console.log('Authorization monitoring already running');
      return;
    }

    this.monitoring = true;
    console.log('Starting payment authorization monitoring...');

    // Check expiring cards daily (24 hours)
    setInterval(async () => {
      await this.checkExpiringAuthorizations();
    }, 24 * 60 * 60 * 1000);

    // Check authorization usage weekly (7 days)
    setInterval(async () => {
      await this.trackAuthorizationUsage();
    }, 7 * 24 * 60 * 60 * 1000);

    // Check failed payments every hour
    setInterval(async () => {
      await this.monitorFailedPayments();
    }, 60 * 60 * 1000);

    console.log('Authorization monitoring scheduled');
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring() {
    this.monitoring = false;
    console.log('Authorization monitoring stopped');
  }

  /**
   * Check for expiring payment methods (cards, authorizations)
   */
  private async checkExpiringAuthorizations(): Promise<void> {
    try {
      console.log('Checking expiring payment authorizations...');

      // Get all active authorizations
      const contracts = await storage.getContracts();
      const alerts: AuthorizationAlert[] = [];

      for (const contract of contracts) {
        const authorization = await storage.getPaymentAuthorizationByContract(contract.id);
        if (!authorization || !authorization.isActive) continue;

        const expirationDate = authorization.expiresAt ? new Date(authorization.expiresAt) : null;
        if (!expirationDate) continue;

        const daysUntilExpiry = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        // Alert 30 days before expiry
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          alerts.push({
            type: 'expiring',
            contractId: contract.id,
            authorizationId: authorization.id,
            message: `Payment method expires in ${daysUntilExpiry} days`,
            severity: daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 14 ? 'medium' : 'low'
          });

          // Send email alert
          await this.emailService.sendPaymentPending({
            clientName: contract.clientEmail,
            clientEmail: contract.clientEmail,
            contractTitle: contract.title,
            milestoneTitle: 'Payment Method Expiring',
            amount: 'N/A',
            paymentMethod: authorization.paymentMethod,
            contractId: contract.id,
            milestoneId: 'expiry-alert',
            chargeDate: expirationDate.toLocaleDateString(),
            timeRemaining: `${daysUntilExpiry} days`
          });
        }

        // Alert for expired authorizations
        if (daysUntilExpiry <= 0) {
          alerts.push({
            type: 'expired',
            contractId: contract.id,
            authorizationId: authorization.id,
            message: 'Payment method has expired',
            severity: 'high'
          });

          // Deactivate expired authorization
          await storage.updatePaymentAuthorization(authorization.id, {
            isActive: false,
            expiredAt: new Date().toISOString()
          });

          // Update contract status
          await storage.updateContract(contract.id, {
            status: 'payment_authorization_expired'
          });

          // Log activity
          await storage.createActivity({
            contractId: contract.id,
            action: 'payment_authorization_expired',
            actorEmail: 'system@smartflo.com',
            details: { authorizationId: authorization.id, reason: 'Payment method expired' }
          });
        }
      }

      if (alerts.length > 0) {
        console.log(`Found ${alerts.length} authorization alerts:`, alerts);
      }

    } catch (error) {
      console.error('Error checking expiring authorizations:', error);
    }
  }

  /**
   * Track authorization usage and limits
   */
  private async trackAuthorizationUsage(): Promise<void> {
    try {
      console.log('Tracking authorization usage...');

      const contracts = await storage.getContracts();

      for (const contract of contracts) {
        const authorization = await storage.getPaymentAuthorizationByContract(contract.id);
        if (!authorization || !authorization.isActive) continue;

        // Get payments for this contract to calculate usage
        const payments = await storage.getPaymentsByContract(contract.id);
        const totalUsed = payments.reduce((sum, payment) => sum + parseInt(payment.amount), 0);
        const totalAuthorized = parseInt(authorization.totalAuthorized);
        const usagePercentage = (totalUsed / totalAuthorized) * 100;

        // Alert if usage is high
        if (usagePercentage >= 80) {
          await this.emailService.sendPaymentPending({
            clientName: contract.clientEmail,
            clientEmail: contract.clientEmail,
            contractTitle: contract.title,
            milestoneTitle: 'Authorization Limit Warning',
            amount: `$${(totalUsed / 100).toFixed(2)} of $${(totalAuthorized / 100).toFixed(2)}`,
            paymentMethod: authorization.paymentMethod,
            contractId: contract.id,
            milestoneId: 'usage-alert',
            chargeDate: 'Immediate attention required',
            timeRemaining: `${usagePercentage.toFixed(1)}% used`
          });

          // Log usage alert
          await storage.createActivity({
            contractId: contract.id,
            action: 'authorization_usage_alert',
            actorEmail: 'system@smartflo.com',
            details: { 
              usagePercentage: usagePercentage.toFixed(1),
              totalUsed,
              totalAuthorized
            }
          });
        }
      }

    } catch (error) {
      console.error('Error tracking authorization usage:', error);
    }
  }

  /**
   * Monitor for failed payment attempts
   */
  private async monitorFailedPayments(): Promise<void> {
    try {
      // This would integrate with Stripe webhooks in production
      console.log('Monitoring failed payment attempts...');

      // For now, simulate checking for failed payments
      const contracts = await storage.getContracts();

      for (const contract of contracts) {
        const authorization = await storage.getPaymentAuthorizationByContract(contract.id);
        if (!authorization || !authorization.isActive) continue;

        // In production, this would check Stripe payment_intent failures
        // or blockchain transaction failures for USDC payments
        
        // Simulate random payment failures (5% chance)
        if (Math.random() < 0.05) {
          console.log(`Simulated payment failure for contract ${contract.id}`);

          // Log failed payment attempt
          await storage.createActivity({
            contractId: contract.id,
            action: 'payment_attempt_failed',
            actorEmail: 'system@smartflo.com',
            details: { 
              authorizationId: authorization.id,
              reason: 'Insufficient funds or card declined',
              retryScheduled: true
            }
          });

          // Notify client of failed payment
          await this.emailService.sendPaymentPending({
            clientName: contract.clientEmail,
            clientEmail: contract.clientEmail,
            contractTitle: contract.title,
            milestoneTitle: 'Payment Failed',
            amount: 'Payment failed',
            paymentMethod: authorization.paymentMethod,
            contractId: contract.id,
            milestoneId: 'failed-payment',
            chargeDate: 'Retry scheduled',
            timeRemaining: 'Action required'
          });
        }
      }

    } catch (error) {
      console.error('Error monitoring failed payments:', error);
    }
  }

  /**
   * Get authorization health report
   */
  public async getAuthorizationReport(): Promise<{
    totalActive: number;
    expiringWithin30Days: number;
    expired: number;
    failedPayments: number;
    alerts: AuthorizationAlert[];
  }> {
    try {
      const contracts = await storage.getContracts();
      let totalActive = 0;
      let expiringWithin30Days = 0;
      let expired = 0;
      let failedPayments = 0;
      const alerts: AuthorizationAlert[] = [];

      for (const contract of contracts) {
        const authorization = await storage.getPaymentAuthorizationByContract(contract.id);
        if (!authorization) continue;

        if (authorization.isActive) {
          totalActive++;

          if (authorization.expiresAt) {
            const daysUntilExpiry = Math.ceil((new Date(authorization.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 0) {
              expired++;
            } else if (daysUntilExpiry <= 30) {
              expiringWithin30Days++;
              alerts.push({
                type: 'expiring',
                contractId: contract.id,
                authorizationId: authorization.id,
                message: `Expires in ${daysUntilExpiry} days`,
                severity: daysUntilExpiry <= 7 ? 'high' : 'medium'
              });
            }
          }
        }
      }

      return {
        totalActive,
        expiringWithin30Days,
        expired,
        failedPayments,
        alerts
      };

    } catch (error) {
      console.error('Error generating authorization report:', error);
      return {
        totalActive: 0,
        expiringWithin30Days: 0,
        expired: 0,
        failedPayments: 0,
        alerts: []
      };
    }
  }
}

// Export singleton instance
export const authorizationMonitor = AuthorizationMonitor.getInstance();