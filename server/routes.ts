import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiContractService } from "./openai-service";
import { 
  insertUserSchema, insertContactSchema, insertContractSchema, 
  insertMilestoneSchema, insertPaymentSchema, insertContractActivitySchema 
} from "@shared/schema";
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

  // Contract routes
  app.post("/api/contracts", async (req, res) => {
    try {
      console.log("Creating contract with data:", req.body);
      const contractData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(contractData);
      console.log("Contract created successfully:", contract);
      
      // Log contract creation activity
      await storage.createActivity({
        contractId: contract.id,
        action: "created",
        actorEmail: contractData.clientEmail,
        details: { contractTitle: contract.title }
      });
      
      res.json(contract); // Return the full contract object
    } catch (error) {
      console.error("Contract creation error:", error);
      res.status(400).json({ message: "Invalid contract data", error: error.message });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  app.get("/api/users/:userId/contracts", async (req, res) => {
    try {
      // Handle both the mock UUID and the old "user-123" format
      const userId = req.params.userId === "user-123" ? "550e8400-e29b-41d4-a716-446655440000" : req.params.userId;
      const contracts = await storage.getContractsByUser(userId);
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

  // Milestone routes
  app.post("/api/milestones", async (req, res) => {
    try {
      const milestoneData = insertMilestoneSchema.parse(req.body);
      const milestone = await storage.createMilestone(milestoneData);
      res.json({ message: "Milestone created successfully", milestoneId: milestone.id });
    } catch (error) {
      res.status(400).json({ message: "Invalid milestone data" });
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
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      // Mock blockchain status
      const blockchainStatus = {
        contractAddress: `solana_contract_${contractId}`,
        escrowAddress: `escrow_${contractId}`,
        escrowBalance: contract.paymentMethod === 'usdc' ? parseFloat(contract.totalValue) : 0,
        amountReleased: 0,
        isActive: contract.status === 'funded',
        lastSyncAt: new Date().toISOString(),
        network: "devnet"
      };
      
      res.json(blockchainStatus);
      
    } catch (error) {
      console.error("Failed to get blockchain status:", error);
      res.status(500).json({ 
        error: "Failed to get blockchain status",
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

  // AI Contract Generation endpoints
  app.post("/api/ai/generate-contract", async (req, res) => {
    try {
      const contractParams = req.body;
      const generatedContract = await aiContractService.generateFreelanceContract(contractParams);
      res.json({ contract: generatedContract });
    } catch (error) {
      console.error("Contract generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate contract",
        error: error instanceof Error ? error.message : "Unknown error"
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

  const httpServer = createServer(app);
  return httpServer;
}
