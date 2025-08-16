import { pgTable, text, uuid, timestamp, boolean, decimal, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  userType: text("user_type").notNull(), // 'freelancer' or 'client'
  companyName: text("company_name"), // Company name for clients
  freelanceType: text("freelance_type").default("other"), // 'developer', 'designer', 'writer', 'consultant', 'other'
  walletAddress: text("wallet_address"),
  stripeAccountId: text("stripe_account_id"),
  hourlyRate: decimal("hourly_rate"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  totalContractsValue: decimal("total_contracts_value").notNull().default("0"),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => users.id),
  clientId: uuid("client_id").references(() => users.id), // For when client signs up
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  projectDescription: text("project_description").notNull(),
  totalValue: decimal("total_value").notNull(),
  paymentMethod: text("payment_method"), // 'stripe_card', 'stripe_ach', or 'usdc' - nullable until client selects
  contractType: text("contract_type").notNull(), // 'fixed_price' or 'milestone_based'
  status: text("status").notNull().default("draft"), // 'draft', 'sent', 'active', 'completed', 'disputed'
  solanaProgramAddress: text("solana_program_address"),
  escrowAddress: text("escrow_address"),
  blockchainNetwork: text("blockchain_network"),
  deploymentTx: text("deployment_tx"),
  blockchainStatus: text("blockchain_status").default("pending"), // 'pending', 'deployed', 'active', 'completed'
  metadataUri: text("metadata_uri"),
  generatedContract: text("generated_contract"), // AI-generated contract document text
  sentAt: timestamp("sent_at"), // When contract was sent to client
  createdAt: timestamp("created_at").defaultNow(),
  activatedAt: timestamp("activated_at"),
  completedAt: timestamp("completed_at"),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'submitted', 'approved', 'paid'
  paymentReleased: boolean("payment_released").notNull().default(false),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
  paymentTx: text("payment_tx"),
});

export const contractSignatures = pgTable("contract_signatures", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  signerEmail: text("signer_email").notNull(),
  signerRole: text("signer_role").notNull(), // 'freelancer' or 'client'
  signedAt: timestamp("signed_at").defaultNow(),
  signatureMethod: text("signature_method").notNull(), // 'wallet' or 'email'
  signatureData: text("signature_data").notNull(),
  blockchainTx: text("blockchain_tx"),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  milestoneId: uuid("milestone_id").references(() => milestones.id),
  amount: decimal("amount").notNull(),
  method: text("method").notNull(), // 'stripe_card', 'stripe_ach', or 'usdc'
  status: text("status").notNull().default("pending"), // 'pending', 'escrowed', 'released', 'refunded'
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  solanaEscrowAccount: text("solana_escrow_account"),
  releasedTx: text("released_tx"),
  createdAt: timestamp("created_at").defaultNow(),
  releasedAt: timestamp("released_at"),
});

export const contractActivity = pgTable("contract_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  action: text("action").notNull(), // 'created', 'sent', 'signed', 'milestone_submitted', etc.
  actorEmail: text("actor_email").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'demo', 'trial', 'contact'
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas - for API endpoints
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Raw insert schema - for storage layer with passwordHash
export const insertUserRawSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  activatedAt: true,
  completedAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  submittedAt: true,
  approvedAt: true,
});

export const insertContractSignatureSchema = createInsertSchema(contractSignatures).omit({
  id: true,
  signedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  releasedAt: true,
});

export const insertContractActivitySchema = createInsertSchema(contractActivity).omit({
  id: true,
  createdAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserRawSchema>;
export type User = typeof users.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;
export type InsertContractSignature = z.infer<typeof insertContractSignatureSchema>;
export type ContractSignature = typeof contractSignatures.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertContractActivity = z.infer<typeof insertContractActivitySchema>;
export type ContractActivity = typeof contractActivity.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
