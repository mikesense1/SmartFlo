import { Resend } from 'resend';
import ContractInvitation from '../emails/ContractInvitation';
import PaymentAuthorized from '../emails/PaymentAuthorized';
import PaymentPending from '../emails/PaymentPending';
import PaymentProcessed from '../emails/PaymentProcessed';
import AuthorizationRevoked from '../emails/AuthorizationRevoked';
import PaymentVerificationEmail from '../emails/PaymentVerification';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface EmailAddress {
  email: string;
  name?: string;
}

interface ContractInvitationData {
  clientName: string;
  clientEmail: string;
  freelancerName: string;
  contractTitle: string;
  totalValue: string;
  contractId: string;
  paymentMethod: string;
}

interface PaymentAuthorizedData {
  clientName: string;
  clientEmail: string;
  contractTitle: string;
  paymentMethod: string;
  contractId: string;
  authorizationDate: string;
}

interface PaymentPendingData {
  clientName: string;
  clientEmail: string;
  contractTitle: string;
  milestoneTitle: string;
  amount: string;
  paymentMethod: string;
  contractId: string;
  milestoneId: string;
  chargeDate: string;
  timeRemaining: string;
}

interface PaymentProcessedData {
  clientName: string;
  clientEmail: string;
  contractTitle: string;
  milestoneTitle: string;
  amount: string;
  paymentMethod: string;
  transactionId: string;
  processedDate: string;
  contractId: string;
  milestoneId: string;
}

interface AuthorizationRevokedData {
  clientName: string;
  clientEmail: string;
  contractTitle: string;
  revocationDate: string;
  contractId: string;
  remainingBalance?: string;
  reason?: string;
}

interface PaymentVerificationData {
  clientName: string;
  clientEmail: string;
  verificationCode: string;
  amount: string;
  milestoneTitle: string;
  contractTitle: string;
  expiresInMinutes?: number;
}

export class EmailService {
  private static instance: EmailService;
  
  private constructor() {}
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private createFromAddress(): EmailAddress {
    return {
      email: 'noreply@getsmartflo.com',
      name: 'SmartFlo'
    };
  }

  private createToAddress(email: string, name?: string): EmailAddress {
    return {
      email,
      name
    };
  }

  /**
   * Send contract invitation email to client
   */
  async sendContractInvitation(data: ContractInvitationData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!resend) {
        return { success: false, error: 'Email service not configured' };
      }
      
      const result = await resend.emails.send({
        from: this.createFromAddress(),
        to: [this.createToAddress(data.clientEmail, data.clientName)],
        subject: `Contract Invitation: ${data.contractTitle} - ${data.totalValue}`,
        react: ContractInvitation({
          clientName: data.clientName,
          freelancerName: data.freelancerName,
          contractTitle: data.contractTitle,
          totalValue: data.totalValue,
          contractId: data.contractId,
          paymentMethod: data.paymentMethod
        }),
        headers: {
          'X-SmartFlo-Email-Type': 'contract-invitation',
          'X-SmartFlo-Contract-ID': data.contractId,
          'X-Priority': '1'
        },
        tags: [
          { name: 'type', value: 'contract-invitation' },
          { name: 'contract', value: data.contractId },
          { name: 'client', value: data.clientEmail }
        ]
      });

