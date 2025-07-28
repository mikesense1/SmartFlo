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

export type PaymentMethod = "usdc" | "stripe_ach" | "stripe_card";

export interface TransactionFeeConfig {
  method: PaymentMethod;
  feePercentage: number; // as decimal (e.g., 0.015 for 1.5%)
  feeCap?: number; // in cents, undefined means no cap
  baseStripeFee?: number; // for stripe payments, in cents
  stripePercentage?: number; // for stripe payments, as decimal
  smartfloFee: number; // SmartFlo additional fee as decimal
}

export const TRANSACTION_FEE_CONFIG: Record<PaymentMethod, TransactionFeeConfig> = {
  usdc: {
    method: "usdc",
    feePercentage: 0.015, // 1.5%
    feeCap: 10000, // $100 cap
    smartfloFee: 0 // No additional fee for USDC
  },
  stripe_ach: {
    method: "stripe_ach", 
    feePercentage: 0.008, // 0.8% Stripe ACH fee
    feeCap: 500, // $5.00 cap per Stripe
    baseStripeFee: 0, // No fixed fee for ACH
    stripePercentage: 0.008, // 0.8% Stripe ACH
    smartfloFee: 0.005 // 0.5% SmartFlo fee
  },
  stripe_card: {
    method: "stripe_card",
    feePercentage: 0.029, // 2.9% Stripe card fee
    baseStripeFee: 30, // $0.30 Stripe fixed fee
    stripePercentage: 0.029, // 2.9% Stripe card fee
    smartfloFee: 0.005 // 0.5% SmartFlo fee
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

  if (paymentMethod === "stripe_card") {
    // Stripe Card fees: Stripe percentage + fixed fee + SmartFlo fee
    const stripeFee = (amountCents * (config.stripePercentage || 0)) + (config.baseStripeFee || 0);
    const smartfloFee = amountCents * config.smartfloFee;
    fee = stripeFee + smartfloFee;
  } else if (paymentMethod === "stripe_ach") {
    // Stripe ACH fees: Stripe percentage (with cap) + SmartFlo fee
    const stripeAchFee = Math.min(amountCents * (config.stripePercentage || 0), config.feeCap || Infinity);
    const smartfloFee = amountCents * config.smartfloFee;
    fee = stripeAchFee + smartfloFee;
  } else {
    // USDC: percentage with cap, no SmartFlo fee
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
    stripe_ach: "ACH Bank Transfer", 
    stripe_card: "Credit/Debit Card"
  };
  return names[method] || method;
}

/**
 * Get fee breakdown details for display
 * @param method - Payment method
 * @param amountCents - Amount in cents
 * @returns Fee breakdown object
 */
export function getFeeBreakdown(method: PaymentMethod, amountCents: number) {
  const config = TRANSACTION_FEE_CONFIG[method];
  const calculation = calculateTotalWithFees(amountCents, method);
  
  if (method === "stripe_card") {
    const stripeFee = (amountCents * (config.stripePercentage || 0)) + (config.baseStripeFee || 0);
    const smartfloFee = amountCents * config.smartfloFee;
    
    return {
      stripeFee,
      smartfloFee,
      totalFee: calculation.transactionFee,
      stripeRate: `${((config.stripePercentage || 0) * 100).toFixed(1)}%`,
      smartfloRate: `${(config.smartfloFee * 100).toFixed(1)}%`,
      fixedFee: config.baseStripeFee || 0
    };
  } else if (method === "stripe_ach") {
    const stripeAchFee = Math.min(amountCents * (config.stripePercentage || 0), config.feeCap || Infinity);
    const smartfloFee = amountCents * config.smartfloFee;
    
    return {
      stripeFee: stripeAchFee,
      smartfloFee,
      totalFee: calculation.transactionFee,
      stripeRate: `${((config.stripePercentage || 0) * 100).toFixed(1)}%`,
      smartfloRate: `${(config.smartfloFee * 100).toFixed(1)}%`,
      feeCap: config.feeCap
    };
  } else {
    return {
      totalFee: calculation.transactionFee,
      rate: `${(config.feePercentage * 100).toFixed(1)}%`,
      feeCap: config.feeCap
    };
  }
}