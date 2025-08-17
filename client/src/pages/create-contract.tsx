import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
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
import { aiContractService, type ContractTemplate } from "@/lib/openai-service";
import { queryClient } from "@/lib/queryClient";
import { calculateTotalWithFees, formatCurrency, getPaymentMethodName, getFeeBreakdown, type PaymentMethod } from "@shared/pricing";
import { useCurrentUser } from "@/hooks/use-current-user";

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

interface PaymentTermsData {
  downPaymentEnabled: boolean;
  downPaymentType: "percentage" | "fixed";
  downPaymentValue: string;
  finalPaymentAuto: boolean;
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
  "Template Selection",
  "AI Contract & Review"
];

const SCOPE_OF_WORK_OPTIONS = [
  "Web Development",
  "Mobile App Development",
  "Design & Creative",
  "Writing & Content",
  "Marketing & Advertising",
  "Software Development",
  "Business Consulting",
  "Bookkeeping & Accounting",
  "Virtual Assistant",
  "Data Analysis & Research",
  "Legal Services",
  "Video & Photography",
  "Translation & Language",
  "Project Management",
  "Other"
];

const MILESTONE_TITLE_OPTIONS = [
  "Project Initiation",
  "Design Phase Completion",
  "Development Phase 1",
  "Development Phase 2", 
  "Testing & Quality Assurance",
  "Content Integration",
  "User Acceptance Testing",
  "Final Delivery",
  "Post-Launch Support",
  "Bug Fixes & Revisions",
  "Documentation Delivery",
  "Training & Handover",
  "Custom Milestone"
];

// Step Components - moved outside main component to prevent recreation
interface StepProps {
  projectData: ProjectSetupData;
  clientData: ClientDetailsData;
  milestones: MilestoneData[];
  paymentTerms: PaymentTermsData;
  updateProjectData: (field: keyof ProjectSetupData, value: string) => void;
  updateClientData: (field: keyof ClientDetailsData, value: string) => void;
  updatePaymentTerms: (field: keyof PaymentTermsData, value: string | boolean) => void;
  updateMilestone: (index: number, field: keyof MilestoneData, value: string | number) => void;
  addMilestone: () => void;
  removeMilestone: (index: number) => void;
}

