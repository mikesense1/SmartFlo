import { Badge } from "@/components/ui/badge";
import { CreditCard, Building2, Wallet } from "lucide-react";

interface PaymentMethodCardProps {
  method: {
    type: string;
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: string;
    cardExpYear?: string;
    bankLast4?: string;
    bankName?: string;
    walletAddress?: string;
    walletType?: string;
  };
  showExpiry?: boolean;
}

export function PaymentMethodCard({ method, showExpiry = true }: PaymentMethodCardProps) {
  const formatCardBrand = (brand?: string) => {
    if (!brand) return "Card";
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const formatWalletAddress = (address?: string) => {
    if (!address) return "Wallet";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  switch (method.type) {
    case "stripe_card":
      return (
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4" />
          <span className="font-medium">
            {formatCardBrand(method.cardBrand)} •••• {method.cardLast4}
          </span>
          {showExpiry && method.cardExpMonth && method.cardExpYear && (
            <span className="text-muted-foreground">
              (Expires {method.cardExpMonth}/{method.cardExpYear})
            </span>
          )}
        </div>
      );

    case "stripe_ach":
      return (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4" />
          <span className="font-medium">
            {method.bankName || "Bank"} •••• {method.bankLast4}
          </span>
          <Badge variant="outline" className="text-xs">ACH</Badge>
        </div>
      );

    case "crypto_wallet":
      return (
        <div className="flex items-center space-x-2">
          <Wallet className="h-4 w-4" />
          <span className="font-medium">
            {method.walletType || "Wallet"}: {formatWalletAddress(method.walletAddress)}
          </span>
          <Badge variant="outline" className="text-xs">USDC</Badge>
        </div>
      );

    default:
      return (
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4" />
          <span className="font-medium">Payment Method</span>
        </div>
      );
  }
}