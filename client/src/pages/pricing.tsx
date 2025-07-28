import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import { Check, Zap, Crown, Building } from "lucide-react";
import { Link } from "wouter";

const PRICING_PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "Forever",
    description: "Perfect for trying out SmartFlo with basic freelance projects",
    icon: Zap,
    features: [
      "2 contracts per month",
      "Basic milestone tracking",
      "Email notifications",
      "Standard contract templates",
      "7-day payment protection",
      "Community support"
    ],
    limitations: [
      "Limited AI contract generation",
      "Basic risk analysis",
      "Standard dispute resolution"
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    popular: false
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    originalPrice: "$348",
    annualPrice: "$290",
    description: "For active freelancers who want AI-powered contract protection",
    icon: Crown,
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
    ],
    limitations: [],
    buttonText: "Start Pro Trial",
    buttonVariant: "default" as const,
    popular: true
  },
  {
    name: "Business",
    price: "$79",
    period: "per month",
    originalPrice: "$948",
    annualPrice: "$790",
    description: "For agencies and teams managing multiple client relationships",
    icon: Building,
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
    ],
    limitations: [],
    buttonText: "Start Business Trial",
    buttonVariant: "outline" as const,
    popular: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "Contact us",
    description: "For large organizations with custom requirements",
    icon: Building,
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
    ],
    limitations: [],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    popular: false
  }
];

const TRANSACTION_FEES = [
  {
    method: "USDC (Crypto)",
    fee: "1.5%",
    cap: "$100 max",
    description: "Fast, secure blockchain payments with instant settlement"
  },
  {
    method: "ACH (Bank Transfer)",
    fee: "2%", 
    cap: "$200 max",
    description: "Direct bank transfers with 2-3 business day settlement"
  },
  {
    method: "Credit/Debit Cards",
    fee: "Stripe + 0.5%",
    cap: "No cap",
    description: "Instant payments via Stripe with industry-standard processing"
  }
];

const FAQ_ITEMS = [
  {
    question: "What are the transaction fees?",
    answer: "USDC: 1.5% (capped at $100), ACH: 2% (capped at $200), Cards: Stripe rates + 0.5%. Fees are automatically added to contract amounts and clearly displayed to clients."
  },
  {
    question: "How does annual billing work?",
    answer: "Annual plans get 2 months free! Pro costs $290/year (vs $348 monthly) and Business costs $790/year (vs $948 monthly). You can switch to annual billing anytime."
  },
  {
    question: "What happens if I exceed my contract limit?",
    answer: "Free plan: You'll be prompted to upgrade. Pro plan: You can purchase additional contracts at $5 each or upgrade to Business for unlimited contracts."
  },
  {
    question: "How do referrals work?",
    answer: "Refer friends and get 1 month free for each successful referral who becomes a paying customer. There's no limit to how many free months you can earn!"
  },
  {
    question: "Can I get volume discounts?",
    answer: "Business plan includes volume discounts on transaction fees. Enterprise customers can negotiate custom rates based on volume. High-volume freelancers should contact sales."
  },
  {
    question: "Is there a setup fee or long-term commitment?",
    answer: "No setup fees and no long-term contracts. You can upgrade, downgrade, or cancel anytime. The free tier remains free forever with 2 contracts per month."
  }
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Simple pricing that grows with you
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Start free and upgrade as your freelance business grows. No hidden fees, no surprises.
          </p>
        </div>

        {/* Annual Billing Toggle */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-slate-100 rounded-lg p-1">
            <button className="px-4 py-2 text-sm font-medium rounded-md bg-white text-slate-900 shadow-sm">
              Monthly
            </button>
            <button className="px-4 py-2 text-sm font-medium rounded-md text-slate-600 hover:text-slate-900">
              Annual (2 months free!)
            </button>
          </div>
        </div>

        {/* Transaction Fees Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Transaction Fees</h2>
            <p className="text-slate-600">Transparent fees automatically added to contract amounts</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRANSACTION_FEES.map((fee, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{fee.method}</h3>
                  <div className="text-2xl font-bold text-blue-600 mb-1">{fee.fee}</div>
                  <div className="text-sm text-slate-500 mb-3">{fee.cap}</div>
                  <p className="text-sm text-slate-600">{fee.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PRICING_PLANS.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 ml-2">{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <div className="text-sm text-slate-500 mb-2">
                      <span className="line-through">{plan.originalPrice}/year</span>
                      <span className="ml-2 text-green-600 font-medium">{plan.annualPrice}/year</span>
                    </div>
                  )}
                  <CardDescription className="text-base">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4 mb-8">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Included:</h4>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {plan.limitations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-500 mb-3">Limitations:</h4>
                        <ul className="space-y-2">
                          {plan.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0">•</span>
                              <span className="text-sm text-slate-500">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.buttonVariant}
                    size="lg"
                    asChild
                  >
                    <Link href="/dashboard">
                      {plan.buttonText}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Everything you need to know about SmartFlo pricing and features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FAQ_ITEMS.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to protect your freelance income?
              </h3>
              <p className="text-lg mb-6 text-blue-100">
                Join thousands of freelancers who never worry about getting paid again
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/dashboard">
                    Start Free Today
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" asChild>
                  <Link href="/create-contract">
                    Create Your First Contract
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}