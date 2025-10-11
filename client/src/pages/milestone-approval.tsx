import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, Shield, CreditCard, Wallet, AlertTriangle, ArrowLeft, DollarSign, Mail } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// Helper function since shared pricing may not be available
const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
import Navigation from "@/components/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function MilestoneApproval() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: currentUser } = useCurrentUser();
  const { toast } = useToast();
  const [approvalStep, setApprovalStep] = useState<'review' | '2fa' | 'processing'>('review');
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Fetch milestone details
  const { data: milestone, isLoading: milestoneLoading } = useQuery({
    queryKey: ['/api/milestones', id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/milestones/${id}`);
      if (!response.ok) throw new Error('Milestone not found');
      return response.json();
    },
    enabled: !!id
  });

  // Fetch contract details
  const { data: contract, isLoading: contractLoading } = useQuery({
    queryKey: ['/api/contracts', milestone?.contractId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/contracts/${milestone.contractId}`);
      if (!response.ok) throw new Error('Contract not found');
      return response.json();
    },
    enabled: !!milestone?.contractId
  });

  // Fetch payment authorization
  const { data: authorization } = useQuery({
    queryKey: ['/api/contracts', milestone?.contractId, 'payment-authorization'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/contracts/${milestone.contractId}/payment-authorization`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.authorization;
    },
    enabled: !!milestone?.contractId
  });

  // Process payment after 2FA verification
  const processPaymentMutation = useMutation({
    mutationFn: async ({ otpCode }: { otpCode: string }) => {
      const response = await apiRequest("POST", `/api/milestones/${id}/verify-and-approve`, {
        otpCode
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment processing failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Processed Successfully",
        description: `Payment of ${formatCurrency(milestone.amount)} has been approved and processed.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/milestones'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      
      // Navigate back to contract or dashboard
      navigate('/client-dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setApprovalStep('review');
      setShow2FA(false);
    }
  });

  // Initiate approval process - request OTP for 2FA
  const initiateApproval = async () => {
    if (!milestone || !currentUser) return;

    try {
      // Request OTP for this milestone approval
      const response = await apiRequest("POST", `/api/milestones/${id}/request-otp`, {});

      if (response.ok) {
        const data = await response.json();
        setApprovalStep('2fa');
        setShow2FA(true);
        
        toast({
          title: "Verification Code Sent",
          description: `A 6-digit code has been sent to ${currentUser.email}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to send verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to initiate payment approval",
        variant: "destructive",
      });
    }
  };

  const handleVerifyOTP = () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }
    
    setApprovalStep('processing');
    setShow2FA(false);
    processPaymentMutation.mutate({ otpCode });
  };

  const handleOtpChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(cleanValue);
    
    // Auto-verify when 6 digits entered
    if (cleanValue.length === 6) {
      setTimeout(() => {
        setApprovalStep('processing');
        setShow2FA(false);
        processPaymentMutation.mutate({ otpCode: cleanValue });
      }, 300);
    }
  };

  const handleCancel2FA = () => {
    setApprovalStep('review');
    setShow2FA(false);
    setOtpCode('');
  };

  if (milestoneLoading || contractLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Loading milestone details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!milestone || !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Milestone Not Found</h1>
            <p className="text-slate-600 mb-4">The milestone you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => navigate('/client-dashboard')}>
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
          <Button 
            variant="outline" 
            onClick={() => navigate('/client-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Milestone Approval Required</h1>
              <p className="text-slate-600">{contract.title} • {milestone.title}</p>
            </div>
          </div>
        </div>

        {approvalStep === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Milestone Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Milestone Details</CardTitle>
                  <CardDescription>Review the completed work before approving payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{milestone.title}</h3>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {milestone.status}
                    </Badge>
                  </div>
                  
                  <p className="text-slate-600">{milestone.description}</p>
                  
                  {milestone.deliverables && milestone.deliverables.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-slate-700 mb-2">Deliverables:</h4>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                        {milestone.deliverables.map((deliverable: string, index: number) => (
                          <li key={index}>{deliverable}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Due Date:</span>
                      <p className="font-medium">{new Date(milestone.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Submitted:</span>
                      <p className="font-medium">
                        {milestone.submittedAt ? new Date(milestone.submittedAt).toLocaleDateString() : 'Not submitted'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Freelancer Work */}
              {milestone.completionNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Work Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 whitespace-pre-wrap">{milestone.completionNotes}</p>
                    {milestone.proofUrl && (
                      <div className="mt-4">
                        <a 
                          href={milestone.proofUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Proof of Work →
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Milestone Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(milestone.amount)}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Platform Fee (1%):</span>
                      <span>{formatCurrency(Math.round(milestone.amount * 0.01))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee:</span>
                      <span>{formatCurrency(Math.round(milestone.amount * 0.029 + 30))}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total Charge:</span>
                      <span>{formatCurrency(milestone.amount + Math.round(milestone.amount * 0.029 + 30))}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  {authorization && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {authorization.paymentMethod === 'card' ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <Wallet className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {authorization.paymentMethod === 'card' ? 'Credit Card' : 'USDC Wallet'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Payment will be charged to your authorized payment method
                      </p>
                    </div>
                  )}

                  {/* Security Notice */}
                  {milestone.amount >= 10000 && (
                    <Alert>
                      <Shield className="w-4 h-4" />
                      <AlertDescription className="text-xs">
                        2FA verification required for payments over $100
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Approve Button */}
                  <Button
                    onClick={initiateApproval}
                    disabled={!authorization || processPaymentMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {processPaymentMutation.isPending ? (
                      <>Processing...</>
                    ) : (
                      <>Approve & Pay {formatCurrency(milestone.amount)}</>
                    )}
                  </Button>

                  {!authorization && (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription className="text-xs">
                        Please set up a payment method first
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Contract Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Contract Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>3 of 5 milestones</span>
                    </div>
                    <Progress value={60} className="h-2" />
                    <p className="text-xs text-gray-600">
                      Total Contract Value: {formatCurrency(contract.totalValue)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* OTP Verification Dialog */}
        <Dialog open={show2FA} onOpenChange={(open) => !open && handleCancel2FA()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <DialogTitle className="text-center">
                Enter Verification Code
              </DialogTitle>
              <DialogDescription className="text-center">
                Code sent to {currentUser?.email}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Alert>
                <Shield className="w-4 h-4" />
                <AlertDescription>
                  <strong>Payment Amount: {formatCurrency(milestone?.amount || 0)}</strong>
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <Input
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  className="text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                  autoFocus
                  data-testid="input-otp-code"
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Code expires in 10 minutes</span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyOTP}
                  disabled={otpCode.length !== 6 || processPaymentMutation.isPending}
                  className="flex-1"
                  data-testid="button-verify-otp"
                >
                  {processPaymentMutation.isPending ? "Verifying..." : "Verify & Approve Payment"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel2FA}
                  data-testid="button-cancel-otp"
                >
                  Cancel
                </Button>
              </div>

              <Alert>
                <Shield className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  Never share verification codes. SmartFlo will never ask for your codes via phone or email.
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>

        {/* Processing State */}
        {approvalStep === 'processing' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="text-center py-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
                <p className="text-sm text-gray-600">
                  Please wait while we process your payment approval...
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}