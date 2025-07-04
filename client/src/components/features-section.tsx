import { Brain, Shield, Zap, BarChart, Users, FileText, Check } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Contract Generation",
    description: "Get legally sound contracts in seconds. AI analyzes your project and generates custom terms, milestones, and payment schedules.",
    benefits: [
      "Industry-specific templates",
      "Legal compliance checking",
      "Automatic milestone creation"
    ],
    bgColor: "from-violet-50 to-purple-50",
    borderColor: "border-violet-100",
    iconColor: "bg-violet-600"
  },
  {
    icon: Shield,
    title: "Smart Escrow Protection",
    description: "Funds are secured in escrow until milestones are approved. Both parties are protected from fraud and disputes.",
    benefits: [
      "Blockchain-secured funds",
      "Automatic dispute resolution",
      "Insurance coverage"
    ],
    bgColor: "from-blue-50 to-cyan-50",
    borderColor: "border-blue-100",
    iconColor: "bg-blue-600"
  },
  {
    icon: Zap,
    title: "Instant Payments",
    description: "Get paid immediately when milestones are approved. Support for crypto and traditional banking worldwide.",
    benefits: [
      "Crypto & fiat payments",
      "Global bank transfers",
      "1% transaction fee"
    ],
    bgColor: "from-emerald-50 to-green-50",
    borderColor: "border-emerald-100",
    iconColor: "bg-emerald-600"
  },
  {
    icon: BarChart,
    title: "Project Analytics",
    description: "Track earnings, project progress, and client satisfaction. Make data-driven decisions about your freelance business.",
    benefits: [
      "Revenue tracking",
      "Time to payment metrics",
      "Client relationship insights"
    ],
    bgColor: "from-amber-50 to-orange-50",
    borderColor: "border-amber-100",
    iconColor: "bg-amber-600"
  },
  {
    icon: Users,
    title: "Client Portal",
    description: "Professional client experience with project updates, milestone approvals, and communication tools.",
    benefits: [
      "Real-time project tracking",
      "One-click approvals",
      "Integrated messaging"
    ],
    bgColor: "from-rose-50 to-pink-50",
    borderColor: "border-rose-100",
    iconColor: "bg-rose-600"
  },
  {
    icon: FileText,
    title: "Tax & Invoicing",
    description: "Automatic tax calculations, invoice generation, and financial reporting for easy bookkeeping.",
    benefits: [
      "Auto-generated invoices",
      "Tax calculation & reporting",
      "Expense tracking"
    ],
    bgColor: "from-indigo-50 to-blue-50",
    borderColor: "border-indigo-100",
    iconColor: "bg-indigo-600"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Everything You Need to Get Paid
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Professional tools designed specifically for modern freelancers
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index}
                className={`p-8 bg-gradient-to-br ${feature.bgColor} rounded-2xl border ${feature.borderColor}`}
              >
                <div className={`w-12 h-12 ${feature.iconColor} rounded-lg flex items-center justify-center mb-4`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 mb-4">{feature.description}</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
