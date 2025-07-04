import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SolutionSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-violet-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            The Future of Freelance Payments
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Automated milestone-based payments with AI-generated contracts. Get paid as soon as work is approved.
          </p>
        </div>
        
        {/* Solution Flow */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-white">1</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Set Milestones</h3>
            <p className="text-slate-600 mb-4">AI generates a professional contract with clear milestones and payment terms. Client deposits funds upfront.</p>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="text-sm text-slate-500 mb-2">Example Milestone</div>
              <div className="text-sm font-medium text-slate-900">Website Design Mockups</div>
              <div className="text-sm text-emerald-600 font-medium">$1,500 • Due: Nov 15</div>
            </div>
          </div>
          
          {/* Arrow */}
          <div className="hidden lg:flex items-center justify-center">
            <ArrowRight className="w-8 h-8 text-primary" />
          </div>
          
          {/* Step 2 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-white">2</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Client Approves</h3>
            <p className="text-slate-600 mb-4">Submit your work for milestone approval. Client reviews and approves with one click.</p>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Status</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending Review</Badge>
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Approve & Release Payment
              </Button>
            </div>
          </div>
          
          {/* Arrow */}
          <div className="hidden lg:flex items-center justify-center">
            <ArrowRight className="w-8 h-8 text-primary" />
          </div>
          
          {/* Step 3 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Instant Payment</h3>
            <p className="text-slate-600 mb-4">Funds release automatically to your account. No invoicing, no waiting, no chasing.</p>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Payment Received</span>
                <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>
              </div>
              <div className="text-lg font-bold text-emerald-600">+$1,500.00</div>
              <div className="text-xs text-slate-500">Deposited to your account</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
