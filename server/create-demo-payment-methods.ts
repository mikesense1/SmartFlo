import { db } from "./db";
import { paymentMethods, users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function createDemoPaymentMethods() {
  console.log("Creating demo payment methods...");

  try {
    // Get demo users
    const [demoFreelancer] = await db
      .select()
      .from(users)
      .where(eq(users.email, "demo@smartflo.com"))
      .limit(1);

    const [demoClient] = await db
      .select()
      .from(users)
      .where(eq(users.email, "client@acmecorp.com"))
      .limit(1);

    if (!demoFreelancer || !demoClient) {
      console.log("Demo users not found, skipping payment methods creation");
      return;
    }

    // Demo payment methods for client (who pays)
    const clientPaymentMethods = [
      {
        userId: demoClient.id,
        type: "stripe_card",
        cardLast4: "4242",
        cardBrand: "visa",
        cardExpMonth: "12",
        cardExpYear: "2025",
        stripePaymentMethodId: "pm_demo_visa_4242",
        stripeCustomerId: "cus_demo_client_acme",
        isDefault: true,
        isActive: true,
        lastUsedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        userId: demoClient.id,
        type: "crypto_wallet",
        walletAddress: "8WxJ6nM4vR2qT7kY3cF9pL5sB1zE6hN8aQ4mU7jV3rK2",
        walletType: "phantom",
        isDefault: false,
        isActive: true,
        lastUsedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        userId: demoClient.id,
        type: "stripe_card",
        cardLast4: "0005",
        cardBrand: "mastercard",
        cardExpMonth: "03",
        cardExpYear: "2024", // Expired card
        stripePaymentMethodId: "pm_demo_mastercard_0005",
        stripeCustomerId: "cus_demo_client_acme",
        isDefault: false,
        isActive: true,
        expiryNotificationSent: true,
        lastUsedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      },
    ];

    // Demo payment methods for freelancer (for receiving, less common but possible)
    const freelancerPaymentMethods = [
      {
        userId: demoFreelancer.id,
        type: "crypto_wallet",
        walletAddress: "7xKX9nR4mP3cQ8vY6tL1sE9fN4cW7aZ5qM8uJ3rT6vH3nD",
        walletType: "phantom",
        isDefault: true,
        isActive: true,
        lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ];

    // Insert payment methods
    await db
      .insert(paymentMethods)
      .values([...clientPaymentMethods, ...freelancerPaymentMethods]);

    console.log("✅ Demo payment methods created successfully!");
    console.log(`• Created ${clientPaymentMethods.length} payment methods for client`);
    console.log(`• Created ${freelancerPaymentMethods.length} payment methods for freelancer`);
    console.log("• Includes expired card for testing notifications");

  } catch (error) {
    console.error("Error creating demo payment methods:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoPaymentMethods()
    .then(() => {
      console.log("Demo payment methods creation completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo payment methods:", error);
      process.exit(1);
    });
}