const ProjectSetupStep = ({ 
  projectData, 
  updateProjectData, 
  paymentTerms, 
  updatePaymentTerms 
}: Pick<StepProps, 'projectData' | 'updateProjectData' | 'paymentTerms' | 'updatePaymentTerms'>) => (
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
        <label className="text-sm font-medium mb-2 block">
          Project Title <span className="text-red-500">*</span>
        </label>
        <Input 
          value={projectData.title}
          placeholder="E-commerce Website Development"
          onChange={(e) => updateProjectData("title", e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Scope of Work Type <span className="text-red-500">*</span>
        </label>
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
        <label className="text-sm font-medium mb-2 block">
          Project Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={projectData.description}
          placeholder="Brief description of the project scope and requirements..."
          className="min-h-[100px]"
          onChange={(e) => updateProjectData("description", e.target.value)}
          required
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

      {/* Payment Terms Section */}
      {(projectData.pricingModel === "milestones" || projectData.pricingModel === "fixed") && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Payment Terms
            </CardTitle>
            <CardDescription>
              Configure how payments will be structured for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="downPaymentEnabled"
                checked={paymentTerms.downPaymentEnabled}
                onChange={(e) => updatePaymentTerms("downPaymentEnabled", e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="downPaymentEnabled" className="text-sm font-medium">
                Require down payment before work begins
              </label>
            </div>
            
            {paymentTerms.downPaymentEnabled && (
              <div className="ml-6 space-y-3 border-l-2 border-blue-300 pl-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Down Payment Type</label>
                  <RadioGroup 
                    value={paymentTerms.downPaymentType}
                    onValueChange={(value) => updatePaymentTerms("downPaymentType", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <label htmlFor="percentage" className="text-sm">Percentage of total</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="fixed-amount" />
                      <label htmlFor="fixed-amount" className="text-sm">Fixed dollar amount</label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Down Payment {paymentTerms.downPaymentType === "percentage" ? "Percentage" : "Amount"}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={paymentTerms.downPaymentValue}
                      onFocus={(e) => {
                        // Clear suggested value on focus
                        const placeholder = paymentTerms.downPaymentType === "percentage" ? "25" : "500";
                        if (e.target.value === placeholder) {
                          updatePaymentTerms("downPaymentValue", "");
                        }
                      }}
                      onChange={(e) => updatePaymentTerms("downPaymentValue", e.target.value)}
                      onKeyDown={(e) => {
                        // Allow backspace to fully clear the field
                        if (e.key === "Backspace" && (e.target as HTMLInputElement).value.length === 1) {
                          updatePaymentTerms("downPaymentValue", "");
                        }
                      }}
                      placeholder={paymentTerms.downPaymentType === "percentage" ? "25" : "500"}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {paymentTerms.downPaymentType === "percentage" ? "%" : "$"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="finalPaymentAuto"
                checked={paymentTerms.finalPaymentAuto}
                onChange={(e) => updatePaymentTerms("finalPaymentAuto", e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="finalPaymentAuto" className="text-sm font-medium">
                Automatically calculate final payment amount
              </label>
            </div>
          </CardContent>
        </Card>
      )}
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
          <label className="text-sm font-medium mb-2 block">
            Client Name <span className="text-red-500">*</span>
          </label>
          <Input 
            value={clientData.clientName}
            placeholder="John Smith"
            onChange={(e) => updateClientData("clientName", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">
            Client Email <span className="text-red-500">*</span>
          </label>
          <Input 
            type="email"
            value={clientData.clientEmail}
            placeholder="john@company.com"
            onChange={(e) => updateClientData("clientEmail", e.target.value)}
            required
          />
          {clientData.clientEmail && !clientData.clientEmail.includes('@') && (
            <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
          )}
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
          <label className="text-sm font-medium mb-2 block">
            Project Budget ($) <span className="text-red-500">*</span>
          </label>
          <Input 
            type="number"
            value={clientData.projectBudget}
            placeholder="5000"
            onChange={(e) => updateClientData("projectBudget", e.target.value)}
            required
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
  clientData,
  projectData,
  paymentTerms
}: Pick<StepProps, 'milestones' | 'updateMilestone' | 'addMilestone' | 'removeMilestone' | 'clientData' | 'projectData' | 'paymentTerms'>) => {
  
  // Calculate milestone amount based on percentage
  const calculateMilestoneAmount = (percentage: number): string => {
    const budget = parseFloat(clientData.projectBudget) || 0;
    return Math.round(budget * (percentage / 100)).toString();
  };

  // Calculate down payment amount
  const calculateDownPaymentAmount = (): number => {
    if (!paymentTerms.downPaymentEnabled) return 0;
    
    const budget = parseFloat(clientData.projectBudget) || 0;
    if (paymentTerms.downPaymentType === "percentage") {
      const percentage = parseFloat(paymentTerms.downPaymentValue) || 0;
      return Math.round(budget * (percentage / 100));
    } else {
      return parseFloat(paymentTerms.downPaymentValue) || 0;
    }
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

  // Calculate remaining amount for final payment
  const getRemainingAmount = (): number => {
    const budget = parseFloat(clientData.projectBudget) || 0;
    const downPayment = calculateDownPaymentAmount();
    const milestoneTotal = getTotalContractAmount();
    return budget - downPayment - milestoneTotal;
  };

  return (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Target className="w-5 h-5" />
        Smart Milestones
      </CardTitle>
      <CardDescription>
        {projectData.pricingModel === "fixed" 
          ? "Your project has been set up as a single milestone. You can edit details or add additional milestones below."
          : "Break your project into manageable milestones for automatic payments"
        }
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {projectData.pricingModel === "fixed" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-blue-600 text-xs font-semibold">!</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Fixed Price Project</h4>
              <p className="text-sm text-blue-700">
                Your project has been automatically set up as a single milestone with your project details. 
                You can edit the milestone below or add additional milestones if needed.
              </p>
            </div>
          </div>
        </div>
      )}
      
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
              <label className="text-sm font-medium mb-1 block">
                Milestone Title <span className="text-red-500">*</span>
              </label>
              <Select 
                value={milestone.title} 
                onValueChange={(value) => {
                  if (value === "Custom Milestone") {
                    updateMilestone(index, "title", "");
                  } else {
                    updateMilestone(index, "title", value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select milestone type" />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONE_TITLE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Custom input when "Custom Milestone" is selected or when value is not in predefined options */}
              {(milestone.title === "Custom Milestone" || (!MILESTONE_TITLE_OPTIONS.includes(milestone.title) && milestone.title)) && (
                <Input
                  className="mt-2"
                  placeholder="Enter custom milestone title"
                  value={milestone.title === "Custom Milestone" ? "" : milestone.title}
                  onChange={(e) => updateMilestone(index, "title", e.target.value)}
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Amount ($) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="1000"
                value={milestone.amount}
                onFocus={(e) => {
                  // Clear placeholder value on focus for easier input
                  if (e.target.value === "1000") {
                    e.target.value = "";
                    updateMilestone(index, "amount", "");
                  }
                }}
                onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                onKeyDown={(e) => {
                  // Allow backspace to fully clear the field
                  if (e.key === "Backspace" && (e.target as HTMLInputElement).value.length === 1) {
                    updateMilestone(index, "amount", "");
                  }
                }}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Due Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={milestone.dueDate}
                onChange={(e) => updateMilestone(index, "dueDate", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Percentage</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="25"
                  value={milestone.percentage || ''}
                  onFocus={(e) => {
                    // Clear suggested value on focus for easier input
                    if (e.target.value === "25") {
                      e.target.value = "";
                      updateMilestone(index, "percentage", 0);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Allow backspace to fully clear the field
                    if (e.key === "Backspace" && (e.target as HTMLInputElement).value.length === 1) {
                      updateMilestone(index, "percentage", 0);
                      updateMilestone(index, "amount", "");
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
                    } else {
                      updateMilestone(index, "amount", "");
                    }
                  }}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">
                Deliverables <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="What will be delivered in this milestone?"
                value={milestone.deliverables}
                onChange={(e) => updateMilestone(index, "deliverables", e.target.value)}
                required
              />
            </div>
          </div>
        </Card>
      ))}

      <Button onClick={addMilestone} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Milestone
      </Button>

      {/* Enhanced Payment Structure Summary */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Payment Structure Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {paymentTerms.downPaymentEnabled && (
            <div className="flex justify-between text-sm">
              <span>Down Payment:</span>
              <span className="font-medium">
                ${calculateDownPaymentAmount().toLocaleString()} 
                ({paymentTerms.downPaymentType === "percentage" ? paymentTerms.downPaymentValue + "%" : "Fixed"})
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Milestones Total:</span>
            <span className="font-medium">${getTotalContractAmount().toLocaleString()}</span>
          </div>
          {paymentTerms.finalPaymentAuto && getRemainingAmount() > 0 && (
            <div className="flex justify-between text-sm">
              <span>Remaining (Final Payment):</span>
              <span className="font-medium text-blue-600">${getRemainingAmount().toLocaleString()}</span>
            </div>
          )}
          <div className="border-t pt-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Project Total:</span>
              <span>${(parseFloat(clientData.projectBudget) || 0).toLocaleString()}</span>
            </div>
          </div>
          {paymentTerms.finalPaymentAuto && getRemainingAmount() > 0 && (
            <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
              💡 Final payment of ${getRemainingAmount().toLocaleString()} will be automatically calculated
            </div>
          )}
        </CardContent>
      </Card>
    </CardContent>
  </Card>
  );
};

const TemplateSelectionStep = ({ 
  recommendedTemplates, 
  selectedTemplate, 
  setSelectedTemplate, 
  isLoadingTemplates 
}: {
  recommendedTemplates: ContractTemplate[];
  selectedTemplate: ContractTemplate | null;
  setSelectedTemplate: (template: ContractTemplate | null) => void;
  isLoadingTemplates: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Brain className="w-5 h-5" />
        AI Template Recommendations
      </CardTitle>
      <CardDescription>
        Choose from AI-generated contract templates tailored to your project type
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {isLoadingTemplates ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">AI is analyzing your project to recommend the best contract templates...</span>
          </div>
        </div>
      ) : recommendedTemplates.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4">
            {recommendedTemplates.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                    <Badge variant="secondary" className="ml-3">
                      {template.recommendationScore}% match
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Key Protection Clauses:</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.clauses.slice(0, 3).map((clause, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {clause}
                          </Badge>
                        ))}
                        {template.clauses.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.clauses.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Risk Mitigation:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {template.riskMitigation.slice(0, 2).map((risk, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <Shield className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4" />
              <span>Templates are customized based on your project type and include freelancer-focused protections</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">No templates available</h3>
          <p className="text-sm text-gray-600">
            AI template recommendations will load when project details are complete.
          </p>
        </div>
      )}
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
  setCustomPrompt,
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
            {/* Payment Method Note */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm text-blue-900">Payment Method</span>
              </div>
              <p className="text-sm text-blue-700">
                Your client will select the payment method when they fund the contract
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
                AI will create a professional contract based on your project details and milestones
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
                      Creating Contract...
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
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;
  milestones: MilestoneData[];
  clientData: ClientDetailsData;
}) => {
  // Calculate total contract value
  const totalContractValue = milestones.reduce((sum, milestone) => {
    return sum + parseFloat(milestone.amount || "0");
  }, 0);

  // Calculate fees for each payment method
  const usdcFees = calculateTotalWithFees(totalContractValue * 100, "usdc");
  const stripeAchFees = calculateTotalWithFees(totalContractValue * 100, "stripe_ach");
  const stripeCardFees = calculateTotalWithFees(totalContractValue * 100, "stripe_card");
  
  // Get fee breakdowns for display
  const usdcBreakdown = getFeeBreakdown("usdc", totalContractValue * 100);
  const achBreakdown = getFeeBreakdown("stripe_ach", totalContractValue * 100);
  const cardBreakdown = getFeeBreakdown("stripe_card", totalContractValue * 100);

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stripe Credit Card Option */}
            <div 
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedPaymentMethod === "stripe_card" 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => setSelectedPaymentMethod("stripe_card")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Credit/Debit Card</h3>
                    <p className="text-sm text-slate-500">Visa, Mastercard, Amex</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  selectedPaymentMethod === "stripe_card" 
                    ? "border-blue-500 bg-blue-500" 
                    : "border-slate-300"
                }`}>
                  {selectedPaymentMethod === "stripe_card" && (
                    <CheckCircle className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Stripe Fee:</span>
                  <span className="text-red-600">{cardBreakdown.stripeRate} + $0.30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">SmartFlo Fee:</span>
                  <span className="text-red-600">{cardBreakdown.smartfloRate}</span>
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
              
              {/* Fee Display */}
              <div className="mt-4 pt-4 border-t bg-slate-50 p-3 rounded">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Contract Amount:</span>
                    <span>{formatCurrency(stripeCardFees.contractAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Fee:</span>
                    <span>{formatCurrency(stripeCardFees.transactionFee)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Client Pays:</span>
                    <span>{formatCurrency(stripeCardFees.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stripe ACH Option */}
            <div 
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedPaymentMethod === "stripe_ach" 
                  ? "border-purple-500 bg-purple-50" 
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => setSelectedPaymentMethod("stripe_ach")}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">ACH Bank Transfer</h3>
                    <p className="text-sm text-slate-500">Direct bank transfer</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  selectedPaymentMethod === "stripe_ach" 
                    ? "border-purple-500 bg-purple-500" 
                    : "border-slate-300"
                }`}>
                  {selectedPaymentMethod === "stripe_ach" && (
                    <CheckCircle className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Stripe Fee:</span>
                  <span className="text-red-600">{achBreakdown.stripeRate} (max $5)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">SmartFlo Fee:</span>
                  <span className="text-red-600">{achBreakdown.smartfloRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Settlement Time:</span>
                  <span className="text-amber-600">3-5 business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Dispute Protection:</span>
                  <span className="text-green-600">✓ Included</span>
                </div>
              </div>
              
              {/* Fee Display */}
              <div className="mt-4 pt-4 border-t bg-slate-50 p-3 rounded">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Contract Amount:</span>
                    <span>{formatCurrency(stripeAchFees.contractAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Fee:</span>
                    <span>{formatCurrency(stripeAchFees.transactionFee)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Client Pays:</span>
                    <span>{formatCurrency(stripeAchFees.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* USDC Crypto Option */}
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
                  <span className="text-slate-600">SmartFlo Fee:</span>
                  <span className="text-red-600">{usdcBreakdown.rate} (max $100)</span>
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
                    <span>Total Fee:</span>
                    <span>{formatCurrency(usdcFees.transactionFee)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Client Pays:</span>
                    <span>{formatCurrency(usdcFees.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Benefits */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">
              {selectedPaymentMethod.startsWith("stripe_") ? "Why Clients Choose USD Payments" : "Why Clients Choose Crypto Payments"}
            </h4>
            <ul className="text-sm text-slate-600 space-y-1">
              {selectedPaymentMethod.startsWith("stripe_") ? (
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
            selectedPaymentMethod.startsWith("stripe_") 
              ? "bg-purple-50 border-purple-400" 
              : "bg-green-50 border-green-400"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                selectedPaymentMethod.startsWith("stripe_") 
                  ? "bg-purple-100" 
                  : "bg-green-100"
              }`}>
                {selectedPaymentMethod.startsWith("stripe_") ? (
                  <Wallet className="w-4 h-4 text-purple-600" />
                ) : (
                  <Shield className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-sm mb-1">
                  {selectedPaymentMethod.startsWith("stripe_") ? "Client Payment Process" : "Client Payment Process"}
                </h5>
                <p className="text-sm text-slate-600">
                  {selectedPaymentMethod.startsWith("stripe_") ? (
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
              <div className="text-slate-600">
                {getPaymentMethodName(selectedPaymentMethod)}
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
  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();
  const [, setLocation] = useLocation();
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
  
  // Template Recommendation State
  const [recommendedTemplates, setRecommendedTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  // AI Contract Generation State
  const [generatedContract, setGeneratedContract] = useState("");
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  
  // Payment Terms State
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermsData>({
    downPaymentEnabled: false,
    downPaymentType: "percentage",
    downPaymentValue: "25",
    finalPaymentAuto: false
  });

  // Payment Setup State
  // Payment method will be selected by client during funding process
  const [isCreating, setIsCreating] = useState(false);
  const [isContractCreated, setIsContractCreated] = useState(false);

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

  const updatePaymentTerms = useCallback((field: keyof PaymentTermsData, value: string | boolean) => {
    setPaymentTerms(prev => ({ ...prev, [field]: value }));
  }, []);

  // Auto-populate first milestone when Fixed Price is selected
  useEffect(() => {
    if (projectData.pricingModel === "fixed" && projectData.title && clientData.projectBudget) {
      setMilestones(prev => {
        const updated = [...prev];
        if (updated.length === 0) {
          updated.push({
            title: "",
            deliverables: "",
            amount: "",
            dueDate: "",
            percentage: 0,
          });
        }
        
        // Auto-populate first milestone with project details
        updated[0] = {
          ...updated[0],
          title: projectData.title || "Project Completion",
          deliverables: projectData.description || "Complete project deliverables as specified",
          amount: clientData.projectBudget || "",
          percentage: 100
        };
        
        return updated;
      });
    }
  }, [projectData.pricingModel, projectData.title, projectData.description, clientData.projectBudget]);

  const loadTemplateRecommendations = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const templates = await aiContractService.getContractTemplateRecommendations(
        projectData.projectType,
        projectData.scopeOfWork,
        projectData.description
      );
      setRecommendedTemplates(templates);
    } catch (error) {
      console.error("Failed to load template recommendations:", error);
      toast({
        title: "Template Loading Failed",
        description: "Unable to load AI template recommendations. Please continue with standard contract generation.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [projectData.projectType, projectData.scopeOfWork, projectData.description, toast]);

  // Load template recommendations when project data is complete
  useEffect(() => {
    if (projectData.scopeOfWork && projectData.title && projectData.description && currentStep >= 4) {
      loadTemplateRecommendations();
    }
  }, [projectData.projectType, projectData.scopeOfWork, projectData.title, projectData.description, currentStep, loadTemplateRecommendations]);

  // Helper functions for contract generation
  const calculateDownPaymentAmount = (): number => {
    if (!paymentTerms.downPaymentEnabled) return 0;
    
    const budget = parseFloat(clientData.projectBudget) || 0;
    if (paymentTerms.downPaymentType === "percentage") {
      const percentage = parseFloat(paymentTerms.downPaymentValue) || 0;
      return Math.round(budget * (percentage / 100));
    } else {
      return parseFloat(paymentTerms.downPaymentValue) || 0;
    }
  };

  const getRemainingAmount = (): number => {
    const budget = parseFloat(clientData.projectBudget) || 0;
    const downPayment = calculateDownPaymentAmount();
    const milestoneTotal = milestones.reduce((total, milestone) => {
      const amount = parseFloat(milestone.amount) || 0;
      return total + amount;
    }, 0);
    return budget - downPayment - milestoneTotal;
  };

  // AI Contract Generation Function
  const generateContract = useCallback(async () => {
    setIsGenerating(true);
    setIsAnalyzing(true);
    
    try {
      // Include selected template in contract generation
      // Include payment terms in milestone data for contract generation
      const enhancedMilestones = [...milestones];
      
      // Add down payment as first milestone if enabled
      if (paymentTerms.downPaymentEnabled) {
        enhancedMilestones.unshift({
          title: "Down Payment",
          deliverables: "Initial payment to commence project work",
          amount: calculateDownPaymentAmount().toString(),
          dueDate: projectData.startDate || new Date().toISOString().split('T')[0],
          percentage: paymentTerms.downPaymentType === "percentage" ? parseFloat(paymentTerms.downPaymentValue) : 0
        });
      }
      
      // Add final payment milestone if auto-calculation is enabled
      if (paymentTerms.finalPaymentAuto && getRemainingAmount() > 0) {
        enhancedMilestones.push({
          title: "Final Delivery",
          deliverables: "Final project delivery and completion",
          amount: getRemainingAmount().toString(),
          dueDate: projectData.endDate || new Date().toISOString().split('T')[0],
          percentage: 0
        });
      }

      const contractParams = {
        projectData,
        clientData,
        milestones: enhancedMilestones,
        paymentMethod: null, // Will be set during client funding
        customPrompt,
        selectedTemplate
      };
      
      console.log("Generating contract with params:", contractParams);

      const contractParamsFixed = {
        ...contractParams,
        paymentMethod: "stripe" as any // Default for generation
      };
      
      const [generatedText, riskAnalysisResult] = await Promise.all([
        aiContractService.generateFreelanceContract(contractParamsFixed),
        aiContractService.analyzeContractRisks(contractParamsFixed)
      ]);
      
      setGeneratedContract(generatedText);
      setRiskAnalysis(riskAnalysisResult);
      
      toast({
        title: "Professional Contract Generated",
        description: "AI has created your contract with advanced legal protections and risk analysis",
      });
      
    } catch (error) {
      console.error("Contract generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Please check your OpenAI API key and try again";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsAnalyzing(false);
    }
  }, [projectData, clientData, milestones, customPrompt, selectedTemplate, paymentTerms, toast]);

  // Final Contract Creation Function
  const finalizeContract = useCallback(async () => {
    // Check authentication state with more comprehensive logging
    console.log("Contract creation - checking authentication:", {
      currentUser,
      hasCurrentUser: !!currentUser?.id
    });

    // Validate user authentication before contract creation
    if (!currentUser?.id) {
      console.log("No current user found - showing login message");
      toast({
        title: "Authentication Required",
        description: "Please log in to create contracts",
        variant: "destructive",
      });
      // Redirect to login page
      window.location.href = "/login";
      return;
    }

    setIsCreating(true);
    
    // Show success screen immediately to prevent blank screen during async operations
    setTimeout(() => {
      setIsContractCreated(true);
    }, 500);
    
    try {
      // Calculate total contract value from milestones
      const milestoneTotal = milestones.reduce((total, milestone) => {
        return total + (parseFloat(milestone.amount) || 0);
      }, 0);

      // Create the contract with all the gathered data (payment method will be set by client)
      const contractData = {
        title: projectData.title,
        projectDescription: projectData.description,
        clientName: clientData.clientName,
        clientEmail: clientData.clientEmail,
        totalValue: milestoneTotal.toString(),
        paymentMethod: projectData.pricingModel === "fixed" ? null : null, // Client will select payment method during funding
        contractType: projectData.pricingModel === "fixed" ? "fixed_price" : "milestone_based",
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        creatorId: currentUser?.id, // Use authenticated user ID
        status: "draft"
      };

      // Create contract via API, including the generated contract document
      const contractResponse = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          ...contractData,
          generatedContract: generatedContract // Include the AI-generated contract document
        }),
      });

      if (!contractResponse.ok) {
        const errorData = await contractResponse.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Contract API Error:', contractResponse.status, errorData);
        
        // Show user-friendly error message
        toast({
          title: "Contract Creation Failed",
          description: errorData.message || "Please check your project details and try again.",
          variant: "destructive",
        });
        
        setIsContractCreated(false);
        setIsCreating(false);
        return;
      }

      const createdContract = await contractResponse.json();

      // Try to create milestones for the contract (but don't fail if this doesn't work)
      try {
        for (const milestone of milestones) {
          if (milestone.title && milestone.deliverables && milestone.amount && milestone.dueDate) {
            const milestoneResponse = await fetch('/api/milestones', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                contractId: createdContract.id,
                title: milestone.title,
                description: milestone.deliverables,
                amount: milestone.amount,
                dueDate: milestone.dueDate
              }),
            });

            if (!milestoneResponse.ok) {
              console.warn('Milestone creation failed:', milestoneResponse.status);
              // Don't fail the whole process if milestones fail
            }
          }
        }
      } catch (milestoneError) {
        console.warn('Milestone creation error (continuing anyway):', milestoneError);
      }

      // Try to create activity log entry (but don't fail if this doesn't work)
      try {
        await fetch('/api/activity', {
          method: 'POST',
          credentials: 'include',
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
      } catch (activityError) {
        console.warn('Activity log creation error (continuing anyway):', activityError);
      }
      
      // Invalidate contracts cache to trigger refresh
      queryClient.invalidateQueries({
        queryKey: ["/api/contracts"]
      });
      
      // Invalidate milestone cache for the new contract
      queryClient.invalidateQueries({
        queryKey: ["/api/contracts", createdContract.id, "milestones"]
      });
      
      // Show success message and redirect immediately
      toast({
        title: "✅ Contract Created Successfully!",
        description: "Contract saved and ready to send. Redirecting to dashboard...",
      });
      
      // Set success state to show the success screen
      setIsContractCreated(true);
      
      // Redirect to appropriate dashboard after success using client-side routing
      setTimeout(() => {
        const dashboardUrl = currentUser?.userType === "client" ? "/client-dashboard" : "/dashboard";
        console.log(`Redirecting to ${dashboardUrl} after successful contract creation`);
        
        // Force refresh auth data before redirect to ensure user is authenticated
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        // Use wouter's client-side routing instead of full page refresh to preserve session
        setLocation(dashboardUrl);
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
  }, [projectData, clientData, milestones, generatedContract, currentUser, toast]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ProjectSetupStep 
          projectData={projectData} 
          updateProjectData={updateProjectData}
          paymentTerms={paymentTerms}
          updatePaymentTerms={updatePaymentTerms}
        />;
      case 2:
        return <ClientDetailsStep clientData={clientData} updateClientData={updateClientData} projectData={projectData} />;
      case 3:
        return <MilestoneBuilderStep 
          milestones={milestones} 
          updateMilestone={updateMilestone}
          addMilestone={addMilestone}
          removeMilestone={removeMilestone}
          clientData={clientData}
          projectData={projectData}
          paymentTerms={paymentTerms}
        />;
      case 4:
        return <TemplateSelectionStep 
          recommendedTemplates={recommendedTemplates}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          isLoadingTemplates={isLoadingTemplates}
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
          {isContractCreated ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="text-center py-16">
                <div className="animate-bounce mb-6">
                  <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-green-700 mb-3">Contract Created Successfully!</h2>
                <p className="text-lg text-slate-700 mb-6">
                  Your AI-generated contract with smart escrow protection is ready.
                </p>
                <div className="bg-white p-6 rounded-lg border border-green-200 mb-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5 text-green-600 mr-2 animate-spin" />
                    <p className="text-green-700 font-semibold">Taking you to dashboard...</p>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{width: '85%'}}></div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>✓ Contract saved with milestone-based payments</p>
                  <p>✓ Smart escrow protection activated</p>
                  <p>✓ Ready to send to your client</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            renderStepContent()
          )}
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
                  (currentStep === 1 && (!projectData?.title || !projectData?.scopeOfWork || !projectData?.description)) ||
                  (currentStep === 2 && (!clientData?.clientName || !clientData?.clientEmail || !clientData?.projectBudget || !clientData.clientEmail.includes('@') || !clientData.clientEmail.includes('.'))) ||
                  (currentStep === 3 && (milestones.length === 0 || milestones.some(m => !m.title || !m.amount || !m.dueDate || !m.deliverables))) ||
                  (currentStep === 4 && !selectedTemplate)
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