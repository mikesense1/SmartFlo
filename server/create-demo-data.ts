import { db } from "./db";
import { users, contracts, milestones, contractActivity, paymentAuthorizations } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

export async function createDemoData() {
  console.log("Creating demo data...");

  try {
    // First, let's check if demo user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, "demo@smartflo.com"))
      .limit(1);

    let demoUserId: string;

    if (existingUser.length === 0) {
      // Create demo freelancer user
      const passwordHash = await bcrypt.hash("demo123", 10);
      
      const [demoUser] = await db
        .insert(users)
        .values({
          email: "demo@smartflo.com",
          fullName: "Sarah Johnson",
          passwordHash,
          userType: "freelancer",
          freelanceType: "developer",
          hourlyRate: "85.00",
          subscriptionTier: "pro",
          totalContractsValue: "15750.00",
          isEmailVerified: true,
        })
        .returning();

      demoUserId = demoUser.id;
      console.log("Created demo user:", demoUser.email);
    } else {
      demoUserId = existingUser[0].id;
      console.log("Demo user already exists");
    }

    // Create demo client user
    let clientUserId: string;
    const existingClient = await db
      .select()
      .from(users)
      .where(eq(users.email, "client@acmecorp.com"))
      .limit(1);

    if (existingClient.length === 0) {
      const clientPasswordHash = await bcrypt.hash("client123", 10);
      
      const [clientUser] = await db
        .insert(users)
        .values({
          email: "client@acmecorp.com",
          fullName: "Michael Chen",
          passwordHash: clientPasswordHash,
          userType: "client",
          companyName: "Acme Corporation",
          subscriptionTier: "business",
          totalContractsValue: "25000.00",
          isEmailVerified: true,
        })
        .returning();

      clientUserId = clientUser.id;
      console.log("Created demo client:", clientUser.email);
    } else {
      clientUserId = existingClient[0].id;
      console.log("Demo client already exists");
    }

    // Create demo contracts
    const contract1Data = {
      creatorId: demoUserId,
      clientId: clientUserId,
      title: "E-commerce Platform Development",
      clientName: "Michael Chen",
      clientEmail: "client@acmecorp.com",
      projectDescription: "Build a modern e-commerce platform with React, Node.js, and Stripe integration. Features include product catalog, shopping cart, payment processing, and admin dashboard.",
      totalValue: "7500.00",
      paymentMethod: "stripe_card",
      contractType: "milestone_based",
      status: "active",
      blockchainStatus: "deployed",
      solanaProgramAddress: "4VqkT7jYGgFZKk8FH8nL9YxGHzKDQf9P3vT2LpJ8vR5S",
      escrowAddress: "7K9mB3nX6cW8fT5qR2M4jY7Lp1N8qS6H9rV3zE4uJ2aF",
      blockchainNetwork: "solana-devnet",
      deploymentTx: "5hK7nR9jB3mX2pQ8vY6tL1sE9fN4cW7aZ5qM8uJ3rT6vH",
      generatedContract: "SOFTWARE DEVELOPMENT AGREEMENT\n\nThis agreement is between Sarah Johnson (Developer) and Acme Corporation (Client) for the development of an e-commerce platform.\n\nSCOPE OF WORK:\n- Modern React.js frontend\n- Node.js backend API\n- Stripe payment integration\n- Admin dashboard\n- Product catalog system\n\nPAYMENT TERMS:\nTotal project value: $7,500\nPayment structure: Milestone-based\nPayment method: Credit card via Stripe\n\nTIMELINE:\n6 weeks total development time\n\nTerms and conditions apply.",
      sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      activatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    };

    const contract2Data = {
      creatorId: demoUserId,
      clientId: null, // Not signed up yet
      title: "Mobile App UI/UX Design",
      clientName: "Jennifer Wilson",
      clientEmail: "jennifer@designstudio.com",
      projectDescription: "Design modern UI/UX for iOS and Android mobile app. Includes wireframes, user flow, high-fidelity mockups, and design system documentation.",
      totalValue: "4250.00",
      paymentMethod: null,
      contractType: "milestone_based",
      status: "sent",
      blockchainStatus: "pending",
      generatedContract: "DESIGN SERVICES AGREEMENT\n\nThis agreement is between Sarah Johnson (Designer) and Jennifer Wilson (Client) for mobile app design services.\n\nSCOPE OF WORK:\n- User experience research\n- Wireframe creation\n- High-fidelity mockups\n- Design system documentation\n- iOS and Android specifications\n\nPAYMENT TERMS:\nTotal project value: $4,250\nPayment structure: Milestone-based\n\nTIMELINE:\n4 weeks total design time\n\nTerms and conditions apply.",
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    };

    const contract3Data = {
      creatorId: demoUserId,
      clientId: clientUserId,
      title: "API Integration & Automation",
      clientName: "Michael Chen", 
      clientEmail: "client@acmecorp.com",
      projectDescription: "Integrate multiple third-party APIs and set up automation workflows. Includes CRM integration, email marketing automation, and analytics dashboard.",
      totalValue: "4000.00",
      paymentMethod: "usdc",
      contractType: "milestone_based",
      status: "active",
      blockchainStatus: "deployed",
      solanaProgramAddress: "8WxJ6nM4vR2qT7kY3cF9pL5sB1zE6hN8aQ4mU7jV3rK2",
      escrowAddress: "9TxK7oP3wS4rU8lZ5cG1qM6tB2yF7hO4aR5nW9jX4vL8",
      blockchainNetwork: "solana-devnet",
      deploymentTx: "6gL8oQ4jC5nY3qR9wZ7tM2sF0fO5dX8bB6pN1uK4sH7uI",
      generatedContract: "API INTEGRATION AGREEMENT\n\nThis agreement is between Sarah Johnson (Developer) and Acme Corporation (Client) for API integration services.\n\nSCOPE OF WORK:\n- CRM system integration\n- Email marketing automation\n- Analytics dashboard setup\n- Third-party API connections\n- Workflow automation\n\nPAYMENT TERMS:\nTotal project value: $4,000\nPayment structure: Milestone-based\nPayment method: USDC cryptocurrency\n\nTIMELINE:\n3 weeks total development time\n\nTerms and conditions apply.",
      sentAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
      activatedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
    };

    // Insert contracts
    const [contract1, contract2, contract3] = await db
      .insert(contracts)
      .values([contract1Data, contract2Data, contract3Data])
      .returning();

    console.log("Created demo contracts:", [contract1.title, contract2.title, contract3.title]);

    // Create milestones for Contract 1 (E-commerce Platform)
    const contract1Milestones = [
      {
        contractId: contract1.id,
        title: "Project Setup & Planning",
        description: "Initialize project repository, set up development environment, create technical specifications and database schema.",
        amount: "1500.00",
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
        status: "paid",
        paymentReleased: true,
        submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        approvedBy: "client@acmecorp.com",
        paymentTx: "tx_1AbC2DeF3GhI4JkL5MnO6PqR",
      },
      {
        contractId: contract1.id,
        title: "Backend API Development",
        description: "Develop REST API endpoints, implement authentication, set up database integration and basic CRUD operations.",
        amount: "2500.00",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
        status: "submitted",
        paymentReleased: false,
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        contractId: contract1.id,
        title: "Frontend Development",
        description: "Build React components, implement responsive design, integrate with backend API and add shopping cart functionality.",
        amount: "2500.00",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
        status: "in_progress",
        paymentReleased: false,
      },
      {
        contractId: contract1.id,
        title: "Payment Integration & Testing",
        description: "Integrate Stripe payment processing, implement security measures, conduct thorough testing and deploy to production.",
        amount: "1000.00",
        dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 18 days from now
        status: "pending",
        paymentReleased: false,
      },
    ];

    // Create milestones for Contract 2 (Mobile App Design)
    const contract2Milestones = [
      {
        contractId: contract2.id,
        title: "Research & Wireframes",
        description: "Conduct user research, create user personas, develop wireframes and user flow diagrams.",
        amount: "1250.00",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "pending",
        paymentReleased: false,
      },
      {
        contractId: contract2.id,
        title: "High-Fidelity Designs",
        description: "Create detailed mockups for all screens, design system components and interactive prototypes.",
        amount: "2000.00",
        dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "pending",
        paymentReleased: false,
      },
      {
        contractId: contract2.id,
        title: "Final Deliverables",
        description: "Deliver design specifications, asset exports, style guide documentation and developer handoff materials.",
        amount: "1000.00",
        dueDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "pending",
        paymentReleased: false,
      },
    ];

    // Create milestones for Contract 3 (API Integration)
    const contract3Milestones = [
      {
        contractId: contract3.id,
        title: "CRM Integration",
        description: "Set up Salesforce API integration, implement data synchronization and create automated workflows.",
        amount: "1500.00",
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
        status: "paid",
        paymentReleased: true,
        submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        approvedBy: "client@acmecorp.com",
        paymentTx: "usdc_tx_8hJ9kL2mN3oP4qR5sT6uV7wX",
      },
      {
        contractId: contract3.id,
        title: "Analytics Dashboard",
        description: "Build comprehensive analytics dashboard with real-time data visualization and reporting features.",
        amount: "1500.00",
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
        status: "in_progress",
        paymentReleased: false,
      },
      {
        contractId: contract3.id,
        title: "Automation Setup",
        description: "Configure email marketing automation, set up notification systems and implement workflow triggers.",
        amount: "1000.00",
        dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 11 days from now
        status: "pending",
        paymentReleased: false,
      },
    ];

    // Insert all milestones
    await db
      .insert(milestones)
      .values([...contract1Milestones, ...contract2Milestones, ...contract3Milestones]);

    console.log("Created demo milestones");

    // Create payment authorizations for active contracts
    const authData = [
      {
        contractId: contract1.id,
        clientId: clientUserId,
        paymentMethod: "stripe",
        stripeCustomerId: "cus_demo_client_acme_corp",
        stripePaymentMethodId: "pm_1Demo2Card3Test4Acme",
        maxPerMilestone: "3000.00",
        totalAuthorized: "7500.00",
        termsVersion: "1.0",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        isActive: true,
        authorizedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract3.id,
        clientId: clientUserId,
        paymentMethod: "usdc",
        walletAddress: "8WxJ6nM4vR2qT7kY3cF9pL5sB1zE6hN8aQ4mU7jV3rK2",
        walletSignature: "signature_demo_usdc_authorization_acme",
        authorizationMessage: "I authorize SmartFlo to process USDC payments for API Integration project up to the specified amounts.",
        maxPerMilestone: "2000.00",
        totalAuthorized: "4000.00",
        termsVersion: "1.0",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        isActive: true,
        authorizedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      },
    ];

    await db
      .insert(paymentAuthorizations)
      .values(authData);

    console.log("Created demo payment authorizations");

    // Create contract activity logs
    const activityData = [
      {
        contractId: contract1.id,
        action: "created",
        actorEmail: "demo@smartflo.com",
        details: { contractTitle: "E-commerce Platform Development" },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract1.id,
        action: "sent",
        actorEmail: "demo@smartflo.com",
        details: { sentTo: "client@acmecorp.com" },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract1.id,
        action: "payment_authorized",
        actorEmail: "client@acmecorp.com",
        details: { method: "stripe_card", amount: "7500.00" },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract1.id,
        action: "milestone_submitted",
        actorEmail: "demo@smartflo.com",
        details: { milestoneTitle: "Project Setup & Planning", amount: "1500.00" },
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract1.id,
        action: "milestone_approved",
        actorEmail: "client@acmecorp.com",
        details: { milestoneTitle: "Project Setup & Planning", amount: "1500.00" },
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract1.id,
        action: "payment_released",
        actorEmail: "system",
        details: { milestoneTitle: "Project Setup & Planning", amount: "1500.00", tx: "tx_1AbC2DeF3GhI4JkL5MnO6PqR" },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract1.id,
        action: "milestone_submitted",
        actorEmail: "demo@smartflo.com",
        details: { milestoneTitle: "Backend API Development", amount: "2500.00" },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract2.id,
        action: "created",
        actorEmail: "demo@smartflo.com",
        details: { contractTitle: "Mobile App UI/UX Design" },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract2.id,
        action: "sent",
        actorEmail: "demo@smartflo.com",
        details: { sentTo: "jennifer@designstudio.com" },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract3.id,
        action: "created",
        actorEmail: "demo@smartflo.com",
        details: { contractTitle: "API Integration & Automation" },
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract3.id,
        action: "payment_authorized",
        actorEmail: "client@acmecorp.com",
        details: { method: "usdc", amount: "4000.00" },
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract3.id,
        action: "milestone_submitted",
        actorEmail: "demo@smartflo.com",
        details: { milestoneTitle: "CRM Integration", amount: "1500.00" },
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract3.id,
        action: "milestone_approved",
        actorEmail: "client@acmecorp.com",
        details: { milestoneTitle: "CRM Integration", amount: "1500.00" },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        contractId: contract3.id,
        action: "payment_released",
        actorEmail: "system",
        details: { milestoneTitle: "CRM Integration", amount: "1500.00", tx: "usdc_tx_8hJ9kL2mN3oP4qR5sT6uV7wX" },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ];

    await db
      .insert(contractActivity)
      .values(activityData);

    console.log("Created demo contract activity logs");

    console.log("✅ Demo data created successfully!");
    console.log("\n📧 Demo Login Credentials:");
    console.log("Freelancer Account:");
    console.log("  Email: demo@smartflo.com");
    console.log("  Password: demo123");
    console.log("  Role: Freelancer (Sarah Johnson)");
    console.log("\nClient Account:");
    console.log("  Email: client@acmecorp.com");
    console.log("  Password: client123");
    console.log("  Role: Client (Michael Chen - Acme Corporation)");
    console.log("\n📋 Demo Data Summary:");
    console.log("• 3 contracts with different statuses");
    console.log("• 10 milestones across all contracts");
    console.log("• 2 payment authorizations (Stripe + USDC)");
    console.log("• 14 activity log entries");
    console.log("• Real timeline data with submitted/approved milestones");

  } catch (error) {
    console.error("Error creating demo data:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoData()
    .then(() => {
      console.log("Demo data creation completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo data:", error);
      process.exit(1);
    });
}