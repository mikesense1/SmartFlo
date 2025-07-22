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
  getContracts(): Promise<Contract[]>;
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

import { db } from "./db";
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

  async getActivityByContract(contractId: string): Promise<ContractActivity[]> {
    return await db.select()
      .from(contractActivity)
      .where(eq(contractActivity.contractId, contractId))
      .orderBy(contractActivity.createdAt);
  }
}

export const storage = new DatabaseStorage();
