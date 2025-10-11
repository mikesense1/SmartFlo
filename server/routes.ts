import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiContractService } from "./openai-service";
import { blockchainService } from "./blockchain-service";
import emailRoutes from "./email-routes";
import { 
  insertUserSchema, insertContactSchema, insertContractSchema, 
  insertMilestoneSchema, insertPaymentSchema, insertContractActivitySchema 
} from "@shared/schema";
import { calculateTotalWithFees, formatCurrency, TRANSACTION_FEE_CONFIG, type PaymentMethod } from "@shared/pricing";
// Mock SmartPaymentTriggers for backend operations
class SmartPaymentTriggers {
  async initializeContract(contractId: string) {
    console.log(`Initializing payment automation for contract ${contractId}`);
    return { contractId, status: "initialized" };
  }

  async onMilestoneSubmitted(contractId: string, milestoneId: string, submissionData: any) {
    console.log(`Processing milestone submission: ${milestoneId} for contract ${contractId}`);
    const transactionId = `tx_${Math.random().toString(36).substr(2, 12)}`;
    return transactionId;
  }

  async onMilestoneApproved(contractId: string, milestoneId: string, approverId: string, walletAddress: string) {
    console.log(`Processing milestone approval: ${milestoneId} for contract ${contractId}`);
    return {
      transactionId: `tx_${Math.random().toString(36).substr(2, 12)}`,
      amount: 1000,
      paymentMethod: "usdc",
      walletAddress
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    const { signup } = await import("./auth");
    return signup(req, res);
  });

  app.post("/api/auth/login", async (req, res) => {
    const { login } = await import("./auth");
    return login(req, res);
  });

  app.post("/api/auth/logout", async (req, res) => {
    const { logout } = await import("./auth");
    return logout(req, res);
  });

  app.get("/api/auth/me", async (req, res) => {
    const { getCurrentUser } = await import("./auth");
    return getCurrentUser(req, res);
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ message: "User created successfully", userId: user.id });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId || userId !== req.params.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updateData = req.body;
      console.log("Updating user profile:", updateData);
      
