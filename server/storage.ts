import { 
  users, contacts, contracts, milestones, contractSignatures, payments, contractActivity,
  paymentAuthorizations, contractShares,
  type User, type InsertUser, type Contact, type InsertContact,
  type Contract, type InsertContract, type Milestone, type InsertMilestone,
  type ContractSignature, type InsertContractSignature,
  type Payment, type InsertPayment, type ContractActivity, type InsertContractActivity,
  type PaymentAuthorization, type InsertPaymentAuthorization,
  type ContractShare, type InsertContractShare
} from "../shared/schema.js";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
  
  // Contract operations
  getContract(id: string): Promise<Contract | undefined>;
  getContracts(): Promise<Contract[]>;
  getContractsByUser(userId: string): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined>;
  
  // Milestone operations
  getMilestone(id: string): Promise<Milestone | undefined>;
  getMilestonesByContract(contractId: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone | undefined>;
  
  // Payment operations
  getPaymentsByContract(contractId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
  
  // Activity tracking
  createActivity(activity: InsertContractActivity): Promise<ContractActivity>;
  createContractActivity(activity: InsertContractActivity): Promise<ContractActivity>;
  getActivityByContract(contractId: string): Promise<ContractActivity[]>;
  getContractActivity(contractId: string): Promise<ContractActivity[]>;
  
  // Contract signature operations
  createContractSignature(signature: InsertContractSignature): Promise<ContractSignature>;
  
  // Contract sharing operations
  createContractShare(share: InsertContractShare): Promise<ContractShare>;
  getContractByShareToken(shareToken: string): Promise<ContractShare | undefined>;
  
  // Payment authorization operations
  createPaymentAuthorization(authorization: InsertPaymentAuthorization): Promise<PaymentAuthorization>;
  getPaymentAuthorizationByContract(contractId: string): Promise<PaymentAuthorization | undefined>;
  
  // Extended milestone operations
  getMilestones(contractId: string): Promise<Milestone[]>;
  
  // Payment authorization updates
  updatePaymentAuthorization(id: string, updates: Partial<PaymentAuthorization>): Promise<PaymentAuthorization | undefined>;
}

import { db } from "./db.js";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  constructor() {
    // No initialization needed for database storage
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Contact operations
  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts);
  }

  // Contract operations
  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async getContracts(): Promise<Contract[]> {
    const allContracts = await db.select().from(contracts);
    return allContracts;
  }

  async getContractsByUser(userId: string): Promise<Contract[]> {
    return await db.select().from(contracts).where(eq(contracts.creatorId, userId));
  }

  async getContractsByCreator(userId: string): Promise<Contract[]> {
    return await db.select().from(contracts).where(eq(contracts.creatorId, userId));
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const [contract] = await db
      .insert(contracts)
      .values(insertContract)
      .returning();
    return contract;
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined> {
    const [contract] = await db
      .update(contracts)
      .set(updates)
      .where(eq(contracts.id, id))
      .returning();
    return contract || undefined;
  }

  // Milestone operations
  async getMilestone(id: string): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(milestones).where(eq(milestones.id, id));
    return milestone || undefined;
  }

  async getMilestonesByContract(contractId: string): Promise<Milestone[]> {
    return await db.select().from(milestones).where(eq(milestones.contractId, contractId));
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const [milestone] = await db
      .insert(milestones)
      .values(insertMilestone)
      .returning();
    return milestone;
  }

  async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone | undefined> {
    const [milestone] = await db
      .update(milestones)
      .set(updates)
      .where(eq(milestones.id, id))
      .returning();
    return milestone || undefined;
  }

  // Payment operations
  async getPaymentsByContract(contractId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.contractId, contractId));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  // Activity tracking
  async createActivity(insertActivity: InsertContractActivity): Promise<ContractActivity> {
    const [activity] = await db
      .insert(contractActivity)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async createContractActivity(insertActivity: InsertContractActivity): Promise<ContractActivity> {
    const [activity] = await db
      .insert(contractActivity)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getActivityByContract(contractId: string): Promise<ContractActivity[]> {
    return await db.select()
      .from(contractActivity)
      .where(eq(contractActivity.contractId, contractId))
      .orderBy(contractActivity.createdAt);
  }

  async getContractActivity(contractId: string): Promise<ContractActivity[]> {
    return await db.select()
      .from(contractActivity)
      .where(eq(contractActivity.contractId, contractId))
      .orderBy(contractActivity.createdAt);
  }

  // Contract signature operations
  async createContractSignature(insertSignature: InsertContractSignature): Promise<ContractSignature> {
    const [signature] = await db
      .insert(contractSignatures)
      .values(insertSignature)
      .returning();
    return signature;
  }

  // Contract sharing operations
  async createContractShare(insertShare: InsertContractShare): Promise<ContractShare> {
    const [share] = await db
      .insert(contractShares)
      .values(insertShare)
      .returning();
    return share;
  }

  async getContractByShareToken(shareToken: string): Promise<ContractShare | undefined> {
    const [share] = await db
      .select()
      .from(contractShares)
      .where(eq(contractShares.shareToken, shareToken));
    return share || undefined;
  }

  // Payment authorization operations
  async createPaymentAuthorization(insertAuth: InsertPaymentAuthorization): Promise<PaymentAuthorization> {
    const [authorization] = await db
      .insert(paymentAuthorizations)
      .values(insertAuth)
      .returning();
    return authorization;
  }

  async getPaymentAuthorizationByContract(contractId: string): Promise<PaymentAuthorization | undefined> {
    const [authorization] = await db
      .select()
      .from(paymentAuthorizations)
      .where(eq(paymentAuthorizations.contractId, contractId));
    return authorization || undefined;
  }

  // Extended milestone operations
  async getMilestones(contractId: string): Promise<Milestone[]> {
    return await db.select().from(milestones).where(eq(milestones.contractId, contractId));
  }

  // Payment authorization updates
  async updatePaymentAuthorization(id: string, updates: Partial<PaymentAuthorization>): Promise<PaymentAuthorization | undefined> {
    const [authorization] = await db
      .update(paymentAuthorizations)
      .set(updates)
      .where(eq(paymentAuthorizations.id, id))
      .returning();
    return authorization || undefined;
  }
}

export const storage = new DatabaseStorage();
