import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Wallet, Shield, AlertTriangle, Trash2, Edit, History, ExternalLink } from "lucide-react";
import { formatCurrency } from "@shared/pricing";

interface PaymentAuthorization {
  id: string;
  contractId: string;
  contractTitle: string;
  paymentMethod: 'stripe' | 'usdc';
  maxPerMilestone: string;
  totalAuthorized: string;
  isActive: boolean;
  authorizedAt: string;
  expiresAt?: string;
  stripePaymentMethodId?: string;
  walletAddress?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuthorizationHistory {
  id: string;
  contractId: string;
  action: 'authorized' | 'revoked' | 'updated';
  timestamp: string;
  details: string;
}

export default function PaymentMethods() {
  const queryClient = useQueryClient();
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedAuthorization, setSelectedAuthorization] = useState<PaymentAuthorization | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const { data: authorizationsData, isLoading } = useQuery({
    queryKey: ['/api/payment-authorizations'],
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/payment-authorizations/history'],
  });

  const revokeAuthorizationMutation = useMutation({
    mutationFn: async (authorizationId: string) => {
      return apiRequest("POST", `/api/payment/revoke-authorization`, {
        authorizationId,
        reason: "Revoked by client"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-authorizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-authorizations/history'] });
      setRevokeDialogOpen(false);
      setSelectedAuthorization(null);
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const authorizations: PaymentAuthorization[] = authorizationsData?.authorizations || [];
  const history: AuthorizationHistory[] = historyData?.history || [];
  const activeAuthorizations = authorizations.filter(auth => auth.isActive);
  const expiredAuthorizations = authorizations.filter(auth => !auth.isActive);

  const getPaymentMethodIcon = (method: string) => {
    return method === 'stripe' ? 
      <CreditCard className="h-5 w-5 text-blue-600" /> : 
      <Wallet className="h-5 w-5 text-purple-600" />;
  };

  const formatPaymentMethodDisplay = (auth: PaymentAuthorization) => {
    if (auth.paymentMethod === 'stripe') {
      return "Visa •••• 4242";
    } else if (auth.paymentMethod === 'usdc') {
      return auth.walletAddress ? 
        `${auth.walletAddress.slice(0, 6)}...${auth.walletAddress.slice(-4)}` : 
        'USDC Wallet';
    }
    return auth.paymentMethod.toUpperCase();
  };

  const handleRevokeAuthorization = (auth: PaymentAuthorization) => {
    setSelectedAuthorization(auth);
    setRevokeDialogOpen(true);
  };

  const handleConfirmRevoke = () => {
    if (selectedAuthorization) {
      revokeAuthorizationMutation.mutate(selectedAuthorization.id);
    }
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Method Management</h1>
          <p className="text-gray-600 mt-1">Manage your authorized payment methods for all contracts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setHistoryDialogOpen(true)}>
            <History className="h-4 w-4 mr-2" />
            View History
          </Button>
          <Button asChild>
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </div>
      </div>

      {/* Active Authorizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Active Payment Authorizations ({activeAuthorizations.length})
          </CardTitle>
          <CardDescription>
            Payment methods currently authorized for milestone payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAuthorizations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active payment authorizations found.
            </div>
          ) : (
            <div className="space-y-4">
              {activeAuthorizations.map((auth) => (
                <Card key={auth.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPaymentMethodIcon(auth.paymentMethod)}
                        <div>
                          <div className="font-semibold">{auth.contractTitle}</div>
                          <div className="text-sm text-gray-600">
                            {formatPaymentMethodDisplay(auth)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="font-medium">Max per milestone: {formatCurrency(parseInt(auth.maxPerMilestone))}</div>
                          <div className="text-gray-600">Total: {formatCurrency(parseInt(auth.totalAuthorized))}</div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Active
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Expiration Warning */}
                    {auth.expiresAt && (isExpiringSoon(auth.expiresAt) || isExpired(auth.expiresAt)) && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {isExpired(auth.expiresAt) ? 
                            "This authorization has expired and needs to be renewed." :
                            `This authorization expires on ${new Date(auth.expiresAt).toLocaleDateString()}. Consider updating your payment method.`
                          }
                        </AlertDescription>
                      </Alert>
                    )}

                    <Separator className="my-3" />
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Authorized: {new Date(auth.authorizedAt).toLocaleDateString()} • 
                        IP: {auth.ipAddress?.slice(0, 12)}...
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/contracts/${auth.contractId}/update-payment`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Update
                          </a>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRevokeAuthorization(auth)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/dashboard/contracts/${auth.contractId}/milestones`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Contract
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired/Revoked Authorizations */}
      {expiredAuthorizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Expired/Revoked Authorizations ({expiredAuthorizations.length})
            </CardTitle>
            <CardDescription>
              Payment authorizations that are no longer active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiredAuthorizations.map((auth) => (
                <Card key={auth.id} className="border-l-4 border-l-orange-500 opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPaymentMethodIcon(auth.paymentMethod)}
                        <div>
                          <div className="font-semibold">{auth.contractTitle}</div>
                          <div className="text-sm text-gray-600">
                            {formatPaymentMethodDisplay(auth)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="font-medium">Was: {formatCurrency(parseInt(auth.maxPerMilestone))}</div>
                          <div className="text-gray-600">Total: {formatCurrency(parseInt(auth.totalAuthorized))}</div>
                        </div>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          Inactive
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/contracts/${auth.contractId}/authorize-payment`}>
                          Reauthorize Payment
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Payment Authorization</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the payment authorization for "{selectedAuthorization?.contractTitle}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will immediately prevent any future milestone payments. 
                Any pending auto-approvals will be paused. You can reauthorize payments later.
              </AlertDescription>
            </Alert>
            {selectedAuthorization && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm space-y-1">
                  <div><strong>Contract:</strong> {selectedAuthorization.contractTitle}</div>
                  <div><strong>Payment Method:</strong> {formatPaymentMethodDisplay(selectedAuthorization)}</div>
                  <div><strong>Authorized Amount:</strong> {formatCurrency(parseInt(selectedAuthorization.totalAuthorized))}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmRevoke}
              disabled={revokeAuthorizationMutation.isPending}
            >
              {revokeAuthorizationMutation.isPending ? "Revoking..." : "Revoke Authorization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Authorization History</DialogTitle>
            <DialogDescription>
              Complete log of all payment authorization activities
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {historyLoading ? (
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No authorization history found.
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                        <div className="font-medium">{item.contractId}</div>
                        <Badge variant={item.action === 'authorized' ? 'default' : 
                                      item.action === 'revoked' ? 'destructive' : 'outline'}>
                          {item.action.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.details}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}