import { 
  users, contacts, contracts, milestones, contractSignatures, payments, contractActivity,
  type User, type InsertUser, type Contact, type InsertContact,
  type Contract, type InsertContract, type Milestone, type InsertMilestone,
  type ContractSignature, type InsertContractSignature,
  type Payment, type InsertPayment, type ContractActivity, type InsertContractActivity
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
  
  // Contract operations
  getContract(id: string): Promise<Contract | undefined>;
  getContractsByUser(userId: string): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined>;
  
  // Milestone operations
  getMilestonesByContract(contractId: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone | undefined>;
  
  // Payment operations
  getPaymentsByContract(contractId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
  
  // Activity tracking
  createActivity(activity: InsertContractActivity): Promise<ContractActivity>;
  getActivityByContract(contractId: string): Promise<ContractActivity[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private contacts: Map<string, Contact>;
  private contracts: Map<string, Contract>;
  private milestones: Map<string, Milestone>;
  private payments: Map<string, Payment>;
  private activities: Map<string, ContractActivity>;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.contracts = new Map();
    this.milestones = new Map();
    this.payments = new Map();
    this.activities = new Map();
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.generateId();
    const user: User = { 
      freelanceType: "other",
      walletAddress: null,
      stripeAccountId: null,
      hourlyRate: null,
      subscriptionTier: "free",
      totalContractsValue: "0",
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Contact operations
  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.generateId();
    const contact: Contact = { 
      ...insertContact, 
      id, 
      createdAt: new Date() 
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  // Contract operations
  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async getContractsByUser(userId: string): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(
      (contract) => contract.creatorId === userId
    );
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = this.generateId();
    const contract: Contract = {
      status: "draft",
      solanaProgramAddress: null,
      metadataUri: null,
      ...insertContract,
      id,
      createdAt: new Date(),
      activatedAt: null,
      completedAt: null,
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;
    
    const updatedContract = { ...contract, ...updates };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }

  // Milestone operations
  async getMilestonesByContract(contractId: string): Promise<Milestone[]> {
    return Array.from(this.milestones.values()).filter(
      (milestone) => milestone.contractId === contractId
    );
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const id = this.generateId();
    const milestone: Milestone = {
      status: "pending",
      paymentReleased: false,
      ...insertMilestone,
      id,
      submittedAt: null,
      approvedAt: null,
      approvedBy: null,
      paymentTx: null,
    };
    this.milestones.set(id, milestone);
    return milestone;
  }

  async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone | undefined> {
    const milestone = this.milestones.get(id);
    if (!milestone) return undefined;
    
    const updatedMilestone = { ...milestone, ...updates };
    this.milestones.set(id, updatedMilestone);
    return updatedMilestone;
  }

  // Payment operations
  async getPaymentsByContract(contractId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.contractId === contractId
    );
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.generateId();
    const payment: Payment = {
      status: "pending",
      milestoneId: null,
      stripePaymentIntentId: null,
      solanaEscrowAccount: null,
      releasedTx: null,
      ...insertPayment,
      id,
      createdAt: new Date(),
      releasedAt: null,
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...updates };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Activity tracking
  async createActivity(insertActivity: InsertContractActivity): Promise<ContractActivity> {
    const id = this.generateId();
    const activity: ContractActivity = {
      details: null,
      ...insertActivity,
      id,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getActivityByContract(contractId: string): Promise<ContractActivity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.contractId === contractId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }
}

export const storage = new MemStorage();
