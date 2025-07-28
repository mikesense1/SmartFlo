import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, Wallet, Plus, Trash2, 
  FileText, Sparkles, Shield,
  CheckCircle, ArrowRight, ArrowLeft, Target, Users,
  CreditCard, Zap, Globe, Lock, ChevronDown
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { aiContractService } from "@/lib/openai-service";
import { queryClient } from "@/lib/queryClient";
import { calculateTotalWithFees, formatCurrency, getPaymentMethodName, type PaymentMethod } from "@shared/pricing";

// Types
interface ProjectSetupData {
  projectType: "website" | "mobile_app" | "design" | "consulting" | "content" | "custom";
  scopeOfWork: string;
  customScopeOfWork?: string; // For "Other" option
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  pricingModel: "milestones" | "hourly" | "fixed";
}

interface ClientDetailsData {
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  projectBudget: string;
  hourlyRate?: string; // For hourly rate contracts
}

interface ContractPricing {
  contractAmount: number;
  transactionFee: number;
  totalAmount: number;
  feePercentage: number;
}

interface MilestoneData {
  title: string;
  deliverables: string;
  amount: string;
  dueDate: string;
  percentage: number;
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

const WIZARD_STEPS = [
  "Project Setup",
  "Client Details", 
  "Smart Milestones",
  "Payment Method",
  "AI Contract & Review"
];

const SCOPE_OF_WORK_OPTIONS = [
  "Website Development",
  "Mobile App Development", 
  "UI/UX Design",
  "Logo & Brand Design",
  "Content Writing",
  "Blog Writing",
  "Copywriting",
  "SEO Services",
  "Social Media Management",
  "Marketing Campaign",
  "Business Consulting",
  "Data Analysis",
  "Software Development",
  "API Integration",
  "Database Design",
  "E-commerce Development",
  "WordPress Development",
  "Graphic Design",
  "Video Editing",
  "Photography",
  "Translation Services",
  "Virtual Assistant",
  "Project Management",
  "Quality Assurance Testing",
  "Custom Software Solution",
  "Other"
];

// Step Components - moved outside main component to prevent recreation
interface StepProps {
  projectData: ProjectSetupData;
  clientData: ClientDetailsData;
  milestones: MilestoneData[];
  updateProjectData: (field: keyof ProjectSetupData, value: string) => void;
  updateClientData: (field: keyof ClientDetailsData, value: string) => void;
  updateMilestone: (index: number, field: keyof MilestoneData, value: string | number) => void;
  addMilestone: () => void;
  removeMilestone: (index: number) => void;
}

const ProjectSetupStep = ({ projectData, updateProjectData }: Pick<StepProps, 'projectData' | 'updateProjectData'>) => (
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
    <CardContent className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Project Title</label>
        <Input 
          value={projectData.title}
          placeholder="E-commerce Website Development"
          onChange={(e) => updateProjectData("title", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Scope of Work Type</label>
        <Select value={projectData.scopeOfWork} onValueChange={(value) => updateProjectData("scopeOfWork", value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select the type of work you'll be doing" />
          </SelectTrigger>
          <SelectContent>
            {SCOPE_OF_WORK_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Scope of Work Input - Shows when "Other" is selected */}
      {projectData.scopeOfWork === "Other" && (
        <div>
          <label className="text-sm font-medium mb-2 block">Custom Scope of Work</label>
          <Input 
            value={projectData.customScopeOfWork || ""}
            placeholder="Please specify your type of work..."
            onChange={(e) => updateProjectData("customScopeOfWork", e.target.value)}
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-2 block">Project Description</label>
        <Textarea
          value={projectData.description}
          placeholder="Brief description of the project scope and requirements..."
          className="min-h-[100px]"
          onChange={(e) => updateProjectData("description", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Start Date</label>
          <Input 
            type="date" 
            value={projectData.startDate}
            onChange={(e) => updateProjectData("startDate", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">End Date</label>
          <Input 
            type="date"
            value={projectData.endDate}
            onChange={(e) => updateProjectData("endDate", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Pricing Model</label>
        <RadioGroup 
          value={projectData.pricingModel}
          onValueChange={(value) => updateProjectData("pricingModel", value as any)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="milestones" id="milestones" />
            <label htmlFor="milestones" className="text-sm">Milestone-Based (Recommended)</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hourly" id="hourly" />
            <label htmlFor="hourly" className="text-sm">Hourly Rate</label>
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

const ClientDetailsStep = ({ clientData, updateClientData, projectData }: Pick<StepProps, 'clientData' | 'updateClientData' | 'projectData'>) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="w-5 h-5" />
        Client Information
      </CardTitle>
      <CardDescription>
        Who will you be working with on this project?
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Client Name</label>
          <Input 
            value={clientData.clientName}
            placeholder="John Smith"
            onChange={(e) => updateClientData("clientName", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Client Email</label>
          <Input 
            type="email"
            value={clientData.clientEmail}
            placeholder="john@company.com"
            onChange={(e) => updateClientData("clientEmail", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Company (Optional)</label>
        <Input 
          value={clientData.clientCompany || ""}
          placeholder="Company Name"
          onChange={(e) => updateClientData("clientCompany", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Project Budget ($)</label>
          <Input 
            type="number"
            value={clientData.projectBudget}
            placeholder="5000"
            onChange={(e) => updateClientData("projectBudget", e.target.value)}
          />
        </div>
        
        {/* Hourly Rate Input - Shows when "hourly" pricing model is selected */}
        {projectData.pricingModel === "hourly" && (
          <div>
            <label className="text-sm font-medium mb-2 block">Hourly Rate ($)</label>
            <Input 
              type="number"
              value={clientData.hourlyRate || ""}
              placeholder="75"
              onChange={(e) => updateClientData("hourlyRate", e.target.value)}
            />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const MilestoneBuilderStep = ({ 
  milestones, 
  updateMilestone, 
  addMilestone, 
  removeMilestone,
  clientData
}: Pick<StepProps, 'milestones' | 'updateMilestone' | 'addMilestone' | 'removeMilestone' | 'clientData'>) => {
  
  // Calculate milestone amount based on percentage
  const calculateMilestoneAmount = (percentage: number): string => {
    const budget = parseFloat(clientData.projectBudget) || 0;
    return Math.round(budget * (percentage / 100)).toString();
  };

  // Calculate total contract amount from all milestones
  const getTotalContractAmount = (): number => {
    return milestones.reduce((total, milestone) => {
      const amount = parseFloat(milestone.amount) || 0;
      return total + amount;
    }, 0);
  };

  // Get total percentage
  const getTotalPercentage = (): number => {
    return milestones.reduce((total, milestone) => total + (milestone.percentage || 0), 0);
  };

  return (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Target className="w-5 h-5" />
        Smart Milestones
      </CardTitle>
      <CardDescription>
        Break your project into manageable milestones for automatic payments
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
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
              <div className="relative">
                <Input
                  type="text"
                  placeholder="25%"
                  value={milestone.percentage ? `${milestone.percentage}%` : ''}
                  onFocus={(e) => {
                    // Clear the % symbol on focus for easier editing
                    e.target.value = milestone.percentage ? milestone.percentage.toString() : '';
                  }}
                  onBlur={(e) => {
                    // Add % symbol back on blur
                    const numValue = parseInt(e.target.value) || 0;
                    updateMilestone(index, "percentage", numValue);
                    // Auto-calculate amount based on percentage
                    if (numValue > 0) {
                      const calculatedAmount = calculateMilestoneAmount(numValue);
                      updateMilestone(index, "amount", calculatedAmount);
                    }
                  }}
                  onChange={(e) => {
                    // Allow only numeric input
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const numValue = parseInt(value) || 0;
                    updateMilestone(index, "percentage", numValue);
                    // Auto-calculate amount based on percentage in real-time
                    if (numValue > 0) {
                      const calculatedAmount = calculateMilestoneAmount(numValue);
                      updateMilestone(index, "amount", calculatedAmount);
                    }
                  }}
                />
              </div>
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

      {/* Summary Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Contract Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Project Budget:</span>
            <span className="font-medium ml-2">${clientData.projectBudget || '0'}</span>
          </div>
          <div>
            <span className="text-blue-700">Total Percentage:</span>
            <span className={`font-medium ml-2 ${getTotalPercentage() === 100 ? 'text-green-600' : getTotalPercentage() > 100 ? 'text-red-600' : 'text-blue-900'}`}>
              {getTotalPercentage()}%
            </span>
          </div>
          <div>
            <span className="text-blue-700">Contract Total:</span>
            <span className="font-medium ml-2">${getTotalContractAmount().toLocaleString()}</span>
          </div>
          <div>
            <span className="text-blue-700">Remaining:</span>
            <span className="font-medium ml-2">
              ${(parseFloat(clientData.projectBudget) - getTotalContractAmount() || 0).toLocaleString()}
            </span>
          </div>
        </div>
        {getTotalPercentage() !== 100 && (
          <div className="mt-2 text-xs text-amber-600">
            💡 Tip: Total percentage should equal 100% for complete project coverage
          </div>
        )}
      </div>
    </CardContent>
  </Card>
  );
};

const ContractGenerationStep = ({ 
  projectData, 
  clientData, 
  milestones,
  generatedContract,
  riskAnalysis,
  isGenerating,
  isAnalyzing,
  generateContract,
  customPrompt,
  setCustomPrompt,
  selectedPaymentMethod,
  finalizeContract,
  isCreating
}: Pick<StepProps, 'projectData' | 'clientData' | 'milestones'> & {
  generatedContract: string;
  riskAnalysis: RiskAnalysis | null;
  isGenerating: boolean;
  isAnalyzing: boolean;
  generateContract: () => Promise<void>;
  customPrompt: string;
  setCustomPrompt: (value: string) => void;
  selectedPaymentMethod: "stripe" | "usdc";
  finalizeContract: () => Promise<void>;
  isCreating: boolean;
}) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Contract Generation
        </CardTitle>
        <CardDescription>
          Generate a professional contract tailored to your project
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!generatedContract ? (
          <div className="space-y-6">
            {/* Payment Method Preview */}
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-sm">Selected Payment Method</span>
              </div>
              <p className="text-sm text-slate-600">
                {selectedPaymentMethod === "stripe" ? "Traditional USD payments via Stripe" : "Crypto payments via USDC on Solana"}
              </p>
            </div>

            {/* Custom Prompt Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                <h4 className="font-medium">Custom AI Instructions (Optional)</h4>
              </div>
              <Textarea
                placeholder="Add specific requirements for your contract (e.g., 'Include a 50% upfront payment clause', 'Add strict deadline penalties', 'Include intellectual property transfer terms')..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
                className="w-full"
              />
              <p className="text-sm text-slate-500">
                Specify any special terms, clauses, or protections you want included in your contract.
              </p>
            </div>

            {/* Generate Button */}
            <div className="text-center py-4 border-t">
              <Brain className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <Button 
                onClick={generateContract}
                disabled={isGenerating}
                className="mb-4"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating Professional Contract...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate Contract with AI
                  </>
                )}
              </Button>
              <p className="text-sm text-slate-500">
                AI will create a professional contract based on your project details, milestones, and {selectedPaymentMethod === "stripe" ? "traditional payment" : "crypto payment"} preferences
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                <CheckCircle className="w-5 h-5" />
                Contract Generated Successfully
              </div>
              <p className="text-sm text-green-600">
                Your contract has been generated and includes all project details, milestones, and payment terms.
              </p>
            </div>
            
            <div className="border rounded-lg p-4 bg-slate-50 max-h-60 overflow-y-auto">
              <h4 className="font-medium mb-2">Contract Preview</h4>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {generatedContract}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Custom Instructions for AI (Optional)
                </label>
                <Textarea
                  placeholder="e.g., 'Include clause about intellectual property rights' or 'Make the payment terms more strict'"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-slate-500">
                  Provide specific instructions to customize your contract generation
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={generateContract}
                  variant="outline"
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Regenerate Contract
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={finalizeContract}
                  disabled={isCreating || isGenerating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Create & Send Contract
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Risk Analysis Card */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Smart Risk Analysis
        </CardTitle>
        <CardDescription>
          AI-powered protection against common freelancer issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAnalyzing ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-pulse" />
            <p className="text-sm text-slate-500">Analyzing contract for potential risks...</p>
          </div>
        ) : riskAnalysis ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{riskAnalysis.overall}%</div>
                <div className="text-sm text-blue-700">Overall Risk</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{riskAnalysis.scopeCreepRisk}%</div>
                <div className="text-sm text-amber-700">Scope Creep</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{riskAnalysis.paymentRisk}%</div>
                <div className="text-sm text-red-700">Payment Risk</div>
              </div>
            </div>

            {riskAnalysis.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">AI Recommendations</h4>
                {riskAnalysis.suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      suggestion.severity === 'high' ? 'bg-red-50 border-red-400' :
                      suggestion.severity === 'medium' ? 'bg-amber-50 border-amber-400' :
                      'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <div className="text-sm font-medium">{suggestion.issue}</div>
                    <div className="text-sm text-slate-600 mt-1">{suggestion.fix}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-sm text-slate-500">
              Generate a contract first to see risk analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

const PaymentSetupStep = ({ 
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  milestones,
  clientData
}: {
  selectedPaymentMethod: "stripe" | "usdc";
  setSelectedPaymentMethod: (method: "stripe" | "usdc") => void;
  milestones: MilestoneData[];
  clientData: ClientDetailsData;
}) => {
  // Calculate total contract value
  const totalContractValue = milestones.reduce((sum, milestone) => {
    return sum + parseFloat(milestone.amount || "0");
  }, 0);

  // Calculate fees for each payment method
  const usdcFees = calculateTotalWithFees(totalContractValue * 100, "usdc");
  const achFees = calculateTotalWithFees(totalContractValue * 100, "ach");
  const cardFees = calculateTotalWithFees(totalContractValue * 100, "card");

  return (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Payment Method Selection
        </CardTitle>
        <CardDescription>
          Choose how your client will pay you. Both methods include milestone-based payments and automatic release upon approval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Traditional Payment Option */}
            <div 
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedPaymentMethod === "stripe" 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => setSelectedPaymentMethod("stripe")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">USD Payments (Stripe)</h3>
                    <p className="text-sm text-slate-500">Credit card, bank transfer, ACH</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  selectedPaymentMethod === "stripe" 
                    ? "border-blue-500 bg-blue-500" 
                    : "border-slate-300"
                }`}>
                  {selectedPaymentMethod === "stripe" && (
                    <CheckCircle className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Processing Fee:</span>
                  <span className="text-red-600">2.9% + $0.30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Settlement Time:</span>
                  <span className="text-amber-600">2-7 business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Dispute Protection:</span>
                  <span className="text-green-600">✓ Included</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Client Requirements:</span>
                  <span className="text-green-600">Credit/Debit Card</span>
                </div>
              </div>
            </div>

            {/* Crypto Payment Option */}
            <div 
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedPaymentMethod === "usdc" 
                  ? "border-green-500 bg-green-50" 
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => setSelectedPaymentMethod("usdc")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Crypto Payments (USDC)</h3>
                    <p className="text-sm text-slate-500">Stable cryptocurrency on Solana</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  selectedPaymentMethod === "usdc" 
                    ? "border-green-500 bg-green-500" 
                    : "border-slate-300"
                }`}>
                  {selectedPaymentMethod === "usdc" && (
                    <CheckCircle className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Transaction Fee:</span>
                  <span className="text-green-600">{usdcFees.feePercentage.toFixed(1)}% (max $100)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Settlement Time:</span>
                  <span className="text-green-600">Instant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Smart Escrow:</span>
                  <span className="text-green-600">✓ Automatic</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Client Requirements:</span>
                  <span className="text-amber-600">Crypto Wallet</span>
                </div>
              </div>
              
              {/* Fee Display */}
              <div className="mt-4 pt-4 border-t bg-slate-50 p-3 rounded">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Contract Amount:</span>
                    <span>{formatCurrency(usdcFees.contractAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction Fee:</span>
                    <span>{formatCurrency(usdcFees.transactionFee)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Client Pays Total:</span>
                    <span>{formatCurrency(usdcFees.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Benefits */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">
              {selectedPaymentMethod === "stripe" ? "Why Clients Choose USD Payments" : "Why Clients Choose Crypto Payments"}
            </h4>
            <ul className="text-sm text-slate-600 space-y-1">
              {selectedPaymentMethod === "stripe" ? (
                <>
                  <li>• No crypto wallet required - use existing bank accounts</li>
                  <li>• Pay with credit card, debit card, or bank transfer</li>
                  <li>• Familiar checkout process with purchase protection</li>
                  <li>• Automatic invoicing and payment tracking</li>
                  <li>• Perfect for traditional businesses and individuals</li>
                </>
              ) : (
                <>
                  <li>• Funds secured in tamper-proof smart contract escrow</li>
                  <li>• Instant payment release when work is approved</li>
                  <li>• Complete transparency - all transactions publicly visible</li>
                  <li>• Significantly lower fees (~$0.50 vs 3%+)</li>
                  <li>• Perfect for crypto-native businesses and international clients</li>
                </>
              )}
            </ul>
          </div>

          {/* Additional Payment Method Info */}
          <div className={`p-4 rounded-lg border-l-4 ${
            selectedPaymentMethod === "stripe" 
              ? "bg-purple-50 border-purple-400" 
              : "bg-green-50 border-green-400"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                selectedPaymentMethod === "stripe" 
                  ? "bg-purple-100" 
                  : "bg-green-100"
              }`}>
                {selectedPaymentMethod === "stripe" ? (
                  <Wallet className="w-4 h-4 text-purple-600" />
                ) : (
                  <Shield className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-sm mb-1">
                  {selectedPaymentMethod === "stripe" ? "Client Payment Process" : "Client Payment Process"}
                </h5>
                <p className="text-sm text-slate-600">
                  {selectedPaymentMethod === "stripe" ? (
                    "Your client will receive a secure payment link and can pay instantly with their credit card or bank account. No crypto knowledge required."
                  ) : (
                    "Your client will connect their crypto wallet (like Phantom or MetaMask) and send USDC tokens to the smart contract. Funds are held securely until milestones are approved."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Final Contract Review */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Final Review & Create Contract
        </CardTitle>
        <CardDescription>
          Review all details and create your contract
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
              <CheckCircle className="w-5 h-5" />
              Ready to Create Contract
            </div>
            <p className="text-sm text-blue-600">
              All project details, milestones, and payment preferences have been configured. 
              Click below to create your professional contract.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-slate-700">Payment Method</div>
              <div className="text-slate-600 capitalize">
                {selectedPaymentMethod === "stripe" ? "Traditional Payment" : "USDC Crypto Escrow"}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-slate-700">Contract Type</div>
              <div className="text-slate-600">Milestone-Based</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="font-medium text-slate-700">AI Protection</div>
              <div className="text-slate-600">Risk Analysis Included</div>
            </div>
          </div>

          <div className="text-center py-4 border-t">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Payment Method Selected</span>
            </div>
            <p className="text-sm text-slate-500">
              Use the navigation buttons below to continue to AI contract generation
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
  );
};

export default function CreateContract() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [milestones, setMilestones] = useState<MilestoneData[]>([
    {
      title: "",
      deliverables: "",
      amount: "",
      dueDate: "",
      percentage: 0
    }
  ]);
  const [projectData, setProjectData] = useState<ProjectSetupData>({
    projectType: "website",
    scopeOfWork: "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    pricingModel: "milestones"
  });
  const [clientData, setClientData] = useState<ClientDetailsData>({
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    projectBudget: "",
    hourlyRate: ""
  });
  
  // AI Contract Generation State
  const [generatedContract, setGeneratedContract] = useState("");
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  
  // Payment Setup State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"stripe" | "usdc">("stripe");
  const [isCreating, setIsCreating] = useState(false);

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

  const updateMilestone = useCallback((index: number, field: keyof MilestoneData, value: string | number) => {
    setMilestones(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const updateProjectData = useCallback((field: keyof ProjectSetupData, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateClientData = useCallback((field: keyof ClientDetailsData, value: string) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  }, []);

  // AI Contract Generation Function
  const generateContract = useCallback(async () => {
    setIsGenerating(true);
    setIsAnalyzing(true);
    
    try {
      // Generate contract with OpenAI
      const contractParams = {
        projectData,
        clientData,
        milestones,
        paymentMethod: selectedPaymentMethod,
        customPrompt
      };

      const generatedText = await aiContractService.generateFreelanceContract(contractParams);
      setGeneratedContract(generatedText);
      
      // Analyze risks with OpenAI
      const riskAnalysisResult = await aiContractService.analyzeContractRisks(contractParams);
      setRiskAnalysis(riskAnalysisResult);
      
      toast({
        title: "Professional Contract Generated",
        description: "AI has created your contract with advanced legal protections and risk analysis",
      });
      
    } catch (error) {
      console.error("Contract generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Please check your OpenAI API key and try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsAnalyzing(false);
    }
  }, [projectData, clientData, milestones, selectedPaymentMethod, customPrompt, toast]);

  // Final Contract Creation Function
  const finalizeContract = useCallback(async () => {
    setIsCreating(true);
    
    try {
      // Calculate total contract value from milestones
      const totalContractValue = milestones.reduce((total, milestone) => {
        return total + (parseFloat(milestone.amount) || 0);
      }, 0);

      // Create the contract with all the gathered data
      const contractData = {
        title: projectData.title,
        projectDescription: projectData.description,
        clientName: clientData.clientName,
        clientEmail: clientData.clientEmail,
        totalValue: totalContractValue.toString(),
        paymentMethod: selectedPaymentMethod,
        contractType: "milestone_based",
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        creatorId: "5db53622-f397-41f4-9746-4b567a24fcfb", // Demo user from database
        status: "draft"
      };

      // Create contract via API
      const contractResponse = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      if (!contractResponse.ok) {
        const errorText = await contractResponse.text();
        console.error('Contract API Error:', contractResponse.status, errorText);
        throw new Error(`Failed to create contract (${contractResponse.status}): ${errorText}`);
      }

      const createdContract = await contractResponse.json();

      // Create milestones for the contract
      for (const milestone of milestones) {
        if (milestone.title && milestone.deliverables && milestone.amount && milestone.dueDate) {
          const milestoneResponse = await fetch('/api/milestones', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contractId: createdContract.id,
              title: milestone.title,
              description: milestone.deliverables,
              amount: milestone.amount,
              dueDate: milestone.dueDate
            }),
          });

          if (!milestoneResponse.ok) {
            const errorText = await milestoneResponse.text();
            console.error('Milestone API Error:', milestoneResponse.status, errorText);
            throw new Error(`Failed to create milestone "${milestone.title}" (${milestoneResponse.status}): ${errorText}`);
          }
        }
      }

      // Create activity log entry
      await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: createdContract.id,
          action: "contract_created",
          actorEmail: clientData.clientEmail,
          details: { contractTitle: projectData.title, aiGenerated: true }
        }),
      });
      
      // Invalidate contracts cache to trigger refresh
      queryClient.invalidateQueries({
        queryKey: ["/api/users", "5db53622-f397-41f4-9746-4b567a24fcfb", "contracts"]
      });
      
      // Invalidate milestone cache for the new contract
      queryClient.invalidateQueries({
        queryKey: ["/api/contracts", createdContract.id, "milestones"]
      });
      
      toast({
        title: "Contract Created Successfully!",
        description: "Contract has been saved and is ready to send to your client",
      });
      
      // Reset form and redirect to dashboard after success
      setTimeout(() => {
        setCurrentStep(1);
        setGeneratedContract("");
        setRiskAnalysis(null);
        setProjectData({
          projectType: "website",
          scopeOfWork: "",
          title: "",
          description: "",
          startDate: "",
          endDate: "",
          pricingModel: "milestones"
        });
        setClientData({
          clientName: "",
          clientEmail: "",
          clientCompany: "",
          projectBudget: "",
          hourlyRate: ""
        });
        setMilestones([{
          title: "",
          deliverables: "",
          amount: "",
          dueDate: "",
          percentage: 0
        }]);
        setCustomPrompt("");
        
        // Navigate to dashboard immediately - avoid any potential redirect conflicts
        console.log("Redirecting to dashboard after successful contract creation");
        window.location.replace('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error("Contract creation error:", error);
      let errorMessage = "Unknown error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // More specific error messaging
      if (errorMessage.includes('Failed to create contract')) {
        errorMessage = "Contract creation failed. Please check your project details and try again.";
      } else if (errorMessage.includes('Failed to create milestone')) {
        errorMessage = "Contract created but milestone setup failed. Please contact support.";
      } else if (errorMessage.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [projectData, clientData, milestones, selectedPaymentMethod, generatedContract, toast]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ProjectSetupStep projectData={projectData} updateProjectData={updateProjectData} />;
      case 2:
        return <ClientDetailsStep clientData={clientData} updateClientData={updateClientData} projectData={projectData} />;
      case 3:
        return <MilestoneBuilderStep 
          milestones={milestones} 
          updateMilestone={updateMilestone}
          addMilestone={addMilestone}
          removeMilestone={removeMilestone}
          clientData={clientData}
        />;
      case 4:
        return <PaymentSetupStep 
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          milestones={milestones}
          clientData={clientData}
        />;
      case 5:
        return <ContractGenerationStep 
          projectData={projectData}
          clientData={clientData}
          milestones={milestones}
          generatedContract={generatedContract}
          riskAnalysis={riskAnalysis}
          isGenerating={isGenerating}
          isAnalyzing={isAnalyzing}
          generateContract={generateContract}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          selectedPaymentMethod={selectedPaymentMethod}
          finalizeContract={finalizeContract}
          isCreating={isCreating}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                AI-Powered
              </Badge>
            </div>
            <div className="text-sm text-slate-500">
              Step {currentStep} of {WIZARD_STEPS.length}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {WIZARD_STEPS.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              
              return (
                <div key={index} className="flex items-center">
                  <div className={`flex items-center ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      isActive ? 'border-primary bg-primary text-white' : 
                      isCompleted ? 'border-green-600 bg-green-600 text-white' : 
                      'border-slate-300'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                    </div>
                    <span className={`ml-2 text-sm ${isActive ? 'font-medium' : 'text-slate-500'}`}>
                      {step}
                    </span>
                    {stepNumber < WIZARD_STEPS.length && (
                      <ArrowRight className="w-4 h-4 text-slate-300 mx-4" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Progress value={(currentStep / WIZARD_STEPS.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="mt-8">
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < WIZARD_STEPS.length && (
              <Button 
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !projectData?.title) ||
                  (currentStep === 2 && !clientData?.clientEmail) ||
                  (currentStep === 3 && milestones.length === 0)
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