import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Coins, Loader2, Shield, AlertTriangle } from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface PaymentAuthorizationProps {
  contractId: string;
  totalAmount: number;
  largestMilestone: number;
  onAuthorized: () => void;
}

function StripeAuthorizationForm({ 
  contractId, 
  totalAmount, 
  largestMilestone, 
  onAuthorized 
}: PaymentAuthorizationProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !agreed) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/contracts/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Authorization Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Capture authorization details
        const response = await apiRequest("POST", "/api/contracts/authorize-payment", {
          contractId,
          paymentMethod: 'stripe',
          totalAmount,
          largestMilestone,
        });

        if (response.ok) {
          onAuthorized();
        } else {
          throw new Error('Failed to save authorization');
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to authorize payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Authorization Agreement
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          By authorizing this payment method, you agree to automated charges up to ${largestMilestone.toLocaleString()} 
          per milestone (Total: ${totalAmount.toLocaleString()}) only upon your explicit approval of completed work.
        </p>
        
        <div className="flex items-start space-x-2">
          <Checkbox
            id="stripe-agree"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(!!checked)}
          />
          <Label htmlFor="stripe-agree" className="text-sm leading-tight">
            I authorize SmartFlo to charge my payment method for approved milestone payments only. 
            I understand I can revoke this authorization at any time and that no charges will occur 
            without my milestone approval.
          </Label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || !elements || !agreed || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Authorizing Payment Method...
          </>
        ) : (
          "Authorize Payment Method"
        )}
      </Button>
    </form>
  );
}

function USDCAuthorizationForm({ 
  contractId, 
  totalAmount, 
  largestMilestone, 
  onAuthorized 
}: PaymentAuthorizationProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [agreed, setAgreed] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Check if Phantom wallet is installed
      if (!window.solana || !window.solana.isPhantom) {
        toast({
          title: "Phantom Wallet Required",
          description: "Please install Phantom wallet to authorize USDC payments",
          variant: "destructive",
        });
        return;
      }

      const response = await window.solana.connect();
      setWalletAddress(response.publicKey.toString());
      setWalletConnected(true);
      
      toast({
        title: "Wallet Connected",
        description: "Phantom wallet connected successfully",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const authorizeUSDCMutation = useMutation({
    mutationFn: async () => {
      if (!walletConnected || !window.solana) {
        throw new Error("Wallet not connected");
      }

      // Create authorization message
      const message = `Authorize SmartFlo payment for Contract ${contractId}\nTotal: ${totalAmount} USDC\nMax per milestone: ${largestMilestone} USDC\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);
      
      // Sign authorization message
      const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
      
      // Submit authorization
      const response = await apiRequest("POST", "/api/contracts/authorize-payment", {
        contractId,
        paymentMethod: 'usdc',
        totalAmount,
        largestMilestone,
        walletAddress,
        signature: Array.from(signedMessage.signature),
        message,
      });

      return response.json();
    },
    onSuccess: () => {
      onAuthorized();
      toast({
        title: "USDC Authorization Complete",
        description: "Your wallet has been authorized for milestone payments",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Authorization Failed",
        description: error.message || "Failed to authorize USDC payments",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      {!walletConnected ? (
        <div className="text-center py-8">
          <Coins className="h-12 w-12 mx-auto text-purple-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">Connect Phantom Wallet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Connect your Phantom wallet to authorize USDC payments
          </p>
          <Button 
            onClick={connectWallet} 
            disabled={isConnecting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              "Connect Phantom Wallet"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">Wallet Connected</h4>
            <p className="text-sm text-green-600 dark:text-green-300 font-mono">
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </p>
          </div>

          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              USDC Authorization Agreement
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              By signing this authorization, you allow SmartFlo to request USDC payments from your wallet 
              up to ${largestMilestone.toLocaleString()} per milestone (Total: ${totalAmount.toLocaleString()}) 
              only upon your explicit approval of completed work.
            </p>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Important:</strong> You will need to approve each transaction in your Phantom wallet. 
                  No automatic charges will occur.
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="usdc-agree"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(!!checked)}
              />
              <Label htmlFor="usdc-agree" className="text-sm leading-tight">
                I authorize SmartFlo to request USDC payments from my wallet for approved milestone 
                payments only. I understand each transaction requires my wallet approval and I can 
                revoke this authorization at any time.
              </Label>
            </div>
          </div>

          <Button
            onClick={() => authorizeUSDCMutation.mutate()}
            disabled={!agreed || authorizeUSDCMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {authorizeUSDCMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing Authorization...
              </>
            ) : (
              "Sign USDC Authorization"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PaymentAuthorization(props: PaymentAuthorizationProps) {
  const [selectedMethod, setSelectedMethod] = useState<"stripe" | "usdc">("stripe");
  const [setupIntent, setSetupIntent] = useState<string | null>(null);

  const createSetupIntentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/create-setup-intent", {
        contractId: props.contractId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSetupIntent(data.clientSecret);
    },
  });

  // Create setup intent when Stripe tab is selected
  const handleTabChange = (method: string) => {
    setSelectedMethod(method as "stripe" | "usdc");
    if (method === "stripe" && !setupIntent) {
      createSetupIntentMutation.mutate();
    }
  };

  return (
    <Tabs value={selectedMethod} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="stripe" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Credit/Debit Card
        </TabsTrigger>
        <TabsTrigger value="usdc" className="flex items-center gap-2">
          <Coins className="h-4 w-4" />
          USDC (Crypto)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stripe" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credit/Debit Card Authorization
            </CardTitle>
            <CardDescription>
              Securely authorize your card for milestone payments. No charges until you approve work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {setupIntent ? (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret: setupIntent,
                  appearance: {
                    theme: 'stripe',
                  },
                }}
              >
                <StripeAuthorizationForm {...props} />
              </Elements>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Setting up secure payment form...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="usdc" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              USDC Crypto Authorization
            </CardTitle>
            <CardDescription>
              Connect your Phantom wallet to authorize USDC payments for approved milestones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <USDCAuthorizationForm {...props} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Extend Window interface for Phantom wallet
declare global {
  interface Window {
    solana?: {
      isPhantom: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
    };
  }
}