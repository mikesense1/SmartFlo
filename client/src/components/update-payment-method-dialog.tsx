import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, CreditCard, Wallet, RefreshCw } from "lucide-react";
import { PaymentMethodCard } from "./payment-method-card";

interface PaymentMethod {
  id: string;
  type: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  walletAddress?: string;
  walletType?: string;
  isDefault: boolean;
  isActive: boolean;
  isExpiring: boolean;
  isExpired: boolean;
  contractCount: number;
}

interface UpdatePaymentMethodDialogProps {
  method: PaymentMethod;
  open: boolean;
  onClose: () => void;
}

export function UpdatePaymentMethodDialog({ method, open, onClose }: UpdatePaymentMethodDialogProps) {
  const [isDefault, setIsDefault] = useState(method.isDefault);
  const [requiresReauth, setRequiresReauth] = useState(false);
  const [password, setPassword] = useState("");
  const [newCardLast4, setNewCardLast4] = useState("");
  const [newExpMonth, setNewExpMonth] = useState("");
  const [newExpYear, setNewExpYear] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsDefault(method.isDefault);
    setRequiresReauth(false);
    setPassword("");
    setNewCardLast4("");
    setNewExpMonth("");
    setNewExpYear("");
  }, [method, open]);

  const updateMethodMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/payment-methods/${method.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({
        title: "Payment Method Updated",
        description: "Your payment method has been updated successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update payment method.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateCard = () => {
    // In a real implementation, this would integrate with Stripe to update the card
    // For demo purposes, we'll simulate updating the card
    setNewCardLast4("5555");
    setNewExpMonth("12");
    setNewExpYear("2027");
    setRequiresReauth(true);
    toast({
      title: "Demo Card Updated",
      description: "Demo card has been updated. Please re-authenticate to confirm.",
    });
  };

  const handleUpdateWallet = () => {
    // In a real implementation, this would connect to a new wallet
    toast({
      title: "Wallet Update",
      description: "Please connect your new wallet to update this payment method.",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (requiresReauth && !password) {
      toast({
        title: "Authentication Required",
        description: "Please enter your password to confirm the update.",
        variant: "destructive",
      });
      return;
    }

    const updates: any = { isDefault };

    // If we have card updates, include them
    if (newCardLast4 && newExpMonth && newExpYear) {
      updates.cardLast4 = newCardLast4;
      updates.cardExpMonth = newExpMonth;
      updates.cardExpYear = newExpYear;
    }

    updateMethodMutation.mutate(updates);
  };

  const isCardExpiring = method.isExpiring || method.isExpired;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Payment Method</DialogTitle>
          <DialogDescription>
            Modify your payment method settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Label>Current Payment Method</Label>
                <PaymentMethodCard method={method} />
                
                {method.contractCount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Used in {method.contractCount} active contract{method.contractCount > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {isCardExpiring && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {method.isExpired 
                  ? "This card has expired and needs to be updated to continue making payments."
                  : "This card will expire soon. Update it to avoid payment interruptions."
                }
              </AlertDescription>
            </Alert>
          )}

          {method.type === "stripe_card" && (
            <div className="space-y-3">
              <Label>Update Card Information</Label>
              {newCardLast4 ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      New card ending in {newCardLast4} ready to save
                    </span>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={handleUpdateCard}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Card Details (Demo)
                </Button>
              )}
            </div>
          )}

          {method.type === "crypto_wallet" && (
            <div className="space-y-3">
              <Label>Update Wallet</Label>
              <Button type="button" variant="outline" onClick={handleUpdateWallet}>
                <Wallet className="h-4 w-4 mr-2" />
                Connect New Wallet
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="update-default">Set as default payment method</Label>
            <Switch
              id="update-default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          {requiresReauth && (
            <div className="space-y-3">
              <Label htmlFor="password">Confirm with Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Authentication required to update payment method and active authorizations.
              </p>
            </div>
          )}

          {method.contractCount > 0 && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Updating this payment method will update all active payment authorizations. 
                Clients will receive a notification email about the change.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={updateMethodMutation.isPending || (requiresReauth && !password)}
            >
              {updateMethodMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Method"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}