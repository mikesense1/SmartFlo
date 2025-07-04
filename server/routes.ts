import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertContactSchema, insertContractSchema, 
  insertMilestoneSchema, insertPaymentSchema, insertContractActivitySchema 
} from "@shared/schema";

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
      const contractData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(contractData);
      
      // Log contract creation activity
      await storage.createActivity({
        contractId: contract.id,
        action: "created",
        actorEmail: req.body.creatorEmail || "system",
        details: { contractTitle: contract.title }
      });
      
      res.json({ message: "Contract created successfully", contractId: contract.id });
    } catch (error) {
      res.status(400).json({ message: "Invalid contract data" });
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
      const contracts = await storage.getContractsByUser(req.params.userId);
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
  app.get("/api/contracts/:contractId/activity", async (req, res) => {
    try {
      const activities = await storage.getActivityByContract(req.params.contractId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
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

  const httpServer = createServer(app);
  return httpServer;
}
