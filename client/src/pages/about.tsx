import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import { 
  Target, Users, Heart, Lightbulb, 
  Shield, Zap, Globe, Award,
  CheckCircle, TrendingUp
} from "lucide-react";
import { Link } from "wouter";

const TEAM_VALUES = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We're on a mission to eliminate payment delays and disputes that hurt freelancers worldwide"
  },
  {
    icon: Users,
    title: "Freelancer-First",
    description: "Every feature is designed with the freelancer's success and peace of mind as the top priority"
  },
  {
    icon: Heart,
    title: "Community-Focused",
    description: "We believe in building tools that strengthen the global freelance community"
  },
  {
    icon: Lightbulb,
    title: "Innovation-Led",
    description: "We use cutting-edge AI and blockchain technology to solve real-world freelancing problems"
  }
];

const STORY_MILESTONES = [
  {
    year: "2024",
    title: "The Problem Discovered",
    description: "After surveying 1,000+ freelancers, we found that 73% had experienced payment delays, and 45% had clients who never paid at all."
  },
  {
    year: "2024",
    title: "AI + Blockchain Solution",
    description: "We realized that combining AI-powered contract generation with blockchain escrow could solve both contract quality and payment security issues."
  },
  {
    year: "2024",
    title: "SmartFlo Launch",
    description: "Launched SmartFlo to help freelancers create professional contracts and get paid automatically through smart milestone systems."
  },
  {
    year: "2025",
    title: "Growing Community",
    description: "Thousands of freelancers now use SmartFlo to protect their income and streamline their client relationships."
  }
];

const ACHIEVEMENTS = [
  {
    icon: Users,
    number: "10,000+",
    label: "Active Freelancers",
    description: "Trust SmartFlo with their contracts"
  },
  {
    icon: Shield,
    number: "$2.3M+",
    label: "Protected Earnings",
    description: "Safely processed through our platform"
  },
  {
    icon: CheckCircle,
    number: "95%",
    label: "Payment Success Rate",
    description: "Freelancers get paid on time"
  },
  {
    icon: TrendingUp,
    number: "4.8/5",
    label: "User Satisfaction",
    description: "Average rating from our users"
  }
];

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            About SmartFlo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Empowering freelancers to focus on what they do best
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            We're building the future of freelance work—where getting paid is automatic, contracts are intelligent, and disputes are a thing of the past.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-xl text-blue-100 max-w-4xl mx-auto">
              To eliminate the financial uncertainty that freelancers face by providing AI-powered contracts and automated payment systems that ensure every freelancer gets paid fairly and on time.
            </p>
          </CardContent>
        </Card>

        {/* The Problem We're Solving */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              The Problem We're Solving
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Freelancing should be about doing great work, not chasing payments or worrying about disputes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-red-500 mb-2">73%</div>
                <div className="font-medium text-slate-900 mb-2">Payment Delays</div>
                <p className="text-sm text-slate-600">
                  of freelancers experience late payments from clients
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-amber-500 mb-2">45%</div>
                <div className="font-medium text-slate-900 mb-2">Non-Payment</div>
                <p className="text-sm text-slate-600">
                  have had clients who never paid at all
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-purple-500 mb-2">60%</div>
                <div className="font-medium text-slate-900 mb-2">Scope Creep</div>
                <p className="text-sm text-slate-600">
                  deal with unplanned work additions without extra pay
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              What Drives Us
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our core values guide every decision we make and every feature we build
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TEAM_VALUES.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{value.title}</h3>
                      <p className="text-slate-600">{value.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Our Story */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Our Story
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From identifying a critical problem to building the solution that freelancers deserve
            </p>
          </div>
          
          <div className="space-y-8">
            {STORY_MILESTONES.map((milestone, index) => (
              <div key={index} className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{milestone.year}</span>
                  </div>
                </div>
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle className="text-xl">{milestone.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{milestone.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Impact We've Made
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Real results for real freelancers in our growing community
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {ACHIEVEMENTS.map((achievement, index) => {
              const IconComponent = achievement.icon;
              return (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-2">{achievement.number}</div>
                    <div className="font-medium text-slate-700 mb-1">{achievement.label}</div>
                    <div className="text-sm text-slate-500">{achievement.description}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Technology Section */}
        <Card className="mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Cutting-Edge Technology</CardTitle>
            <CardDescription className="text-lg">
              We use the latest technology to solve age-old freelancing problems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">AI-Powered Contracts</h3>
                <p className="text-sm text-slate-600">
                  Advanced language models analyze your project and generate legally sound contracts with protective clauses
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Blockchain Escrow</h3>
                <p className="text-sm text-slate-600">
                  Smart contracts on Solana provide tamper-proof escrow that automatically releases payments
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Smart Automation</h3>
                <p className="text-sm text-slate-600">
                  Intelligent workflows handle payments, notifications, and milestone tracking automatically
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to join the freelance revolution?
              </h3>
              <p className="text-lg mb-6 text-green-100">
                Be part of a community that's changing how freelancers work and get paid
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/create-contract">
                    Get Started Today
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600" asChild>
                  <Link href="/features">
                    Explore Features
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