import { db } from './db';
import { users, contracts, milestones, payments, contractActivity, contacts } from '../shared/schema';
import type { InsertUser, InsertContract, InsertMilestone, InsertPayment, InsertContractActivity, InsertContact } from '../shared/schema';

export async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...');
  
  try {
    // Check if demo data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('Demo data already exists, skipping seed...');
      return;
    }

    // Create demo users
    const demoUsers: InsertUser[] = [
      {
        email: 'alex.morgan@smartflo.dev',
        fullName: 'Alex Morgan',
        freelanceType: 'developer',
        hourlyRate: '85.00',
        subscriptionTier: 'pro',
        totalContractsValue: '47500.00',
      },
      {
        email: 'sarah.chen@designstudio.com',
        fullName: 'Sarah Chen',
        freelanceType: 'designer',
        hourlyRate: '75.00',
        subscriptionTier: 'free',
        totalContractsValue: '23800.00',
      },
      {
        email: 'marcus.johnson@contentwriter.io',
        fullName: 'Marcus Johnson',
        freelanceType: 'writer',
        hourlyRate: '65.00',
        subscriptionTier: 'pro',
        totalContractsValue: '18400.00',
      }
    ];

    console.log('Creating demo users...');
    const createdUsers = await db.insert(users).values(demoUsers).returning();
    console.log(`✓ Created ${createdUsers.length} demo users`);

    // Create demo contacts  
    const demoContacts: InsertContact[] = [
      {
        name: 'TechStartup Inc',
        email: 'hello@techstartup.co',
        message: 'We need a full-stack developer to build our e-commerce platform with React and Node.js. Timeline is 3 months.',
        type: 'project_inquiry'
      },
      {
        name: 'Creative Agency',
        email: 'projects@creativeagency.com',
        message: 'Looking for a designer to create comprehensive brand identity including logo, website design, and marketing materials.',
        type: 'project_inquiry'
      }
    ];

    console.log('Creating demo contacts...');
    const createdContacts = await db.insert(contacts).values(demoContacts).returning();
    console.log(`✓ Created ${createdContacts.length} demo contacts`);

    // Create demo contracts
    const demoContracts: InsertContract[] = [
      {
        creatorId: createdUsers[0].id, // Alex Morgan
        title: 'E-commerce Platform Development',
        clientName: 'TechStartup Inc',
        clientEmail: 'hello@techstartup.co',
        projectDescription: 'Full-stack e-commerce platform with React frontend, Node.js backend, payment integration, and admin dashboard. Includes user authentication, product catalog, shopping cart, and order management.',
        totalValue: '15000.00',
        paymentMethod: 'stripe_card',
        contractType: 'milestone_based',
        status: 'active',
        solanaProgramAddress: '8K7J9mNvFqGxQ2Rp4EwBzCvL5tM6sN1xY3zA9qW4eR5u',
        escrowAddress: '5eY9qW4eR5u8K7J9mNvFqGxQ2Rp4EwBzCvL5tM6sN1xY3zA',
        blockchainNetwork: 'solana-devnet',
        blockchainStatus: 'deployed',
        generatedContract: `FREELANCE DEVELOPMENT AGREEMENT

This Agreement is entered into between Alex Morgan ("Contractor") and TechStartup Inc ("Client") for the development of an e-commerce platform.

PROJECT SCOPE:
- Full-stack web application development
- React.js frontend with responsive design
- Node.js/Express backend API
- PostgreSQL database integration
- Stripe payment processing
- User authentication system
- Product catalog and inventory management
- Shopping cart and checkout flow
- Admin dashboard for order management

PAYMENT TERMS:
Total Project Value: $15,000.00
Payment Method: Stripe Credit Card
Structure: Milestone-based payments

MILESTONES:
1. Frontend UI/UX Implementation - $5,000.00
2. Backend API Development - $4,500.00
3. Payment Integration & Testing - $3,000.00
4. Deployment & Documentation - $2,500.00

TIMELINE:
Project Start Date: Current Date
Estimated Completion: 12 weeks from start date

INTELLECTUAL PROPERTY:
All code and assets created will be transferred to Client upon final payment.

PAYMENT PROCESSING:
- SmartFlo Fee: 3.4% per transaction
- Payments held in secure escrow until milestone approval
- Auto-release after 7 days if no disputes raised

This contract is governed by the laws of [Jurisdiction] and includes standard freelance protection clauses.`,
      },
      {
        creatorId: createdUsers[1].id, // Sarah Chen
        title: 'Brand Identity & Website Design',
        clientName: 'Creative Agency',
        clientEmail: 'projects@creativeagency.com',
        projectDescription: 'Complete brand identity design including logo, color palette, typography, business cards, and responsive website design with modern UI/UX principles.',
        totalValue: '8500.00',
        paymentMethod: 'stripe_ach',
        contractType: 'milestone_based',
        status: 'active',
        solanaProgramAddress: '9L8K0nWvGrHyS3Sq5FxCzDwM6uO2yP4xZ5aB0rX6fT7v',
        escrowAddress: '6fT7v9L8K0nWvGrHyS3Sq5FxCzDwM6uO2yP4xZ5aB0rX',
        blockchainNetwork: 'solana-devnet',
        blockchainStatus: 'deployed',
        generatedContract: `DESIGN SERVICES AGREEMENT

This Agreement is between Sarah Chen ("Designer") and Creative Agency ("Client") for brand identity and website design services.

PROJECT DELIVERABLES:
- Complete brand identity package
- Logo design (3 concepts + revisions)
- Color palette and typography guidelines
- Business card and letterhead design
- Responsive website design (5 pages)
- Style guide documentation

PAYMENT TERMS:
Total Project Value: $8,500.00
Payment Method: Stripe ACH Transfer
Structure: Milestone-based payments

TIMELINE:
Project Duration: 8 weeks
Review Period: 3 business days per milestone

REVISIONS:
Up to 3 major revisions per milestone included
Additional revisions billed at $85/hour

USAGE RIGHTS:
Client receives full commercial usage rights upon final payment.

This agreement includes SmartFlo's standard design protection clauses and dispute resolution process.`,
        activatedAt: new Date(),
      },
      {
        creatorId: createdUsers[2].id, // Marcus Johnson
        title: 'Content Writing & SEO Strategy',
        clientName: 'Digital Marketing Firm',
        clientEmail: 'content@digitalmarketing.pro',
        projectDescription: 'Comprehensive content writing package including blog posts, website copy, SEO optimization, and content marketing strategy for B2B SaaS company.',
        totalValue: '4200.00',
        paymentMethod: 'usdc',
        contractType: 'milestone_based',
        status: 'completed',
        solanaProgramAddress: '7M9N2pYvHsJzT4Ur6GxDzEwO7vP3zQ5yA6bC1sY8gU9w',
        escrowAddress: '8gU9w7M9N2pYvHsJzT4Ur6GxDzEwO7vP3zQ5yA6bC1sY',
        blockchainNetwork: 'solana-devnet',
        blockchainStatus: 'completed',
        generatedContract: `CONTENT CREATION AGREEMENT

Agreement between Marcus Johnson ("Writer") and Digital Marketing Firm ("Client") for content writing and SEO services.

SCOPE OF WORK:
- 12 SEO-optimized blog posts (1,500 words each)
- Website copy rewrite (5 pages)
- Content marketing strategy document
- Keyword research and optimization
- Meta descriptions and title tags

DELIVERABLES TIMELINE:
Week 1-2: SEO research and strategy
Week 3-6: Blog content creation
Week 7-8: Website copy and optimization

PAYMENT TERMS:
Total Value: $4,200.00
Payment Method: USDC Cryptocurrency
Milestone Structure: 4 payments of $1,050.00

QUALITY STANDARDS:
- Original, plagiarism-free content
- SEO best practices compliance
- Brand voice consistency
- Timely delivery as scheduled

COPYRIGHT:
All content rights transfer to Client upon payment completion.

SmartFlo platform fees: 1.5% per USDC transaction (max $100).`,
        activatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      }
    ];

    console.log('Creating demo contracts...');
    const createdContracts = await db.insert(contracts).values(demoContracts).returning();
    console.log(`✓ Created ${createdContracts.length} demo contracts`);

    // Create demo milestones
    const demoMilestones: InsertMilestone[] = [
      // E-commerce Platform Milestones
      {
        contractId: createdContracts[0].id,
        title: 'Frontend UI/UX Implementation',
        description: 'Complete responsive frontend with React.js, including user interface, product pages, and shopping cart functionality.',
        amount: '5000.00',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 weeks from now
        status: 'in_progress'
      },
      {
        contractId: createdContracts[0].id,
        title: 'Backend API Development',
        description: 'Node.js/Express REST API with database integration, user authentication, and product management endpoints.',
        amount: '4500.00',
        dueDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000), // 6 weeks from now
        status: 'pending'
      },
      {
        contractId: createdContracts[0].id,
        title: 'Payment Integration & Testing',
        description: 'Stripe payment processing integration, comprehensive testing, and security implementation.',
        amount: '3000.00',
        dueDate: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000), // 9 weeks from now
        status: 'pending'
      },
      {
        contractId: createdContracts[0].id,
        title: 'Deployment & Documentation',
        description: 'Production deployment, performance optimization, and comprehensive documentation delivery.',
        amount: '2500.00',
        dueDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000), // 12 weeks from now
        status: 'pending'
      },
      // Brand Identity Milestones
      {
        contractId: createdContracts[1].id,
        title: 'Brand Research & Logo Concepts',
        description: 'Market research, brand positioning analysis, and 3 initial logo design concepts.',
        amount: '2500.00',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        status: 'approved',
        paymentReleased: true,
        approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        approvedBy: 'projects@creativeagency.com'
      },
      {
        contractId: createdContracts[1].id,
        title: 'Final Brand Identity Package',
        description: 'Finalized logo, color palette, typography guidelines, and brand style guide.',
        amount: '3000.00',
        dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks from now
        status: 'submitted',
        submittedAt: new Date()
      },
      {
        contractId: createdContracts[1].id,
        title: 'Website Design & Implementation',
        description: 'Responsive website design mockups and final implementation with brand elements.',
        amount: '3000.00',
        dueDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000), // 8 weeks from now
        status: 'pending'
      },
      // Content Writing Milestones (Completed)
      {
        contractId: createdContracts[2].id,
        title: 'SEO Research & Strategy',
        description: 'Comprehensive keyword research, competitor analysis, and content marketing strategy document.',
        amount: '1050.00',
        dueDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        status: 'paid',
        paymentReleased: true,
        approvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        approvedBy: 'content@digitalmarketing.pro'
      },
      {
        contractId: createdContracts[2].id,
        title: 'Blog Content Creation (6 Posts)',
        description: 'First batch of 6 SEO-optimized blog posts targeting primary keywords.',
        amount: '1050.00',
        dueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        status: 'paid',
        paymentReleased: true,
        approvedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        approvedBy: 'content@digitalmarketing.pro'
      },
      {
        contractId: createdContracts[2].id,
        title: 'Blog Content Creation (6 Posts)',
        description: 'Second batch of 6 SEO-optimized blog posts and website copy rewrite.',
        amount: '1050.00',
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'paid',
        paymentReleased: true,
        approvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        approvedBy: 'content@digitalmarketing.pro'
      },
      {
        contractId: createdContracts[2].id,
        title: 'Final Optimization & Delivery',
        description: 'Meta descriptions, title tags optimization, and final content strategy documentation.',
        amount: '1050.00',
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'paid',
        paymentReleased: true,
        approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        approvedBy: 'content@digitalmarketing.pro'
      }
    ];

    console.log('Creating demo milestones...');
    const createdMilestones = await db.insert(milestones).values(demoMilestones).returning();
    console.log(`✓ Created ${createdMilestones.length} demo milestones`);

    // Create demo payments
    const demoPayments: InsertPayment[] = [
      // Payments for completed content writing project
      {
        contractId: createdContracts[2].id,
        milestoneId: createdMilestones[7].id,
        amount: '1050.00',
        method: 'usdc',
        status: 'released',
        solanaEscrowAccount: '8gU9w7M9N2pYvHsJzT4Ur6GxDzEwO7vP3zQ5yA6bC1sY'
      },
      {
        contractId: createdContracts[2].id,
        milestoneId: createdMilestones[8].id,
        amount: '1050.00',
        method: 'usdc',
        status: 'released',
        solanaEscrowAccount: '8gU9w7M9N2pYvHsJzT4Ur6GxDzEwO7vP3zQ5yA6bC1sY'
      },
      {
        contractId: createdContracts[2].id,
        milestoneId: createdMilestones[9].id,
        amount: '1050.00',
        method: 'usdc',
        status: 'released',
        solanaEscrowAccount: '8gU9w7M9N2pYvHsJzT4Ur6GxDzEwO7vP3zQ5yA6bC1sY'
      },
      {
        contractId: createdContracts[2].id,
        milestoneId: createdMilestones[10].id,
        amount: '1050.00',
        method: 'usdc',
        status: 'released',
        solanaEscrowAccount: '8gU9w7M9N2pYvHsJzT4Ur6GxDzEwO7vP3zQ5yA6bC1sY'
      },
      // Payment for approved brand identity milestone
      {
        contractId: createdContracts[1].id,
        milestoneId: createdMilestones[4].id,
        amount: '2500.00',
        method: 'stripe_ach',
        status: 'released'
      }
    ];

    console.log('Creating demo payments...');
    const createdPayments = await db.insert(payments).values(demoPayments).returning();
    console.log(`✓ Created ${createdPayments.length} demo payments`);

    // Create demo contract activities
    const demoActivities: InsertContractActivity[] = [
      {
        contractId: createdContracts[0].id,
        action: 'contract_created',
        description: 'Contract created and deployed to blockchain',
        performedBy: 'alex.morgan@smartflo.dev'
      },
      {
        contractId: createdContracts[0].id,
        action: 'milestone_started',
        description: 'Started work on Frontend UI/UX Implementation',
        performedBy: 'alex.morgan@smartflo.dev'
      },
      {
        contractId: createdContracts[1].id,
        action: 'contract_created',
        description: 'Brand identity contract activated',
        performedBy: 'sarah.chen@designstudio.com'
      },
      {
        contractId: createdContracts[1].id,
        action: 'milestone_completed',
        description: 'Brand Research & Logo Concepts milestone completed',
        performedBy: 'sarah.chen@designstudio.com'
      },
      {
        contractId: createdContracts[1].id,
        action: 'payment_released',
        description: 'Payment of $2,500.00 released for completed milestone',
        performedBy: 'system'
      },
      {
        contractId: createdContracts[2].id,
        action: 'contract_completed',
        description: 'Content writing project completed successfully',
        performedBy: 'marcus.johnson@contentwriter.io'
      }
    ];

    console.log('Creating demo contract activities...');
    const createdActivities = await db.insert(contractActivity).values(demoActivities).returning();
    console.log(`✓ Created ${createdActivities.length} demo activities`);

    console.log('🎉 Demo data seeding completed successfully!');
    console.log(`
📊 Summary:
  • Users: ${createdUsers.length}
  • Contracts: ${createdContracts.length}
  • Milestones: ${createdMilestones.length}
  • Payments: ${createdPayments.length}
  • Activities: ${createdActivities.length}
  • Contacts: ${createdContacts.length}
    `);

    return {
      users: createdUsers,
      contracts: createdContracts,
      milestones: createdMilestones,
      payments: createdPayments,
      activities: createdActivities,
      contacts: createdContacts
    };

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

// Function to clear all demo data (for testing)
export async function clearDemoData() {
  console.log('🧹 Clearing demo data...');
  
  try {
    await db.delete(contractActivity);
    await db.delete(payments);
    await db.delete(milestones);
    await db.delete(contracts);
    await db.delete(contacts);
    await db.delete(users);
    
    console.log('✓ Demo data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing demo data:', error);
    throw error;
  }
}