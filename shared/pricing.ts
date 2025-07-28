// Pricing configuration and fee calculation utilities

export interface PricingPlan {
  id: string;
  name: string;
  price: number; // Monthly price in cents
  annualPrice?: number; // Annual price in cents (with discount)
  contractLimit: number | null; // null means unlimited
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    contractLimit: 2,
    features: [
      "2 contracts per month",
      "Basic milestone tracking",
      "Email notifications",
      "Standard contract templates",
      "7-day payment protection",
      "Community support"
    ]
  },
  {
    id: "pro",
    name: "Pro", 
    price: 2900, // $29.00
    annualPrice: 29000, // $290.00 (2 months free)
    contractLimit: 10,
    features: [
      "10 contracts per month",
      "Full AI contract generation",
      "Advanced risk analysis",
      "Smart milestone suggestions",
      "Priority email support",
      "All payment methods (USDC, ACH, Cards)",
      "Auto payment release",
      "Advanced dispute resolution",
      "Client payment tracking",
      "Custom contract templates"
    ]
  },
  {
    id: "business",
    name: "Business",
    price: 7900, // $79.00
    annualPrice: 79000, // $790.00 (2 months free)
    contractLimit: null, // unlimited
    features: [
      "Unlimited contracts",
      "Everything in Pro",
      "Team collaboration tools",
      "Client management dashboard",
      "White-label contracts",
      "API access",
      "Advanced analytics",
      "Priority phone support",
      "Custom integrations",
      "Bulk contract creation",
      "Advanced reporting",
      "Volume discount rates"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0, // Custom pricing
    contractLimit: null,
    features: [
      "Everything in Business",
      "Custom contract limits",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantees",
      "On-premise deployment options",
      "Custom training",
      "Negotiable transaction rates",
      "Priority feature requests",
      "Custom compliance support"
    ]
  }
];

export type PaymentMethod = "usdc" | "ach" | "card";

export interface TransactionFeeConfig {
  method: PaymentMethod;
  feePercentage: number; // as decimal (e.g., 0.015 for 1.5%)
  feeCap?: number; // in cents, undefined means no cap
  baseStripeFee?: number; // for card payments, in cents
  stripePercentage?: number; // for card payments, as decimal
}

export const TRANSACTION_FEE_CONFIG: Record<PaymentMethod, TransactionFeeConfig> = {
  usdc: {
    method: "usdc",
    feePercentage: 0.015, // 1.5%
    feeCap: 10000 // $100 cap
  },
  ach: {
    method: "ach", 
    feePercentage: 0.02, // 2%
    feeCap: 20000 // $200 cap
  },
  card: {
    method: "card",
    feePercentage: 0.005, // 0.5% additional
    baseStripeFee: 30, // $0.30
    stripePercentage: 0.035 // 3.5% (updated from 2.9%)
    // No cap for card payments
  }
};

/**
 * Calculate transaction fee for a given amount and payment method
 * @param amountCents - Contract amount in cents
 * @param paymentMethod - Payment method used
 * @returns Fee amount in cents
 */
export function calculateTransactionFee(
  amountCents: number, 
  paymentMethod: PaymentMethod
): number {
  const config = TRANSACTION_FEE_CONFIG[paymentMethod];
  
  if (!config) {
    throw new Error(`Unsupported payment method: ${paymentMethod}`);
  }

  let fee = 0;

  if (paymentMethod === "card") {
    // Card fees: Stripe fee + our additional fee
    const stripeFee = (amountCents * (config.stripePercentage || 0)) + (config.baseStripeFee || 0);
    const additionalFee = amountCents * config.feePercentage;
    fee = stripeFee + additionalFee;
  } else {
    // USDC and ACH: percentage with cap
    fee = amountCents * config.feePercentage;
    
    if (config.feeCap && fee > config.feeCap) {
      fee = config.feeCap;
    }
  }

  return Math.round(fee);
}

/**
 * Calculate total amount including transaction fee
 * @param contractAmountCents - Base contract amount in cents
 * @param paymentMethod - Payment method used
 * @returns Object with breakdown of amounts
 */
export function calculateTotalWithFees(
  contractAmountCents: number,
  paymentMethod: PaymentMethod
) {
  const transactionFee = calculateTransactionFee(contractAmountCents, paymentMethod);
  const totalAmount = contractAmountCents + transactionFee;
  
  return {
    contractAmount: contractAmountCents,
    transactionFee,
    totalAmount,
    feePercentage: (transactionFee / contractAmountCents) * 100
  };
}

/**
 * Format amount in cents to dollar string
 * @param cents - Amount in cents
 * @returns Formatted dollar amount (e.g., "$12.34")
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
}

/**
 * Get display name for payment method
 * @param method - Payment method
 * @returns Human-readable payment method name
 */
export function getPaymentMethodName(method: PaymentMethod): string {
  const names = {
    usdc: "USDC (Crypto)",
    ach: "ACH (Bank Transfer)", 
    card: "Credit/Debit Card"
  };
  return names[method] || method;
}