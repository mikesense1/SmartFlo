import { storage } from '../../db';
import { sendEmail } from '../../email-service';

/**
 * Card Expiry Monitoring Service
 * Checks for expiring cards and sends notifications
 */
export class CardExpiryMonitor {
  private static instance: CardExpiryMonitor;

  private constructor() {}

  public static getInstance(): CardExpiryMonitor {
    if (!CardExpiryMonitor.instance) {
      CardExpiryMonitor.instance = new CardExpiryMonitor();
    }
    return CardExpiryMonitor.instance;
  }

  /**
   * Check all card payment methods and send expiry notifications
   * This should be run daily via cron job
   */
  async checkExpiringCards(): Promise<{
    cardsChecked: number;
    notificationsSent: number;
    cardsExpired: number;
  }> {
    console.log('[CardExpiryMonitor] Starting expiry check...');
    
    try {
      // Get all active card payment methods
      const allMethods = await storage.getAllPaymentMethods();
      const cardMethods = allMethods.filter(m => 
        m.type === 'stripe_card' && 
        m.isActive && 
        m.cardExpMonth && 
        m.cardExpYear
      );

      console.log(`[CardExpiryMonitor] Found ${cardMethods.length} active card payment methods`);

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      let notificationsSent = 0;
      let cardsExpired = 0;

      for (const method of cardMethods) {
        const expDate = new Date(
          parseInt(`20${method.cardExpYear}`),
          parseInt(method.cardExpMonth!) - 1
        );

        const isExpired = expDate < now;
        const isExpiringSoon = expDate <= thirtyDaysFromNow && !isExpired;

        // Handle expired cards
        if (isExpired) {
          await this.handleExpiredCard(method);
          cardsExpired++;
        }
        // Send expiry warning (30 days before)
        else if (isExpiringSoon && !method.expiryNotificationSent) {
          await this.sendExpiryWarning(method, expDate);
          notificationsSent++;
        }
      }

      console.log(`[CardExpiryMonitor] Check complete. Notifications sent: ${notificationsSent}, Cards expired: ${cardsExpired}`);

      return {
        cardsChecked: cardMethods.length,
        notificationsSent,
        cardsExpired
      };
    } catch (error) {
      console.error('[CardExpiryMonitor] Error checking expiring cards:', error);
      throw error;
    }
  }

  /**
   * Send expiry warning email to user
   */
  private async sendExpiryWarning(
    method: any,
    expiryDate: Date
  ): Promise<void> {
    try {
      const user = await storage.getUser(method.userId);
      
      // Get contracts using this payment method
      const contracts = await storage.getContractsUsingPaymentMethod(method.id);
      const activeContracts = contracts.filter(c => c.status === 'active');

      const subject = '⚠️ Your Payment Card is Expiring Soon';
      
      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ea580c;">Payment Card Expiring Soon</h2>
          
          <p>Hello,</p>
          
          <p>This is a reminder that your payment card on file is expiring soon:</p>
          
          <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0;">
            <strong>${method.cardBrand?.toUpperCase()} •••• ${method.cardLast4}</strong><br>
            <span style="color: #ea580c; font-weight: bold;">Expires: ${method.cardExpMonth}/${method.cardExpYear}</span>
          </div>
          
          ${activeContracts.length > 0 ? `
          <p><strong>This card is currently being used for ${activeContracts.length} active contract${activeContracts.length > 1 ? 's' : ''}:</strong></p>
          <ul>
            ${activeContracts.map(c => `<li>${c.title}</li>`).join('')}
          </ul>
          ` : ''}
          
          <p><strong>What You Need to Do:</strong></p>
          <ol>
            <li>Log in to your SmartFlo account</li>
            <li>Go to Payment Methods</li>
            <li>Update your card information</li>
          </ol>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://getsmartflo.com'}/dashboard/payment-methods" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Update Payment Method
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            If you don't update your card before it expires, automatic payments may fail and you could experience service interruptions.
          </p>
          
          <p style="color: #64748b; font-size: 14px;">
            Questions? Contact us at support@smartflo.com
          </p>
        </div>
      `;

      await sendEmail(user.email, subject, body);

      // Mark notification as sent
      await storage.updatePaymentMethod(method.id, {
        expiryNotificationSent: true,
        updatedAt: new Date()
      });

      console.log(`[CardExpiryMonitor] Expiry warning sent to ${user.email} for card ${method.cardLast4}`);
    } catch (error) {
      console.error('[CardExpiryMonitor] Error sending expiry warning:', error);
      throw error;
    }
  }

  /**
   * Handle expired card
   */
  private async handleExpiredCard(method: any): Promise<void> {
    try {
      const user = await storage.getUser(method.userId);
      
      // Get contracts using this payment method
      const contracts = await storage.getContractsUsingPaymentMethod(method.id);
      const activeContracts = contracts.filter(c => c.status === 'active');

      // Send expired card notification
      const subject = '🚨 Your Payment Card Has Expired';
      
      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Payment Card Expired</h2>
          
          <p>Hello,</p>
          
          <p>Your payment card on file has expired:</p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <strong>${method.cardBrand?.toUpperCase()} •••• ${method.cardLast4}</strong><br>
            <span style="color: #dc2626; font-weight: bold;">Expired: ${method.cardExpMonth}/${method.cardExpYear}</span>
          </div>
          
          ${activeContracts.length > 0 ? `
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <strong>⚠️ Action Required</strong><br>
            This card is being used for ${activeContracts.length} active contract${activeContracts.length > 1 ? 's' : ''}. 
            Milestone payments may fail until you update your card.
          </div>
          
          <p><strong>Affected Contracts:</strong></p>
          <ul>
            ${activeContracts.map(c => `<li>${c.title}</li>`).join('')}
          </ul>
          ` : ''}
          
          <div style="margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://getsmartflo.com'}/dashboard/payment-methods" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Update Card Now
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            Update your card as soon as possible to avoid payment failures and service interruptions.
          </p>
        </div>
      `;

      await sendEmail(user.email, subject, body);

      // Mark card as inactive if not already
      if (method.isActive) {
        await storage.updatePaymentMethod(method.id, {
          isActive: false,
          updatedAt: new Date()
        });
      }

      console.log(`[CardExpiryMonitor] Expired card notification sent to ${user.email} for card ${method.cardLast4}`);
    } catch (error) {
      console.error('[CardExpiryMonitor] Error handling expired card:', error);
      throw error;
    }
  }

  /**
   * Get summary of card expiry status
   */
  async getExpiryStatus(): Promise<{
    totalCards: number;
    expiringSoon: number;
    expired: number;
    healthy: number;
  }> {
    const allMethods = await storage.getAllPaymentMethods();
    const cardMethods = allMethods.filter(m => 
      m.type === 'stripe_card' && 
      m.isActive && 
      m.cardExpMonth && 
      m.cardExpYear
    );

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    let expiringSoon = 0;
    let expired = 0;
    let healthy = 0;

    for (const method of cardMethods) {
      const expDate = new Date(
        parseInt(`20${method.cardExpYear}`),
        parseInt(method.cardExpMonth!) - 1
      );

      if (expDate < now) {
        expired++;
      } else if (expDate <= thirtyDaysFromNow) {
        expiringSoon++;
      } else {
        healthy++;
      }
    }

    return {
      totalCards: cardMethods.length,
      expiringSoon,
      expired,
      healthy
    };
  }
}

// Export singleton instance
export const cardExpiryMonitor = CardExpiryMonitor.getInstance();
