import { Clock, Calendar, DollarSign, AlertCircle, FileText } from "lucide-react";

export default function PainPointsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Freelancing Shouldn't Mean Financial Stress
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Traditional freelance payments are broken. Here's what freelancers face every day:
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Stat 1 */}
          <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-4xl font-bold text-red-600 mb-2">71%</div>
            <p className="text-slate-700 font-medium">of freelancers face payment delays</p>
          </div>
          
          {/* Stat 2 */}
          <div className="text-center p-8 bg-amber-50 rounded-2xl border border-amber-100">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-amber-600" />
            </div>
            <div className="text-4xl font-bold text-amber-600 mb-2">45</div>
            <p className="text-slate-700 font-medium">average days to get paid</p>
          </div>
          
          {/* Stat 3 */}
          <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-4xl font-bold text-red-600 mb-2">$3.2K</div>
            <p className="text-slate-700 font-medium">average lost to late payments yearly</p>
          </div>
        </div>
        
        {/* Pain Point Stories */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-8 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Chasing Invoices</h3>
                <p className="text-slate-600">Spend hours following up on overdue payments instead of focusing on your craft and growing your business.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-8 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Contract Disputes</h3>
                <p className="text-slate-600">Unclear terms lead to scope creep, disputes, and unpaid work. Legal protection is expensive and complex.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
