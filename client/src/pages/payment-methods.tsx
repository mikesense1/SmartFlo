import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Building2, 
  Wallet, 
  Star, 
  MoreVertical, 
  Shield, 
  AlertTriangle, 
  Calendar,
  Plus,
  Trash2,
  Edit,
  Check,
  X
} from "lucide-react";
import { PaymentMethodCard } from "@/components/payment-method-card";
import { AddPaymentMethodDialog } from "@/components/add-payment-method-dialog";
import { UpdatePaymentMethodDialog } from "@/components/update-payment-method-dialog";

interface PaymentMethod {
  id: string;
  type: "stripe_card" | "stripe_ach" | "crypto_wallet";
  stripePaymentMethodId?: string;
  walletAddress?: string;
  walletType?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  bankLast4?: string;
  bankName?: string;
  isDefault: boolean;
  isActive: boolean;
  lastUsedAt?: string;
  expiryNotificationSent: boolean;
  createdAt: string;
  contractCount: number;
  contracts: Array<{
    contractTitle: string;
    contractId: string;
    totalAuthorized: string;
  }>;
  isExpiring: boolean;
  isExpired: boolean;
}

export default function PaymentMethodsPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paymentMethods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: expiringMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods/expiring"],
  });

  const updateMethodMutation = useMutation({
    mutationFn: (data: { id: string; updates: any }) =>
      apiRequest("PATCH", `/api/payment-methods/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({
        title: "Payment Method Updated",
        description: "Your payment method has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update payment method.",
        variant: "destructive",
      });
    },
  });

  const removeMethodMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/payment-methods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({
        title: "Payment Method Removed",
        description: "Your payment method has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Removal Failed",
        description: error.message || "Failed to remove payment method.",
        variant: "destructive",
      });
    },
  });

  const handleSetDefault = (method: PaymentMethod) => {
    updateMethodMutation.mutate({
      id: method.id,
      updates: { isDefault: true },
    });
  };

  const handleRemoveMethod = (method: PaymentMethod) => {
    if (method.contractCount > 0) {
      toast({
        title: "Cannot Remove",
        description: "This payment method is used in active contracts and cannot be removed.",
        variant: "destructive",
      });
      return;
    }

    removeMethodMutation.mutate(method.id);
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "stripe_card":
        return <CreditCard className="h-5 w-5" />;
      case "stripe_ach":
        return <Building2 className="h-5 w-5" />;
      case "crypto_wallet":
        return <Wallet className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (method: PaymentMethod) => {
    if (method.isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (method.isExpiring) {
      return <Badge variant="outline" className="border-orange-500 text-orange-700">Expiring Soon</Badge>;
    }
    if (!method.isActive) {
      return <Badge variant="secondary">Revoked</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-700">Active</Badge>;
  };

  const formatLastUsed = (date?: string) => {
    if (!date) return "Never used";
    return `Last used ${new Date(date).toLocaleDateString()}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasExpiringCards = expiringMethods.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground mt-1">
            Manage your saved payment methods and authorizations
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <AddPaymentMethodDialog onClose={() => setAddDialogOpen(false)} />
        </Dialog>
      </div>

      {hasExpiringCards && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {expiringMethods.length} payment method{expiringMethods.length > 1 ? "s" : ""} expiring within 30 days.
            Update them to avoid payment issues.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
            <p className="text-muted-foreground mb-4">
              Add your first payment method to start accepting payments
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.id} className={method.isDefault ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-muted rounded-lg">
                      {getMethodIcon(method.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <PaymentMethodCard method={method} />
                        {method.isDefault && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {getStatusBadge(method)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatLastUsed(method.lastUsedAt)}
                      </p>

                      {method.contracts.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">
                            Used in {method.contracts.length} contract{method.contracts.length > 1 ? "s" : ""}:
                          </p>
                          <div className="space-y-1">
                            {method.contracts.map((contract) => (
                              <div key={contract.contractId} className="flex justify-between text-sm text-muted-foreground">
                                <span>{contract.contractTitle}</span>
                                <span>${contract.totalAuthorized}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(method.isExpiring || method.isExpired) && (
                        <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <p className="text-sm text-orange-700">
                              {method.isExpired 
                                ? "This card has expired and needs to be updated" 
                                : `This card expires ${method.cardExpMonth}/${method.cardExpYear}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!method.isDefault && (
                        <DropdownMenuItem onClick={() => handleSetDefault(method)}>
                          <Star className="h-4 w-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedMethod(method);
                          setUpdateDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Update Method
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleRemoveMethod(method)}
                        className="text-destructive"
                        disabled={method.contractCount > 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Method
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedMethod && (
        <UpdatePaymentMethodDialog
          method={selectedMethod}
          open={updateDialogOpen}
          onClose={() => {
            setUpdateDialogOpen(false);
            setSelectedMethod(null);
          }}
        />
      )}
    </div>
  );
}