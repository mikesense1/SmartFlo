import { storage } from '../../storage';
import crypto from 'crypto';

interface AuditEvent {
  id?: string;
  userId: string;
  contractId?: string;
  eventType: 'authorization_created' | 'authorization_revoked' | 'payment_attempt' | 'payment_success' | 
           'payment_failed' | 'approval_granted' | 'approval_denied' | 'dispute_opened' | 'dispute_resolved' |
           'compliance_check' | 'data_access' | 'settings_changed' | 'admin_action';
  entityId?: string; // ID of the affected entity (authorization, payment, etc.)
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  complianceRelevant: boolean;
  retentionYears: number;
}

interface AuthorizationRecord {
  id: string;
  contractId: string;
  clientId: string;
  method: 'stripe' | 'usdc';
  status: 'active' | 'revoked' | 'expired' | 'suspended';
  stripeCustomerId?: string;
  stripeMandateId?: string;
  solanaWalletAddress?: string;
  solanaAuthSignature?: string;
  maxPerMilestone: number;
  totalAuthorized: number;
  totalCharged: number;
  authorizedAt: string;
  revokedAt?: string;
  lastUsedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  termsVersion: string;
}

interface DisputeRecord {
  id: string;
  paymentId: string;
  contractId: string;
  clientId: string;
  freelancerId: string;
  amount: number;
  reason: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  openedAt: string;
  resolvedAt?: string;
  resolution?: string;
  refundAmount?: number;
  adminNotes?: string;
}

/**
 * Comprehensive audit logging system
 */
export class AuditLogger {
  private static instance: AuditLogger;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log audit event with comprehensive tracking
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      const auditId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const auditEvent: AuditEvent = {
        ...event,
        id: auditId,
        timestamp
      };

      // Store in activities table with audit prefix
      await storage.createActivity({
        contractId: event.contractId || 'audit-system',
        action: `audit_${event.eventType}`,
        actorEmail: `user_${event.userId}`,
        details: JSON.stringify({
          ...auditEvent,
          auditId,
          hash: this.generateEventHash(auditEvent)
        })
      });

      // Log critical events to console
      if (event.severity === 'critical' || event.severity === 'error') {
        console.error(`AUDIT [${event.severity.toUpperCase()}]: ${event.action}`, {
          userId: event.userId,
          eventType: event.eventType,
          details: event.details
        });
      }

