import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, CreditCard, Wallet, Shield, Clock, 
  CheckCircle, ExternalLink, Info, AlertCircle,
  Lock, Globe, Zap, DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { initializeContractAutomation } from "@/lib/payments/smart-triggers";

interface Contract {
  id: string;
  title: string;
  freelancerName: string;
  freelancerEmail: string;
  totalValue: string;
  paymentMethod: "stripe" | "usdc";
  status: string;
  escrowAddress?: string;
}

interface Milestone {
  id: string;
  title: string;
  amount: string;
  dueDate: string;
  description: string;
  status: string;
}

export default function ClientPaymentPage() {
  const params = useParams();
  const contractId = params.id || "demo-contract";
  const { toast } = useToast();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"stripe" | "usdc">("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [transactionId, setTransactionId] = useState<string>("");

  // Mock contract data for demonstration
  const mockContract: Contract = {
    id: contractId,
    title: "E-commerce Website Development",
    freelancerName: "Alex Johnson",
    freelancerEmail: "alex@webdev.com",
    totalValue: "8000",
    paymentMethod: "usdc", // Default, but client can choose
    status: "pending_payment",
    escrowAddress: "7xKXR2JeP9NjHKqT3VqLFz4WpJ8HrQnKyV5M9CqRt2Ek"
  };

  const mockMilestones: Milestone[] = [
    {
      id: "1",
      title: "Design & Planning",
      amount: "2000",
      dueDate: "2025-01-15",
      description: "Complete wireframes, mockups, and project architecture",
      status: "pending"
    },
    {
      id: "2",
      title: "Frontend Development", 
      amount: "2800",
      dueDate: "2025-02-01",
      description: "HTML/CSS/JS implementation with responsive design",
      status: "pending"
    },
    {
      id: "3",
      title: "Backend Integration",
      amount: "2000",
      dueDate: "2025-02-15", 
      description: "API development, database setup, and core functionality",
      status: "pending"
    },
    {
      id: "4",
      title: "Testing & Launch",
      amount: "1200",
      dueDate: "2025-03-01",
      description: "QA testing, deployment, and final optimizations", 
      status: "pending"
    }
  ];

  // Initialize payment automation when component loads
  useEffect(() => {
    initializeContractAutomation(contractId);
  }, [contractId]);

  const stripePaymentMutation = useMutation({
    mutationFn: async (paymentData: { amount: string; cardToken: string }) => {
      setIsProcessing(true);
      
      // Simulate Stripe payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In production, this would:
      // 1. Create payment intent with Stripe
      // 2. Process payment and hold in escrow
      // 3. Update contract status
      // 4. Initialize milestone tracking
      
      const mockPaymentIntent = `pi_${Math.random().toString(36).substr(2, 24)}`;
      return { success: true, paymentIntentId: mockPaymentIntent };
    },
    onSuccess: (result) => {
      setTransactionId(result.paymentIntentId);
      setPaymentComplete(true);
      toast({
        title: "Payment Successful!",
        description: `$${mockContract.totalValue} has been secured in escrow. Work can now begin.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const cryptoPaymentMutation = useMutation({
    mutationFn: async (paymentData: { amount: string; walletAddress: string }) => {
      setIsProcessing(true);
      
      // Simulate USDC payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would:
      // 1. Connect to Solana wallet
      // 2. Transfer USDC to escrow contract
      // 3. Record transaction on blockchain
      // 4. Update contract status
      
      const mockTxHash = `${Math.random().toString(36).substr(2, 44)}`;
      return { success: true, transactionHash: mockTxHash };
    },
    onSuccess: (result) => {
      setTransactionId(result.transactionHash);
      setPaymentComplete(true);
      toast({
        title: "USDC Payment Successful!",
        description: `$${mockContract.totalValue} USDC has been secured in blockchain escrow.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Crypto Payment Failed", 
        description: "There was an issue with your USDC payment. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const handleStripePayment = () => {
    // In production, would integrate with Stripe Elements
    stripePaymentMutation.mutate({
      amount: mockContract.totalValue,
      cardToken: "tok_visa" // Mock token
    });
  };

  const handleCryptoPayment = () => {
    // In production, would integrate with Solana wallet adapters
    cryptoPaymentMutation.mutate({
      amount: mockContract.totalValue,
      walletAddress: mockContract.escrowAddress || ""
    });
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-slate-50">
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
                <h1 className="text-xl font-bold text-slate-900">Payment Complete</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription>
                Your funds are now secured and the freelancer can begin work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Contract Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Project</div>
                    <div className="font-medium">{mockContract.title}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Freelancer</div>
                    <div className="font-medium">{mockContract.freelancerName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Total Amount</div>
                    <div className="font-medium">${mockContract.totalValue}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Payment Method</div>
                    <div className="font-medium">{selectedPaymentMethod === "stripe" ? "Bank Transfer" : "USDC Crypto"}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="text-slate-500">Transaction ID:</div>
                <div className="font-mono">{transactionId}</div>
                {selectedPaymentMethod === "usdc" && (
                  <a 
                    href={`https://solscan.io/tx/${transactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your payment is secured in escrow and will be automatically released to the freelancer 
                  as milestones are completed and approved by you.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Link href={`/milestone-tracker/${contractId}`}>
                  <Button className="flex-1">
                    Track Progress
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="flex-1">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                <h1 className="text-xl font-bold text-slate-900">Fund Contract</h1>
                <p className="text-sm text-slate-500">{mockContract.title}</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              Pending Payment
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contract Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Overview</CardTitle>
                <CardDescription>Review the project details before funding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Freelancer</div>
                    <div className="font-medium">{mockContract.freelancerName}</div>
                    <div className="text-sm text-slate-500">{mockContract.freelancerEmail}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Total Value</div>
                    <div className="text-2xl font-bold text-green-600">${mockContract.totalValue}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Milestones</CardTitle>
                <CardDescription>Funds will be released as these milestones are completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockMilestones.map((milestone, index) => (
                    <div key={milestone.id}>
                      <div className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <h4 className="font-medium">{milestone.title}</h4>
                          </div>
                          <p className="text-sm text-slate-600 ml-8">{milestone.description}</p>
                          <div className="text-xs text-slate-500 ml-8 mt-1">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold">${milestone.amount}</div>
                          <div className="text-xs text-slate-500">
                            {((parseFloat(milestone.amount) / parseFloat(mockContract.totalValue)) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose Payment Method</CardTitle>
                <CardDescription>Select how you'd like to fund this contract</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedPaymentMethod} onValueChange={(value) => setSelectedPaymentMethod(value as "stripe" | "usdc")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stripe">Bank Transfer</TabsTrigger>
                    <TabsTrigger value="usdc">USDC Crypto</TabsTrigger>
                  </TabsList>

                  <TabsContent value="stripe" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                        <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">Bank Transfer via Stripe</h4>
                          <p className="text-sm text-blue-700">
                            2.9% + $0.30 fee • 2-3 day processing • USD only
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-600">Fraud protection included</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Card Number</label>
                          <Input placeholder="4242 4242 4242 4242" disabled={isProcessing} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Expiry</label>
                            <Input placeholder="MM/YY" disabled={isProcessing} />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">CVC</label>
                            <Input placeholder="123" disabled={isProcessing} />
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Your payment will be held securely and released automatically as milestones are completed.
                        </AlertDescription>
                      </Alert>

                      <Button 
                        onClick={handleStripePayment}
                        disabled={isProcessing}
                        className="w-full"
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Secure Payment ${mockContract.totalValue}
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="usdc" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                        <Wallet className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-900">USDC Cryptocurrency</h4>
                          <p className="text-sm text-green-700">
                            0.1% fee • Instant settlement • Global access
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Globe className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600">Works worldwide</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium mb-2">Escrow Address</h4>
                        <div className="font-mono text-sm break-all bg-white p-2 rounded border">
                          {mockContract.escrowAddress}
                        </div>
                        <div className="mt-2 text-sm text-slate-600">
                          Send exactly <strong>{mockContract.totalValue} USDC</strong> to this address
                        </div>
                      </div>

                      <Alert>
                        <Zap className="h-4 w-4" />
                        <AlertDescription>
                          USDC payments are secured by blockchain smart contracts and released automatically.
                        </AlertDescription>
                      </Alert>

                      <Button 
                        onClick={handleCryptoPayment}
                        disabled={isProcessing}
                        className="w-full"
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Processing Transaction...
                          </>
                        ) : (
                          <>
                            <Wallet className="w-4 h-4 mr-2" />
                            Pay with Crypto Wallet
                          </>
                        )}
                      </Button>

                      <div className="text-center">
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          Don't have USDC? Buy with card →
                        </button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Payment Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Escrow Protection</div>
                    <div className="text-sm text-slate-600">Funds held securely until work is approved</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Automatic Release</div>
                    <div className="text-sm text-slate-600">Payments released instantly when milestones approved</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Dispute Resolution</div>
                    <div className="text-sm text-slate-600">Built-in mediation for any issues</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}