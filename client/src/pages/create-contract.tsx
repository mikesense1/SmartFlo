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
  CreditCard, Zap, Globe, Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { aiContractService } from "@/lib/openai-service";
import { queryClient } from "@/lib/queryClient";

// Types
interface ProjectSetupData {
  projectType: "website" | "mobile_app" | "design" | "consulting" | "content" | "custom";
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
  "AI Contract & Review",
  "Payment Setup"
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

const ClientDetailsStep = ({ clientData, updateClientData }: Pick<StepProps, 'clientData' | 'updateClientData'>) => (
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

      <div>
        <label className="text-sm font-medium mb-2 block">Project Budget ($)</label>
        <Input 
          type="number"
          value={clientData.projectBudget}
          placeholder="5000"
          onChange={(e) => updateClientData("projectBudget", e.target.value)}
        />
      </div>
    </CardContent>
  </Card>
);

const MilestoneBuilderStep = ({ 
  milestones, 
  updateMilestone, 
  addMilestone, 
  removeMilestone
}: Pick<StepProps, 'milestones' | 'updateMilestone' | 'addMilestone' | 'removeMilestone'>) => (
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
  setCustomPrompt
}: Pick<StepProps, 'projectData' | 'clientData' | 'milestones'> & {
  generatedContract: string;
  riskAnalysis: RiskAnalysis | null;
  isGenerating: boolean;
  isAnalyzing: boolean;
  generateContract: () => Promise<void>;
  customPrompt: string;
  setCustomPrompt: (value: string) => void;
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
                AI will create a professional contract based on your project details and custom requirements
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

            <Button 
              onClick={generateContract}
              variant="outline"
              disabled={isGenerating}
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
  finalizeContract,
  isCreating
}: {
  selectedPaymentMethod: "stripe" | "usdc";
  setSelectedPaymentMethod: (method: "stripe" | "usdc") => void;
  finalizeContract: () => Promise<void>;
  isCreating: boolean;
}) => (
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
                  <span className="text-slate-600">Processing Fee:</span>
                  <span className="text-green-600">~$0.50 gas fee</span>
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

          <Button 
            onClick={finalizeContract}
            className="w-full"
            size="lg"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Creating Contract...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Create Contract & Send to Client
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

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
    projectBudget: ""
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
      // Create the contract with all the gathered data
      const contractData = {
        title: projectData.title,
        projectDescription: projectData.description,
        clientName: clientData.clientName,
        clientEmail: clientData.clientEmail,
        totalValue: clientData.projectBudget,
        paymentMethod: selectedPaymentMethod,
        contractType: "milestone_based",
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        creatorId: "550e8400-e29b-41d4-a716-446655440000", // Mock UUID for demo
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
        throw new Error('Failed to create contract');
      }

      const createdContract = await contractResponse.json();

      // Create milestones for the contract
      for (const milestone of milestones) {
        await fetch('/api/milestones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractId: createdContract.id,
            title: milestone.title,
            description: milestone.deliverables,
            amount: milestone.amount,
            dueDate: milestone.dueDate,
            status: "pending"
          }),
        });
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
        queryKey: ["/api/users", "user-123", "contracts"]
      });
      
      // Invalidate milestone cache for the new contract
      queryClient.invalidateQueries({
        queryKey: ["/api/contracts", result.id, "milestones"]
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
          projectBudget: ""
        });
        setMilestones([{
          title: "",
          deliverables: "",
          amount: "",
          dueDate: "",
          percentage: 0
        }]);
        setCustomPrompt("");
        
        // Navigate to dashboard
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (error) {
      console.error("Contract creation error:", error);
      toast({
        title: "Creation Failed",
        description: "Please try again or contact support",
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
        return <ClientDetailsStep clientData={clientData} updateClientData={updateClientData} />;
      case 3:
        return <MilestoneBuilderStep 
          milestones={milestones} 
          updateMilestone={updateMilestone}
          addMilestone={addMilestone}
          removeMilestone={removeMilestone}
        />;
      case 4:
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
        />;
      case 5:
        return <PaymentSetupStep 
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
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