      return auditId;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  }

  /**
   * Log authorization events
   */
  async logAuthorizationEvent(
    userId: string,
    action: 'created' | 'updated' | 'revoked' | 'expired',
    authorizationId: string,
    details: Record<string, any>,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<string> {
    return this.logEvent({
      userId,
      eventType: action === 'created' ? 'authorization_created' : 'authorization_revoked',
      entityId: authorizationId,
      action: `Authorization ${action}`,
      details: {
        authorizationId,
        ...details
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      severity: action === 'revoked' ? 'warning' : 'info',
      complianceRelevant: true,
      retentionYears: 7 // Financial records retention
    });
  }

  /**
   * Log payment events
   */
  async logPaymentEvent(
    userId: string,
    action: 'attempt' | 'success' | 'failed' | 'refunded',
    paymentId: string,
    amount: number,
    details: Record<string, any>,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<string> {
    const eventType = action === 'attempt' ? 'payment_attempt' : 
                     action === 'success' ? 'payment_success' : 'payment_failed';

    return this.logEvent({
      userId,
      eventType,
      entityId: paymentId,
      action: `Payment ${action}`,
      details: {
        paymentId,
        amount,
        ...details
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      severity: action === 'failed' ? 'error' : 'info',
      complianceRelevant: true,
      retentionYears: 7
    });
  }

  /**
   * Log approval events
   */
  async logApprovalEvent(
    userId: string,
    action: 'granted' | 'denied',
    milestoneId: string,
    amount: number,
    details: Record<string, any>,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<string> {
    return this.logEvent({
      userId,
      eventType: action === 'granted' ? 'approval_granted' : 'approval_denied',
      entityId: milestoneId,
      action: `Milestone approval ${action}`,
      details: {
        milestoneId,
        amount,
        ...details
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      severity: 'info',
      complianceRelevant: true,
      retentionYears: 7
    });
  }

  /**
   * Log dispute events
   */
  async logDisputeEvent(
    userId: string,
    action: 'opened' | 'resolved' | 'closed',
    disputeId: string,
    details: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      userId,
      eventType: action === 'opened' ? 'dispute_opened' : 'dispute_resolved',
      entityId: disputeId,
      action: `Dispute ${action}`,
      details: {
        disputeId,
        ...details
      },
      severity: action === 'opened' ? 'warning' : 'info',
      complianceRelevant: true,
      retentionYears: 7
    });
  }

  /**
   * Log administrative actions
   */
  async logAdminAction(
    adminUserId: string,
    action: string,
    targetEntityId: string,
    details: Record<string, any>,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<string> {
    return this.logEvent({
      userId: adminUserId,
      eventType: 'admin_action',
      entityId: targetEntityId,
      action: `Admin: ${action}`,
      details: {
        targetEntityId,
        adminAction: action,
        ...details
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      severity: 'warning',
      complianceRelevant: true,
      retentionYears: 7
    });
  }

  /**
   * Get audit trail for entity
   */
  async getAuditTrail(
    entityId: string,
    options?: {
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<AuditEvent[]> {
    try {
      const activities = await storage.getActivityByContract('audit-system') || [];
      
      return activities
        .filter(activity => {
          if (!activity.action.startsWith('audit_')) return false;
          
          try {
            const details = typeof activity.details === 'string' ? 
              JSON.parse(activity.details) : activity.details;
            
            if (entityId && details.entityId !== entityId) return false;
            if (options?.eventType && details.eventType !== options.eventType) return false;
            
            if (options?.startDate || options?.endDate) {
              const eventDate = new Date(details.timestamp);
              if (options.startDate && eventDate < options.startDate) return false;
              if (options.endDate && eventDate > options.endDate) return false;
            }
            
            return true;
          } catch {
            return false;
          }
        })
        .slice(0, options?.limit || 1000)
        .map(activity => {
          try {
            const details = typeof activity.details === 'string' ? 
              JSON.parse(activity.details) : activity.details;
            return details as AuditEvent;
          } catch {
            return null;
          }
        })
        .filter((event): event is AuditEvent => event !== null)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
      console.error('Error getting audit trail:', error);
      return [];
    }
  }

  /**
   * Get compliance metrics
   */
  async getComplianceMetrics(timeframe: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    totalEvents: number;
    authorizationEvents: number;
    paymentEvents: number;
    disputeEvents: number;
    failedPayments: number;
    revokedAuthorizations: number;
    complianceIssues: number;
  }> {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const activities = await storage.getActivityByContract('audit-system') || [];
      const relevantEvents = activities
        .filter(activity => {
          if (!activity.action.startsWith('audit_')) return false;
          const createdAt = new Date(activity.createdAt || '');
          return createdAt >= startDate;
        })
        .map(activity => {
          try {
            const details = typeof activity.details === 'string' ? 
              JSON.parse(activity.details) : activity.details;
            return details as AuditEvent;
          } catch {
            return null;
          }
        })
        .filter((event): event is AuditEvent => event !== null);

      return {
        totalEvents: relevantEvents.length,
        authorizationEvents: relevantEvents.filter(e => 
          e.eventType.includes('authorization')).length,
        paymentEvents: relevantEvents.filter(e => 
          e.eventType.includes('payment')).length,
        disputeEvents: relevantEvents.filter(e => 
          e.eventType.includes('dispute')).length,
        failedPayments: relevantEvents.filter(e => 
          e.eventType === 'payment_failed').length,
        revokedAuthorizations: relevantEvents.filter(e => 
          e.eventType === 'authorization_revoked').length,
        complianceIssues: relevantEvents.filter(e => 
          e.severity === 'error' || e.severity === 'critical').length
      };
    } catch (error) {
      console.error('Error getting compliance metrics:', error);
      return {
        totalEvents: 0,
        authorizationEvents: 0,
        paymentEvents: 0,
        disputeEvents: 0,
        failedPayments: 0,
        revokedAuthorizations: 0,
        complianceIssues: 0
      };
    }
  }

  /**
   * Clean up old audit logs (2+ years)
   */
  async cleanupOldLogs(): Promise<number> {
    try {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const activities = await storage.getActivityByContract('audit-system') || [];
      let cleanedCount = 0;

      for (const activity of activities) {
        try {
          const details = typeof activity.details === 'string' ? 
            JSON.parse(activity.details) : activity.details;
          
          const eventDate = new Date(details.timestamp);
          const retentionYears = details.retentionYears || 2;
          const expiryDate = new Date(eventDate);
          expiryDate.setFullYear(expiryDate.getFullYear() + retentionYears);

          if (new Date() > expiryDate) {
            // In a real implementation, you would delete the activity
            // For now, we just count what would be deleted
            cleanedCount++;
          }
        } catch {
          // Skip invalid entries
        }
      }

      console.log(`Audit cleanup: ${cleanedCount} old records identified for removal`);
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      return 0;
    }
  }

  /**
   * Generate secure hash for audit event integrity
   */
  private generateEventHash(event: AuditEvent): string {
    const hashData = `${event.userId}:${event.eventType}:${event.action}:${event.timestamp}:${JSON.stringify(event.details)}`;
    return crypto.createHash('sha256').update(hashData).digest('hex');
  }

  /**
   * Verify audit event integrity
   */
  async verifyEventIntegrity(auditId: string): Promise<boolean> {
    try {
      const activities = await storage.getActivityByContract('audit-system') || [];
      const activity = activities.find(a => {
        try {
          const details = typeof a.details === 'string' ? JSON.parse(a.details) : a.details;
          return details.auditId === auditId;
        } catch {
          return false;
        }
      });

      if (!activity) return false;

      const details = typeof activity.details === 'string' ? 
        JSON.parse(activity.details) : activity.details;
      
      const storedHash = details.hash;
      const computedHash = this.generateEventHash(details);
      
      return storedHash === computedHash;
    } catch (error) {
      console.error('Error verifying event integrity:', error);
      return false;
    }
  }
}

export { AuditEvent, AuthorizationRecord, DisputeRecord };