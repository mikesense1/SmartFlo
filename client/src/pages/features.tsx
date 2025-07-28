import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import { 
  Brain, Shield, Zap, CreditCard, Globe, Users, 
  CheckCircle, FileText, TrendingUp, Clock, 
  AlertTriangle, Smartphone, Lock, BarChart3
} from "lucide-react";
import { Link } from "wouter";

const FEATURE_CATEGORIES = [
  {
    title: "AI-Powered Contract Generation",
    description: "Let artificial intelligence create professional contracts tailored to your specific project needs",
    icon: Brain,
    color: "blue",
    features: [
      {
        name: "Smart Contract Templates",
        description: "AI analyzes your project type and automatically selects the best contract structure",
        icon: FileText
      },
      {
        name: "Risk Analysis & Protection",
        description: "Advanced AI identifies potential risks and suggests protective clauses",
        icon: Shield
      },
      {
        name: "Custom Clause Generation",
        description: "Generate specific terms based on your industry and project requirements",
        icon: Brain
      },
      {
        name: "Legal Language Optimization",
        description: "AI ensures your contracts use proper legal language while remaining clear",
        icon: CheckCircle
      }
    ]
  },
  {
    title: "Smart Payment Management",
    description: "Flexible payment options with automatic escrow and milestone-based releases",
    icon: CreditCard,
    color: "green",
    features: [
      {
        name: "Dual Payment Methods",
        description: "Accept both traditional payments (Stripe) and crypto payments (USDC)",
        icon: CreditCard
      },
      {
        name: "Automatic Escrow",
        description: "Funds are held securely until milestones are completed and approved",
        icon: Lock
      },
      {
        name: "Milestone-Based Releases",
        description: "Get paid automatically when clients approve your completed work",
        icon: Zap
      },
      {
        name: "Instant Crypto Settlements",
        description: "USDC payments settle instantly with minimal fees (~$0.50)",
        icon: Globe
      }
    ]
  },
  {
    title: "Project & Client Management",
    description: "Comprehensive tools to manage your freelance business efficiently",
    icon: Users,
    color: "purple",
    features: [
      {
        name: "Client Dashboard",
        description: "Give clients a professional portal to track project progress",
        icon: BarChart3
      },
      {
        name: "Milestone Tracking",
        description: "Visual progress tracking with automated status updates",
        icon: TrendingUp
      },
      {
        name: "Automated Notifications",
        description: "Keep everyone informed with smart email and in-app notifications",
        icon: AlertTriangle
      },
      {
        name: "Mobile-Friendly Interface",
        description: "Manage your contracts and payments from any device",
        icon: Smartphone
      }
    ]
  }
];

const BENEFITS = [
  {
    title: "Never Chase Payments Again",
    description: "Automatic payment release when milestones are approved eliminates payment delays and awkward follow-ups",
    icon: Clock,
    color: "bg-green-100 text-green-600"
  },
  {
    title: "Professional Client Experience",
    description: "Clients get a polished, trustworthy experience that builds confidence in your services",
    icon: Users,
    color: "bg-blue-100 text-blue-600"
  },
  {
    title: "Legal Protection Built-In",
    description: "AI-generated contracts include protective clauses that shield you from common freelancer pitfalls",
    icon: Shield,
    color: "bg-purple-100 text-purple-600"
  },
  {
    title: "Scale Your Business",
    description: "Streamlined processes let you focus on delivering great work instead of managing payments",
    icon: TrendingUp,
    color: "bg-amber-100 text-amber-600"
  }
];

const STATS = [
  { number: "95%", label: "Payment Success Rate", description: "Freelancers get paid on time" },
  { number: "3 Days", label: "Average Payment Time", description: "From approval to your account" },
  { number: "87%", label: "Client Satisfaction", description: "Clients prefer milestone-based projects" },
  { number: "$2.3M+", label: "Protected Earnings", description: "Total payments processed safely" }
];

export default function Features() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            Platform Features
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Everything you need to freelance with confidence
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            SmartFlo combines AI-powered contract generation with smart payment automation to protect your freelance income and streamline your business.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {STATS.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="font-medium text-slate-900 mb-1">{stat.label}</div>
                <div className="text-sm text-slate-500">{stat.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Categories */}
        <div className="space-y-16 mb-16">
          {FEATURE_CATEGORIES.map((category, categoryIndex) => {
            const IconComponent = category.icon;
            return (
              <div key={categoryIndex} className={categoryIndex % 2 === 1 ? "md:flex-row-reverse" : ""}>
                <div className="text-center mb-12">
                  <div className={`w-16 h-16 mx-auto mb-6 bg-${category.color}-100 rounded-full flex items-center justify-center`}>
                    <IconComponent className={`w-8 h-8 text-${category.color}-600`} />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">{category.title}</h2>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto">{category.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.features.map((feature, featureIndex) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <Card key={featureIndex} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-${category.color}-100 rounded-lg flex items-center justify-center`}>
                              <FeatureIcon className={`w-5 h-5 text-${category.color}-600`} />
                            </div>
                            <CardTitle className="text-lg">{feature.name}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-base">
                            {feature.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Why freelancers choose SmartFlo
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Join thousands of freelancers who have transformed their business with our platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {BENEFITS.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${benefit.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                      <p className="text-slate-600">{benefit.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Integration Section */}
        <Card className="mb-16">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Seamless Integrations
              </h2>
              <p className="text-lg text-slate-600">
                SmartFlo works with the tools and platforms you already use
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <CreditCard className="w-8 h-8 text-purple-600" />
                </div>
                <span className="font-medium">Stripe</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Globe className="w-8 h-8 text-green-600" />
                </div>
                <span className="font-medium">Solana</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
                <span className="font-medium">OpenAI</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                  <Zap className="w-8 h-8 text-amber-600" />
                </div>
                <span className="font-medium">Webhooks</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to experience the future of freelancing?
              </h3>
              <p className="text-lg mb-6 text-blue-100">
                Create your first AI-powered contract in under 5 minutes
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/create-contract">
                    Create Your First Contract
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" asChild>
                  <Link href="/pricing">
                    View Pricing
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