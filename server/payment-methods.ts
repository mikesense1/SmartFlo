import type { Express } from "express";
import { db } from "./db";
import { paymentMethods, paymentAuthorizations, contracts, users } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "./auth";

const addPaymentMethodSchema = z.object({
  type: z.enum(["stripe_card", "stripe_ach", "crypto_wallet"]),
  stripePaymentMethodId: z.string().optional(),
  walletAddress: z.string().optional(),
  walletType: z.string().optional(),
  isDefault: z.boolean().default(false),
});

const updatePaymentMethodSchema = z.object({
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export function registerPaymentMethodRoutes(app: Express) {
  // Get all payment methods for current user
  app.get("/api/payment-methods", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;

      // Get payment methods with usage statistics
      const userPaymentMethods = await db
        .select({
          id: paymentMethods.id,
          type: paymentMethods.type,
          stripePaymentMethodId: paymentMethods.stripePaymentMethodId,
          walletAddress: paymentMethods.walletAddress,
          walletType: paymentMethods.walletType,
          cardLast4: paymentMethods.cardLast4,
          cardBrand: paymentMethods.cardBrand,
          cardExpMonth: paymentMethods.cardExpMonth,
          cardExpYear: paymentMethods.cardExpYear,
          bankLast4: paymentMethods.bankLast4,
          bankName: paymentMethods.bankName,
          isDefault: paymentMethods.isDefault,
          isActive: paymentMethods.isActive,
          lastUsedAt: paymentMethods.lastUsedAt,
          expiryNotificationSent: paymentMethods.expiryNotificationSent,
          createdAt: paymentMethods.createdAt,
          contractCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${paymentAuthorizations} pa 
            WHERE pa.payment_method_id = ${paymentMethods.id} 
            AND pa.is_active = true
          )`,
        })
        .from(paymentMethods)
        .where(and(
          eq(paymentMethods.userId, userId),
          eq(paymentMethods.isActive, true)
        ))
        .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.lastUsedAt));

      // Get contract names for each payment method
      const enrichedMethods = await Promise.all(
        userPaymentMethods.map(async (method) => {
          const contractNames = await db
            .select({
              contractTitle: contracts.title,
              contractId: contracts.id,
              totalAuthorized: paymentAuthorizations.totalAuthorized,
            })
            .from(paymentAuthorizations)
            .innerJoin(contracts, eq(paymentAuthorizations.contractId, contracts.id))
            .where(and(
              eq(paymentAuthorizations.paymentMethodId, method.id),
              eq(paymentAuthorizations.isActive, true)
            ));

          return {
            ...method,
            contracts: contractNames,
            isExpiring: isCardExpiring(method),
            isExpired: isCardExpired(method),
          };
        })
      );

      res.json(enrichedMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  // Add new payment method
  app.post("/api/payment-methods", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const validatedData = addPaymentMethodSchema.parse(req.body);

      // If setting as default, unset other defaults
      if (validatedData.isDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(paymentMethods.userId, userId));
      }

      // For Stripe payment methods, fetch details from Stripe
      let methodData = { ...validatedData, userId };
      
      if (validatedData.type === "stripe_card" && validatedData.stripePaymentMethodId) {
        // In a real implementation, you would fetch from Stripe API here
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        // const paymentMethod = await stripe.paymentMethods.retrieve(validatedData.stripePaymentMethodId);
        
        // For demo purposes, we'll use mock data
        methodData = {
          ...methodData,
          cardLast4: "4242",
          cardBrand: "visa",
          cardExpMonth: "12",
          cardExpYear: "2025",
        } as any;
      }

      const [newMethod] = await db
        .insert(paymentMethods)
        .values(methodData)
        .returning();

      res.status(201).json(newMethod);
    } catch (error) {
      console.error("Error adding payment method:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: error.errors[0].message 
        });
      }
      
      res.status(500).json({ error: "Failed to add payment method" });
    }
  });

  // Update payment method
  app.patch("/api/payment-methods/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const methodId = req.params.id;
      const validatedData = updatePaymentMethodSchema.parse(req.body);

      // Verify ownership
      const [existingMethod] = await db
        .select()
        .from(paymentMethods)
        .where(and(
          eq(paymentMethods.id, methodId),
          eq(paymentMethods.userId, userId)
        ));

      if (!existingMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      // If setting as default, unset other defaults
      if (validatedData.isDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(
            eq(paymentMethods.userId, userId),
            sql`${paymentMethods.id} != ${methodId}`
          ));
      }

      const [updatedMethod] = await db
        .update(paymentMethods)
        .set({ 
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(paymentMethods.id, methodId))
        .returning();

      res.json(updatedMethod);
    } catch (error) {
      console.error("Error updating payment method:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: error.errors[0].message 
        });
      }
      
      res.status(500).json({ error: "Failed to update payment method" });
    }
  });

  // Remove payment method
  app.delete("/api/payment-methods/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const methodId = req.params.id;

      // Verify ownership
      const [existingMethod] = await db
        .select()
        .from(paymentMethods)
        .where(and(
          eq(paymentMethods.id, methodId),
          eq(paymentMethods.userId, userId)
        ));

      if (!existingMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      // Check if method is being used in active authorizations
      const [activeAuth] = await db
        .select()
        .from(paymentAuthorizations)
        .where(and(
          eq(paymentAuthorizations.paymentMethodId, methodId),
          eq(paymentAuthorizations.isActive, true)
        ));

      if (activeAuth) {
        return res.status(400).json({ 
          error: "Cannot delete payment method with active authorizations" 
        });
      }

      // Soft delete by setting isActive to false
      await db
        .update(paymentMethods)
        .set({ 
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(paymentMethods.id, methodId));

      res.json({ message: "Payment method removed successfully" });
    } catch (error) {
      console.error("Error removing payment method:", error);
      res.status(500).json({ error: "Failed to remove payment method" });
    }
  });

  // Get expiring payment methods
  app.get("/api/payment-methods/expiring", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringMethods = await db
        .select()
        .from(paymentMethods)
        .where(and(
          eq(paymentMethods.userId, userId),
          eq(paymentMethods.isActive, true),
          eq(paymentMethods.type, "stripe_card"),
          sql`CAST(${paymentMethods.cardExpYear} || '-' || ${paymentMethods.cardExpMonth} || '-01' AS date) <= ${thirtyDaysFromNow.toISOString().split('T')[0]}`
        ));

      res.json(expiringMethods);
    } catch (error) {
      console.error("Error fetching expiring payment methods:", error);
      res.status(500).json({ error: "Failed to fetch expiring payment methods" });
    }
  });

  // Update payment method usage
  app.post("/api/payment-methods/:id/use", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const methodId = req.params.id;

      // Verify ownership
      const [existingMethod] = await db
        .select()
        .from(paymentMethods)
        .where(and(
          eq(paymentMethods.id, methodId),
          eq(paymentMethods.userId, userId)
        ));

      if (!existingMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }

      await db
        .update(paymentMethods)
        .set({ 
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paymentMethods.id, methodId));

      res.json({ message: "Payment method usage updated" });
    } catch (error) {
      console.error("Error updating payment method usage:", error);
      res.status(500).json({ error: "Failed to update payment method usage" });
    }
  });
}

// Helper functions
function isCardExpiring(method: any): boolean {
  if (method.type !== "stripe_card" || !method.cardExpMonth || !method.cardExpYear) {
    return false;
  }

  const expDate = new Date(parseInt(method.cardExpYear), parseInt(method.cardExpMonth) - 1, 1);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return expDate <= thirtyDaysFromNow && expDate > new Date();
}

function isCardExpired(method: any): boolean {
  if (method.type !== "stripe_card" || !method.cardExpMonth || !method.cardExpYear) {
    return false;
  }

  const expDate = new Date(parseInt(method.cardExpYear), parseInt(method.cardExpMonth) - 1, 1);
  return expDate <= new Date();
}