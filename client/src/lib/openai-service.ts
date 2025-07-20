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
    try {
      const response = await fetch('/api/ai/generate-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both local server response and Vercel function response
      if (data.success && data.contract) {
        return data.contract; // Vercel function returns simple string
      }
      
      return data.contract || 'Contract generated successfully';
    } catch (error) {
      console.error("Contract generation error:", error);
      throw new Error("Failed to generate contract with AI");
    }
  }

  async analyzeContractRisks(params: ContractGenerationParams): Promise<RiskAnalysis> {
    try {
      const response = await fetch('/api/ai/analyze-risks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error("Risk analysis error:", error);
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
}

export const aiContractService = new AIContractService();