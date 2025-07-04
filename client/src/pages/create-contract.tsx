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
  CheckCircle, ArrowRight, ArrowLeft, Target, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";

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

const ContractGenerationStep = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Contract Generation
      </CardTitle>
      <CardDescription>
        AI-generated legal agreement optimized for freelancers
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8">
        <Brain className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <Button>
          Generate Contract
        </Button>
      </div>
    </CardContent>
  </Card>
);

const PaymentSetupStep = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Wallet className="w-5 h-5" />
        Payment Setup
      </CardTitle>
      <CardDescription>
        Choose how you want to receive payments
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8">
        <Wallet className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-sm text-slate-500">Payment setup will be implemented soon</p>
      </div>
    </CardContent>
  </Card>
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
        return <ContractGenerationStep />;
      case 5:
        return <PaymentSetupStep />;
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