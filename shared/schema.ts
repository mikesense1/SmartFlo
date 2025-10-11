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

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'stripe_card', 'stripe_ach', 'crypto_wallet'
  stripePaymentMethodId: text("stripe_payment_method_id"),
  stripeCustomerId: text("stripe_customer_id"),
  walletAddress: text("wallet_address"),
  walletType: text("wallet_type"), // 'phantom', 'solflare', etc.
  cardLast4: text("card_last4"),
  cardBrand: text("card_brand"), // 'visa', 'mastercard', etc.
  cardExpMonth: text("card_exp_month"),
  cardExpYear: text("card_exp_year"),
  bankLast4: text("bank_last4"),
  bankName: text("bank_name"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  expiryNotificationSent: boolean("expiry_notification_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentAuthorizations = pgTable("payment_authorizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  clientId: uuid("client_id").references(() => users.id),
  paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
  paymentMethod: text("payment_method").notNull(), // 'stripe' or 'usdc'
  stripeSetupIntentId: text("stripe_setup_intent_id"),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  stripeCustomerId: text("stripe_customer_id"),
  walletAddress: text("wallet_address"),
  walletSignature: text("wallet_signature"),
  authorizationMessage: text("authorization_message"),
  maxPerMilestone: decimal("max_per_milestone").notNull(),
  totalAuthorized: decimal("total_authorized").notNull(),
  termsVersion: text("terms_version").notNull().default("1.0"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").notNull().default(true),
  authorizedAt: timestamp("authorized_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
});

export const contractShares = pgTable("contract_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  shareToken: text("share_token").notNull().unique(),
  clientEmail: text("client_email").notNull(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
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

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentAuthorizationSchema = createInsertSchema(paymentAuthorizations).omit({
  id: true,
  authorizedAt: true,
});

export const insertContractShareSchema = createInsertSchema(contractShares).omit({
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
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentAuthorization = z.infer<typeof insertPaymentAuthorizationSchema>;
export type PaymentAuthorization = typeof paymentAuthorizations.$inferSelect;
export type InsertContractShare = z.infer<typeof insertContractShareSchema>;
export type ContractShare = typeof contractShares.$inferSelect;

// Payment OTP (2FA) table for secure milestone approvals
export const paymentOTPs = pgTable("payment_otps", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  milestoneId: uuid("milestone_id").references(() => milestones.id),
  code: text("code").notNull(), // Hashed OTP code
  amount: decimal("amount").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at"),
  failedAttempts: decimal("failed_attempts").notNull().default("0"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectPaymentOTP = typeof paymentOTPs.$inferSelect;
export const insertPaymentOTPSchema = createInsertSchema(paymentOTPs).omit({
  id: true,
  createdAt: true,
});
export type InsertPaymentOTP = z.infer<typeof insertPaymentOTPSchema>;

// User security settings for smart 2FA
export const userSecuritySettings = pgTable("user_security_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id),
  always2FA: boolean("always_2fa").notNull().default(false),
  tfaThreshold: decimal("tfa_threshold").notNull().default("10000"), // in cents, default $100
  enabledMethods: text("enabled_methods").array().notNull().default(["email"]), // 'email', 'sms', 'authenticator'
  backupCodes: text("backup_codes").array(), // Hashed backup codes
  trustedDevicesEnabled: boolean("trusted_devices_enabled").notNull().default(true),
  sessionTimeout: decimal("session_timeout").notNull().default("30"), // minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SelectUserSecuritySettings = typeof userSecuritySettings.$inferSelect;
export const insertUserSecuritySettingsSchema = createInsertSchema(userSecuritySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserSecuritySettings = z.infer<typeof insertUserSecuritySettingsSchema>;

// Trusted devices for smart 2FA
export const trustedDevices = pgTable("trusted_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  deviceId: text("device_id").notNull(), // Browser fingerprint or device identifier
  deviceName: text("device_name"),
  deviceType: text("device_type"), // 'desktop', 'mobile', 'tablet'
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  isTrusted: boolean("is_trusted").notNull().default(false),
  trustedAt: timestamp("trusted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectTrustedDevice = typeof trustedDevices.$inferSelect;
export const insertTrustedDeviceSchema = createInsertSchema(trustedDevices).omit({
  id: true,
  createdAt: true,
});
export type InsertTrustedDevice = z.infer<typeof insertTrustedDeviceSchema>;

// 2FA analytics for monitoring and optimization
export const tfaAnalytics = pgTable("tfa_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  milestoneId: uuid("milestone_id").references(() => milestones.id),
  eventType: text("event_type").notNull(), // '2fa_sent', '2fa_success', '2fa_failed', '2fa_skipped'
  method: text("method").notNull(), // 'email', 'sms', 'authenticator', 'backup_code'
  amount: decimal("amount"),
  timeToComplete: decimal("time_to_complete"), // milliseconds
  deviceId: text("device_id"),
  ipAddress: text("ip_address"),
  reason: text("reason"), // Why 2FA was triggered or skipped
  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectTFAAnalytics = typeof tfaAnalytics.$inferSelect;
export const insertTFAAnalyticsSchema = createInsertSchema(tfaAnalytics).omit({
  id: true,
  createdAt: true,
});
export type InsertTFAAnalytics = z.infer<typeof insertTFAAnalyticsSchema>;
