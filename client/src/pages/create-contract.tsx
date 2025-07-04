import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, CreditCard, Wallet, Plus, Trash2, Calendar, 
  DollarSign, FileText, Sparkles, Shield, Zap,
  AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const projectSetupSchema = z.object({
  projectType: z.enum(["website", "mobile_app", "design", "consulting", "content", "custom"]),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide a detailed description"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  pricingModel: z.enum(["fixed", "milestones"]),
});

const clientDetailsSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  clientEmail: z.string().email("Valid email required"),
  clientCompany: z.string().optional(),
  projectBudget: z.string().min(1, "Budget is required"),
});

const milestoneSchema = z.object({
  title: z.string().min(3, "Milestone title required"),
  deliverables: z.string().min(10, "Deliverables description required"),
  amount: z.string().min(1, "Amount required"),
  dueDate: z.string().min(1, "Due date required"),
  percentage: z.number().min(1).max(100),
});

type ProjectSetupData = z.infer<typeof projectSetupSchema>;
type ClientDetailsData = z.infer<typeof clientDetailsSchema>;
type MilestoneData = z.infer<typeof milestoneSchema>;

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

export default function CreateContract() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<string>("");
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [projectData, setProjectData] = useState<ProjectSetupData | null>(null);
  const [clientData, setClientData] = useState<ClientDetailsData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"stripe" | "usdc">("stripe");

  // AI-powered milestone suggestions
  const suggestMilestones = async (projectType: string, budget: string, timeline: number) => {
    setIsGenerating(true);
    try {
      // Simulate AI milestone generation based on project type and timeline
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const suggestions: MilestoneData[] = getProjectTypeSuggestions(projectType, budget, timeline);
      setMilestones(suggestions);
      
      toast({
        title: "Milestones Suggested!",
        description: `Generated ${suggestions.length} milestone recommendations based on your project.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate milestone suggestions.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate contract with AI
  const generateContract = async () => {
    if (!projectData || !clientData || milestones.length === 0) return;
    
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const contract = `
FREELANCE SERVICES AGREEMENT

This Agreement is entered into between ${clientData.clientName} ${clientData.clientCompany ? `(${clientData.clientCompany})` : ''} ("Client") and [Your Name] ("Service Provider").

PROJECT SCOPE:
${projectData.description}

PROJECT TIMELINE:
Start Date: ${projectData.startDate}
End Date: ${projectData.endDate}

PAYMENT TERMS:
- Total Project Value: $${clientData.projectBudget}
- Payment Method: ${selectedPaymentMethod === "stripe" ? "Bank Transfer via Stripe" : "USDC Cryptocurrency"}
- Payment Structure: Milestone-based payments with automatic release upon approval

MILESTONES & DELIVERABLES:
${milestones.map((m, i) => `${i + 1}. ${m.title} - $${m.amount} (${m.percentage}% of total)
   Deliverables: ${m.deliverables}
   Due Date: ${m.dueDate}`).join('\n\n')}

TERMS & CONDITIONS:
- Work shall be completed professionally and meet industry standards
- Client approval required for milestone completion (5 business days maximum review period)
- Payments held in escrow and released automatically upon milestone approval
- Up to 2 rounds of revisions included per milestone
- Additional revisions: $${Math.round(parseFloat(clientData.projectBudget) * 0.1)} per round
- Intellectual property transfers to client upon final payment
- Either party may terminate with 7 days written notice
- Disputes resolved through PayFlow's mediation system

This contract is secured by blockchain escrow technology ensuring automatic payment release and dispute protection.

Generated with AI assistance • Legally optimized • Blockchain secured
      `.trim();
      
      setGeneratedContract(contract);
      
      // Perform risk analysis
      setIsAnalyzing(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const analysis: RiskAnalysis = analyzeContractRisks(contract, projectData, milestones);
      setRiskAnalysis(analysis);
      setIsAnalyzing(false);
      
      toast({
        title: "Contract Generated!",
        description: "AI contract created with risk analysis complete.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const finalizeContract = async () => {
    if (!projectData || !clientData) return;
    
    try {
      const contractData = {
        title: projectData.title,
        clientName: clientData.clientName,
        clientEmail: clientData.clientEmail,
        projectDescription: projectData.description,
        totalValue: clientData.projectBudget,
        paymentMethod: selectedPaymentMethod,
        contractType: "milestone_based",
        creatorId: "user-123",
      };

      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contractData)
      });
      
      if (response.ok) {
        toast({
          title: "Contract Created!",
          description: "Your contract is ready to send to your client.",
        });
        setCurrentStep(5); // Move to success step
      } else {
        throw new Error("Failed to create contract");
      }
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to save contract. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper functions
  const getProjectTypeSuggestions = (type: string, budget: string, timeline: number): MilestoneData[] => {
    const budgetNum = parseFloat(budget);
    const suggestions: Record<string, MilestoneData[]> = {
      website: [
        { title: "Design & Planning", deliverables: "Wireframes, mockups, and project architecture", amount: (budgetNum * 0.25).toString(), dueDate: "", percentage: 25 },
        { title: "Frontend Development", deliverables: "HTML/CSS/JS implementation, responsive design", amount: (budgetNum * 0.35).toString(), dueDate: "", percentage: 35 },
        { title: "Backend Integration", deliverables: "API integration, database setup, functionality", amount: (budgetNum * 0.25).toString(), dueDate: "", percentage: 25 },
        { title: "Testing & Launch", deliverables: "QA testing, deployment, final optimizations", amount: (budgetNum * 0.15).toString(), dueDate: "", percentage: 15 }
      ],
      mobile_app: [
        { title: "UI/UX Design", deliverables: "App design, user flow, prototypes", amount: (budgetNum * 0.3).toString(), dueDate: "", percentage: 30 },
        { title: "Core Development", deliverables: "Main app features and functionality", amount: (budgetNum * 0.4).toString(), dueDate: "", percentage: 40 },
        { title: "Testing & Polish", deliverables: "Bug fixes, performance optimization", amount: (budgetNum * 0.2).toString(), dueDate: "", percentage: 20 },
        { title: "App Store Launch", deliverables: "Store submission, final deployment", amount: (budgetNum * 0.1).toString(), dueDate: "", percentage: 10 }
      ],
      design: [
        { title: "Concept & Strategy", deliverables: "Initial concepts, mood boards, strategy", amount: (budgetNum * 0.3).toString(), dueDate: "", percentage: 30 },
        { title: "Design Development", deliverables: "Detailed designs, iterations, refinements", amount: (budgetNum * 0.5).toString(), dueDate: "", percentage: 50 },
        { title: "Final Delivery", deliverables: "Final files, brand guidelines, assets", amount: (budgetNum * 0.2).toString(), dueDate: "", percentage: 20 }
      ]
    };
    
    return suggestions[type] || [
      { title: "Project Setup", deliverables: "Initial planning and setup", amount: (budgetNum * 0.3).toString(), dueDate: "", percentage: 30 },
      { title: "Core Work", deliverables: "Main project deliverables", amount: (budgetNum * 0.5).toString(), dueDate: "", percentage: 50 },
      { title: "Final Delivery", deliverables: "Final review and delivery", amount: (budgetNum * 0.2).toString(), dueDate: "", percentage: 20 }
    ];
  };

  const analyzeContractRisks = (contract: string, project: ProjectSetupData, milestones: MilestoneData[]): RiskAnalysis => {
    // Simulate AI risk analysis
    const hasRevisionLimits = contract.includes("rounds of revisions");
    const hasLatePenalties = contract.includes("Late Payment");
    const hasIPClause = contract.includes("Intellectual property");
    
    return {
      overall: hasRevisionLimits && hasLatePenalties && hasIPClause ? 2.5 : 6.8,
      scopeCreepRisk: hasRevisionLimits ? 2.1 : 8.5,
      paymentRisk: hasLatePenalties ? 1.5 : 7.2,
      ipRisk: hasIPClause ? 1.2 : 8.9,
      suggestions: [
        ...(!hasRevisionLimits ? [{ issue: "No revision limits specified", fix: "Added: 'Up to 2 rounds of revisions included'", severity: "high" as const }] : []),
        ...(!hasLatePenalties ? [{ issue: "No late payment penalties", fix: "Consider adding late payment fees", severity: "medium" as const }] : []),
        ...(!hasIPClause ? [{ issue: "IP ownership unclear", fix: "Added: 'IP transfers upon final payment'", severity: "high" as const }] : [])
      ]
    };
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const addMilestone = () => {
    setMilestones([...milestones, {
      title: "",
      deliverables: "",
      amount: "",
      dueDate: "",
      percentage: 0,
    }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneData, value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const steps = [
    "Project Setup",
    "Client Details", 
    "Smart Milestones",
    "AI Contract & Review",
    "Payment Setup"
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ProjectSetupStep />;
      case 2:
        return <ClientDetailsStep />;
      case 3:
        return <MilestoneBuilderStep />;
      case 4:
        return <ContractGenerationStep />;
      case 5:
        return <PaymentSetupStep />;
      default:
        return null;
    }
  };

  // Step Components
  const ProjectSetupStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          What are you building?
        </CardTitle>
        <CardDescription>
          Tell us about your project so we can create the perfect contract
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Project Type</label>
          <Select onValueChange={(value) => setProjectData(prev => prev ? {...prev, projectType: value as any} : null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="website">Website Development</SelectItem>
              <SelectItem value="mobile_app">Mobile App</SelectItem>
              <SelectItem value="design">Design Work</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
              <SelectItem value="content">Content Creation</SelectItem>
              <SelectItem value="custom">Custom Project</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Project Title</label>
          <Input 
            placeholder="e.g., E-commerce Website for Fashion Brand"
            onChange={(e) => setProjectData(prev => prev ? {...prev, title: e.target.value} : {title: e.target.value} as any)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Project Description</label>
          <Textarea
            placeholder="Brief description of the project scope and requirements..."
            className="min-h-[100px]"
            onChange={(e) => setProjectData(prev => prev ? {...prev, description: e.target.value} : null)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Start Date</label>
            <Input 
              type="date" 
              onChange={(e) => setProjectData(prev => prev ? {...prev, startDate: e.target.value} : null)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">End Date</label>
            <Input 
              type="date"
              onChange={(e) => setProjectData(prev => prev ? {...prev, endDate: e.target.value} : null)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Pricing Model</label>
          <RadioGroup 
            onValueChange={(value) => setProjectData(prev => prev ? {...prev, pricingModel: value as any} : null)}
            defaultValue="milestones"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="milestones" id="milestones" />
              <label htmlFor="milestones" className="text-sm">Milestone-Based (Recommended)</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fixed" id="fixed" />
              <label htmlFor="fixed" className="text-sm">Fixed Price</label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );

  const ClientDetailsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
        <CardDescription>
          Who will you be working with on this project?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Client Name</label>
            <Input 
              placeholder="John Smith"
              onChange={(e) => setClientData(prev => prev ? {...prev, clientName: e.target.value} : {clientName: e.target.value} as any)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Client Email</label>
            <Input 
              type="email"
              placeholder="john@company.com"
              onChange={(e) => setClientData(prev => prev ? {...prev, clientEmail: e.target.value} : null)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Company (Optional)</label>
          <Input 
            placeholder="Company Name"
            onChange={(e) => setClientData(prev => prev ? {...prev, clientCompany: e.target.value} : null)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Project Budget ($)</label>
          <Input 
            type="number"
            placeholder="5000"
            onChange={(e) => setClientData(prev => prev ? {...prev, projectBudget: e.target.value} : null)}
          />
        </div>
      </CardContent>
    </Card>
  );

  const MilestoneBuilderStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Define Payment Milestones
        </CardTitle>
        <CardDescription>
          Break your project into payment milestones for better cash flow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Project Milestones</h3>
          <Button 
            onClick={() => projectData && clientData && suggestMilestones(projectData.projectType, clientData.projectBudget, 30)}
            disabled={isGenerating || !projectData || !clientData}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "AI Suggest Milestones"}
          </Button>
        </div>

        {milestones.map((milestone, index) => (
          <Card key={index} className="p-4 bg-slate-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Milestone {index + 1}</h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => removeMilestone(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input
                  placeholder="Milestone title"
                  value={milestone.title}
                  onChange={(e) => updateMilestone(index, "title", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Amount ($)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={milestone.amount}
                  onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Due Date</label>
                <Input
                  type="date"
                  value={milestone.dueDate}
                  onChange={(e) => updateMilestone(index, "dueDate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Percentage</label>
                <Input
                  type="number"
                  placeholder="25"
                  value={milestone.percentage}
                  onChange={(e) => updateMilestone(index, "percentage", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Deliverables</label>
                <Textarea
                  placeholder="What will be delivered in this milestone?"
                  value={milestone.deliverables}
                  onChange={(e) => updateMilestone(index, "deliverables", e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}

        <Button onClick={addMilestone} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Milestone
        </Button>
      </CardContent>
    </Card>
  );

  const ContractGenerationStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your Contract
          </CardTitle>
          <CardDescription>
            AI-generated legal agreement optimized for freelancers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedContract ? (
            <div className="bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {generatedContract}
              </pre>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <Button onClick={generateContract} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Contract"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            AI Risk Analysis
          </CardTitle>
          <CardDescription>
            Protecting you from common freelancer pitfalls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-sm text-slate-500">Analyzing contract risks...</p>
            </div>
          ) : riskAnalysis ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${riskAnalysis.overall < 5 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {riskAnalysis.overall.toFixed(1)}/10
                </div>
                <p className="text-sm text-slate-500">Overall Risk Score</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Scope Creep Risk</span>
                  <span className={riskAnalysis.scopeCreepRisk < 5 ? 'text-green-600' : 'text-red-600'}>
                    {riskAnalysis.scopeCreepRisk.toFixed(1)}/10
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payment Risk</span>
                  <span className={riskAnalysis.paymentRisk < 5 ? 'text-green-600' : 'text-red-600'}>
                    {riskAnalysis.paymentRisk.toFixed(1)}/10
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IP Risk</span>
                  <span className={riskAnalysis.ipRisk < 5 ? 'text-green-600' : 'text-red-600'}>
                    {riskAnalysis.ipRisk.toFixed(1)}/10
                  </span>
                </div>
              </div>

              {riskAnalysis.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Suggestions:</h4>
                  {riskAnalysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{suggestion.issue}</p>
                          <p className="text-xs text-slate-600">{suggestion.fix}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Generate contract to see risk analysis</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const PaymentSetupStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          How do you want to get paid?
        </CardTitle>
        <CardDescription>
          Choose your preferred payment method for automatic releases
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}
            onClick={() => setSelectedPaymentMethod('stripe')}
          >
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-5 h-5" />
              <h4 className="font-medium">Bank Transfer (USD)</h4>
            </div>
            <p className="text-sm text-slate-600 mb-2">2.9% + $0.30 fee • 2-3 day transfer</p>
            <p className="text-xs text-slate-500">Best for: US clients, traditional businesses</p>
          </div>

          <div 
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === 'usdc' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}
            onClick={() => setSelectedPaymentMethod('usdc')}
          >
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="w-5 h-5" />
              <h4 className="font-medium">USDC (Crypto)</h4>
            </div>
            <p className="text-sm text-slate-600 mb-2">0.1% fee • Instant transfer</p>
            <p className="text-xs text-slate-500">Best for: International clients, crypto-friendly</p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Payments are held in escrow and automatically released when you mark 
            milestones as complete and client approves.
          </AlertDescription>
        </Alert>

        <Button onClick={finalizeContract} className="w-full" size="lg">
          Create Contract & Send to Client
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-900">Smart Contract Builder</h1>
              <Badge variant="secondary" className="bg-violet-100 text-violet-800">
                <Sparkles className="w-4 h-4 mr-1" />
                AI-Powered
              </Badge>
            </div>
            <div className="text-sm text-slate-500">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              
              return (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted ? 'bg-green-100 text-green-800' :
                    isActive ? 'bg-primary text-white' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'font-medium' : 'text-slate-500'}`}>
                    {step}
                  </span>
                  {stepNumber < steps.length && (
                    <ArrowRight className="w-4 h-4 text-slate-300 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {renderStepContent()}
          
          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < steps.length && (
              <Button 
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !projectData?.title) ||
                  (currentStep === 2 && !clientData?.clientEmail) ||
                  (currentStep === 3 && milestones.length === 0) ||
                  (currentStep === 4 && !generatedContract)
                }
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}