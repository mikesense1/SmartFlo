import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wallet, Shield, Zap, CheckCircle, Clock, 
  ExternalLink, Copy, AlertTriangle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SolanaContractManager, formatSolanaAddress, formatUSDC } from "@/lib/solana";

interface BlockchainPaymentProps {
  contract: {
    id: string;
    title: string;
    totalValue: string;
    milestoneCount: number;
    clientName: string;
    status: string;
  };
  milestones: Array<{
    id: string;
    title: string;
    amount: string;
    status: string;
    dueDate: string;
  }>;
}

export default function BlockchainPayment({ contract, milestones }: BlockchainPaymentProps) {
  const { wallet, connected, publicKey } = useWallet();
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [contractAddress, setContractAddress] = useState<string>("");
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [activeStep, setActiveStep] = useState(1);

  const contractManager = wallet ? new SolanaContractManager(wallet) : null;

  const handleDeployContract = async () => {
    if (!contractManager || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Solana wallet first.",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    try {
      // Mock client public key for demo
      const clientPubkey = publicKey; // In real app, get from client
      
      const result = await contractManager.createContract(
        contract.id,
        parseFloat(contract.totalValue),
        contract.milestoneCount,
        clientPubkey
      );
      
      setContractAddress(result.contractAddress);
      setActiveStep(2);
      
      toast({
        title: "Contract Deployed!",
        description: "Your smart contract is now live on Solana blockchain.",
      });
    } catch (error: any) {
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy contract",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDepositFunds = async () => {
    if (!contractManager) return;

    try {
      const amount = parseFloat(contract.totalValue);
      await contractManager.depositFunds(contract.id, amount);
      
      setEscrowBalance(amount);
      setActiveStep(3);
      
      toast({
        title: "Funds Deposited",
        description: `$${amount.toLocaleString()} USDC secured in escrow.`,
      });
    } catch (error: any) {
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitMilestone = async (milestoneIndex: number) => {
    if (!contractManager) return;

    try {
      const proofUri = `https://payflow.dev/proof/${contract.id}-${milestoneIndex}`;
      await contractManager.submitMilestone(contract.id, milestoneIndex, proofUri);
      
      toast({
        title: "Milestone Submitted",
        description: "Waiting for client approval to release payment.",
      });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApproveMilestone = async (milestoneIndex: number) => {
    if (!contractManager || !publicKey) return;

    try {
      await contractManager.approveMilestone(contract.id, milestoneIndex, publicKey);
      
      const milestoneAmount = parseFloat(milestones[milestoneIndex]?.amount || "0");
      setEscrowBalance(prev => prev - milestoneAmount);
      
      toast({
        title: "Payment Released",
        description: `$${milestoneAmount.toLocaleString()} USDC sent to freelancer.`,
      });
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  const getStepStatus = (step: number) => {
    if (step < activeStep) return "completed";
    if (step === activeStep) return "active";
    return "pending";
  };

  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Solana Wallet Connection
          </CardTitle>
          <CardDescription>
            Connect your Solana wallet to deploy smart contracts and process payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connected ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {formatSolanaAddress(publicKey?.toString() || "")}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(publicKey?.toString() || "")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Not connected</span>
                </>
              )}
            </div>
            <WalletMultiButton />
          </div>
        </CardContent>
      </Card>

      {/* Smart Contract Deployment Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Smart Contract Deployment
          </CardTitle>
          <CardDescription>
            Deploy your contract to Solana blockchain for secure escrow payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Contract Deployment Progress</span>
              <span>{Math.round((activeStep / 4) * 100)}% Complete</span>
            </div>
            <Progress value={(activeStep / 4) * 100} className="h-2" />
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {/* Step 1: Deploy Contract */}
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                getStepStatus(1) === "completed" ? "bg-green-100 text-green-800" :
                getStepStatus(1) === "active" ? "bg-blue-100 text-blue-800" :
                "bg-gray-100 text-gray-500"
              }`}>
                {getStepStatus(1) === "completed" ? <CheckCircle className="w-4 h-4" /> : "1"}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Deploy Smart Contract</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Create the escrow contract on Solana blockchain
                </p>
                {activeStep === 1 && (
                  <Button 
                    onClick={handleDeployContract} 
                    disabled={!connected || isDeploying}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isDeploying ? "Deploying..." : "Deploy Contract"}
                  </Button>
                )}
                {contractAddress && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">Contract Address:</Badge>
                    <span className="text-sm font-mono">{formatSolanaAddress(contractAddress)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(contractAddress)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Fund Escrow */}
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                getStepStatus(2) === "completed" ? "bg-green-100 text-green-800" :
                getStepStatus(2) === "active" ? "bg-blue-100 text-blue-800" :
                "bg-gray-100 text-gray-500"
              }`}>
                {getStepStatus(2) === "completed" ? <CheckCircle className="w-4 h-4" /> : "2"}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Fund Escrow Account</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Client deposits ${parseFloat(contract.totalValue).toLocaleString()} USDC to escrow
                </p>
                {activeStep === 2 && (
                  <Button 
                    onClick={handleDepositFunds}
                    disabled={!connected}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Deposit ${parseFloat(contract.totalValue).toLocaleString()} USDC
                  </Button>
                )}
                {escrowBalance > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-green-100 text-green-800">
                      Escrow Balance: ${escrowBalance.toLocaleString()} USDC
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Milestone Execution */}
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                getStepStatus(3) === "completed" ? "bg-green-100 text-green-800" :
                getStepStatus(3) === "active" ? "bg-blue-100 text-blue-800" :
                "bg-gray-100 text-gray-500"
              }`}>
                {getStepStatus(3) === "completed" ? <CheckCircle className="w-4 h-4" /> : "3"}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Execute Milestones</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Submit work and get automatic payments upon approval
                </p>
                {activeStep >= 3 && (
                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium text-sm">{milestone.title}</div>
                          <div className="text-xs text-muted-foreground">
                            ${parseFloat(milestone.amount).toLocaleString()} • Due: {milestone.dueDate}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSubmitMilestone(index)}
                          >
                            Submit Work
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveMilestone(index)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve & Pay
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Contract Complete */}
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-slate-50">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                getStepStatus(4) === "completed" ? "bg-green-100 text-green-800" :
                "bg-gray-100 text-gray-500"
              }`}>
                {getStepStatus(4) === "completed" ? <CheckCircle className="w-4 h-4" /> : "4"}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Contract Completed</h4>
                <p className="text-sm text-muted-foreground">
                  All milestones approved and payments released automatically
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Blockchain Security Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Escrow Protection</h4>
                <p className="text-xs text-muted-foreground">
                  Funds secured in smart contract until work is approved
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Instant Payments</h4>
                <p className="text-xs text-muted-foreground">
                  Automatic USDC transfer upon milestone approval
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Transparent</h4>
                <p className="text-xs text-muted-foreground">
                  All transactions visible on Solana blockchain
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning for Demo */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This is a demonstration of blockchain integration. In production, ensure you're using the correct network and have proper wallet security measures in place.
        </AlertDescription>
      </Alert>
    </div>
  );
}