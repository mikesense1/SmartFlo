import React, { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction } from "@solana/web3.js";
import { AnchorProvider } from "@project-serum/anchor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  Shield, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  PaymentAuthService, 
  CreateAuthorizationParams, 
  PaymentAuthorization,
  formatUSDC
} from "@/lib/solana/payment-auth";

interface USDCAuthorizationProps {
  contractId: string;
  freelancerAddress: string;
  onAuthorizationComplete?: (authorization: PaymentAuthorization) => void;
  onAuthorizationRevoked?: () => void;
}

export default function USDCAuthorization({
  contractId,
  freelancerAddress,
  onAuthorizationComplete,
  onAuthorizationRevoked
}: USDCAuthorizationProps) {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const { toast } = useToast();

  const [paymentAuthService] = useState(() => new PaymentAuthService(connection));
  const [authorization, setAuthorization] = useState<PaymentAuthorization | null>(null);
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [usdcBalance, setUSDCBalance] = useState<number>(0);

  // Authorization form state
  const [maxPerMilestone, setMaxPerMilestone] = useState<string>('');
  const [totalAuthorized, setTotalAuthorized] = useState<string>('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      initializeService();
      loadExistingAuthorization();
      loadUSDCBalance();
    }
  }, [connected, publicKey, contractId]);

  const initializeService = async () => {
    if (!publicKey || !signTransaction) return;

    try {
      // Create a dummy wallet for AnchorProvider
      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: Transaction[]) => {
          return Promise.all(txs.map(tx => signTransaction(tx)));
        }
      };

      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: 'confirmed'
      });

      await paymentAuthService.initializeProgram(provider);
    } catch (error) {
      console.error('Error initializing payment auth service:', error);
    }
  };

  const loadExistingAuthorization = async () => {
    if (!publicKey) return;

    try {
      const existingAuth = await paymentAuthService.getPaymentAuthorization(publicKey, contractId);
      setAuthorization(existingAuth);
      
      if (existingAuth && onAuthorizationComplete) {
        onAuthorizationComplete(existingAuth);
      }

      // Start monitoring if authorization exists
      if (existingAuth && !monitoring) {
        startMonitoring();
      }
    } catch (error) {
      console.error('Error loading existing authorization:', error);
    }
  };

  const loadUSDCBalance = async () => {
    if (!publicKey) return;

    try {
      const balance = await paymentAuthService.getUSDCBalance(publicKey);
      setUSDCBalance(balance);
    } catch (error) {
      console.error('Error loading USDC balance:', error);
    }
  };

  const startMonitoring = async () => {
    if (!publicKey || monitoring) return;

    try {
      setMonitoring(true);
      await paymentAuthService.monitorAuthorization(
        publicKey,
        contractId,
        (updatedAuth) => {
          setAuthorization(updatedAuth);
          if (updatedAuth && onAuthorizationComplete) {
            onAuthorizationComplete(updatedAuth);
          }
        }
      );
    } catch (error) {
      console.error('Error starting authorization monitoring:', error);
      setMonitoring(false);
    }
  };

  const createAuthorization = async () => {
    if (!publicKey || !signTransaction) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Phantom wallet first",
        variant: "destructive"
      });
      return;
    }

    const params: CreateAuthorizationParams = {
      contractId,
      freelancerAddress,
      maxPerMilestone: parseFloat(maxPerMilestone),
      totalAuthorized: parseFloat(totalAuthorized)
    };

    // Validate parameters
    const validation = paymentAuthService.validateAuthorizationParams(params);
    if (!validation.valid) {
      toast({
        title: "Invalid Parameters",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    // Check if user has enough USDC
    if (usdcBalance < params.totalAuthorized) {
      toast({
        title: "Insufficient USDC",
        description: `You need ${params.totalAuthorized} USDC but only have ${usdcBalance}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create transaction
      const transaction = await paymentAuthService.createAuthorizationTransaction(publicKey, params);
      
      // Sign and send transaction
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      toast({
        title: "Authorization Created",
        description: `Successfully authorized ${params.totalAuthorized} USDC for payments`,
      });

      // Reload authorization data
      await loadExistingAuthorization();
      setShowForm(false);
      
      // Start monitoring
      if (!monitoring) {
        startMonitoring();
      }

    } catch (error: any) {
      console.error('Error creating authorization:', error);
      toast({
        title: "Authorization Failed",
        description: error.message || "Failed to create payment authorization",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeAuthorization = async () => {
    if (!publicKey || !signTransaction || !authorization) return;

    setLoading(true);

    try {
      const transaction = await paymentAuthService.revokeAuthorizationTransaction(publicKey, contractId);
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      await connection.confirmTransaction(signature, 'confirmed');

      toast({
        title: "Authorization Revoked",
        description: "Payment authorization has been successfully revoked",
      });

      setAuthorization(null);
      if (onAuthorizationRevoked) {
        onAuthorizationRevoked();
      }

    } catch (error: any) {
      console.error('Error revoking authorization:', error);
      toast({
        title: "Revocation Failed",
        description: error.message || "Failed to revoke authorization",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAuthorizationStatusColor = () => {
    if (!authorization) return 'gray';
    return authorization.isActive ? 'green' : 'red';
  };

  const getSpendingPercentage = () => {
    if (!authorization) return 0;
    const spent = authorization.totalSpent.toNumber() / 1_000_000;
    const total = authorization.totalAuthorized.toNumber() / 1_000_000;
    return total > 0 ? (spent / total) * 100 : 0;
  };

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            USDC Payment Authorization
          </CardTitle>
          <CardDescription>
            Connect your Phantom wallet to authorize USDC payments for this contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4 py-8">
            <Wallet className="w-16 h-16 text-gray-400" />
            <p className="text-gray-600 text-center">
              Connect your Phantom wallet to get started with USDC payments
            </p>
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-600" />
            Wallet Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Wallet Address</p>
              <p className="font-mono text-sm">{publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">USDC Balance</p>
              <p className="text-lg font-bold">{usdcBalance.toFixed(2)} USDC</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authorization Status */}
      {authorization ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className={`w-5 h-5 text-${getAuthorizationStatusColor()}-600`} />
              Payment Authorization Active
            </CardTitle>
            <CardDescription>
              Pre-authorized USDC payments for this freelance contract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Max Per Milestone</p>
                <p className="text-lg font-bold">{formatUSDC(authorization.maxPerMilestone)} USDC</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Authorized</p>
                <p className="text-lg font-bold">{formatUSDC(authorization.totalAuthorized)} USDC</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Spending Progress</span>
                <span>{formatUSDC(authorization.totalSpent)} / {formatUSDC(authorization.totalAuthorized)} USDC</span>
              </div>
              <Progress value={getSpendingPercentage()} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <Badge 
                className={`bg-${getAuthorizationStatusColor()}-100 text-${getAuthorizationStatusColor()}-800 border-${getAuthorizationStatusColor()}-200`}
              >
                {authorization.isActive ? 'Active' : 'Inactive'}
              </Badge>
              
              {authorization.isActive && (
                <Button 
                  variant="outline" 
                  onClick={revokeAuthorization}
                  disabled={loading}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Revoke Authorization
                </Button>
              )}
            </div>

            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Payments up to {formatUSDC(authorization.maxPerMilestone)} USDC can be processed automatically without additional signatures.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Create USDC Authorization
            </CardTitle>
            <CardDescription>
              Set up automatic USDC payments for milestone approvals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showForm ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Authorization Found</h3>
                  <p className="text-gray-600 mb-4">
                    Create a payment authorization to enable automatic USDC payments for milestones
                  </p>
                  <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Create Authorization
                  </Button>
                </div>

                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    One-time setup: Sign once to authorize automatic payments for all milestones in this contract.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxPerMilestone">Max Per Milestone (USDC)</Label>
                    <Input
                      id="maxPerMilestone"
                      type="number"
                      step="0.01"
                      min="0"
                      value={maxPerMilestone}
                      onChange={(e) => setMaxPerMilestone(e.target.value)}
                      placeholder="500.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalAuthorized">Total Authorized (USDC)</Label>
                    <Input
                      id="totalAuthorized"
                      type="number"
                      step="0.01"
                      min="0"
                      value={totalAuthorized}
                      onChange={(e) => setTotalAuthorized(e.target.value)}
                      placeholder="5000.00"
                    />
                  </div>
                </div>

                <Alert>
                  <Clock className="w-4 h-4" />
                  <AlertDescription>
                    Freelancer: {freelancerAddress.slice(0, 8)}...{freelancerAddress.slice(-8)}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button 
                    onClick={createAuthorization}
                    disabled={loading || !maxPerMilestone || !totalAuthorized}
                    className="flex-1"
                  >
                    {loading ? 'Creating...' : 'Sign & Authorize'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>USDC Payment Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <Zap className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-semibold">Instant Payments</h4>
              <p className="text-sm text-gray-600">Payments process automatically when milestones are approved</p>
            </div>
            <div className="text-center p-4">
              <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold">Secure & Transparent</h4>
              <p className="text-sm text-gray-600">All transactions recorded on Solana blockchain</p>
            </div>
            <div className="text-center p-4">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-semibold">Low Fees</h4>
              <p className="text-sm text-gray-600">Minimal transaction costs compared to traditional payments</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}