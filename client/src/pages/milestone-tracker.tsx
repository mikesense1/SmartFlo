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

  // Mock data for demonstration
  const mockContract: Contract = {
    id: contractId,
    title: "E-commerce Website Development",
    clientName: "TechCorp Inc.",
    totalValue: "8000",
    amountReleased: "2000",
    escrowBalance: "6000",
    status: "active",
    paymentMethod: "usdc"
  };

  const mockMilestones: Milestone[] = [
    {
      id: "1",
      title: "Design & Planning",
      description: "Complete wireframes, mockups, and project architecture",
      amount: "2000",
      dueDate: "2025-01-15",
      status: "paid",
      completionNotes: "Delivered complete design system with responsive layouts",
      submittedAt: "2025-01-10",
      approvedAt: "2025-01-12",
      paidAt: "2025-01-12",
      paymentTx: "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi",
      deliverables: ["wireframes.pdf", "mockups.sketch", "style-guide.pdf"]
    },
    {
      id: "2", 
      title: "Frontend Development",
      description: "HTML/CSS/JS implementation with responsive design",
      amount: "2800",
      dueDate: "2025-02-01",
      status: "submitted",
      completionNotes: "Completed responsive frontend with all requested features. Includes mobile optimization and cross-browser testing.",
      submittedAt: "2025-01-30",
      deliverables: ["frontend-demo.zip", "testing-report.pdf"]
    },
    {
      id: "3",
      title: "Backend Integration",
      description: "API development, database setup, and core functionality",
      amount: "2000",
      dueDate: "2025-02-15",
      status: "in_progress"
    },
    {
      id: "4",
      title: "Testing & Launch",
      description: "QA testing, deployment, and final optimizations",
      amount: "1200",
      dueDate: "2025-03-01",
      status: "pending"
    }
  ];

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
    mutationFn: async (data: { milestoneId: string; notes: string }) => {
      // Simulate blockchain submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Milestone Submitted!",
        description: "Your milestone has been submitted for client approval.",
      });
      setIsSubmissionModalOpen(false);
      setCompletionNotes("");
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit milestone. Please try again.",
        variant: "destructive",
      });
    }
  });

  const approveMilestoneMutation = useMutation({
    mutationFn: async (data: { milestoneId: string; notes: string }) => {
      // Simulate blockchain approval and payment
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true, transactionId: "5hG8KL2cJJF97GXTLMwItnnGBDCh5hqAhgg5Q4clMBj" };
    },
    onSuccess: () => {
      toast({
        title: "Payment Released!",
        description: "Milestone approved and payment automatically released via blockchain.",
      });
      setIsApprovalModalOpen(false);
      setApprovalNotes("");
      queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Failed to approve milestone. Please try again.",
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

  const completedMilestones = mockMilestones.filter(m => m.status === "paid").length;
  const totalProgress = (completedMilestones / mockMilestones.length) * 100;
  const amountReleased = parseFloat(mockContract.amountReleased);
  const totalValue = parseFloat(mockContract.totalValue);

  return (
    <div className="min-h-screen bg-slate-50">
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
                <h1 className="text-xl font-bold text-slate-900">{mockContract.title}</h1>
                <p className="text-sm text-slate-500">Contract with {mockContract.clientName}</p>
              </div>
            </div>
            <Badge className={getStatusColor(mockContract.status)}>
              {mockContract.status}
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
              <div className="text-2xl font-bold text-blue-600">${parseFloat(mockContract.escrowBalance).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Secured by blockchain</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedMilestones}/{mockMilestones.length}</div>
              <Progress value={totalProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">Milestones completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Info */}
        <Alert className="mb-8">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Payments are automatically released via {mockContract.paymentMethod === "usdc" ? "USDC cryptocurrency" : "Stripe bank transfer"} 
            when milestones are approved. Funds are secured in blockchain escrow.
          </AlertDescription>
        </Alert>

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
            {mockMilestones.map((milestone, index) => (
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
                
                {index < mockMilestones.length - 1 && (
                  <div className="flex justify-center my-4">
                    <div className="w-px h-8 bg-slate-200"></div>
                  </div>
                )}
              </div>
            ))}
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