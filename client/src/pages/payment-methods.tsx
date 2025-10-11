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

interface PaymentAuthorization {
  id: string;
  contractId: string;
  contractTitle: string;
  contractStatus: string;
  paymentMethod: "stripe" | "usdc";
  maxPerMilestone: string;
  totalAuthorized: string;
  authorizedAt: string;
  isActive: boolean;
  revokedAt?: string;
  milestoneCount: number;
  completedMilestones: number;
}

export default function PaymentMethodsPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [selectedAuth, setSelectedAuth] = useState<PaymentAuthorization | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paymentMethods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: expiringMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods/expiring"],
  });

  const { data: authorizationsData, isLoading: authLoading } = useQuery<{ authorizations: PaymentAuthorization[] }>({
    queryKey: ["/api/payment/authorizations"],
  });

  const authorizations = authorizationsData?.authorizations || [];

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

  const revokeAuthorizationMutation = useMutation({
    mutationFn: (data: { authorizationId: string; reason: string }) =>
      apiRequest("POST", "/api/payment/revoke-authorization", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment/authorizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({
        title: "Authorization Revoked",
        description: "Payment authorization has been revoked successfully.",
      });
      setRevokeConfirmOpen(false);
      setSelectedAuth(null);
    },
    onError: (error: any) => {
      toast({
        title: "Revocation Failed",
        description: error.message || "Failed to revoke authorization.",
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
  const activeAuthorizations = authorizations.filter(auth => auth.isActive);
  const revokedAuthorizations = authorizations.filter(auth => !auth.isActive);

  const handleRevokeAuthorization = () => {
    if (!selectedAuth) return;
    revokeAuthorizationMutation.mutate({
      authorizationId: selectedAuth.id,
      reason: "Revoked by client via payment methods dashboard"
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Methods & Authorizations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your saved payment methods and active contract authorizations
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

      {/* Active Authorizations Section */}
      {!authLoading && activeAuthorizations.length > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Active Payment Authorizations
            </CardTitle>
            <CardDescription>
              You have {activeAuthorizations.length} active authorization{activeAuthorizations.length > 1 ? "s" : ""} for milestone-based payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeAuthorizations.map((auth) => (
              <div key={auth.id} className="p-4 bg-white rounded-lg border border-blue-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{auth.contractTitle}</h4>
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Payment Method:</span>
                        <div className="font-medium mt-1">
                          {auth.paymentMethod === 'stripe' ? (
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Card/Bank Payment
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4" />
                              USDC Wallet
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Authorized:</span>
                        <div className="font-medium mt-1">${parseFloat(auth.totalAuthorized).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Per Milestone:</span>
                        <div className="font-medium mt-1">${parseFloat(auth.maxPerMilestone).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Milestones:</span>
                        <div className="font-medium mt-1">{auth.completedMilestones}/{auth.milestoneCount} completed</div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Authorized on {new Date(auth.authorizedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      setSelectedAuth(auth);
                      setRevokeConfirmOpen(true);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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

      {/* Revoke Authorization Confirmation Dialog */}
      <Dialog open={revokeConfirmOpen} onOpenChange={setRevokeConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Revoke Payment Authorization?
            </DialogTitle>
            <DialogDescription>
              This will revoke your payment authorization for the contract. You will need to re-authorize if you want to resume work.
            </DialogDescription>
          </DialogHeader>

          {selectedAuth && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium mb-2">{selectedAuth.contractTitle}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Total Authorized: ${parseFloat(selectedAuth.totalAuthorized).toLocaleString()}</div>
                  <div>Milestones: {selectedAuth.completedMilestones}/{selectedAuth.milestoneCount} completed</div>
                </div>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Warning:</strong> Revoking this authorization will:
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Prevent automatic milestone payments</li>
                    <li>Pause work on this contract</li>
                    <li>Require you to set up a new payment method to resume</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRevokeConfirmOpen(false);
                    setSelectedAuth(null);
                  }}
                  disabled={revokeAuthorizationMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRevokeAuthorization}
                  disabled={revokeAuthorizationMutation.isPending}
                >
                  {revokeAuthorizationMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Revoking...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Revoke Authorization
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}