import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees, no long-term contracts.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
              <p className="text-slate-600 mb-4">Perfect for getting started</p>
              <div className="text-4xl font-bold text-slate-900 mb-2">$0</div>
              <p className="text-slate-500">Forever free</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">2 contracts per month</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">AI contract generation</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">Milestone-based payments</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">Basic escrow protection</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">Email support</span>
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <X className="w-5 h-5 text-slate-400" />
                <span className="text-slate-500">Advanced analytics</span>
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <X className="w-5 h-5 text-slate-400" />
                <span className="text-slate-500">Custom branding</span>
              </li>
            </ul>
            
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
              Start Free Trial
            </Button>
          </div>
          
          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-primary/5 to-violet-50 p-8 rounded-2xl border-2 border-primary/20 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-white">Most Popular</Badge>
            </div>
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
              <p className="text-slate-600 mb-4">For serious freelancers</p>
              <div className="text-4xl font-bold text-slate-900 mb-2">$29</div>
              <p className="text-slate-500">per month</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">Unlimited contracts</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">AI contract generation</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">Milestone-based payments</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">Premium escrow protection</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">Priority support</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">Advanced analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">Custom branding</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">White-label client portal</span>
              </li>
            </ul>
            
            <Button className="w-full bg-primary hover:bg-primary/90 text-white">
              Start 14-Day Trial
            </Button>
          </div>
        </div>
        
        {/* Transaction Fee Info */}
        <div className="text-center mt-12 p-6 bg-slate-50 rounded-xl max-w-2xl mx-auto">
          <p className="text-slate-600 mb-2">
            <strong>Simple pricing:</strong> Just 1% transaction fee on successful payments
          </p>
          <p className="text-sm text-slate-500">
            No setup fees, no monthly minimums, no hidden charges. You only pay when you get paid.
          </p>
        </div>
      </div>
    </section>
  );
}
