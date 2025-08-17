import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Clock, AlertTriangle, CreditCard, Wallet, Shield, ExternalLink } from "lucide-react";
import { formatCurrency } from "@shared/pricing";

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'paid';
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;
}

interface PaymentAuthorization {
  id: string;
  paymentMethod: 'stripe' | 'usdc';
  maxPerMilestone: string;
  totalAuthorized: string;
  isActive: boolean;
  authorizedAt: string;
  expiresAt?: string;
  stripePaymentMethodId?: string;
  walletAddress?: string;
}

interface Contract {
  id: string;
  title: string;
  status: string;
  paymentMethod?: string;
  clientEmail: string;
  freelancerEmail: string;
}

export default function ContractMilestones() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");

  const { data: contractData, isLoading: contractLoading } = useQuery({
    queryKey: [`/api/contracts/${id}`],
    enabled: !!id
  });

  const { data: milestonesData, isLoading: milestonesLoading } = useQuery({
    queryKey: [`/api/contracts/${id}/milestones`],
    enabled: !!id
  });

  const { data: authorizationData, isLoading: authLoading } = useQuery({
    queryKey: [`/api/contracts/${id}/payment-authorization`],
    enabled: !!id
  });

  const submitMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, notes }: { milestoneId: string; notes: string }) => {
      return apiRequest("POST", `/api/milestones/${milestoneId}/submit`, {
        completionNotes: notes,
        proofUrl: `milestone-${milestoneId}-proof`,
        deliverables: []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${id}/milestones`] });
      setSubmitDialogOpen(false);
      setCompletionNotes("");
      setSelectedMilestone(null);
    }
  });

  if (contractLoading || milestonesLoading || authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const contract: Contract = contractData?.contract;
  const milestones: Milestone[] = milestonesData?.milestones || [];
  const authorization: PaymentAuthorization = authorizationData?.authorization;

  const completedMilestones = milestones.filter(m => m.status === 'paid').length;
  const totalMilestones = milestones.length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'approved': return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'submitted': return <Clock className="h-5 w-5 text-orange-600" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'paid': 'default',
      'approved': 'secondary',
      'submitted': 'outline',
      'in_progress': 'outline',
      'pending': 'outline'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatPaymentMethodDisplay = () => {
    if (!authorization || !authorization.isActive) return null;
    
    if (authorization.paymentMethod === 'stripe') {
      return (
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4 text-blue-600" />
          <span>Payment Method: Visa •••• 4242</span>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
      );
    } else if (authorization.paymentMethod === 'usdc') {
      const shortAddress = authorization.walletAddress ? 
        `${authorization.walletAddress.slice(0, 6)}...${authorization.walletAddress.slice(-4)}` : 
        'Connected';
      return (
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 text-purple-600" />
          <span>USDC Wallet: {shortAddress}</span>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
      );
    }
  };

  const handleSubmitMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setSubmitDialogOpen(true);
  };

  const handleSubmit = () => {
    if (selectedMilestone) {
      submitMilestoneMutation.mutate({ 
        milestoneId: selectedMilestone.id, 
        notes: completionNotes 
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contract Milestones</h1>
          <p className="text-gray-600 mt-1">{contract?.title}</p>
        </div>
        <Button variant="outline" asChild>
          <a href={`/dashboard/contracts/${id}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Back to Contract
          </a>
        </Button>
      </div>

      {/* Payment Authorization Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Payment Authorization Status
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/payment-methods">Manage Payment Methods</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {authorization && authorization.isActive ? (
            <div className="space-y-3">
              {formatPaymentMethodDisplay()}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Max per milestone: {formatCurrency(parseInt(authorization.maxPerMilestone))}</span>
                <span>Total authorized: {formatCurrency(parseInt(authorization.totalAuthorized))}</span>
                <span>Authorized: {new Date(authorization.authorizedAt).toLocaleDateString()}</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/payment-methods">Change Payment Method</a>
              </Button>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Payment authorization required before milestone work can begin. 
                <Button variant="link" className="p-0 h-auto ml-2" asChild>
                  <a href={`/contracts/${contract?.id}/authorize-payment`}>Set up payment method</a>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>
            {completedMilestones} of {totalMilestones} milestones completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="w-full" />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{completedMilestones} completed</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Milestones</h2>
        {milestones.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No milestones found for this contract.
            </CardContent>
          </Card>
        ) : (
          milestones.map((milestone, index) => (
            <Card key={milestone.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(milestone.status)}
                      <CardTitle className="text-lg">
                        Milestone {index + 1}: {milestone.title}
                      </CardTitle>
                    </div>
                    {getStatusBadge(milestone.status)}
                  </div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(milestone.amount)}
                  </div>
                </div>
                <CardDescription>{milestone.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                  {milestone.submittedAt && (
                    <span>Submitted: {new Date(milestone.submittedAt).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Milestone Actions */}
                <div className="flex gap-2">
                  {milestone.status === 'pending' || milestone.status === 'in_progress' ? (
                    <>
                      {!authorization || !authorization.isActive ? (
                        <Alert className="flex-1">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            Client payment method not configured. Milestone work is paused.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Button 
                          onClick={() => handleSubmitMilestone(milestone)}
                          className="ml-auto"
                        >
                          Submit Milestone
                        </Button>
                      )}
                    </>
                  ) : milestone.status === 'submitted' ? (
                    <div className="text-sm text-orange-600 ml-auto">
                      Awaiting client approval...
                    </div>
                  ) : milestone.status === 'approved' ? (
                    <div className="text-sm text-blue-600 ml-auto">
                      Payment processing...
                    </div>
                  ) : milestone.status === 'paid' ? (
                    <div className="text-sm text-green-600 ml-auto">
                      ✓ Paid on {milestone.paidAt ? new Date(milestone.paidAt).toLocaleDateString() : 'N/A'}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Submit Milestone Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Milestone</DialogTitle>
            <DialogDescription>
              Submit "{selectedMilestone?.title}" for client review
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Completion Notes</label>
              <Textarea
                placeholder="Describe what you've completed for this milestone..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitMilestoneMutation.isPending || !completionNotes.trim()}
            >
              {submitMilestoneMutation.isPending ? "Submitting..." : "Submit Milestone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}