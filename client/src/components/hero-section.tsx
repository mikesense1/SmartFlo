import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, Users } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative gradient-hero pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Get Paid Automatically<br />
            <span className="text-primary">When Work is Done</span>
          </h1>
          <p className="text-xl text-slate-600 mb-4 max-w-3xl mx-auto">
            AI Contracts + Smart Payments for Freelancers
          </p>
          <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
            Set milestones, get client approval, receive instant payments. No more chasing invoices or waiting 45 days to get paid.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold shadow-lg"
            >
              Start Getting Paid Faster
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-slate-300 text-slate-700 px-8 py-4 text-lg font-semibold hover:bg-white"
            >
              Watch Demo
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>2-minute setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>10,000+ freelancers</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero Visual/Dashboard Preview */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600" 
            alt="PayFlow dashboard interface showing milestone-based payments and contract management" 
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
