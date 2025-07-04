import { Button } from "@/components/ui/button";
import { CreditCard, Clock, Shield } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-20 gradient-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to Get Paid Faster?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of freelancers who've transformed their payment experience. Start your free trial today.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            size="lg"
            className="bg-white text-primary hover:bg-slate-50 px-8 py-4 text-lg font-semibold shadow-lg"
          >
            Start Getting Paid Faster
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
          >
            Schedule Demo
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-blue-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>Setup in 2 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span>14-day free trial</span>
          </div>
        </div>
      </div>
    </section>
  );
}
