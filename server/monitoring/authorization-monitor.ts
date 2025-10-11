/**
 * Authorization Monitoring Service
 * Monitors payment method expirations and authorization status
 */

import { db } from '../db';
import { paymentMethods, paymentAuthorizations, users, contracts } from '@shared/schema';
import { and, eq, lte, sql } from 'drizzle-orm';

interface ExpiringMethod {
  id: string;
  clientEmail: string;
  contractTitle: string;
  cardLast4: string;
  cardBrand: string;
  expMonth: string;
  expYear: string;
  daysUntilExpiry: number;
}

class AuthorizationMonitorService {
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitoring();
  }

  /**
   * Start the monitoring service
   */
  private startMonitoring(): void {
    // Check every 24 hours
    this.checkInterval = setInterval(() => {
      this.runChecks();
    }, 24 * 60 * 60 * 1000);

    // Run initial check after 1 minute
    setTimeout(() => {
      this.runChecks();
    }, 60 * 1000);

    console.log('Authorization monitoring service started');
  }

  /**
   * Run all monitoring checks
   */
  private async runChecks(): Promise<void> {
    try {
      await Promise.all([
        this.checkExpiringCards(),
        this.checkExpiredCards(),
        this.checkInactiveAuthorizations()
      ]);
    } catch (error) {
      console.error('Error in authorization monitoring:', error);
    }
  }

  /**
   * Check for cards expiring within 30 days
   */
  async checkExpiringCards(): Promise<ExpiringMethod[]> {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expiringMethods = await db
        .select({
          id: paymentMethods.id,
          clientId: paymentMethods.userId,
          clientEmail: users.email,
          cardLast4: paymentMethods.cardLast4,
          cardBrand: paymentMethods.cardBrand,
          expMonth: paymentMethods.cardExpMonth,
          expYear: paymentMethods.cardExpYear,
          expiryNotificationSent: paymentMethods.expiryNotificationSent
        })
        .from(paymentMethods)
        .innerJoin(users, eq(paymentMethods.userId, users.id))
        .where(and(
          eq(paymentMethods.type, 'stripe_card'),
          eq(paymentMethods.isActive, true),
          eq(paymentMethods.expiryNotificationSent, false),
          sql`${paymentMethods.cardExpMonth} IS NOT NULL`,
          sql`${paymentMethods.cardExpYear} IS NOT NULL`
        ));

      const expiringSoon: ExpiringMethod[] = [];

      for (const method of expiringMethods) {
        if (!method.expMonth || !method.expYear) continue;

        const expiryDate = new Date(
          parseInt(`20${method.expYear}`),
          parseInt(method.expMonth) - 1,
          1
        );

        if (expiryDate <= thirtyDaysFromNow) {
          const daysUntilExpiry = Math.floor(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Get contracts using this payment method
          const contractsUsingMethod = await db
            .select({
              contractId: paymentAuthorizations.contractId,
              contractTitle: contracts.title
            })
            .from(paymentAuthorizations)
            .innerJoin(contracts, eq(paymentAuthorizations.contractId, contracts.id))
            .where(and(
              eq(paymentAuthorizations.stripePaymentMethodId, method.id),
              eq(paymentAuthorizations.isActive, true)
            ));

          if (contractsUsingMethod.length > 0) {
            expiringSoon.push({
              id: method.id,
              clientEmail: method.clientEmail,
              contractTitle: contractsUsingMethod[0].contractTitle,
              cardLast4: method.cardLast4 || '',
              cardBrand: method.cardBrand || '',
              expMonth: method.expMonth,
              expYear: method.expYear,
              daysUntilExpiry
            });

            // Send notification
            await this.sendExpirationWarning(method, contractsUsingMethod);

            // Mark notification as sent
            await db
              .update(paymentMethods)
              .set({ expiryNotificationSent: true })
              .where(eq(paymentMethods.id, method.id));
          }
        }
      }

      if (expiringSoon.length > 0) {
        console.log(`Found ${expiringSoon.length} expiring payment methods`);
      }

      return expiringSoon;
    } catch (error) {
      console.error('Error checking expiring cards:', error);
      return [];
    }
  }

  /**
   * Check for expired cards and deactivate them
   */
  async checkExpiredCards(): Promise<void> {
    try {
      const now = new Date();

      const expiredMethods = await db
        .select({
          id: paymentMethods.id,
          cardExpMonth: paymentMethods.cardExpMonth,
          cardExpYear: paymentMethods.cardExpYear
        })
        .from(paymentMethods)
        .where(and(
          eq(paymentMethods.type, 'stripe_card'),
          eq(paymentMethods.isActive, true),
          sql`${paymentMethods.cardExpMonth} IS NOT NULL`,
          sql`${paymentMethods.cardExpYear} IS NOT NULL`
        ));

      for (const method of expiredMethods) {
        if (!method.cardExpMonth || !method.cardExpYear) continue;

        const expiryDate = new Date(
          parseInt(`20${method.cardExpYear}`),
          parseInt(method.cardExpMonth) - 1,
          1
        );

        if (expiryDate < now) {
          // Deactivate expired payment method
          await db
            .update(paymentMethods)
            .set({ isActive: false })
            .where(eq(paymentMethods.id, method.id));

          // Revoke associated authorizations
          await db
            .update(paymentAuthorizations)
            .set({ 
              isActive: false,
              revokedAt: new Date()
            })
            .where(eq(paymentAuthorizations.stripePaymentMethodId, method.id));

          console.log(`Deactivated expired payment method: ${method.id}`);
        }
      }
    } catch (error) {
      console.error('Error checking expired cards:', error);
    }
  }

  /**
   * Check for inactive authorizations
   */
  async checkInactiveAuthorizations(): Promise<void> {
    try {
      const inactiveAuths = await db
        .select({
          id: paymentAuthorizations.id,
          contractId: paymentAuthorizations.contractId,
          contractTitle: contracts.title,
          clientEmail: users.email,
          revokedAt: paymentAuthorizations.revokedAt
        })
        .from(paymentAuthorizations)
        .innerJoin(contracts, eq(paymentAuthorizations.contractId, contracts.id))
        .innerJoin(users, eq(paymentAuthorizations.clientId, users.id))
        .where(and(
          eq(paymentAuthorizations.isActive, false),
          eq(contracts.status, 'active')
        ));

      if (inactiveAuths.length > 0) {
        console.log(`Found ${inactiveAuths.length} inactive authorizations for active contracts`);
        
        for (const auth of inactiveAuths) {
          // Could send notifications or alerts here
          console.log(`Contract "${auth.contractTitle}" has inactive authorization - requires action`);
        }
      }
    } catch (error) {
      console.error('Error checking inactive authorizations:', error);
    }
  }

  /**
   * Send expiration warning email
   */
  private async sendExpirationWarning(
    method: any,
    contracts: any[]
  ): Promise<void> {
    try {
      console.log(`Sending expiration warning for card ending in ${method.cardLast4}`);
      console.log(`Affected contracts:`, contracts.map(c => c.contractTitle));
      
      // In production, this would send an actual email via Resend
      // For now, just log the notification
    } catch (error) {
      console.error('Error sending expiration warning:', error);
    }
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats(): Promise<{
    expiringMethods: number;
    expiredMethods: number;
    inactiveAuthorizations: number;
    activeAuthorizations: number;
  }> {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [expiringCount, expiredCount, inactiveAuthCount, activeAuthCount] = await Promise.all([
        // Expiring methods count
        db
          .select({ count: sql<number>`count(*)` })
          .from(paymentMethods)
          .where(and(
            eq(paymentMethods.type, 'stripe_card'),
            eq(paymentMethods.isActive, true),
            sql`${paymentMethods.cardExpMonth} IS NOT NULL`
          ))
          .then(r => parseInt(r[0]?.count?.toString() || '0')),

        // Expired methods count
        db
          .select({ count: sql<number>`count(*)` })
          .from(paymentMethods)
          .where(and(
            eq(paymentMethods.type, 'stripe_card'),
            eq(paymentMethods.isActive, false)
          ))
          .then(r => parseInt(r[0]?.count?.toString() || '0')),

        // Inactive authorizations count
        db
          .select({ count: sql<number>`count(*)` })
          .from(paymentAuthorizations)
          .where(eq(paymentAuthorizations.isActive, false))
          .then(r => parseInt(r[0]?.count?.toString() || '0')),

        // Active authorizations count
        db
          .select({ count: sql<number>`count(*)` })
          .from(paymentAuthorizations)
          .where(eq(paymentAuthorizations.isActive, true))
          .then(r => parseInt(r[0]?.count?.toString() || '0'))
      ]);

      return {
        expiringMethods: expiringCount,
        expiredMethods: expiredCount,
        inactiveAuthorizations: inactiveAuthCount,
        activeAuthorizations: activeAuthCount
      };
    } catch (error) {
      console.error('Error getting monitoring stats:', error);
      return {
        expiringMethods: 0,
        expiredMethods: 0,
        inactiveAuthorizations: 0,
        activeAuthorizations: 0
      };
    }
  }

  /**
   * Stop the monitoring service
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Authorization monitoring service stopped');
    }
  }
}

// Export singleton instance
export const authorizationMonitor = new AuthorizationMonitorService();
