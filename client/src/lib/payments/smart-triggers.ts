import { FreelanceContractService } from '@/lib/solana/contract-service';
import { apiRequest } from '@/lib/queryClient';

export interface MilestoneSubmissionData {
  milestoneIndex: number;
  proofUri: string;
  completionNotes: string;
  deliverables?: string[];
}

export interface PaymentReleaseData {
  contractId: string;
  milestoneId: string;
  amount: number;
  transactionId: string;
  paymentMethod: 'stripe' | 'usdc';
  releasedAt: Date;
}

export interface ContractEvent {
  contractId: string;
  milestoneIndex?: number;
  amount?: number;
  reason?: string;
  timestamp: Date;
}

export class SmartPaymentTriggers {
  private contractService: FreelanceContractService | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  
  constructor(contractService?: FreelanceContractService) {
    this.contractService = contractService || null;
    this.setupEventListeners();
  }

  // Called when freelancer submits milestone
  async onMilestoneSubmitted(
    contractId: string,
    milestoneId: string,
    proofData: MilestoneSubmissionData
  ): Promise<string> {
    try {
      console.log(`Processing milestone submission for contract ${contractId}`);
      
      // 1. Record submission on blockchain (if crypto payment)
      let blockchainTx = null;
      if (this.contractService) {
        try {
          blockchainTx = await this.contractService.submitMilestone(
            contractId,
            proofData.milestoneIndex,
            proofData.proofUri
          );
          console.log(`Blockchain submission successful: ${blockchainTx}`);
        } catch (error) {
          console.warn('Blockchain submission failed, continuing with database update:', error);
        }
      }

      // 2. Update database via API
      const updateResponse = await apiRequest(`/api/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          completionNotes: proofData.completionNotes,
          deliverables: proofData.deliverables,
          submissionTx: blockchainTx,
        })
      });

      // 3. Notify client via API
      await this.notifyClient(contractId, milestoneId, 'milestone_submitted');

      // 4. Schedule auto-approval (7 days)
      await this.scheduleAutoApproval(milestoneId, 7);

      // 5. Emit event
      this.emitEvent('milestone_submitted', {
        contractId,
        milestoneIndex: proofData.milestoneIndex,
        timestamp: new Date()
      });

      return blockchainTx || `db_update_${Date.now()}`;
    } catch (error) {
      console.error('Milestone submission failed:', error);
      throw new Error(`Failed to submit milestone: ${error.message}`);
    }
  }

  // Called when client approves milestone
  async onMilestoneApproved(
    contractId: string,
    milestoneId: string,
    approverId: string,
    freelancerWallet?: string
  ): Promise<PaymentReleaseData> {
    try {
      console.log(`Processing milestone approval for contract ${contractId}`);
      
      // 1. Get contract and milestone data
      const contract = await this.getContract(contractId);
      const milestone = await this.getMilestone(milestoneId);

      let paymentTx = null;
      let paymentMethod = contract.paymentMethod as 'stripe' | 'usdc';

      // 2. Execute blockchain approval for USDC payments
      if (paymentMethod === 'usdc' && this.contractService && freelancerWallet) {
        try {
          const { PublicKey } = await import('@solana/web3.js');
          const freelancerPubkey = new PublicKey(freelancerWallet);
          paymentTx = await this.contractService.approveMilestone(
            contractId,
            milestone.index,
            freelancerPubkey
          );
          console.log(`Blockchain payment released: ${paymentTx}`);
        } catch (error) {
          console.error('Blockchain payment failed:', error);
          // Fallback to database-only approval
        }
      }

      // 3. Handle Stripe payments
      if (paymentMethod === 'stripe') {
        paymentTx = await this.releaseStripePayment(contract, milestone);
      }

      // 4. Update milestone status
      await apiRequest(`/api/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'paid',
          approvedAt: new Date().toISOString(),
          approvedBy: approverId,
          paymentTx,
          paymentReleased: true
        })
      });

      // 5. Check if contract is complete
      await this.checkContractCompletion(contractId);

      // 6. Notify both parties
      await this.notifyClient(contractId, milestoneId, 'milestone_approved');
      await this.notifyFreelancer(contractId, milestoneId, 'payment_released');

      // 7. Emit event
      this.emitEvent('milestone_approved', {
        contractId,
        milestoneIndex: milestone.index,
        amount: parseFloat(milestone.amount),
        timestamp: new Date()
      });

      const paymentData: PaymentReleaseData = {
        contractId,
        milestoneId,
        amount: parseFloat(milestone.amount),
        transactionId: paymentTx || `fallback_${Date.now()}`,
        paymentMethod,
        releasedAt: new Date()
      };

      return paymentData;
    } catch (error) {
      console.error('Milestone approval failed:', error);
      throw new Error(`Failed to approve milestone: ${error.message}`);
    }
  }

  // Stripe payment release simulation
  private async releaseStripePayment(contract: any, milestone: any): Promise<string> {
    try {
      console.log(`Simulating Stripe payment release for $${milestone.amount}`);
      
      // Simulate API call to Stripe
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would:
      // 1. Capture the held payment from escrow
      // 2. Transfer to freelancer's Stripe account
      // 3. Deduct platform fees
      
      const mockTransferId = `pi_${Math.random().toString(36).substr(2, 24)}`;
      
      // Record payment in database
      await apiRequest('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          contractId: contract.id,
          milestoneId: milestone.id,
          amount: milestone.amount,
          paymentMethod: 'stripe',
          status: 'completed',
          transactionId: mockTransferId,
          platformFee: parseFloat(milestone.amount) * 0.025, // 2.5% fee
          netAmount: parseFloat(milestone.amount) * 0.975
        })
      });

      return mockTransferId;
    } catch (error) {
      console.error('Stripe payment release failed:', error);
      throw error;
    }
  }

  // Auto-approval mechanism
  private async scheduleAutoApproval(milestoneId: string, daysToWait: number): Promise<void> {
    console.log(`Scheduling auto-approval for milestone ${milestoneId} in ${daysToWait} days`);
    
    // In production, this would use a job queue like BullMQ or Redis
    // For demo purposes, we'll simulate the scheduling
    setTimeout(async () => {
      try {
        const milestone = await this.getMilestone(milestoneId);
        
        if (milestone && milestone.status === 'submitted') {
          console.log(`Auto-approving milestone ${milestoneId} after ${daysToWait} days`);
          
          await this.onMilestoneApproved(
            milestone.contractId,
            milestoneId,
            'system_auto_approval'
          );
          
          // Notify both parties about auto-approval
          await this.sendAutoApprovalNotification(milestone);
        }
      } catch (error) {
        console.error('Auto-approval failed:', error);
      }
    }, daysToWait * 24 * 60 * 60 * 1000); // Convert days to milliseconds
  }

  // Setup blockchain event listeners
  private setupEventListeners(): void {
    if (!this.contractService) return;

    // Listen for milestone approvals on Solana
    try {
      this.contractService.addEventListener('MilestoneApproved', async (event: any) => {
        console.log('Milestone approved on blockchain:', event);
        
        // Sync blockchain state with database
        await this.syncBlockchainState(event.contractId);
        
        // Send payment confirmation
        await this.sendPaymentConfirmation(
          event.contractId,
          event.milestoneIndex,
          event.amount
        );
      });

      // Listen for contract disputes
      this.contractService.addEventListener('ContractDisputed', async (event: any) => {
        console.log('Contract dispute detected:', event);
        await this.handleDispute(event.contractId, event.reason);
      });
    } catch (error) {
      console.warn('Failed to setup blockchain event listeners:', error);
    }
  }

  // Sync blockchain state with database
  private async syncBlockchainState(contractId: string): Promise<void> {
    if (!this.contractService) return;

    try {
      const blockchainContract = await this.contractService.getContractData(contractId);
      
      await apiRequest(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          escrowBalance: blockchainContract.escrowBalance,
          amountReleased: blockchainContract.amountReleased,
          completedMilestones: blockchainContract.completedMilestones,
          isCompleted: blockchainContract.isCompleted
        })
      });
    } catch (error) {
      console.error('Failed to sync blockchain state:', error);
    }
  }

  // Utility methods
  private async getContract(contractId: string): Promise<any> {
    try {
      return await apiRequest(`/api/contracts/${contractId}`);
    } catch (error) {
      console.error('Failed to get contract:', error);
      throw error;
    }
  }

  private async getMilestone(milestoneId: string): Promise<any> {
    try {
      return await apiRequest(`/api/milestones/${milestoneId}`);
    } catch (error) {
      console.error('Failed to get milestone:', error);
      throw error;
    }
  }

  private async checkContractCompletion(contractId: string): Promise<void> {
    try {
      // Get all milestones for the contract
      const milestones = await apiRequest(`/api/contracts/${contractId}/milestones`);
      const allPaid = milestones.every((m: any) => m.status === 'paid');
      
      if (allPaid) {
        await apiRequest(`/api/contracts/${contractId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'completed',
            completedAt: new Date().toISOString()
          })
        });
        
        this.emitEvent('contract_completed', {
          contractId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to check contract completion:', error);
    }
  }

  // Notification methods
  private async notifyClient(contractId: string, milestoneId: string, eventType: string): Promise<void> {
    console.log(`Notifying client about ${eventType} for milestone ${milestoneId}`);
    // In production, send email/SMS notification
  }

  private async notifyFreelancer(contractId: string, milestoneId: string, eventType: string): Promise<void> {
    console.log(`Notifying freelancer about ${eventType} for milestone ${milestoneId}`);
    // In production, send email/SMS notification
  }

  private async sendAutoApprovalNotification(milestone: any): Promise<void> {
    console.log(`Sending auto-approval notification for milestone ${milestone.id}`);
    // In production, send notification to both parties
  }

  private async sendPaymentConfirmation(contractId: string, milestoneIndex: number, amount: number): Promise<void> {
    console.log(`Sending payment confirmation for milestone ${milestoneIndex}: $${amount}`);
    // In production, send payment receipt
  }

  private async handleDispute(contractId: string, reason: string): Promise<void> {
    console.log(`Handling dispute for contract ${contractId}: ${reason}`);
    
    // Update contract status
    await apiRequest(`/api/contracts/${contractId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'disputed',
        disputeReason: reason,
        disputedAt: new Date().toISOString()
      })
    });
    
    // Notify dispute resolution team
    this.emitEvent('contract_disputed', {
      contractId,
      reason,
      timestamp: new Date()
    });
  }

  // Event system
  private emitEvent(eventName: string, data: ContractEvent): void {
    const listeners = this.eventListeners.get(eventName) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Event listener error for ${eventName}:`, error);
      }
    });
  }

  public addEventListener(eventName: string, callback: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(callback);
  }

  public removeEventListener(eventName: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventName) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  // Initialize payment automation for a contract
  public async initializeContract(contractId: string): Promise<void> {
    console.log(`Initializing payment automation for contract ${contractId}`);
    
    // Set up contract-specific event listeners
    this.addEventListener('milestone_submitted', (event) => {
      if (event.contractId === contractId) {
        console.log(`Contract ${contractId} milestone submitted`);
      }
    });
    
    this.addEventListener('milestone_approved', (event) => {
      if (event.contractId === contractId) {
        console.log(`Contract ${contractId} milestone approved`);
      }
    });
  }
}

// Singleton instance for global use
export const paymentTriggers = new SmartPaymentTriggers();

// Helper functions
export const submitMilestone = async (
  contractId: string,
  milestoneId: string,
  data: MilestoneSubmissionData
): Promise<string> => {
  return paymentTriggers.onMilestoneSubmitted(contractId, milestoneId, data);
};

export const approveMilestone = async (
  contractId: string,
  milestoneId: string,
  approverId: string,
  freelancerWallet?: string
): Promise<PaymentReleaseData> => {
  return paymentTriggers.onMilestoneApproved(contractId, milestoneId, approverId, freelancerWallet);
};

export const initializeContractAutomation = async (contractId: string): Promise<void> => {
  return paymentTriggers.initializeContract(contractId);
};