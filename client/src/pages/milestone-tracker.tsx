import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, CheckCircle, Clock, DollarSign, FileText, 
  Upload, ExternalLink, AlertCircle, Calendar, 
  Send, Shield, Zap, Target, Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { submitMilestone, approveMilestone, MilestoneSubmissionData } from "@/lib/payments/smart-triggers";

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: string;
  dueDate: string;
  status: "pending" | "in_progress" | "submitted" | "approved" | "paid";
  completionNotes?: string;
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  paymentTx?: string;
  deliverables?: string[];
}

interface Contract {
  id: string;
  title: string;
  clientName: string;
  totalValue: string;
  amountReleased: string;
  escrowBalance: string;
  status: string;
  paymentMethod: "stripe" | "usdc";
}

export default function MilestoneTracker() {
  const params = useParams();
  const contractId = params.id || "demo-contract";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [currentUserRole] = useState<"freelancer" | "client">("freelancer"); // Mock user role

  // Fetch contract data
  const { data: contract, isLoading: contractLoading } = useQuery({
    queryKey: ["/api/contracts", contractId],
    enabled: contractId !== "demo-contract",
  });

  // Fetch milestones for this contract
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ["/api/contracts", contractId, "milestones"],
    enabled: contractId !== "demo-contract",
  });

  // Mock data for demo/fallback only
  const mockContract: Contract = {
    id: contractId,
    title: "Demo Contract",
    clientName: "Demo Client",
    totalValue: "5000",
    amountReleased: "0",
    escrowBalance: "5000",
    status: "active",
    paymentMethod: "usdc"
  };

  const mockMilestones: Milestone[] = [
    {
      id: "demo-1",
      title: "Demo Milestone",
      description: "This is a demonstration milestone",
      amount: "5000",
      dueDate: "2025-08-01",
      status: "pending"
    }
  ];

  // Use real data if available, otherwise fall back to mock data
  const displayContract = contract || mockContract;
  const displayMilestones = milestones.length > 0 ? milestones.map(m => ({
    ...m,
    status: m.status as "pending" | "in_progress" | "submitted" | "approved" | "paid"
  })) : mockMilestones;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-slate-100 text-slate-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "submitted": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "paid": return "bg-emerald-100 text-emerald-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "in_progress": return <Target className="w-4 h-4" />;
      case "submitted": return <Send className="w-4 h-4" />;
      case "approved": return <CheckCircle className="w-4 h-4" />;
      case "paid": return <Wallet className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const submitMilestoneMutation = useMutation({
    mutationFn: async (data: { milestoneId: string; notes: string; deliverables?: string[] }) => {
      if (!selectedMilestone) throw new Error("No milestone selected");
      
      const submissionData: MilestoneSubmissionData = {
        milestoneIndex: parseInt(selectedMilestone.id) - 1, // Convert to 0-based index
        proofUri: `ipfs://milestone-${selectedMilestone.id}-proof`, // In production, upload to IPFS
        completionNotes: data.notes,
        deliverables: data.deliverables || []
      };

      // Use smart payment triggers for submission
      const transactionId = await submitMilestone(contractId, selectedMilestone.id, submissionData);
      
      return { success: true, transactionId };
    },
    onSuccess: (result) => {
      toast({
        title: "Milestone Submitted!",
        description: `Your milestone has been submitted for client approval. Transaction: ${result.transactionId.substring(0, 8)}...`,
      });
      setIsSubmissionModalOpen(false);
      setCompletionNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", contractId, "milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", contractId] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: `Failed to submit milestone: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const approveMilestoneMutation = useMutation({
    mutationFn: async (data: { milestoneId: string; notes: string }) => {
      if (!selectedMilestone) throw new Error("No milestone selected");
      
      // Use smart payment triggers for approval and automatic payment release
      const paymentData = await approveMilestone(
        contractId,
        selectedMilestone.id,
        "client-user-123", // In production, get from auth context
        "FakeWalletAddress123..." // Mock freelancer wallet
      );
      
      return paymentData;
    },
    onSuccess: (paymentData) => {
      toast({
        title: "Payment Released!",
        description: `Milestone approved and $${paymentData.amount} automatically released via ${paymentData.paymentMethod.toUpperCase()}. TX: ${paymentData.transactionId.substring(0, 8)}...`,
      });
      setIsApprovalModalOpen(false);
      setApprovalNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", contractId, "milestones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", contractId] });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: `Failed to approve milestone: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleSubmitMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setIsSubmissionModalOpen(true);
  };

  const handleApproveMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setIsApprovalModalOpen(true);
  };

  const completedMilestones = displayMilestones.filter(m => m.status === "paid").length;
  const totalProgress = displayMilestones.length > 0 ? (completedMilestones / displayMilestones.length) * 100 : 0;
  const amountReleased = parseFloat(displayContract.amountReleased || "0");
  const totalValue = parseFloat(displayContract.totalValue || "0");

  // Show loading state while fetching data
  if ((contractLoading || milestonesLoading) && contractId !== "demo-contract") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading contract and milestones...</p>
              </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{displayContract.title}</h1>
                <p className="text-sm text-slate-500">Contract with {displayContract.clientName}</p>
              </div>
            </div>
            <Badge className={getStatusColor(displayContract.status)}>
              {displayContract.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contract Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Project total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amount Released</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${amountReleased.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{((amountReleased / totalValue) * 100).toFixed(0)}% paid out</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Escrow</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${parseFloat(displayContract.escrowBalance || "0").toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Secured by blockchain</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedMilestones}/{displayMilestones.length}</div>
              <Progress value={totalProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Milestones completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Automation Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Smart Payment Automation:</strong> Payments are automatically released via {displayContract.paymentMethod === "usdc" ? "USDC cryptocurrency" : "Stripe bank transfer"} 
              when milestones are approved. Funds are secured in blockchain escrow.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Auto-Approval Protection:</strong> Submitted milestones are automatically approved after 7 days if no client response. 
              Includes blockchain synchronization and dispute resolution.
            </AlertDescription>
          </Alert>
        </div>

        {/* Milestones Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Milestone Timeline
            </CardTitle>
            <CardDescription>
              Track progress and manage milestone submissions and approvals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {displayMilestones.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Milestones Found</h3>
                <p className="text-slate-500 mb-4">This contract doesn't have any milestones yet.</p>
                <Link href="/create-contract">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Contract
                  </Button>
                </Link>
              </div>
            ) : (
              displayMilestones.map((milestone, index) => (
                <div key={milestone.id}>
                <Card className="relative">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(milestone.status)}`}>
                          {getStatusIcon(milestone.status)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{milestone.title}</CardTitle>
                          <CardDescription>{milestone.description}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">${milestone.amount}</div>
                        <Badge className={getStatusColor(milestone.status)}>
                          {milestone.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </div>
                      {milestone.submittedAt && (
                        <div className="flex items-center gap-1">
                          <Send className="w-4 h-4" />
                          Submitted: {new Date(milestone.submittedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {milestone.completionNotes && (
                      <div className="bg-slate-50 p-3 rounded-lg mb-4">
                        <h4 className="font-medium text-sm mb-1">Completion Notes:</h4>
                        <p className="text-sm text-slate-600">{milestone.completionNotes}</p>
                      </div>
                    )}

                    {milestone.deliverables && milestone.deliverables.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-2">Deliverables:</h4>
                        <div className="flex flex-wrap gap-2">
                          {milestone.deliverables.map((file, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {file}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {milestone.status === "in_progress" && currentUserRole === "freelancer" && (
                          <Button onClick={() => handleSubmitMilestone(milestone)}>
                            <Send className="w-4 h-4 mr-2" />
                            Submit for Approval
                          </Button>
                        )}
                        
                        {milestone.status === "submitted" && currentUserRole === "client" && (
                          <div className="flex gap-2">
                            <Button onClick={() => handleApproveMilestone(milestone)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve & Release Payment
                            </Button>
                            <Button variant="outline">
                              Request Changes
                            </Button>
                          </div>
                        )}
                      </div>

                      {milestone.status === "paid" && milestone.paymentTx && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Paid on {new Date(milestone.paidAt!).toLocaleDateString()}</span>
                          <a 
                            href={`https://solscan.io/tx/${milestone.paymentTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {index < displayMilestones.length - 1 && (
                  <div className="flex justify-center my-4">
                    <div className="w-px h-8 bg-slate-200"></div>
                  </div>
                )}
              </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submission Modal */}
      <Dialog open={isSubmissionModalOpen} onOpenChange={setIsSubmissionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Milestone for Approval</DialogTitle>
            <DialogDescription>
              Milestone: {selectedMilestone?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Completion Notes</label>
              <Textarea
                placeholder="Describe what you've completed and any important details..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-500">Attach deliverables (optional)</p>
              <p className="text-xs text-slate-400">ZIP, PDF, PNG, JPG files accepted</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmissionModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedMilestone) {
                  submitMilestoneMutation.mutate({
                    milestoneId: selectedMilestone.id,
                    notes: completionNotes
                  });
                }
              }}
              disabled={submitMilestoneMutation.isPending || !completionNotes.trim()}
            >
              {submitMilestoneMutation.isPending ? "Submitting..." : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Milestone & Release Payment</DialogTitle>
            <DialogDescription>
              This will automatically release ${selectedMilestone?.amount} to the freelancer via blockchain escrow.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Approval Notes (Optional)</label>
              <Textarea
                placeholder="Any feedback or notes about the completed work..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Payment will be released immediately and cannot be reversed. Please review all deliverables carefully.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedMilestone) {
                  approveMilestoneMutation.mutate({
                    milestoneId: selectedMilestone.id,
                    notes: approvalNotes
                  });
                }
              }}
              disabled={approveMilestoneMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMilestoneMutation.isPending ? "Processing..." : "Approve & Release Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}