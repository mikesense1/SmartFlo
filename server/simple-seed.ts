import { db } from './db';
import { users, contracts, milestones, contacts } from '../shared/schema';

export async function seedSimpleData() {
  console.log('🌱 Seeding simple demo data...');
  
  try {
    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('Demo data already exists');
      return { success: true, message: 'Data already exists' };
    }

    // Create demo users
    const createdUsers = await db.insert(users).values([
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
      }
    ]).returning();

    // Create demo contacts
    await db.insert(contacts).values([
      {
        name: 'TechStartup Inc',
        email: 'hello@techstartup.co',
        message: 'We need a full-stack developer to build our e-commerce platform',
        type: 'demo'
      },
      {
        name: 'Creative Agency',
        email: 'projects@creativeagency.com',
        message: 'Looking for a designer to create comprehensive brand identity',
        type: 'demo'
      }
    ]);

    // Create demo contracts
    const createdContracts = await db.insert(contracts).values([
      {
        creatorId: createdUsers[0].id,
        title: 'E-commerce Platform Development',
        clientName: 'TechStartup Inc',
        clientEmail: 'hello@techstartup.co',
        projectDescription: 'Full-stack e-commerce platform with React frontend, Node.js backend, payment integration, and admin dashboard.',
        totalValue: '15000.00',
        paymentMethod: 'stripe_card',
        contractType: 'milestone_based',
        status: 'active',
        solanaProgramAddress: '8K7J9mNvFqGxQ2Rp4EwBzCvL5tM6sN1xY3zA9qW4eR5u',
        escrowAddress: '5eY9qW4eR5u8K7J9mNvFqGxQ2Rp4EwBzCvL5tM6sN1xY3zA',
        blockchainNetwork: 'solana-devnet',
        blockchainStatus: 'deployed',
        generatedContract: 'FREELANCE DEVELOPMENT AGREEMENT\n\nThis Agreement is entered into between Alex Morgan ("Contractor") and TechStartup Inc ("Client") for the development of an e-commerce platform.\n\nPROJECT SCOPE:\n- Full-stack web application development\n- React.js frontend with responsive design\n- Node.js/Express backend API\n- Payment integration and testing\n\nPAYMENT TERMS:\nTotal Project Value: $15,000.00\nPayment Method: Stripe Credit Card\nStructure: Milestone-based payments\n\nThis contract includes SmartFlo standard protection clauses.',
      },
      {
        creatorId: createdUsers[1].id,
        title: 'Brand Identity & Website Design',
        clientName: 'Creative Agency',
        clientEmail: 'projects@creativeagency.com',
        projectDescription: 'Complete brand identity design including logo, color palette, typography, business cards, and responsive website design.',
        totalValue: '8500.00',
        paymentMethod: 'stripe_ach',
        contractType: 'milestone_based',
        status: 'active',
        solanaProgramAddress: '9L8K0nWvGrHyS3Sq5FxCzDwM6uO2yP4xZ5aB0rX6fT7v',
        escrowAddress: '6fT7v9L8K0nWvGrHyS3Sq5FxCzDwM6uO2yP4xZ5aB0rX',
        blockchainNetwork: 'solana-devnet',
        blockchainStatus: 'deployed',
        generatedContract: 'DESIGN SERVICES AGREEMENT\n\nThis Agreement is between Sarah Chen ("Designer") and Creative Agency ("Client") for brand identity and website design services.\n\nPROJECT DELIVERABLES:\n- Complete brand identity package\n- Logo design with revisions\n- Color palette and typography guidelines\n- Responsive website design\n\nPAYMENT TERMS:\nTotal Project Value: $8,500.00\nPayment Method: Stripe ACH Transfer\nStructure: Milestone-based payments',
      }
    ]).returning();

    // Create demo milestones
    await db.insert(milestones).values([
      {
        contractId: createdContracts[0].id,
        title: 'Frontend UI/UX Implementation',
        description: 'Complete responsive frontend with React.js',
        amount: '5000.00',
        dueDate: '2025-01-28',
        status: 'in_progress'
      },
      {
        contractId: createdContracts[0].id,
        title: 'Backend API Development',
        description: 'Node.js/Express REST API with database integration',
        amount: '4500.00',
        dueDate: '2025-02-15',
        status: 'pending'
      },
      {
        contractId: createdContracts[1].id,
        title: 'Brand Research & Logo Concepts',
        description: 'Market research and 3 initial logo design concepts',
        amount: '2500.00',
        dueDate: '2025-01-21',
        status: 'approved',
        paymentReleased: true
      },
      {
        contractId: createdContracts[1].id,
        title: 'Website Design Implementation',
        description: 'Responsive website design with brand elements',
        amount: '3000.00',
        dueDate: '2025-02-04',
        status: 'submitted'
      }
    ]);

    console.log('✅ Simple demo data created successfully');
    return {
      success: true,
      message: 'Demo data seeded successfully',
      data: {
        users: createdUsers.length,
        contracts: createdContracts.length
      }
    };

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}