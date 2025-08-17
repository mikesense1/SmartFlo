import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import { Loader2, FileText, Shield, CreditCard, Coins, CheckCircle2 } from "lucide-react";
import PaymentAuthorizationComponent from "@/components/PaymentAuthorization";
import type { Contract, Milestone } from "@shared/schema";

interface ContractData {
  contract: Contract;
  milestones: Milestone[];
}

export default function ContractSign() {
  const [match, params] = useRoute("/contracts/:shareToken/sign");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signature, setSignature] = useState("");
  const [signatureAgreed, setSignatureAgreed] = useState(false);
  const [paymentAuthorized, setPaymentAuthorized] = useState(false);
  const [showPaymentAuth, setShowPaymentAuth] = useState(false);

  const shareToken = params?.shareToken;

  const { data: contractData, isLoading } = useQuery<ContractData>({
    queryKey: ["/api/contracts/shared", shareToken],
    enabled: !!shareToken,
  });

  const signContractMutation = useMutation({
    mutationFn: async (data: { signature: string }) => {
      const response = await apiRequest("POST", `/api/contracts/${shareToken}/sign`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contract Signed",
        description: "Contract signed successfully. You can now set up payment authorization.",
      });
      setShowPaymentAuth(true);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/shared", shareToken] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sign contract",
        variant: "destructive",
      });
    },
  });

  const handleSignContract = () => {
    if (!signature.trim()) {
      toast({
        title: "Error",
        description: "Please enter your full name as signature",
        variant: "destructive",
      });
      return;
    }
    signContractMutation.mutate({ signature: signature.trim() });
  };

  const handlePaymentAuthorized = () => {
    setPaymentAuthorized(true);
    toast({
      title: "Payment Authorization Complete",
      description: "Your payment method has been authorized. The contract is now active!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading contract...</span>
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Contract Not Found</CardTitle>
            <CardDescription>
              This contract link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { contract, milestones } = contractData;
  const isSigned = contract.status === "signed" || contract.status === "payment_authorized" || contract.status === "active";
  const isAuthorized = contract.status === "payment_authorized" || contract.status === "active";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Contract Signature & Payment Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review the contract terms and authorize payments for approved work
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${isSigned ? 'text-green-600' : 'text-blue-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isSigned ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {isSigned ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
              <span className="font-medium">Sign Contract</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${
              isAuthorized ? 'text-green-600' : isSigned ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isAuthorized ? 'bg-green-100 text-green-600' : 
                isSigned ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {isAuthorized ? <CheckCircle2 className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
              </div>
              <span className="font-medium">Authorize Payments</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Contract Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {contract.title}
              </CardTitle>
              <CardDescription>
                Contract from {contract.clientName} • Total Value: ${parseFloat(contract.totalValue).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Project Description</h4>
                <p className="text-gray-600 dark:text-gray-300">{contract.projectDescription}</p>
              </div>

              {milestones?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Project Milestones</h4>
                  <div className="space-y-2">
                    {milestones.map((milestone: Milestone, index: number) => (
                      <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <span className="font-medium">Milestone {index + 1}: {milestone.title}</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{milestone.description}</p>
                        </div>
                        <Badge variant="outline">
                          ${parseFloat(milestone.amount).toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Important Terms</h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Payments are released automatically upon milestone approval</li>
                  <li>• You have 48 hours to dispute any milestone approval</li>
                  <li>• A 1% platform fee applies to all transactions</li>
                  <li>• Milestones auto-approve after 7 days if no action is taken</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Signature Section */}
          {!isSigned && (
            <Card>
              <CardHeader>
                <CardTitle>Electronic Signature</CardTitle>
                <CardDescription>
                  Sign this contract to proceed with payment authorization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="signature">Full Legal Name (Electronic Signature)</Label>
                  <Input
                    id="signature"
                    placeholder="Enter your full legal name"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="signature-agree"
                    checked={signatureAgreed}
                    onCheckedChange={(checked) => setSignatureAgreed(!!checked)}
                  />
                  <Label htmlFor="signature-agree" className="text-sm">
                    I agree to the terms and conditions outlined in this contract and our{" "}
                    <Link href="/terms-of-service" className="text-blue-600 hover:underline">
                      Terms of Service
                    </Link>
                  </Label>
                </div>

                <Button
                  onClick={handleSignContract}
                  disabled={!signature.trim() || !signatureAgreed || signContractMutation.isPending}
                  className="w-full"
                >
                  {signContractMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Signing Contract...
                    </>
                  ) : (
                    "Sign Contract"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment Authorization Section */}
          {(isSigned || showPaymentAuth) && !isAuthorized && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Payment Method Setup
                </CardTitle>
                <CardDescription>
                  Authorize payments for approved work only. You maintain full control over milestone approvals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">How Payment Authorization Works</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• You authorize payments for work you approve only</li>
                    <li>• No charges occur without your explicit milestone approval</li>
                    <li>• You can revoke authorization at any time</li>
                    <li>• View full payment terms in our{" "}
                      <Link href="/payment-authorization" className="underline">
                        Payment Authorization Agreement
                      </Link>
                    </li>
                  </ul>
                </div>

                <PaymentAuthorizationComponent
                  contractId={contract.id}
                  totalAmount={parseFloat(contract.totalValue)}
                  largestMilestone={Math.max(...(milestones?.map((m: Milestone) => parseFloat(m.amount)) || [0]))}
                  onAuthorized={handlePaymentAuthorized}
                />
              </CardContent>
            </Card>
          )}

          {/* Success State */}
          {isAuthorized && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  Contract Active
                </CardTitle>
                <CardDescription className="text-green-600 dark:text-green-300">
                  Contract is signed and payment method is authorized. Work can now begin!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Payment Method: Connected ✓
                    </Badge>
                  </div>
                  <Link href="/client-dashboard">
                    <Button>Go to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}