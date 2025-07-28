import { smartContractService, SmartContractConfig, BlockchainDeployment } from "../shared/blockchain.js";
import { storage } from "./storage.js";

/**
 * Server-side blockchain integration service
 * Handles smart contract deployment for all payment methods
 */
export class BlockchainIntegrationService {
  
  /**
   * Deploy smart contract for a new contract
   * Automatically triggered after contract creation
   */
  async deployContractBlockchain(contractId: string): Promise<void> {
    try {
      console.log(`Starting blockchain deployment for contract ${contractId}`);
      
      // Get contract details from database
      const contract = await storage.getContract(contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }
      
      // Get contract milestones
      const milestones = await storage.getMilestonesByContract(contractId);
      
      // Prepare smart contract configuration
      const config: SmartContractConfig = {
        contractId: contract.id,
        paymentMethod: contract.paymentMethod as any,
        totalAmount: Math.round(parseFloat(contract.totalValue) * 100), // Convert to cents
        milestones: milestones.map(milestone => ({
          id: milestone.id,
          title: milestone.title,
          amount: Math.round(parseFloat(milestone.amount) * 100), // Convert to cents
          dueDate: milestone.dueDate,
          deliverables: milestone.description,
          status: milestone.status as any
        }))
      };
      
      // Deploy the smart contract
      const deployment = await smartContractService.deployContract(config);
      
      // Update contract with blockchain deployment details
      await this.updateContractWithBlockchainData(contractId, deployment);
      
      console.log(`Blockchain deployment completed for contract ${contractId}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Blockchain deployment failed for contract ${contractId}:`, errorMessage);
      
      // Update contract status to show deployment failure
      await storage.updateContract(contractId, {
        blockchainStatus: "failed",
        metadataUri: `Error: ${errorMessage}`
      });
      
      throw error;
    }
  }
  
  /**
   * Update contract with blockchain deployment data
   */
  private async updateContractWithBlockchainData(
    contractId: string, 
    deployment: BlockchainDeployment
  ): Promise<void> {
    await storage.updateContract(contractId, {
      solanaProgramAddress: deployment.contractAddress,
      escrowAddress: deployment.escrowAddress,
      blockchainNetwork: deployment.network,
      deploymentTx: deployment.deploymentTx,
      blockchainStatus: "deployed"
    });
  }
  
  /**
   * Handle Stripe payment confirmation
   * Activates the smart contract when payment is received
   */
  async handleStripePaymentConfirmation(
    paymentIntentId: string, 
    contractId: string
  ): Promise<void> {
    try {
      console.log(`Processing Stripe payment confirmation for contract ${contractId}`);
      
      // Verify the contract exists and has been deployed
      const contract = await storage.getContract(contractId);
      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }
      
      if (contract.blockchainStatus !== "deployed") {
        throw new Error(`Contract ${contractId} blockchain not deployed yet`);
      }
      
      // Activate the smart contract
      await smartContractService.onStripePaymentConfirmed(paymentIntentId, contractId);
      
      // Update contract status
      await storage.updateContract(contractId, {
        blockchainStatus: "active",
        status: "active",
        activatedAt: new Date()
      });
      
      // Create payment record
      await storage.createPayment({
        contractId: contractId,
        amount: contract.totalValue,
        method: contract.paymentMethod,
        status: "escrowed",
        stripePaymentIntentId: paymentIntentId,
        solanaEscrowAccount: contract.escrowAddress
      });
      
      console.log(`Smart contract activated for contract ${contractId}`);
      
    } catch (error) {
      console.error(`Failed to activate smart contract for contract ${contractId}:`, error);
      throw error;
    }
  }
  
  /**
   * Process milestone completion and payment
   */
  async processMilestoneCompletion(
    contractId: string,
    milestoneId: string,
    approved: boolean,
    approvedBy: string
  ): Promise<void> {
    try {
      const contract = await storage.getContract(contractId);
      if (!contract || contract.blockchainStatus !== "active") {
        throw new Error(`Contract ${contractId} is not active on blockchain`);
      }
      
      if (approved) {
        // Process payment through smart contract
        await smartContractService.processMilestonePayment(
          contract.solanaProgramAddress!,
          milestoneId,
          true
        );
        
        // Update milestone status
        await storage.updateMilestone(milestoneId, {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: approvedBy,
          paymentReleased: true
        });
        
        // Create payment record for milestone
        const milestone = await storage.getMilestone(milestoneId);
        if (milestone) {
          await storage.createPayment({
            contractId: contractId,
            milestoneId: milestoneId,
            amount: milestone.amount,
            method: contract.paymentMethod,
            status: "released",
            solanaEscrowAccount: contract.escrowAddress,
            releasedTx: `milestone_${milestoneId}_${Date.now()}`
          });
        }
        
      } else {
        // Handle rejection
        await storage.updateMilestone(milestoneId, {
          status: "pending",
          approvedBy: approvedBy
        });
      }
      
    } catch (error) {
      console.error(`Failed to process milestone completion:`, error);
      throw error;
    }
  }
  
  /**
   * Check if all milestones are completed
   */
  async checkContractCompletion(contractId: string): Promise<void> {
    const milestones = await storage.getMilestonesByContract(contractId);
    const completedMilestones = milestones.filter(m => m.status === "approved");
    
    if (completedMilestones.length === milestones.length && milestones.length > 0) {
      // All milestones completed, mark contract as completed
      await storage.updateContract(contractId, {
        status: "completed",
        blockchainStatus: "completed",
        completedAt: new Date()
      });
      
      console.log(`Contract ${contractId} completed - all milestones approved`);
    }
  }
  
  /**
   * Get blockchain status for a contract
   */
  async getBlockchainStatus(contractId: string): Promise<{
    status: string;
    contractAddress?: string;
    escrowAddress?: string;
    deploymentTx?: string;
    network?: string;
  }> {
    const contract = await storage.getContract(contractId);
    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }
    
    return {
      status: contract.blockchainStatus || "pending",
      contractAddress: contract.solanaProgramAddress || undefined,
      escrowAddress: contract.escrowAddress || undefined,
      deploymentTx: contract.deploymentTx || undefined,
      network: contract.blockchainNetwork || undefined
    };
  }
}

// Export singleton instance
export const blockchainService = new BlockchainIntegrationService();