      const updatedUser = await storage.updateUser(req.params.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Client contract routes
  app.get("/api/client-contracts", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get contracts where user is the client (by clientId or clientEmail)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // For now, return contracts where clientEmail matches user email
      const allContracts = await storage.getContracts();
      const clientContracts = allContracts.filter(contract => 
        contract.clientEmail === user.email || contract.clientId === userId
      );
      
      res.json(clientContracts);
    } catch (error) {
      console.error("Failed to fetch client contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  // Contract management routes
  app.post("/api/contracts/:id/send", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const contract = await storage.getContract(req.params.id);
      if (!contract || contract.creatorId !== userId) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Update contract status to 'sent' and set sentAt timestamp
      await storage.updateContract(req.params.id, {
        status: "sent",
        sentAt: new Date()
      });

      // Log activity
      await storage.createActivity({
        contractId: req.params.id,
        action: "contract_sent",
        description: `Contract sent to ${contract.clientEmail}`,
        timestamp: new Date()
      });

      res.json({ message: "Contract sent successfully" });
    } catch (error) {
      console.error("Failed to send contract:", error);
      res.status(500).json({ message: "Failed to send contract" });
    }
  });

  app.post("/api/contracts/:id/request-payment", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const contract = await storage.getContract(req.params.id);
      if (!contract || contract.creatorId !== userId) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Log activity
      await storage.createActivity({
        contractId: req.params.id,
        action: "payment_requested",
        description: `Payment request sent to ${contract.clientEmail}`,
        timestamp: new Date()
      });

      res.json({ message: "Payment request sent successfully" });
    } catch (error) {
      console.error("Failed to request payment:", error);
      res.status(500).json({ message: "Failed to request payment" });
    }
  });

  // Contract routes with authentication
  app.get("/api/contracts", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log(`Fetching contracts for user: ${userId}`);
      const contracts = await storage.getContractsByUser(userId);
      console.log(`Successfully retrieved ${contracts.length} contracts for user`);
      res.json(contracts);
    } catch (error) {
      console.error("Failed to fetch contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log("Creating contract with data:", req.body);
      const contractData = insertContractSchema.parse({
        ...req.body,
        creatorId: userId // Ensure contract is associated with authenticated user
      });
      const contract = await storage.createContract(contractData);
      console.log("Contract created successfully:", contract);
      
      // Log contract creation activity
      await storage.createActivity({
        contractId: contract.id,
        action: "created",
        actorEmail: contractData.clientEmail,
        details: { contractTitle: contract.title }
      });
      
      // Automatically deploy smart contract for all payment methods
      try {
        console.log(`Deploying smart contract for contract ${contract.id}`);
        await blockchainService.deployContractBlockchain(contract.id);
        console.log(`Smart contract deployed successfully for contract ${contract.id}`);
      } catch (blockchainError) {
        console.error(`Smart contract deployment failed for contract ${contract.id}:`, blockchainError);
        // Contract creation succeeds even if blockchain deployment fails
        // Frontend can show deployment status and retry if needed
      }
      
      res.json(contract); // Return the full contract object
    } catch (error) {
      console.error("Contract creation error:", error);
      res.status(400).json({ message: "Invalid contract data", error: error.message });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Ensure user can only access their own contracts
      if (contract.creatorId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  app.get("/api/users/:userId/contracts", async (req, res) => {
    try {
      const authenticatedUserId = (req as any).session?.userId;
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const requestedUserId = req.params.userId;
      
      // Users can only access their own contracts
      if (requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const contracts = await storage.getContractsByUser(requestedUserId);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.patch("/api/contracts/:id", async (req, res) => {
    try {
      const updates = req.body;
      const contract = await storage.updateContract(req.params.id, updates);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(400).json({ message: "Failed to update contract" });
    }
  });

  // Get contract document by ID
  app.get("/api/contracts/:id/document", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      if (!contract.generatedContract) {
        return res.status(404).json({ 
          error: "Contract document not available",
          message: "This contract does not have a generated document. It may have been created before AI generation was available."
        });
      }
      
      res.json({ 
        document: contract.generatedContract,
        contractId: contract.id,
        title: contract.title,
        clientName: contract.clientName
      });
    } catch (error) {
      console.error("Failed to get contract document:", error);
      res.status(500).json({ error: "Failed to get contract document" });
    }
  });

  // Milestone routes
  app.post("/api/milestones", async (req, res) => {
    try {
      console.log("Creating milestone with data:", req.body);
      const milestoneData = insertMilestoneSchema.parse(req.body);
      const milestone = await storage.createMilestone(milestoneData);
      res.json({ message: "Milestone created successfully", milestoneId: milestone.id });
    } catch (error) {
      console.error("Milestone creation error:", error);
      res.status(400).json({ message: "Invalid milestone data", error: error.message });
    }
  });

  app.get("/api/contracts/:contractId/milestones", async (req, res) => {
    try {
      const milestones = await storage.getMilestonesByContract(req.params.contractId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  app.patch("/api/milestones/:id", async (req, res) => {
    try {
      const updates = req.body;
      const milestone = await storage.updateMilestone(req.params.id, updates);
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      res.json(milestone);
    } catch (error) {
      res.status(400).json({ message: "Failed to update milestone" });
    }
  });

  // Payment routes
  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.json({ message: "Payment created successfully", paymentId: payment.id });
    } catch (error) {
      res.status(400).json({ message: "Invalid payment data" });
    }
  });

  app.get("/api/contracts/:contractId/payments", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByContract(req.params.contractId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Activity routes
  app.post("/api/activity", async (req, res) => {
    try {
      const activityData = insertContractActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.json(activity);
    } catch (error) {
      console.error("Activity creation error:", error);
      res.status(400).json({ message: "Invalid activity data", error: error.message });
    }
  });

  app.get("/api/contracts/:contractId/activity", async (req, res) => {
    try {
      const activities = await storage.getActivityByContract(req.params.contractId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Blockchain Operations API Routes
  
  // Advanced contract creation with blockchain deployment
  app.post("/api/contracts/create-advanced", async (req, res) => {
    try {
      const { title, client, milestones, paymentMethod, totalValue } = req.body;
      const userId = req.body.creatorId || "user-123"; // Mock user for demo
      
      console.log(`Creating advanced contract: ${title} with ${paymentMethod} payment`);
      
      // 1. Create contract in database
      const contractData = {
        creatorId: userId,
        title,
        clientName: client.name || client.clientName,
        clientEmail: client.email || client.clientEmail,
        projectDescription: req.body.description || `Advanced contract for ${title}`,
        totalValue: totalValue.toString(),
        paymentMethod,
        contractType: "milestone_based"
      };
      
      const contract = await storage.createContract(contractData);
      
      // 2. Create milestones
      if (milestones && milestones.length > 0) {
        for (let i = 0; i < milestones.length; i++) {
          const milestone = milestones[i];
          await storage.createMilestone({
            contractId: contract.id,
            title: milestone.title,
            description: milestone.deliverables || milestone.description,
            amount: milestone.amount.toString(),
            dueDate: milestone.dueDate,
            status: "pending"
          });
        }
      }
      
      // 3. Simulate blockchain deployment for USDC contracts
      if (paymentMethod === 'usdc') {
        console.log(`Deploying smart contract for contract ${contract.id}`);
        
        // Simulate contract deployment
        const mockContractAddress = `${Math.random().toString(36).substr(2, 44)}`;
        const mockEscrowAddress = `${Math.random().toString(36).substr(2, 44)}`;
        
        // In production, this would deploy actual Solana contract
        await storage.createActivity({
          contractId: contract.id,
          action: "blockchain_deployed",
          actorEmail: "system",
          details: { 
            contractAddress: mockContractAddress,
            escrowAddress: mockEscrowAddress,
            paymentMethod 
          }
        });
      }
      
      // 4. Initialize payment automation
      const smartTriggers = new SmartPaymentTriggers();
      await smartTriggers.initializeContract(contract.id);
      
      res.json({ 
        success: true, 
        contractId: contract.id,
        message: "Advanced contract created with blockchain integration"
      });
      
    } catch (error) {
      console.error("Contract creation failed:", error);
      res.status(500).json({ 
        error: "Contract creation failed",
        details: error.message 
      });
    }
  });

  // Milestone submission with blockchain integration
  app.post("/api/milestones/submit", async (req, res) => {
    try {
      const { milestoneId, contractId, completionNotes, proofUrl, deliverables } = req.body;
      
      console.log(`Submitting milestone ${milestoneId} for contract ${contractId}`);
      
      // Get contract and milestone data
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      // Use smart payment triggers for submission
      const smartTriggers = new SmartPaymentTriggers();
      
      const submissionData = {
        milestoneIndex: 0, // Mock index
        proofUri: proofUrl || `ipfs://milestone-${milestoneId}-proof`,
        completionNotes: completionNotes || "Milestone completed",
        deliverables: deliverables || []
      };
      
      const transactionId = await smartTriggers.onMilestoneSubmitted(
        contractId,
        milestoneId,
        submissionData
      );
      
      // Update milestone status
      await storage.updateMilestone(milestoneId, {
        status: "submitted",
        submittedAt: new Date().toISOString()
      });
      
      // Log activity
      await storage.createActivity({
        contractId,
        action: "milestone_submitted",
        actorEmail: "freelancer@example.com",
        details: { milestoneId, transactionId, completionNotes }
      });
      
      res.json({ 
        success: true, 
        transactionId,
        message: "Milestone submitted successfully"
      });
      
    } catch (error) {
      console.error("Milestone submission failed:", error);
      res.status(500).json({ 
        error: "Milestone submission failed",
        details: error.message 
      });
    }
  });

  // Milestone approval with automatic payment release
  app.post("/api/milestones/approve", async (req, res) => {
    try {
      const { milestoneId, contractId, approverId, approvalNotes } = req.body;
      
      console.log(`Approving milestone ${milestoneId} for contract ${contractId}`);
      
      // Get contract data
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      // Use smart payment triggers for approval and payment
      const smartTriggers = new SmartPaymentTriggers();
      
      const paymentData = await smartTriggers.onMilestoneApproved(
        contractId,
        milestoneId,
        approverId || "client-123",
        "FreelancerWalletAddress" // Mock wallet
      );
      
      // Update milestone status
      await storage.updateMilestone(milestoneId, {
        status: "paid",
        approvedAt: new Date().toISOString(),
        paymentReleased: true
      });
      
      // Create payment record
      await storage.createPayment({
        contractId,
        milestoneId,
        amount: paymentData.amount.toString(),
        paymentMethod: paymentData.paymentMethod,
        status: "completed",
        transactionId: paymentData.transactionId
      });
      
      // Log activity
      await storage.createActivity({
        contractId,
        action: "milestone_approved_payment_released",
        actorEmail: "client@example.com",
        details: { 
          milestoneId, 
          amount: paymentData.amount,
          transactionId: paymentData.transactionId,
          paymentMethod: paymentData.paymentMethod
        }
      });
      
      res.json({ 
        success: true, 
        paymentData,
        message: "Milestone approved and payment released automatically"
      });
      
    } catch (error) {
      console.error("Milestone approval failed:", error);
      res.status(500).json({ 
        error: "Milestone approval failed",
        details: error.message 
      });
    }
  });

  // Contract funding (client payment)
  app.post("/api/contracts/fund", async (req, res) => {
    try {
      const { contractId, paymentMethod, amount, paymentDetails } = req.body;
      
      console.log(`Funding contract ${contractId} with ${paymentMethod}`);
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      // Simulate payment processing
      let transactionId;
      if (paymentMethod === 'stripe') {
        // Simulate Stripe payment intent
        transactionId = `pi_${Math.random().toString(36).substr(2, 24)}`;
      } else if (paymentMethod === 'usdc') {
        // Simulate USDC blockchain transaction
        transactionId = `${Math.random().toString(36).substr(2, 44)}`;
      }
      
      // Update contract status
      await storage.updateContract(contractId, {
        status: "funded",
        fundedAt: new Date().toISOString()
      });
      
      // Log funding activity
      await storage.createActivity({
        contractId,
        action: "contract_funded",
        actorEmail: "client@example.com",
        details: { 
          amount: amount.toString(),
          paymentMethod,
          transactionId
        }
      });
      
      // Initialize payment automation
      const smartTriggers = new SmartPaymentTriggers();
      await smartTriggers.initializeContract(contractId);
      
      res.json({ 
        success: true, 
        transactionId,
        message: "Contract funded successfully"
      });
      
    } catch (error) {
      console.error("Contract funding failed:", error);
      res.status(500).json({ 
        error: "Contract funding failed",
        details: error.message 
      });
    }
  });

  // Blockchain status and sync
  app.get("/api/contracts/:contractId/blockchain-status", async (req, res) => {
    try {
      const { contractId } = req.params;
      const status = await blockchainService.getBlockchainStatus(contractId);
      res.json(status);
    } catch (error) {
      console.error("Failed to get blockchain status:", error);
      res.status(500).json({ 
        error: "Failed to get blockchain status",
        details: error.message 
      });
    }
  });

  // Deploy smart contract manually (if auto-deployment failed)
  app.post("/api/contracts/:contractId/deploy-blockchain", async (req, res) => {
    try {
      const { contractId } = req.params;
      console.log(`Manual blockchain deployment requested for contract ${contractId}`);
      
      await blockchainService.deployContractBlockchain(contractId);
      
      res.json({ 
        success: true, 
        message: "Smart contract deployed successfully" 
      });
    } catch (error) {
      console.error("Manual blockchain deployment failed:", error);
      res.status(500).json({ 
        error: "Blockchain deployment failed",
        details: error.message 
      });
    }
  });

  // Stripe payment confirmation webhook
  app.post("/api/webhooks/stripe/:contractId", async (req, res) => {
    try {
      const { contractId } = req.params;
      const { paymentIntentId, status } = req.body;
      
      if (status === "succeeded") {
        console.log(`Stripe payment confirmed for contract ${contractId}`);
        await blockchainService.handleStripePaymentConfirmation(paymentIntentId, contractId);
        
        res.json({ 
          success: true, 
          message: "Payment confirmed and smart contract activated" 
        });
      } else {
        res.json({ message: "Payment not yet confirmed" });
      }
    } catch (error) {
      console.error("Stripe webhook processing failed:", error);
      res.status(500).json({ 
        error: "Webhook processing failed",
        details: error.message 
      });
    }
  });

  // Milestone approval with blockchain payment
  app.post("/api/contracts/:contractId/milestones/:milestoneId/approve", async (req, res) => {
    try {
      const { contractId, milestoneId } = req.params;
      const { approved, approvedBy } = req.body;
      
      console.log(`Processing milestone ${milestoneId} approval: ${approved ? 'approved' : 'rejected'}`);
      
      await blockchainService.processMilestoneCompletion(
        contractId,
        milestoneId,
        approved,
        approvedBy || "client"
      );
      
      // Check if contract is fully completed
      await blockchainService.checkContractCompletion(contractId);
      
      res.json({ 
        success: true, 
        message: approved ? "Milestone approved and payment released" : "Milestone rejected" 
      });
    } catch (error) {
      console.error("Milestone approval failed:", error);
      res.status(500).json({ 
        error: "Milestone approval failed",
        details: error.message 
      });
    }
  });

  // Webhook for Stripe payments
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const { type, data } = req.body;
      
      console.log(`Stripe webhook received: ${type}`);
      
      switch (type) {
        case 'payment_intent.succeeded':
          const contractId = data.object.metadata?.contractId;
          if (contractId) {
            await storage.updateContract(contractId, {
              status: "funded",
              fundedAt: new Date().toISOString()
            });
            
            await storage.createActivity({
              contractId,
              action: "stripe_payment_confirmed",
              actorEmail: "system",
              details: { paymentIntentId: data.object.id }
            });
          }
          break;
          
        case 'transfer.created':
          // Record freelancer payment
          await storage.createPayment({
            contractId: data.object.metadata?.contractId,
            amount: (data.object.amount / 100).toString(),
            paymentMethod: 'stripe',
            status: 'completed',
            transactionId: data.object.id
          });
          break;
      }
      
      res.json({ received: true });
      
    } catch (error) {
      console.error("Stripe webhook failed:", error);
      res.status(400).json({ 
        error: "Webhook processing failed",
        details: error.message 
      });
    }
  });

  // Pricing calculation endpoint
  app.post("/api/pricing/calculate", async (req, res) => {
    try {
      const { contractAmount, paymentMethod } = req.body;

      // Validate input
      if (!contractAmount || typeof contractAmount !== 'number' || contractAmount <= 0) {
        return res.status(400).json({
          error: 'Invalid contract amount. Must be a positive number.'
        });
      }

      if (!paymentMethod || !TRANSACTION_FEE_CONFIG[paymentMethod as PaymentMethod]) {
        return res.status(400).json({
          error: 'Invalid payment method. Must be one of: usdc, ach, card'
        });
      }

      // Calculate fees (contractAmount expected in cents)
      const pricing = calculateTotalWithFees(contractAmount, paymentMethod as PaymentMethod);
      
      res.json({
        success: true,
        data: {
          ...pricing,
          contractAmountFormatted: formatCurrency(pricing.contractAmount),
          transactionFeeFormatted: formatCurrency(pricing.transactionFee),
          totalAmountFormatted: formatCurrency(pricing.totalAmount),
          paymentMethod,
          feeConfig: TRANSACTION_FEE_CONFIG[paymentMethod as PaymentMethod]
        }
      });

    } catch (error) {
      console.error('Pricing calculation error:', error);
      res.status(500).json({
        error: 'Failed to calculate pricing',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get fee configuration
  app.get("/api/pricing/fees", async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          feeConfig: TRANSACTION_FEE_CONFIG,
          supportedMethods: Object.keys(TRANSACTION_FEE_CONFIG)
        }
      });
    } catch (error) {
      console.error('Error getting fee config:', error);
      res.status(500).json({ error: 'Failed to get fee configuration' });
    }
  });

  // Contact form submission (existing)
  app.post("/api/contacts", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.json({ message: "Contact form submitted successfully", contactId: contact.id });
    } catch (error) {
      res.status(400).json({ message: "Invalid contact data" });
    }
  });

  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Contract sharing and payment authorization routes
  app.get("/api/contracts/shared/:shareToken", async (req, res) => {
    try {
      const { shareToken } = req.params;
      
      // Get contract share by token
      const contractShare = await storage.getContractByShareToken(shareToken);
      if (!contractShare || !contractShare.isActive) {
        return res.status(404).json({ error: "Contract not found or expired" });
      }
      
      // Get contract details
      const contract = await storage.getContract(contractShare.contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      // Get milestones
      const milestones = await storage.getMilestones(contractShare.contractId);
      
      res.json({
        contract,
        milestones,
        shareInfo: {
          shareToken,
          expiresAt: contractShare.expiresAt,
          clientEmail: contractShare.clientEmail
        }
      });
    } catch (error) {
      console.error("Error fetching shared contract:", error);
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  app.post("/api/contracts/:shareToken/sign", async (req, res) => {
    try {
      const { shareToken } = req.params;
      const { signature } = req.body;
      
      if (!signature) {
        return res.status(400).json({ error: "Signature is required" });
      }
      
      // Get contract share by token
      const contractShare = await storage.getContractByShareToken(shareToken);
      if (!contractShare || !contractShare.isActive) {
        return res.status(404).json({ error: "Contract not found or expired" });
      }
      
      // Create signature record
      await storage.createContractSignature({
        contractId: contractShare.contractId,
        signerEmail: contractShare.clientEmail,
        signerRole: 'client',
        signatureMethod: 'email',
        signatureData: signature
      });
      
      // Update contract status to signed
      await storage.updateContract(contractShare.contractId, {
        status: 'signed'
      });
      
      // Log activity
      await storage.createActivity({
        contractId: contractShare.contractId,
        action: "contract_signed",
        actorEmail: contractShare.clientEmail,
        details: { signature, method: 'electronic' }
      });
      
      res.json({ 
        success: true, 
        message: "Contract signed successfully" 
      });
    } catch (error) {
      console.error("Error signing contract:", error);
      res.status(500).json({ error: "Failed to sign contract" });
    }
  });

  app.post("/api/contracts/authorize-payment", async (req, res) => {
    try {
      const { 
        contractId, 
        paymentMethod, 
        totalAmount, 
        largestMilestone,
        stripeSetupIntentId,
        stripePaymentMethodId,
        stripeCustomerId,
        walletAddress,
        signature,
        message
      } = req.body;
      
      if (!contractId || !paymentMethod || !totalAmount || !largestMilestone) {
        return res.status(400).json({ error: "Missing required authorization data" });
      }
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      // Get client IP and user agent for authorization record
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Create payment authorization record
      const authorizationData = {
        contractId,
        paymentMethod,
        maxPerMilestone: largestMilestone.toString(),
        totalAuthorized: totalAmount.toString(),
        ipAddress: ipAddress?.toString(),
        userAgent,
        isActive: true,
        ...(paymentMethod === 'stripe' && {
          stripeSetupIntentId,
          stripePaymentMethodId,
          stripeCustomerId
        }),
        ...(paymentMethod === 'usdc' && {
          walletAddress,
          walletSignature: signature ? JSON.stringify(signature) : undefined,
          authorizationMessage: message
        })
      };
      
      await storage.createPaymentAuthorization(authorizationData);
      
      // Update contract status to payment_authorized
      await storage.updateContract(contractId, {
        status: 'payment_authorized',
        paymentMethod
      });
      
      // Log activity
      await storage.createActivity({
        contractId,
        action: "payment_authorized",
        actorEmail: contract.clientEmail,
        details: { 
          paymentMethod, 
          maxPerMilestone: largestMilestone,
          totalAuthorized: totalAmount
        }
      });
      
      res.json({ 
        success: true, 
        message: "Payment authorization completed successfully" 
      });
    } catch (error) {
      console.error("Error authorizing payment:", error);
      res.status(500).json({ error: "Failed to authorize payment" });
    }
  });

  app.post("/api/stripe/create-setup-intent", async (req, res) => {
    try {
      const { contractId } = req.body;
      
      if (!contractId) {
        return res.status(400).json({ error: "Contract ID is required" });
      }
      
      // Mock Stripe SetupIntent creation for development
      const mockSetupIntent = {
        id: `seti_${Math.random().toString(36).substr(2, 12)}`,
        clientSecret: `seti_${Math.random().toString(36).substr(2, 12)}_secret_${Math.random().toString(36).substr(2, 12)}`,
        status: 'requires_payment_method'
      };
      
      res.json({
        clientSecret: mockSetupIntent.clientSecret,
        setupIntentId: mockSetupIntent.id
      });
    } catch (error) {
      console.error("Error creating setup intent:", error);
      res.status(500).json({ error: "Failed to create setup intent" });
    }
  });

  // Payment authorization management routes
  app.get("/api/payment-authorizations", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const userId = (req as any).session?.userId;
        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        // Get all contracts for the user
        const userContracts = await storage.getContractsByUser(userId);
        const contractIds = userContracts.map(c => c.id);

        // Get payment authorizations for user's contracts
        const authorizations = [];
        for (const contractId of contractIds) {
          const auth = await storage.getPaymentAuthorizationByContract(contractId);
          if (auth) {
            const contract = userContracts.find(c => c.id === contractId);
            authorizations.push({
              ...auth,
              contractTitle: contract?.title || 'Unknown Contract'
            });
          }
        }

        res.json({ authorizations });
      });
    } catch (error) {
      console.error("Error fetching payment authorizations:", error);
      res.status(500).json({ error: "Failed to fetch payment authorizations" });
    }
  });

  app.get("/api/payment-authorizations/history", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const userId = (req as any).session?.userId;
        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        // Get contracts for the user and their authorization history
        const userContracts = await storage.getContractsByUser(userId);
        const contractIds = userContracts.map(c => c.id);

        // Mock authorization history for now
        const history = contractIds.flatMap(contractId => [
          {
            id: `hist_${contractId}_1`,
            contractId,
            action: 'authorized',
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            details: 'Payment method authorized for milestone payments'
          }
        ]);

        res.json({ history: history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) });
      });
    } catch (error) {
      console.error("Error fetching authorization history:", error);
      res.status(500).json({ error: "Failed to fetch authorization history" });
    }
  });

  app.get("/api/contracts/:id/payment-authorization", async (req, res) => {
    try {
      const { id } = req.params;
      const authorization = await storage.getPaymentAuthorizationByContract(id);
      
      res.json({ authorization });
    } catch (error) {
      console.error("Error fetching contract authorization:", error);
      res.status(500).json({ error: "Failed to fetch authorization" });
    }
  });

  // New: Get authorization status with formatted details for UI
  app.get("/api/contracts/:id/authorization-status", async (req, res) => {
    try {
      const { id } = req.params;
      const authorization = await storage.getActiveAuthorization(id);
      const contract = await storage.getContract(id);
      
      if (!authorization || !contract) {
        return res.json({ 
          hasAuthorization: false,
          status: 'not_configured',
          message: 'Payment method not configured'
        });
      }

      // Format payment method display
      let paymentMethodDisplay = '';
      if (authorization.paymentMethod === 'stripe') {
        // For Stripe, we'd need to fetch the actual payment method details
        // For now, show a generic message
        paymentMethodDisplay = authorization.stripePaymentMethodId 
          ? `Card •••• ${authorization.stripePaymentMethodId.slice(-4)}` 
          : 'Stripe Payment Method';
      } else if (authorization.paymentMethod === 'usdc') {
        const addr = authorization.walletAddress || '';
        paymentMethodDisplay = `USDC Wallet ${addr.slice(0, 4)}...${addr.slice(-4)}`;
      }

      // Check if expired or revoked
      const isExpired = authorization.revokedAt !== null;
      const status = !authorization.isActive ? 'revoked' : isExpired ? 'expired' : 'active';

      res.json({
        hasAuthorization: true,
        status,
        paymentMethod: authorization.paymentMethod,
        paymentMethodDisplay,
        maxPerMilestone: authorization.maxPerMilestone,
        totalAuthorized: authorization.totalAuthorized,
        authorizedAt: authorization.authorizedAt,
        revokedAt: authorization.revokedAt,
        isActive: authorization.isActive,
        authorizationId: authorization.id
      });
    } catch (error) {
      console.error("Error fetching authorization status:", error);
      res.status(500).json({ error: "Failed to fetch authorization status" });
    }
  });

  // New: Get all authorizations for client
  app.get("/api/payment/authorizations", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const userId = (req as any).session?.userId;
        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const authorizations = await storage.getPaymentAuthorizationsByClient(userId);
        
        // Enhance with contract details
        const authorizationsWithDetails = await Promise.all(
          authorizations.map(async (auth) => {
            const contract = await storage.getContract(auth.contractId);
            const milestones = await storage.getMilestones(auth.contractId);
            
            return {
              ...auth,
              contractTitle: contract?.title || 'Unknown Contract',
              contractStatus: contract?.status,
              milestoneCount: milestones.length,
              completedMilestones: milestones.filter(m => m.status === 'paid').length
            };
          })
        );

        res.json({ authorizations: authorizationsWithDetails });
      });
    } catch (error) {
      console.error("Error fetching authorizations:", error);
      res.status(500).json({ error: "Failed to fetch authorizations" });
    }
  });

  // New: Update authorization (change payment method)
  app.patch("/api/payment/authorizations/:id", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { id } = req.params;
        const userId = (req as any).session?.userId;
        
        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const authorization = await storage.getPaymentAuthorizationById(id);
        if (!authorization) {
          return res.status(404).json({ error: "Authorization not found" });
        }

        // Verify user owns this authorization
        if (authorization.clientId !== userId) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        // Update authorization
        const updates = req.body;
        const updatedAuth = await storage.updatePaymentAuthorization(id, updates);

        // Log activity
        await storage.createActivity({
          contractId: authorization.contractId,
          action: "payment_authorization_updated",
          actorEmail: (req as any).session?.user?.email || 'unknown',
          details: { updates }
        });

        res.json({ authorization: updatedAuth });
      });
    } catch (error) {
      console.error("Error updating authorization:", error);
      res.status(500).json({ error: "Failed to update authorization" });
    }
  });

  app.get("/api/contracts/:id/milestones", async (req, res) => {
    try {
      const { id } = req.params;
      const milestones = await storage.getMilestones(id);
      
      res.json({ milestones });
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  app.post("/api/milestones/:id/submit", async (req, res) => {
    try {
      const { id } = req.params;
      const { completionNotes, proofUrl, deliverables } = req.body;

      // Get milestone and contract
      const milestone = await storage.getMilestone(id);
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      const contract = await storage.getContract(milestone.contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Check payment authorization
      const authorization = await storage.getPaymentAuthorizationByContract(milestone.contractId);
      if (!authorization || !authorization.isActive) {
        // Send "Action Required" email to client
        const { EmailService } = await import('./email-service');
        const emailService = EmailService.getInstance();
        
        await emailService.sendPaymentPending({
          clientName: contract.clientEmail,
          clientEmail: contract.clientEmail,
          contractTitle: contract.title,
          milestoneTitle: milestone.title,
          amount: milestone.amount.toString(),
          paymentMethod: 'Not configured',
          contractId: contract.id,
          milestoneId: milestone.id,
          chargeDate: 'Payment method required',
          timeRemaining: 'Setup required'
        });

        return res.status(400).json({ 
          error: "Client payment method not configured",
          message: "Payment authorization required before milestone submission"
        });
      }

      // Update milestone status
      await storage.updateMilestone(id, {
        status: 'submitted',
        submittedAt: new Date().toISOString()
      });

      // Log activity
      await storage.createActivity({
        contractId: milestone.contractId,
        action: "milestone_submitted",
        actorEmail: contract.freelancerEmail,
        details: { milestoneId: id, completionNotes, proofUrl }
      });

      res.json({ 
        success: true, 
        message: "Milestone submitted successfully"
      });
    } catch (error) {
      console.error("Error submitting milestone:", error);
      res.status(500).json({ error: "Failed to submit milestone" });
    }
  });

  app.post("/api/payment/revoke-authorization", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { authorizationId, reason } = req.body;
        const userId = (req as any).session?.userId;

        if (!authorizationId) {
          return res.status(400).json({ error: "Authorization ID is required" });
        }

        // Get authorization and verify ownership through contract
        const authorization = await storage.getPaymentAuthorizationByContract(authorizationId);
        if (!authorization) {
          return res.status(404).json({ error: "Authorization not found" });
        }

        const contract = await storage.getContract(authorization.contractId);
        if (!contract) {
          return res.status(404).json({ error: "Contract not found" });
        }

        // Verify user owns this contract (client or freelancer)
        const user = await storage.getUser(userId);
        if (!user || (contract.clientEmail !== user.email && contract.freelancerEmail !== user.email)) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        // Update authorization to inactive
        await storage.updatePaymentAuthorization(authorizationId, { 
          isActive: false,
          revokedAt: new Date().toISOString(),
          revocationReason: reason || 'Revoked by client'
        });

        // Update contract status if needed
        await storage.updateContract(authorization.contractId, {
          status: 'payment_authorization_revoked'
        });

        // Log activity
        await storage.createActivity({
          contractId: authorization.contractId,
          action: "payment_authorization_revoked",
          actorEmail: user.email,
          details: { authorizationId, reason: reason || 'Revoked by client' }
        });

        // Send confirmation email
        const { EmailService } = await import('./email-service');
        const emailService = EmailService.getInstance();
        
        await emailService.sendAuthorizationRevoked({
          clientName: contract.clientEmail,
          clientEmail: contract.clientEmail,
          contractTitle: contract.title,
          revocationDate: new Date().toLocaleDateString(),
          contractId: contract.id,
          reason: reason || 'Payment authorization revoked by client'
        });

        res.json({ 
          success: true, 
          message: "Payment authorization revoked successfully"
        });
      });
    } catch (error) {
      console.error("Error revoking authorization:", error);
      res.status(500).json({ error: "Failed to revoke authorization" });
    }
  });

  // Enhanced 2FA routes with smart triggers
  app.post("/api/payment/send-otp", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { milestoneId, amount } = req.body;
        const userId = (req as any).session?.userId;

        if (!userId || !milestoneId || !amount) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Rate limiting
        const { otpRateLimiter } = await import('./lib/auth/two-factor');
        const rateLimitKey = `otp_${userId}`;
        
        if (!otpRateLimiter.isAllowed(rateLimitKey)) {
          return res.status(429).json({ 
            error: "Too many attempts. Please try again later.",
            remainingAttempts: otpRateLimiter.getRemainingAttempts(rateLimitKey)
          });
        }

        // Smart 2FA check with context
        const { requires2FA } = await import('./lib/auth/smart-2fa');
        const context = {
          deviceId: req.headers['x-device-id'] as string,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          contractId: milestoneId
        };
        
        const requirement = await requires2FA(userId, amount, context);
        if (!requirement.required) {
          return res.json({ 
            success: true, 
            require2FA: false,
            reason: requirement.reason,
            message: "2FA not required for this payment"
          });
        }

        // Send OTP
        const { sendPaymentOTP } = await import('./lib/auth/two-factor');
        const result = await sendPaymentOTP(userId, milestoneId, amount);
        
        res.json({
          success: true,
          require2FA: true,
          reason: requirement.reason,
          otpId: result.otpId,
          expiresAt: result.expiresAt
        });
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  // Batch OTP sending
  app.post("/api/payment/batch-send-otp", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { milestoneIds, totalAmount } = req.body;
        const userId = (req as any).session?.userId;

        if (!userId || !milestoneIds?.length || !totalAmount) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Rate limiting
        const { otpRateLimiter } = await import('./lib/auth/two-factor');
        const rateLimitKey = `batch_otp_${userId}`;
        
        if (!otpRateLimiter.isAllowed(rateLimitKey)) {
          return res.status(429).json({ 
            error: "Too many batch attempts. Please try again later."
          });
        }

        // Smart 2FA check for batch
        const { requires2FA } = await import('./lib/auth/smart-2fa');
        const context = {
          deviceId: req.headers['x-device-id'] as string,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          isBatchPayment: true
        };
        
        const requirement = await requires2FA(userId, totalAmount, context);
        if (!requirement.required) {
          return res.json({ 
            success: true, 
            require2FA: false,
            reason: requirement.reason
          });
        }

        // Send OTP for batch approval
        const { sendPaymentOTP } = await import('./lib/auth/two-factor');
        const result = await sendPaymentOTP(userId, `batch_${milestoneIds.join('_')}`, totalAmount);
        
        res.json({
          success: true,
          require2FA: true,
          reason: requirement.reason,
          otpId: result.otpId,
          expiresAt: result.expiresAt,
          milestoneCount: milestoneIds.length
        });
      });
    } catch (error) {
      console.error("Error sending batch OTP:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  app.post("/api/payment/verify-otp", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { milestoneId, otpCode } = req.body;
        const userId = (req as any).session?.userId;

        if (!userId || !milestoneId || !otpCode) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Rate limiting for verification attempts
        const { otpRateLimiter } = await import('./lib/auth/two-factor');
        const rateLimitKey = `verify_${userId}`;
        
        if (!otpRateLimiter.isAllowed(rateLimitKey)) {
          return res.status(429).json({ 
            error: "Too many verification attempts. Please try again later.",
            remainingAttempts: otpRateLimiter.getRemainingAttempts(rateLimitKey)
          });
        }

        // Verify OTP
        const { verifyPaymentOTP } = await import('./lib/auth/two-factor');
        const result = await verifyPaymentOTP(userId, milestoneId, otpCode);

        if (result.valid) {
          res.json({
            success: true,
            valid: true,
            otpId: result.otpId
          });
        } else {
          res.status(400).json({
            success: false,
            valid: false,
            error: "Invalid or expired verification code"
          });
        }
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  app.post("/api/milestones/verify-and-pay", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { milestoneId, otpId } = req.body;
        const userId = (req as any).session?.userId;

        if (!userId || !milestoneId) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Get milestone and contract details
        const milestone = await storage.getMilestone(milestoneId);
        if (!milestone) {
          return res.status(404).json({ error: "Milestone not found" });
        }

        const contract = await storage.getContract(milestone.contractId);
        if (!contract) {
          return res.status(404).json({ error: "Contract not found" });
        }

        // Verify user has permission (client only)
        const user = await storage.getUser(userId);
        if (!user || contract.clientEmail !== user.email) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        // Check if 2FA verification is required and valid
        if (otpId !== 'no_2fa_required') {
          // Additional verification that OTP was used for this milestone
          const activities = await storage.getActivitiesByContract(milestoneId) || [];
          const otpUsed = activities.some((activity: any) => {
            if (activity.action !== 'payment_otp_used') return false;
            try {
              const details = typeof activity.details === 'string' ? JSON.parse(activity.details) : activity.details;
              return details.otpId === otpId;
            } catch {
              return false;
            }
          });

          if (!otpUsed) {
            return res.status(400).json({ error: "Invalid or expired verification" });
          }
        }

        // Check payment authorization is still valid
        const authorization = await storage.getPaymentAuthorizationByContract(milestone.contractId);
        if (!authorization || !authorization.isActive) {
          return res.status(400).json({ 
            error: "Payment authorization expired. Please reauthorize your payment method."
          });
        }

        // Update milestone status to approved
        await storage.updateMilestone(milestoneId, {
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: user.email
        });

        // Create payment record
        const payment = await storage.createPayment({
          contractId: milestone.contractId,
          milestoneId,
          amount: milestone.amount.toString(),
          method: authorization.paymentMethod,
          status: 'completed',
          processedAt: new Date().toISOString(),
          paymentIntentId: `sim_${Date.now()}`, // Simulated payment ID
          clientId: user.id.toString()
        });

        // Log successful payment approval with 2FA
        await storage.createActivity({
          contractId: milestone.contractId,
          action: "milestone_payment_approved_2fa",
          actorEmail: user.email,
          details: JSON.stringify({
            milestoneId,
            paymentId: payment.id,
            amount: milestone.amount,
            otpVerified: otpId !== 'no_2fa_required'
          })
        });

        // Send confirmation email to freelancer
        const { EmailService } = await import('./email-service');
        const emailService = EmailService.getInstance();
        
        await emailService.sendPaymentProcessed({
          freelancerName: contract.freelancerEmail,
          freelancerEmail: contract.freelancerEmail,
          contractTitle: contract.title,
          milestoneTitle: milestone.title,
          amount: (milestone.amount / 100).toFixed(2),
          paymentMethod: authorization.paymentMethod === 'card' ? 'Credit Card' : 'USDC',
          contractId: contract.id,
          transactionId: payment.id,
          processedDate: new Date().toLocaleDateString(),
          expectedDeposit: '1-3 business days'
        });

        // Mark device as trusted if requested
        if (req.body.trustDevice && req.headers['x-device-id']) {
          const { trustDevice } = await import('./lib/auth/smart-2fa');
          await trustDevice(userId, req.headers['x-device-id'] as string, {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });
        }

        res.json({
          success: true,
          paymentId: payment.id,
          message: "Payment approved and processed successfully"
        });
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  // Generate OTP for milestone payment approval
  app.post("/api/milestones/:milestoneId/request-otp", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { milestoneId } = req.params;
        const userId = (req as any).session?.userId;

        if (!userId || !milestoneId) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Get milestone data
        const milestone = await storage.getMilestone(milestoneId);
        if (!milestone) {
          return res.status(404).json({ error: "Milestone not found" });
        }

        // Convert amount to cents
        const amountInCents = Math.round(parseFloat(milestone.amount) * 100);

        // Generate and send OTP
        const { sendPaymentOTP } = await import('./lib/auth/two-factor');
        const result = await sendPaymentOTP({
          userId,
          milestoneId,
          amount: amountInCents,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });

        res.json({
          success: true,
          expiresAt: result.expiresAt,
          message: "Verification code sent to your email"
        });
      });
    } catch (error: any) {
      console.error("Error generating OTP:", error);
      res.status(500).json({ error: error.message || "Failed to send verification code" });
    }
  });

  // Verify OTP and approve milestone with payment
  app.post("/api/milestones/:milestoneId/verify-and-approve", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { milestoneId } = req.params;
        const { otpCode } = req.body;
        const userId = (req as any).session?.userId;

        if (!userId || !milestoneId || !otpCode) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Verify OTP
        const { verifyPaymentOTP } = await import('./lib/auth/two-factor');
        const verification = await verifyPaymentOTP(userId, milestoneId, otpCode);

        if (!verification.valid) {
          return res.status(400).json({ 
            error: verification.error || "Invalid verification code" 
          });
        }

        // Get milestone and contract data
        const milestone = await storage.getMilestone(milestoneId);
        if (!milestone) {
          return res.status(404).json({ error: "Milestone not found" });
        }

        const contract = await storage.getContract(milestone.contractId);
        if (!contract) {
          return res.status(404).json({ error: "Contract not found" });
        }

        // Check authorization is still valid
        const authorization = await storage.getActivePaymentAuthorization(milestone.contractId);
        if (!authorization) {
          return res.status(400).json({ 
            error: "Payment authorization has expired or been revoked" 
          });
        }

        // Process payment
        const { processAuthorizedPayment } = await import('./lib/payments');
        const payment = await processAuthorizedPayment(milestone, authorization, contract);

        // Update milestone status
        await storage.updateMilestone(milestoneId, {
          status: "approved",
          paymentReleased: true,
          approvedAt: new Date(),
          approvedBy: userId,
          paymentTx: payment.id
        });

        // Log activity
        await storage.createActivity({
          contractId: milestone.contractId,
          action: "milestone_approved",
          actorEmail: userId,
          details: JSON.stringify({
            milestoneId,
            amount: milestone.amount,
            paymentId: payment.id,
            otpVerified: true
          })
        });

        res.json({
          success: true,
          paymentId: payment.id,
          message: "Payment approved and processed successfully"
        });
      });
    } catch (error: any) {
      console.error("Error verifying and approving:", error);
      res.status(500).json({ error: error.message || "Failed to process payment approval" });
    }
  });

  // Batch milestone approval
  app.post("/api/milestones/batch-approve", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { milestoneIds, otpCode, trustDevice } = req.body;
        const userId = (req as any).session?.userId;

        if (!userId || !milestoneIds?.length || !otpCode) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Process batch approval
        const { batchApproveWithOTP } = await import('./lib/auth/smart-2fa');
        const results = await batchApproveWithOTP(userId, milestoneIds, otpCode);

        // Mark device as trusted if requested
        if (trustDevice && req.headers['x-device-id']) {
          const { trustDevice: trustDeviceFunc } = await import('./lib/auth/smart-2fa');
          await trustDeviceFunc(userId, req.headers['x-device-id'] as string, {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });
        }

        const successCount = results.filter(r => r.success).length;
        
        res.json({
          success: true,
          results,
          summary: {
            total: milestoneIds.length,
            successful: successCount,
            failed: milestoneIds.length - successCount
          }
        });
      });
    } catch (error: any) {
      console.error("Error in batch approval:", error);
      res.status(500).json({ error: error.message || "Failed to process batch approval" });
    }
  });

  // Analytics endpoint for 2FA events
  app.post("/api/analytics/2fa-event", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const userId = (req as any).session?.userId;
        const eventData = { ...req.body, userId };

        const { track2FAEvent } = await import('./lib/auth/smart-2fa');
        await track2FAEvent(eventData);

        res.json({ success: true });
      });
    } catch (error) {
      console.error("Error tracking 2FA event:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  // Security monitoring endpoints
  app.get("/api/security/metrics", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { timeframe } = req.query;
        const { getSecurityMetrics } = await import('./lib/security/monitoring');
        
        const metrics = await getSecurityMetrics(timeframe as 'day' | 'week' | 'month');
        res.json(metrics);
      });
    } catch (error: any) {
      console.error("Error getting security metrics:", error);
      res.status(500).json({ error: "Failed to get security metrics" });
    }
  });

  app.get("/api/security/alerts", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { limit } = req.query;
        const { getSecurityAlerts } = await import('./lib/security/monitoring');
        
        const alerts = await getSecurityAlerts(limit ? parseInt(limit as string) : 50);
        res.json(alerts);
      });
    } catch (error: any) {
      console.error("Error getting security alerts:", error);
      res.status(500).json({ error: "Failed to get security alerts" });
    }
  });

  app.get("/api/security/events", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { limit } = req.query;
        const userId = (req as any).session?.userId;
        
        // Get security events for this user
        const activities = await storage.getActivitiesByContract('security-monitoring') || [];
        const events = activities
          .filter(activity => 
            activity.action.startsWith('security_') && 
            activity.actorEmail === `user_${userId}`
          )
          .slice(0, limit ? parseInt(limit as string) : 100)
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
                amount: details.amount,
                location: details.location,
                riskScore: details.riskScore,
                createdAt: details.timestamp
              };
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        
        res.json(events);
      });
    } catch (error: any) {
      console.error("Error getting security events:", error);
      res.status(500).json({ error: "Failed to get security events" });
    }
  });

  app.post("/api/security/export-report", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { timeframe, includeEvents, includeAlerts } = req.body;
        const userId = (req as any).session?.userId;

        // Generate CSV report
        let csvContent = "Type,Timestamp,Event,Success,IP Address,Risk Score,Amount,Method\n";

        if (includeEvents) {
          const activities = await storage.getActivitiesByContract('security-monitoring') || [];
          activities
            .filter(activity => 
              activity.action.startsWith('security_') && 
              activity.actorEmail === `user_${userId}`
            )
            .slice(0, 1000) // Limit to 1000 events
            .forEach(activity => {
              try {
                const details = typeof activity.details === 'string' ? 
                  JSON.parse(activity.details) : activity.details;
                csvContent += `Event,${details.timestamp || ''},${details.eventType || ''},${details.success || false},${details.ipAddress || ''},${details.riskScore || 0},${details.amount || ''},${details.method || ''}\n`;
              } catch {
                // Skip invalid entries
              }
            });
        }

        if (includeAlerts) {
          const alertActivities = await storage.getActivitiesByContract('security-alerts') || [];
          alertActivities
            .filter(activity => activity.action.startsWith('alert_'))
            .slice(0, 500) // Limit to 500 alerts
            .forEach(activity => {
              try {
                const details = typeof activity.details === 'string' ? 
                  JSON.parse(activity.details) : activity.details;
                csvContent += `Alert,${details.timestamp || ''},${details.alertType || ''},${details.severity || ''},,,${details.metadata?.amount || ''},\n`;
              } catch {
                // Skip invalid entries
              }
            });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="security-report-${timeframe}-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      });
    } catch (error: any) {
      console.error("Error exporting security report:", error);
      res.status(500).json({ error: "Failed to export security report" });
    }
  });

  // Compliance and audit endpoints
  app.get("/api/compliance/pci-status", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { ComplianceManager } = await import('./lib/compliance/compliance-manager');
        const complianceManager = ComplianceManager.getInstance();
        
        const pciStatus = await complianceManager.getPCIComplianceStatus();
        res.json(pciStatus);
      });
    } catch (error: any) {
      console.error("Error getting PCI compliance status:", error);
      res.status(500).json({ error: "Failed to get PCI compliance status" });
    }
  });

  app.get("/api/compliance/metrics", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { period } = req.query;
        const { AuditLogger } = await import('./lib/audit/audit-logger');
        const auditLogger = AuditLogger.getInstance();
        
        const metrics = await auditLogger.getComplianceMetrics(period as 'day' | 'week' | 'month' | 'year');
        res.json(metrics);
      });
    } catch (error: any) {
      console.error("Error getting compliance metrics:", error);
      res.status(500).json({ error: "Failed to get compliance metrics" });
    }
  });

  app.get("/api/compliance/authorizations", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { ComplianceManager } = await import('./lib/compliance/compliance-manager');
        const complianceManager = ComplianceManager.getInstance();
        
        const authorizations = await complianceManager.getAuthorizationRecords();
        res.json(authorizations);
      });
    } catch (error: any) {
      console.error("Error getting authorization records:", error);
      res.status(500).json({ error: "Failed to get authorization records" });
    }
  });

  app.get("/api/compliance/disputes", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { ComplianceManager } = await import('./lib/compliance/compliance-manager');
        const complianceManager = ComplianceManager.getInstance();
        
        const disputes = await complianceManager.getDisputes();
        res.json(disputes);
      });
    } catch (error: any) {
      console.error("Error getting dispute records:", error);
      res.status(500).json({ error: "Failed to get dispute records" });
    }
  });

  app.post("/api/compliance/disputes", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const userId = (req as any).session?.userId;
        const { paymentId, contractId, freelancerId, amount, reason } = req.body;

        if (!paymentId || !contractId || !freelancerId || !amount || !reason) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const { ComplianceManager } = await import('./lib/compliance/compliance-manager');
        const complianceManager = ComplianceManager.getInstance();
        
        const disputeId = await complianceManager.createDispute(
          paymentId,
          contractId,
          userId,
          freelancerId,
          amount,
          reason
        );

        res.json({ success: true, disputeId });
      });
    } catch (error: any) {
      console.error("Error creating dispute:", error);
      res.status(500).json({ error: "Failed to create dispute" });
    }
  });

  app.post("/api/compliance/disputes/:disputeId/resolve", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { disputeId } = req.params;
        const adminUserId = (req as any).session?.userId;
        const { resolution, refundAmount } = req.body;

        if (!resolution) {
          return res.status(400).json({ error: "Resolution required" });
        }

        const { ComplianceManager } = await import('./lib/compliance/compliance-manager');
        const complianceManager = ComplianceManager.getInstance();
        
        await complianceManager.resolveDispute(disputeId, resolution, refundAmount, adminUserId);
        res.json({ success: true });
      });
    } catch (error: any) {
      console.error("Error resolving dispute:", error);
      res.status(500).json({ error: "Failed to resolve dispute" });
    }
  });

  app.post("/api/compliance/run-monthly-jobs", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { ComplianceManager } = await import('./lib/compliance/compliance-manager');
        const complianceManager = ComplianceManager.getInstance();
        
        const results = await complianceManager.runMonthlyComplianceJobs();
        res.json(results);
      });
    } catch (error: any) {
      console.error("Error running monthly compliance jobs:", error);
      res.status(500).json({ error: "Failed to run compliance jobs" });
    }
  });

  app.post("/api/compliance/export-report", async (req, res) => {
    try {
      const { requireAuth } = await import("./auth");
      requireAuth(req, res, async () => {
        const { period, includeAuthorizations, includeDisputes } = req.body;
        const userId = (req as any).session?.userId;

        const { ComplianceManager } = await import('./lib/compliance/compliance-manager');
        const { AuditLogger } = await import('./lib/audit/audit-logger');
        
        const complianceManager = ComplianceManager.getInstance();
        const auditLogger = AuditLogger.getInstance();

        // Generate comprehensive compliance report
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
          case 'quarter':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const report = await complianceManager.generateComplianceReport(startDate, endDate);

        // Generate CSV content
        let csvContent = "Type,Date,Event,Details,Amount,Status\n";
        
        if (includeAuthorizations) {
          const auths = await complianceManager.getAuthorizationRecords();
          auths.forEach(auth => {
            csvContent += `Authorization,${auth.authorizedAt},${auth.method}_auth,Contract:${auth.contractId},${auth.totalAuthorized},${auth.status}\n`;
          });
        }

        if (includeDisputes) {
          const disputes = await complianceManager.getDisputes();
          disputes.forEach(dispute => {
            csvContent += `Dispute,${dispute.openedAt},dispute_${dispute.status},${dispute.reason},${dispute.amount},${dispute.status}\n`;
          });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${period}-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      });
    } catch (error: any) {
      console.error("Error exporting compliance report:", error);
      res.status(500).json({ error: "Failed to export compliance report" });
    }
  });

  // Get milestone details (for approval page)
  app.get("/api/milestones/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const milestone = await storage.getMilestone(id);
      
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      res.json(milestone);
    } catch (error) {
      console.error("Error fetching milestone:", error);
      res.status(500).json({ error: "Failed to fetch milestone" });
    }
  });

  // Email service routes
  app.use("/api/emails", emailRoutes);

  // Debug endpoint to test OpenAI API key
  app.get("/api/debug/openai-status", async (req, res) => {
    try {
      const hasApiKey = !!process.env.OPENAI_API_KEY;
      const keyLength = process.env.OPENAI_API_KEY?.length || 0;
      const keyPrefix = process.env.OPENAI_API_KEY?.substring(0, 7) || "none";
      
      res.json({
        hasApiKey,
        keyLength,
        keyPrefix,
        environment: process.env.NODE_ENV || "unknown",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Debug endpoint failed",
        message: error.message 
      });
    }
  });

  // AI Contract Generation endpoints
  app.post("/api/ai/generate-contract", async (req, res) => {
    try {
      console.log("=== AI Contract Generation Request ===");
      console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);
      console.log("OpenAI API Key length:", process.env.OPENAI_API_KEY?.length || 0);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const contractParams = req.body;
      console.log("Calling aiContractService.generateFreelanceContract...");
      
      const generatedContract = await aiContractService.generateFreelanceContract(contractParams);
      console.log("Contract generated successfully, length:", generatedContract.length);
      
      res.json({ contract: generatedContract });
    } catch (error) {
      console.error("=== Contract Generation Error ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Full error:", error);
      
      // Check for specific OpenAI errors
      if (error.message?.includes('API key')) {
        console.error("This appears to be an API key issue");
      }
      
      res.status(500).json({ 
        message: "Failed to generate contract",
        error: error instanceof Error ? error.message : "Unknown error",
        debug: {
          hasApiKey: !!process.env.OPENAI_API_KEY,
          errorType: error.constructor.name
        }
      });
    }
  });

  app.post("/api/ai/analyze-risks", async (req, res) => {
    try {
      const contractParams = req.body;
      const riskAnalysis = await aiContractService.analyzeContractRisks(contractParams);
      res.json({ analysis: riskAnalysis });
    } catch (error) {
      console.error("Risk analysis error:", error);
      res.status(500).json({ 
        message: "Failed to analyze risks",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/ai/template-recommendations", async (req, res) => {
    try {
      const { projectType, scopeOfWork, projectDescription } = req.body;

      const prompt = `Based on the following project details, recommend 3 specialized contract templates with risk mitigation strategies:

Project Type: ${projectType}
Scope of Work: ${scopeOfWork}
Project Description: ${projectDescription}

For each template, provide:
1. Template name (specific to the work type)
2. Brief description
3. Key clauses that should be included
4. Risk mitigation strategies
5. Recommendation score (0-100 based on project fit)

Respond with JSON in this exact format:
{
  "templates": [
    {
      "id": "template-1",
      "name": "Template Name",
      "description": "Brief description of when to use this template",
      "projectTypes": ["Web Development", "Software Development"],
      "template": "Template overview text",
      "clauses": ["Clause 1", "Clause 2", "Clause 3"],
      "riskMitigation": ["Risk strategy 1", "Risk strategy 2"],
      "recommendationScore": 95
    }
  ]
}`;

      const generatedRecommendations = await aiContractService.generateTemplateRecommendations(prompt);
      res.json({ templates: generatedRecommendations });
    } catch (error) {
      console.error("Template recommendation error:", error);
      res.status(500).json({ 
        message: "Failed to generate template recommendations",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin routes for demo data seeding
  app.post("/api/admin/seed-demo-data", async (req, res) => {
    try {
      const { seedSimpleData } = await import('./simple-seed');
      const result = await seedSimpleData();
      res.json(result);
    } catch (error) {
      console.error("Demo data seeding error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to seed demo data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Pricing calculation routes
  app.post("/api/pricing/calculate", async (req, res) => {
    try {
      const { contractAmount, paymentMethod } = req.body;

      // Validate input
      if (!contractAmount || typeof contractAmount !== 'number' || contractAmount <= 0) {
        return res.status(400).json({
          error: 'Invalid contract amount. Must be a positive number.'
        });
      }

      if (!paymentMethod || !TRANSACTION_FEE_CONFIG[paymentMethod as PaymentMethod]) {
        return res.status(400).json({
          error: 'Invalid payment method. Must be one of: usdc, ach, card'
        });
      }

      // Calculate fees (contractAmount should be in cents)
      const pricing = calculateTotalWithFees(contractAmount, paymentMethod as PaymentMethod);
      
      return res.status(200).json({
        success: true,
        data: {
          ...pricing,
          contractAmountFormatted: formatCurrency(pricing.contractAmount),
          transactionFeeFormatted: formatCurrency(pricing.transactionFee),
          totalAmountFormatted: formatCurrency(pricing.totalAmount),
          paymentMethod,
          feeConfig: TRANSACTION_FEE_CONFIG[paymentMethod as PaymentMethod]
        }
      });

    } catch (error) {
      console.error('Pricing calculation error:', error);
      return res.status(500).json({
        error: 'Failed to calculate pricing',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/pricing/config", async (req, res) => {
    try {
      return res.status(200).json({
        success: true,
        data: {
          feeConfig: TRANSACTION_FEE_CONFIG,
          supportedMethods: Object.keys(TRANSACTION_FEE_CONFIG)
        }
      });
    } catch (error) {
      console.error('Error fetching pricing config:', error);
      return res.status(500).json({
        error: 'Failed to fetch pricing configuration'
      });
    }
  });

  // Register payment method routes
  const { registerPaymentMethodRoutes } = await import("./payment-methods");
  registerPaymentMethodRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
