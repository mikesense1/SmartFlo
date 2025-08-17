import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Building2, Wallet, Shield } from "lucide-react";

interface AddPaymentMethodDialogProps {
  onClose: () => void;
}

export function AddPaymentMethodDialog({ onClose }: AddPaymentMethodDialogProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [isDefault, setIsDefault] = useState(false);
  const [stripePaymentMethodId, setStripePaymentMethodId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletType, setWalletType] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addMethodMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payment-methods", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({
        title: "Payment Method Added",
        description: "Your payment method has been added successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Payment Method",
        description: error.message || "An error occurred while adding your payment method.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) {
      toast({
        title: "Selection Required",
        description: "Please select a payment method type.",
        variant: "destructive",
      });
      return;
    }

    const baseData = {
      type: selectedType,
      isDefault,
    };

    let methodData = baseData;

    switch (selectedType) {
      case "stripe_card":
        if (!stripePaymentMethodId) {
          toast({
            title: "Card Required",
            description: "Please add a credit card.",
            variant: "destructive",
          });
          return;
        }
        methodData = {
          ...baseData,
          stripePaymentMethodId,
        };
        break;

      case "crypto_wallet":
        if (!walletAddress) {
          toast({
            title: "Wallet Required",
            description: "Please connect a crypto wallet.",
            variant: "destructive",
          });
          return;
        }
        methodData = {
          ...baseData,
          walletAddress,
          walletType: walletType || "phantom",
        };
        break;

      case "stripe_ach":
        methodData = {
          ...baseData,
          // ACH setup would require additional Stripe integration
        };
        break;
    }

    addMethodMutation.mutate(methodData);
  };

  const handleStripeCardSetup = () => {
    // In a real implementation, this would integrate with Stripe Elements
    // For demo purposes, we'll simulate adding a card
    setStripePaymentMethodId("pm_demo_card_visa_4242");
    toast({
      title: "Demo Card Added",
      description: "Demo Visa •••• 4242 has been added for testing.",
    });
  };

  const handleWalletConnect = () => {
    // In a real implementation, this would connect to Phantom/Solflare
    // For demo purposes, we'll simulate connecting a wallet
    setWalletAddress("7xKX9nR4mP3cQ8vY6tL1sE9fN4cW7aZ5qM8uJ3rT6vH3nD");
    setWalletType("phantom");
    toast({
      title: "Demo Wallet Connected",
      description: "Demo Phantom wallet has been connected for testing.",
    });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogDescription>
          Choose how you'd like to pay for your contracts
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label>Payment Method Type</Label>
          
          <Card 
            className={`cursor-pointer transition-all ${selectedType === "stripe_card" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setSelectedType("stripe_card")}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5" />
                <div>
                  <h4 className="font-medium">Credit/Debit Card</h4>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${selectedType === "stripe_ach" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setSelectedType("stripe_ach")}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5" />
                <div>
                  <h4 className="font-medium">Bank Transfer (ACH)</h4>
                  <p className="text-sm text-muted-foreground">Direct bank account transfer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${selectedType === "crypto_wallet" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setSelectedType("crypto_wallet")}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Wallet className="h-5 w-5" />
                <div>
                  <h4 className="font-medium">Crypto Wallet</h4>
                  <p className="text-sm text-muted-foreground">USDC payments via Solana</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedType === "stripe_card" && (
          <div className="space-y-3">
            <Label>Credit Card Details</Label>
            {stripePaymentMethodId ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Demo Visa •••• 4242 added</span>
                </div>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={handleStripeCardSetup}>
                <CreditCard className="h-4 w-4 mr-2" />
                Add Credit Card (Demo)
              </Button>
            )}
          </div>
        )}

        {selectedType === "crypto_wallet" && (
          <div className="space-y-3">
            <Label>Crypto Wallet</Label>
            {walletAddress ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Phantom wallet connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button type="button" variant="outline" onClick={handleWalletConnect}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Phantom Wallet (Demo)
                </Button>
                <div className="text-sm text-muted-foreground">
                  Or select wallet type:
                </div>
                <Select value={walletType} onValueChange={setWalletType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select wallet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phantom">Phantom</SelectItem>
                    <SelectItem value="solflare">Solflare</SelectItem>
                    <SelectItem value="torus">Torus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {selectedType === "stripe_ach" && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              ACH bank transfer setup will be available in the next version. 
              Please use a credit card or crypto wallet for now.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="default-method">Set as default payment method</Label>
          <Switch
            id="default-method"
            checked={isDefault}
            onCheckedChange={setIsDefault}
          />
        </div>

        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={addMethodMutation.isPending || !selectedType || 
              (selectedType === "stripe_card" && !stripePaymentMethodId) ||
              (selectedType === "crypto_wallet" && !walletAddress) ||
              (selectedType === "stripe_ach")
            }
          >
            {addMethodMutation.isPending ? "Adding..." : "Add Payment Method"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}