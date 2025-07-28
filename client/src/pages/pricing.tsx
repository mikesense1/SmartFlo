import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import { Check, Zap, Crown, Building } from "lucide-react";
import { Link } from "wouter";

const PRICING_PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "Forever Free",
    description: "Perfect for trying out SmartFlo with basic freelance projects",
    icon: Zap,
    features: [
      "Up to 3 contracts per month",
      "Basic milestone tracking",
      "Email notifications",
      "Standard contract templates",
      "7-day payment protection",
      "Community support"
    ],
    limitations: [
      "No AI contract generation",
      "No risk analysis",
      "Basic dispute resolution"
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    popular: false
  },
  {
    name: "Professional",
    price: "$29",
    period: "per month",
    description: "For active freelancers who want AI-powered contract protection",
    icon: Crown,
    features: [
      "Unlimited contracts",
      "AI contract generation",
      "Advanced risk analysis",
      "Smart milestone suggestions",
      "Priority email support",
      "Stripe + Crypto payments",
      "Auto payment release",
      "Advanced dispute resolution",
      "Client payment tracking",
      "Custom contract templates"
    ],
    limitations: [],
    buttonText: "Start Professional Trial",
    buttonVariant: "default" as const,
    popular: true
  },
  {
    name: "Agency",
    price: "$99",
    period: "per month",
    description: "For agencies managing multiple freelancers and client relationships",
    icon: Building,
    features: [
      "Everything in Professional",
      "Team collaboration tools",
      "Client management dashboard",
      "White-label contracts",
      "API access",
      "Advanced analytics",
      "Priority phone support",
      "Custom integrations",
      "Bulk contract creation",
      "Advanced reporting"
    ],
    limitations: [],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    popular: false
  }
];

const FAQ_ITEMS = [
  {
    question: "How does the payment processing work?",
    answer: "SmartFlo supports both traditional payments via Stripe (credit cards, bank transfers) and crypto payments via USDC on Solana. All payments are held in secure escrow until milestones are approved."
  },
  {
    question: "What happens if a client disputes a milestone?",
    answer: "Our dispute resolution system includes automated evidence collection, AI-powered assessment, and human mediation when needed. Most disputes are resolved within 3-5 business days."
  },
  {
    question: "Can I use my own contract templates?",
    answer: "Yes! Professional and Agency plans allow custom contract templates. Our AI can also enhance your existing templates with protective clauses and risk analysis."
  },
  {
    question: "Is there a setup fee or long-term commitment?",
    answer: "No setup fees and no long-term contracts. You can upgrade, downgrade, or cancel anytime. The free tier remains free forever."
  },
  {
    question: "How secure are the crypto payments?",
    answer: "Crypto payments use audited smart contracts on Solana with multi-signature security. Funds are held in escrow until both parties confirm milestone completion."
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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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