      if (result.error) {
        console.error('Failed to send contract invitation email:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending contract invitation email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send payment authorization confirmation email
   */
  async sendPaymentAuthorized(data: PaymentAuthorizedData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!resend) {
        return { success: false, error: 'Email service not configured' };
      }
      
      const result = await resend.emails.send({
        from: this.createFromAddress(),
        to: [this.createToAddress(data.clientEmail, data.clientName)],
        subject: `Payment Authorization Confirmed - ${data.contractTitle}`,
        react: PaymentAuthorized({
          clientName: data.clientName,
          contractTitle: data.contractTitle,
          paymentMethod: data.paymentMethod,
          contractId: data.contractId,
          authorizationDate: data.authorizationDate
        }),
        headers: {
          'X-SmartFlo-Email-Type': 'payment-authorized',
          'X-SmartFlo-Contract-ID': data.contractId,
          'X-Priority': '2'
        },
        tags: [
          { name: 'type', value: 'payment-authorized' },
          { name: 'contract', value: data.contractId },
          { name: 'client', value: data.clientEmail }
        ]
      });

      if (result.error) {
        console.error('Failed to send payment authorized email:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending payment authorized email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send 24-hour payment pending notice
   */
  async sendPaymentPending(data: PaymentPendingData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!resend) {
        return { success: false, error: 'Email service not configured' };
      }
      
      const result = await resend.emails.send({
        from: this.createFromAddress(),
        to: [this.createToAddress(data.clientEmail, data.clientName)],
        subject: `⏰ Payment Processing in 24 Hours - ${data.milestoneTitle} (${data.amount})`,
        react: PaymentPending({
          clientName: data.clientName,
          contractTitle: data.contractTitle,
          milestoneTitle: data.milestoneTitle,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          contractId: data.contractId,
          milestoneId: data.milestoneId,
          chargeDate: data.chargeDate,
          timeRemaining: data.timeRemaining
        }),
        headers: {
          'X-SmartFlo-Email-Type': 'payment-pending',
          'X-SmartFlo-Contract-ID': data.contractId,
          'X-SmartFlo-Milestone-ID': data.milestoneId,
          'X-Priority': '1'
        },
        tags: [
          { name: 'type', value: 'payment-pending' },
          { name: 'contract', value: data.contractId },
          { name: 'milestone', value: data.milestoneId },
          { name: 'client', value: data.clientEmail }
        ]
      });

      if (result.error) {
        console.error('Failed to send payment pending email:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending payment pending email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send payment processed receipt
   */
  async sendPaymentProcessed(data: PaymentProcessedData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!resend) {
        return { success: false, error: 'Email service not configured' };
      }
      
      const result = await resend.emails.send({
        from: this.createFromAddress(),
        to: [this.createToAddress(data.clientEmail, data.clientName)],
        subject: `✅ Payment Processed: ${data.milestoneTitle} - ${data.amount}`,
        react: PaymentProcessed({
          clientName: data.clientName,
          contractTitle: data.contractTitle,
          milestoneTitle: data.milestoneTitle,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          transactionId: data.transactionId,
          processedDate: data.processedDate,
          contractId: data.contractId,
          milestoneId: data.milestoneId
        }),
        headers: {
          'X-SmartFlo-Email-Type': 'payment-processed',
          'X-SmartFlo-Contract-ID': data.contractId,
          'X-SmartFlo-Milestone-ID': data.milestoneId,
          'X-SmartFlo-Transaction-ID': data.transactionId,
          'X-Priority': '2'
        },
        tags: [
          { name: 'type', value: 'payment-processed' },
          { name: 'contract', value: data.contractId },
          { name: 'milestone', value: data.milestoneId },
          { name: 'transaction', value: data.transactionId },
          { name: 'client', value: data.clientEmail }
        ]
      });

      if (result.error) {
        console.error('Failed to send payment processed email:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending payment processed email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send authorization revoked confirmation
   */
  async sendAuthorizationRevoked(data: AuthorizationRevokedData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!resend) {
        return { success: false, error: 'Email service not configured' };
      }
      
      const result = await resend.emails.send({
        from: this.createFromAddress(),
        to: [this.createToAddress(data.clientEmail, data.clientName)],
        subject: `🚫 Payment Authorization Revoked - ${data.contractTitle}`,
        react: AuthorizationRevoked({
          clientName: data.clientName,
          contractTitle: data.contractTitle,
          revocationDate: data.revocationDate,
          contractId: data.contractId,
          remainingBalance: data.remainingBalance,
          reason: data.reason
        }),
        headers: {
          'X-SmartFlo-Email-Type': 'authorization-revoked',
          'X-SmartFlo-Contract-ID': data.contractId,
          'X-Priority': '2'
        },
        tags: [
          { name: 'type', value: 'authorization-revoked' },
          { name: 'contract', value: data.contractId },
          { name: 'client', value: data.clientEmail }
        ]
      });

      if (result.error) {
        console.error('Failed to send authorization revoked email:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending authorization revoked email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send payment verification code (2FA)
   */
  async sendPaymentVerification(data: PaymentVerificationData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!resend) {
        console.log('[Email] Resend not configured, displaying code in console');
        console.log(`[2FA] Verification code for ${data.clientEmail}: ${data.verificationCode}`);
        return { success: true, messageId: 'console-only' };
      }
      
      const result = await resend.emails.send({
        from: this.createFromAddress(),
        to: [this.createToAddress(data.clientEmail, data.clientName)],
        subject: `🔐 Payment Verification Code: ${data.verificationCode}`,
        react: PaymentVerificationEmail({
          clientName: data.clientName,
          verificationCode: data.verificationCode,
          amount: data.amount,
          milestoneTitle: data.milestoneTitle,
          contractTitle: data.contractTitle,
          expiresInMinutes: data.expiresInMinutes || 10
        }),
        headers: {
          'X-SmartFlo-Email-Type': 'payment-verification',
          'X-Priority': '1'
        },
        tags: [
          { name: 'type', value: 'payment-verification' },
          { name: 'client', value: data.clientEmail }
        ]
      });

      if (result.error) {
        console.error('Failed to send payment verification email:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending payment verification email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send test email to verify Resend integration
   */
  async sendTestEmail(toEmail: string, toName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!resend) {
        return { success: false, error: 'Email service not configured' };
      }
      
      const result = await resend.emails.send({
        from: this.createFromAddress(),
        to: [this.createToAddress(toEmail, toName)],
        subject: 'SmartFlo Email Service Test',
        html: `
          <h1>✅ SmartFlo Email Service Test</h1>
          <p>This is a test email to verify that the Resend email service integration is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Service:</strong> Resend Email API</p>
          <p><strong>Integration:</strong> SmartFlo Platform</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This email was sent by SmartFlo's automated email service.<br>
            If you received this in error, please contact support@getsmartflo.com
          </p>
        `,
        headers: {
          'X-SmartFlo-Email-Type': 'test',
          'X-Priority': '3'
        },
        tags: [
          { name: 'type', value: 'test' },
          { name: 'recipient', value: toEmail }
        ]
      });

      if (result.error) {
        console.error('Failed to send test email:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending test email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();