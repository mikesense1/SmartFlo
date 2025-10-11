import { useState } from "react";
import { useParams, Link } from "wouter";
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
import { CheckCircle, Clock, AlertTriangle, CreditCard, Wallet, Shield, ArrowLeft } from "lucide-react";
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

  const contract: Contract = (contractData as any)?.contract || contractData;
  const milestones: Milestone[] = (milestonesData as any)?.milestones || milestonesData || [];
  const authorization: PaymentAuthorization = (authorizationData as any)?.authorization || authorizationData;

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
    const variants: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
      'paid': 'default',
      'approved': 'secondary',
      'submitted': 'outline',
      'in_progress': 'outline',
      'pending': 'outline'
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
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

  const hasActiveAuthorization = authorization && authorization.isActive && !authorization.expiresAt;
  const authorizationExpired = authorization && !authorization.isActive;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contract Milestones</h1>
          <p className="text-gray-600 mt-1">{contract?.title}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/contracts/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contract
          </Link>
        </Button>
      </div>

      {/* Payment Authorization Status - Enhanced */}
      <Card className={hasActiveAuthorization ? "border-green-200 bg-green-50/30" : "border-orange-200 bg-orange-50/30"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className={`h-5 w-5 ${hasActiveAuthorization ? 'text-green-600' : 'text-orange-600'}`} />
                Payment Authorization
              </CardTitle>
              {hasActiveAuthorization ? (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : authorizationExpired ? (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Revoked
                </Badge>
              ) : (
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/payment-methods">Manage</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasActiveAuthorization ? (
            <div className="space-y-4">
              <div className="p-3 bg-white rounded-lg border border-green-200">
                {formatPaymentMethodDisplay()}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Max Per Milestone</span>
                  <div className="font-semibold text-lg">{formatCurrency(parseInt(authorization.maxPerMilestone))}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Authorized</span>
                  <div className="font-semibold text-lg">{formatCurrency(parseInt(authorization.totalAuthorized))}</div>
                </div>
                <div>
                  <span className="text-gray-600">Authorized On</span>
                  <div className="font-semibold text-lg">{new Date(authorization.authorizedAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/payment-methods">
                    Change Payment Method
                  </Link>
                </Button>
              </div>
            </div>
          ) : authorizationExpired ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Payment authorization has been revoked.</strong> Work cannot continue until payment method is reauthorized.
                <div className="mt-2">
                  <Button variant="destructive" size="sm" asChild>
                    <Link href="/dashboard/payment-methods">Reauthorize Payment</Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-orange-200">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Action Required:</strong> Payment method not configured. Client must authorize payment before milestone work can begin.
                <div className="mt-2">
                  <Button variant="outline" size="sm" className="border-orange-500 text-orange-700 hover:bg-orange-100" asChild>
                    <Link href="/dashboard/payment-methods">Set Up Payment Method</Link>
                  </Button>
                </div>
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