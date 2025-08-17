import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Edit, Save, ArrowLeft, 
  AlertCircle, CheckCircle, Plus, Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { queryClient } from "@/lib/queryClient";

interface EditableContract {
  id: string;
  title: string;
  projectDescription: string;
  clientName: string;
  clientEmail: string;
  totalValue: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface Milestone {
  id?: string;
  title: string;
  description: string;
  amount: string;
  dueDate: string;
}

export default function EditContract() {
  const params = useParams();
  const contractId = params.id;
  const { data: currentUser } = useCurrentUser();
  const { toast } = useToast();

  const [contract, setContract] = useState<EditableContract | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch contract data
  const { data: contractData, isLoading: contractLoading } = useQuery({
    queryKey: ["/api/contracts", contractId],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch contract');
      return response.json();
    },
    enabled: !!contractId
  });

  // Fetch milestones
  const { data: milestonesData } = useQuery({
    queryKey: ["/api/contracts", contractId, "milestones"],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}/milestones`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!contractId
  });

  useEffect(() => {
    if (contractData) {
      setContract({
        id: contractData.id,
        title: contractData.title,
        projectDescription: contractData.projectDescription || contractData.project_description,
        clientName: contractData.clientName || contractData.client_name,
        clientEmail: contractData.clientEmail || contractData.client_email,
        totalValue: contractData.totalValue || contractData.total_value || "0",
        status: contractData.status,
        startDate: contractData.startDate || contractData.start_date,
        endDate: contractData.endDate || contractData.end_date
      });
    }
  }, [contractData]);

  useEffect(() => {
    if (milestonesData) {
      setMilestones(milestonesData.map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        amount: m.amount,
        dueDate: m.dueDate || m.due_date
      })));
    }
  }, [milestonesData]);

  // Save contract mutation
  const saveContractMutation = useMutation({
    mutationFn: async () => {
      if (!contract) throw new Error('No contract data');
      
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: contract.title,
          projectDescription: contract.projectDescription,
          clientName: contract.clientName,
          clientEmail: contract.clientEmail,
          totalValue: contract.totalValue,
          startDate: contract.startDate,
          endDate: contract.endDate
        }),
      });

      if (!response.ok) throw new Error('Failed to update contract');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contract Updated",
        description: "Your contract has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save contract changes.",
        variant: "destructive",
      });
    }
  });

  const addMilestone = () => {
    setMilestones([...milestones, {
      title: "",
      description: "",
      amount: "",
      dueDate: ""
    }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    setMilestones(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    saveContractMutation.mutate();
    setTimeout(() => setIsSaving(false), 1000);
  };

  if (contractLoading || !contract) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-slate-600">Loading contract...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only allow editing draft contracts
  if (contract.status !== 'draft') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-yellow-600 mb-4" />
              <h2 className="text-2xl font-bold text-yellow-800 mb-2">Contract Cannot Be Edited</h2>
              <p className="text-yellow-700 mb-6">
                Only draft contracts can be edited. This contract has status: <Badge className="ml-1">{contract.status}</Badge>
              </p>
              <Link href="/dashboard">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Edit className="w-6 h-6" />
                  Edit Contract
                </h1>
                <p className="text-sm text-slate-500">Make changes to your draft contract</p>
              </div>
            </div>
            <Badge variant="secondary">Draft</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Contract Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
              <CardDescription>Update the basic contract information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Contract Title</label>
                <Input
                  value={contract.title}
                  onChange={(e) => setContract({...contract, title: e.target.value})}
                  placeholder="E-commerce Website Development"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Project Description</label>
                <Textarea
                  value={contract.projectDescription}
                  onChange={(e) => setContract({...contract, projectDescription: e.target.value})}
                  placeholder="Detailed description of the project scope and deliverables"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Client Name</label>
                  <Input
                    value={contract.clientName}
                    onChange={(e) => setContract({...contract, clientName: e.target.value})}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Client Email</label>
                  <Input
                    type="email"
                    value={contract.clientEmail}
                    onChange={(e) => setContract({...contract, clientEmail: e.target.value})}
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Total Value ($)</label>
                  <Input
                    type="number"
                    value={contract.totalValue}
                    onChange={(e) => setContract({...contract, totalValue: e.target.value})}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={contract.startDate || ""}
                    onChange={(e) => setContract({...contract, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={contract.endDate || ""}
                    onChange={(e) => setContract({...contract, endDate: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Milestones</CardTitle>
                  <CardDescription>Edit contract milestones and payment schedule</CardDescription>
                </div>
                <Button onClick={addMilestone} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Milestone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No milestones yet. Add milestones to break down the project into manageable payments.</p>
                  </div>
                ) : (
                  milestones.map((milestone, index) => (
                    <Card key={index} className="bg-slate-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">Milestone {index + 1}</h4>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeMilestone(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Title</label>
                            <Input
                              value={milestone.title}
                              onChange={(e) => updateMilestone(index, "title", e.target.value)}
                              placeholder="Milestone title"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Amount ($)</label>
                            <Input
                              type="number"
                              value={milestone.amount}
                              onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                              placeholder="1000"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Description</label>
                            <Input
                              value={milestone.description}
                              onChange={(e) => updateMilestone(index, "description", e.target.value)}
                              placeholder="Milestone deliverables"
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
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-600">
                  Changes are automatically saved as you type
                </div>
                <div className="flex gap-3">
                  <Link href="/dashboard">
                    <Button variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="min-w-[120px]"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Contract
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}