import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
console.log("Initializing OpenAI client...");
console.log("API Key exists:", !!process.env.OPENAI_API_KEY);

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
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

interface RiskAnalysis {
  overall: number;
  scopeCreepRisk: number;
  paymentRisk: number;
  ipRisk: number;
  suggestions: Array<{
    issue: string;
    fix: string;
    severity: "low" | "medium" | "high";
  }>;
}

export class AIContractService {
  async generateFreelanceContract(params: ContractGenerationParams): Promise<string> {
    const {
      projectData,
      clientData,
      milestones,
      paymentMethod,
      customPrompt = ""
    } = params;

    const systemPrompt = `You are an expert freelance contract attorney specializing in protecting freelancers from common payment delays, scope creep, and legal issues. Generate professional, legally sound freelance service agreements that prioritize freelancer protection while being fair to clients.

Key requirements:
1. Use professional legal language appropriate for freelance contracts
2. Include strong payment protection clauses
3. Define clear scope boundaries to prevent scope creep
4. Include intellectual property protections
5. Add dispute resolution mechanisms
6. Include automatic payment release terms
7. Add client response timeframes to prevent delays
8. Include contract termination protections

Always prioritize freelancer protection while maintaining professional client relationships.`;

    const userPrompt = `Generate a comprehensive freelance service agreement with the following details:

PROJECT INFORMATION:
- Type: ${projectData.projectType}
- Title: ${projectData.title}
- Description: ${projectData.description}
- Start Date: ${projectData.startDate}
- End Date: ${projectData.endDate}
- Pricing Model: ${projectData.pricingModel}
- Total Budget: $${clientData.projectBudget}

CLIENT INFORMATION:
- Name: ${clientData.clientName}
- Email: ${clientData.clientEmail}
- Company: ${clientData.clientCompany || 'Individual Client'}

MILESTONES:
${milestones.map((milestone, index) => `
Milestone ${index + 1}: ${milestone.title}
- Deliverables: ${milestone.deliverables}
- Amount: $${milestone.amount}
- Due Date: ${milestone.dueDate}
- Percentage: ${milestone.percentage}%
`).join('')}

PAYMENT METHOD: ${paymentMethod === "stripe" ? "Traditional payment processing (Stripe)" : "Cryptocurrency escrow (USDC)"}

CUSTOM REQUIREMENTS:
${customPrompt || "Standard freelance protections apply"}

Generate a complete, professional freelance service agreement that includes:
1. Clear project scope and deliverables
2. Milestone-based payment structure with automatic release terms
3. Intellectual property clauses favoring the freelancer
4. Scope change procedures with additional compensation
5. Client approval timeframes (7-day maximum)
6. Dispute resolution procedures
7. Contract termination clauses
8. Late payment penalties
9. Communication and revision policies
10. Legal jurisdiction and governing law

Format as a professional legal document with proper headings and numbered sections.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.3
      });

      return response.choices[0].message.content || "Contract generation failed";
    } catch (error) {
      console.error("OpenAI contract generation error:", error);
      throw new Error("Failed to generate contract with AI");
    }
  }

  async analyzeContractRisks(params: ContractGenerationParams): Promise<RiskAnalysis> {
    const {
      projectData,
      clientData,
      milestones,
      paymentMethod
    } = params;

    const systemPrompt = `You are a freelance business consultant specializing in risk analysis for freelance contracts. Analyze the provided project details and identify potential risks that could lead to payment delays, scope creep, or other common freelancer issues.

Provide risk scores (0-100%) and specific, actionable recommendations to mitigate risks.`;

    const userPrompt = `Analyze the following freelance project for potential risks:

PROJECT: ${projectData.title} (${projectData.projectType})
DESCRIPTION: ${projectData.description}
BUDGET: $${clientData.projectBudget}
TIMELINE: ${projectData.startDate} to ${projectData.endDate}
PAYMENT METHOD: ${paymentMethod}

MILESTONES:
${milestones.map((m, i) => `${i + 1}. ${m.title} - $${m.amount} - ${m.dueDate}`).join('\n')}

CLIENT: ${clientData.clientName} ${clientData.clientCompany ? `(${clientData.clientCompany})` : '(Individual)'}

Analyze and provide JSON response with:
{
  "overall": <0-100 risk percentage>,
  "scopeCreepRisk": <0-100 risk percentage>,
  "paymentRisk": <0-100 risk percentage>,
  "ipRisk": <0-100 risk percentage>,
  "suggestions": [
    {
      "issue": "<specific risk identified>",
      "fix": "<actionable solution>",
      "severity": "<low|medium|high>"
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result as RiskAnalysis;
    } catch (error) {
      console.error("OpenAI risk analysis error:", error);
      // Return fallback analysis
      return {
        overall: 25,
        scopeCreepRisk: 30,
        paymentRisk: 20,
        ipRisk: 25,
        suggestions: [
          {
            issue: "Unable to perform AI risk analysis",
            fix: "Please review contract terms manually for potential issues",
            severity: "medium"
          }
        ]
      };
    }
  }

  async generateTemplateRecommendations(prompt: string): Promise<any[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system", 
            content: "You are an expert contract advisor specializing in freelance agreements. Provide practical, legally-informed recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"templates": []}');
      return result.templates || [];
    } catch (error) {
      console.error("Template recommendation generation error:", error);
      throw new Error("Failed to generate template recommendations");
    }
  }
}

export const aiContractService = new AIContractService();