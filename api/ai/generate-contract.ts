import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ContractGenerationParams {
  projectData: {
    projectType: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    pricingModel: string;
  };
  clientData: {
    clientName: string;
    clientEmail: string;
    clientCompany?: string;
    projectBudget: string;
  };
  milestones: Array<{
    title: string;
    deliverables: string;
    amount: string;
    dueDate: string;
    percentage: number;
  }>;
  paymentMethod: "stripe" | "usdc";
  customPrompt?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("=== AI Contract Generation Request (Vercel) ===");
    console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);
    console.log("OpenAI API Key length:", process.env.OPENAI_API_KEY?.length || 0);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: "OpenAI API key not configured",
        debug: { hasApiKey: false }
      });
    }

    const params: ContractGenerationParams = req.body;
    const { projectData, clientData, milestones, paymentMethod, customPrompt = "" } = params;

    const contractPrompt = `Generate a comprehensive freelance contract based on the following details:

PROJECT INFORMATION:
- Type: ${projectData.projectType}
- Title: ${projectData.title}
- Description: ${projectData.description}
- Start Date: ${projectData.startDate}
- End Date: ${projectData.endDate}
- Pricing Model: ${projectData.pricingModel}

CLIENT INFORMATION:
- Name: ${clientData.clientName}
- Email: ${clientData.clientEmail}
- Company: ${clientData.clientCompany || "Individual"}
- Budget: ${clientData.projectBudget}

MILESTONES:
${milestones.map((m, i) => `${i + 1}. ${m.title} - $${m.amount} (${m.percentage}%) - Due: ${m.dueDate}\n   Deliverables: ${m.deliverables}`).join('\n')}

PAYMENT METHOD: ${paymentMethod === 'usdc' ? 'USDC (Cryptocurrency)' : 'Stripe (Credit Card/Bank)'}

${customPrompt ? `ADDITIONAL REQUIREMENTS:\n${customPrompt}` : ''}

Please generate a professional, legally sound freelance contract that includes:
1. Clear scope of work
2. Payment terms and milestone structure
3. Intellectual property clauses
4. Termination conditions
5. Dispute resolution
6. Professional liability protection

Make it comprehensive but readable for both freelancer and client.`;

    console.log("Calling OpenAI API...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a legal contract expert specializing in freelance agreements. Generate professional, comprehensive contracts that protect both parties."
        },
        {
          role: "user",
          content: contractPrompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.3,
    });

    const generatedContract = completion.choices[0]?.message?.content;
    
    if (!generatedContract) {
      throw new Error("No contract generated from OpenAI");
    }

    console.log("Contract generated successfully, length:", generatedContract.length);
    
    res.status(200).json({ contract: generatedContract });

  } catch (error: any) {
    console.error("=== Contract Generation Error (Vercel) ===");
    console.error("Error:", error);
    
    res.status(500).json({
      error: "Failed to generate contract",
      message: error.message,
      debug: {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        errorType: error.constructor.name
      }
    });
  }
}