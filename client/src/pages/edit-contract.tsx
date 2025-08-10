import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, ArrowRight, CheckCircle, Target, 
  Sparkles, Plus, Trash2, Save, Loader
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import type { Contract } from "@shared/schema";

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
  "Down Payment",
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

interface ProjectSetupData {
  title: string;
  scopeOfWork: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface ClientDetailsData {
  clientName: string;
  clientEmail: string;
  projectBudget: string;
}

interface MilestoneData {
  id?: string;
  title: string;
  deliverables: string;
  amount: string;
  dueDate: string;
  percentage: number;
}

export default function EditContract() {
  const [, params] = useRoute("/edit-contract/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const contractId = params?.id;

  const [projectData, setProjectData] = useState<ProjectSetupData>({
    title: "",
    scopeOfWork: "",
    description: "",
    startDate: "",
    endDate: ""
  });

  const [clientData, setClientData] = useState<ClientDetailsData>({
    clientName: "",
    clientEmail: "",
    projectBudget: ""
  });

  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch contract data
  const { data: contract, isLoading } = useQuery({
    queryKey: ["/api/contracts", contractId],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}`);
      if (!response.ok) throw new Error("Contract not found");
      return response.json();
    },
    enabled: !!contractId
  });

  // Fetch milestones
  const { data: contractMilestones = [] } = useQuery({
    queryKey: ["/api/contracts", contractId, "milestones"],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}/milestones`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!contractId
  });

  // Populate form data when contract is loaded
  useEffect(() => {
    if (contract) {
      setProjectData({
        title: contract.title || "",
        scopeOfWork: contract.scopeOfWork || contract.scope_of_work || "",
        description: contract.projectDescription || contract.project_description || "",
        startDate: contract.startDate || contract.start_date || "",
        endDate: contract.endDate || contract.end_date || ""
      });

      setClientData({
        clientName: contract.clientName || contract.client_name || "",
        clientEmail: contract.clientEmail || contract.client_email || "",
        projectBudget: contract.totalValue || contract.total_value || ""
      });
    }
  }, [contract]);

  // Populate milestones when they're loaded
  useEffect(() => {
    if (contractMilestones.length > 0) {
      const formattedMilestones = contractMilestones.map((milestone: any) => ({
        id: milestone.id,
        title: milestone.title || "",
        deliverables: milestone.description || milestone.deliverables || "",
        amount: milestone.amount || "",
        dueDate: milestone.dueDate || milestone.due_date || "",
        percentage: milestone.percentage || 0
      }));
      setMilestones(formattedMilestones);
    }
  }, [contractMilestones]);

  // Update functions
  const updateProjectData = (field: keyof ProjectSetupData, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const updateClientData = (field: keyof ClientDetailsData, value: string) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const updateMilestone = (index: number, field: keyof MilestoneData, value: string | number) => {
    setMilestones(prev => prev.map((milestone, i) => 
      i === index ? { ...milestone, [field]: value } : milestone
    ));
  };

  const addMilestone = () => {
    setMilestones(prev => [...prev, {
      title: "",
      deliverables: "",
      amount: "",
      dueDate: "",
      percentage: 0
    }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  // Save changes mutation
  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      setIsSaving(true);
      
      // Update contract
      const contractResponse = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectData.title,
          projectDescription: projectData.description,
          clientName: clientData.clientName,
          clientEmail: clientData.clientEmail,
          totalValue: clientData.projectBudget,
          startDate: projectData.startDate,
          endDate: projectData.endDate
        })
      });

      if (!contractResponse.ok) {
        throw new Error("Failed to update contract");
      }

      // Update milestones
      for (const milestone of milestones) {
        if (milestone.id) {
          // Update existing milestone
          await fetch(`/api/milestones/${milestone.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: milestone.title,
              description: milestone.deliverables,
              amount: milestone.amount,
              dueDate: milestone.dueDate
            })
          });
        } else {
          // Create new milestone
          await fetch('/api/milestones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractId: contractId,
              title: milestone.title,
              description: milestone.deliverables,
              amount: milestone.amount,
              dueDate: milestone.dueDate
            })
          });
        }
      }

      return contractResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Contract Updated",
        description: "Your changes have been saved successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      
      // Redirect back to dashboard
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSaving(false);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-3">
            <Loader className="w-6 h-6 animate-spin" />
            <span>Loading contract...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Contract Not Found</h2>
            <p className="text-slate-600 mb-4">The contract you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Don't allow editing non-draft contracts
  if (contract.status !== 'draft') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Contract Cannot Be Edited</h2>
            <p className="text-slate-600 mb-2">Only draft contracts can be edited.</p>
            <p className="text-slate-600 mb-4">This contract is currently <Badge className="mx-1">{contract.status}</Badge></p>
            <Button onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Contract</h1>
              <p className="text-slate-600">Update your draft contract details</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Project Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Project Details
              </CardTitle>
              <CardDescription>
                Update your project information
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>
                Update client details and project budget
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
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Project Milestones
              </CardTitle>
              <CardDescription>
                Update your project milestones and payment schedule
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
                        onChange={(e) => updateMilestone(index, "amount", e.target.value)}
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
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          <Button 
            onClick={() => saveChangesMutation.mutate()}
            disabled={isSaving || !projectData.title || !clientData.clientEmail}
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}