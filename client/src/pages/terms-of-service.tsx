import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-slate-600">Effective Date: January 17, 2025</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-8">
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                <p className="text-slate-700 leading-relaxed">
                  By accessing or using SmartFlo ("we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). 
                  If you disagree with any part of these terms, you may not access the service.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
                <p className="text-slate-700 leading-relaxed">
                  SmartFlo is an automated freelance payment platform that facilitates milestone-based payments between freelancers and clients 
                  through AI-generated contracts and smart escrow protection.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-blue-700">3. Automated Payment Processing</h2>
                <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-blue-800">Payment Authorization</h3>
                  <p className="text-slate-700 leading-relaxed">
                    By using SmartFlo's payment services, clients authorize us to charge their selected payment method 
                    (credit card, debit card, ACH bank transfer, or USDC cryptocurrency) for milestone payments upon 
                    their explicit approval of completed work deliverables.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-blue-800">Milestone Approval Process</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-700">
                    <li>Freelancers submit completed milestone deliverables for review</li>
                    <li>Clients have 7 calendar days to review and approve/reject submissions</li>
                    <li>If no action is taken within 7 days, milestones are automatically approved</li>
                    <li>Upon approval (manual or automatic), payment is processed within 24 hours</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-blue-800">Authorization Revocation</h3>
                  <p className="text-slate-700 leading-relaxed">
                    You may revoke your payment authorization at any time by:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Accessing your account payment settings</li>
                    <li>Contacting support at support@getsmartflo.com</li>
                    <li>Clicking the "Manage Payment Settings" link in any payment email</li>
                  </ul>
                  <p className="text-sm text-slate-600 mt-2">
                    Note: Revoking authorization may result in contract termination and potential legal obligations for unpaid work.
                  </p>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-red-700">4. Dispute Resolution & Refund Policy</h2>
                <div className="bg-red-50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-red-800">48-Hour Dispute Window</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Clients have 48 hours from the time of payment processing to dispute any charge through SmartFlo's platform. 
                    Disputes filed after this window will be subject to traditional chargeback processes through your payment provider.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-red-800">Dispute Process</h3>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700">
                    <li>File dispute through your SmartFlo dashboard within 48 hours</li>
                    <li>Provide detailed explanation and supporting evidence</li>
                    <li>SmartFlo mediates between parties for 5 business days</li>
                    <li>If unresolved, funds are held in escrow pending external arbitration</li>
                  </ol>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-green-700">5. Platform Fees & Pricing</h2>
                <div className="bg-green-50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-green-800">SmartFlo Platform Fee: 1%</h3>
                  <p className="text-slate-700 leading-relaxed">
                    SmartFlo charges a 1% platform fee on all processed payments to cover:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>AI contract generation and legal review</li>
                    <li>Smart escrow protection and dispute mediation</li>
                    <li>Payment processing and fraud protection</li>
                    <li>24/7 customer support and platform maintenance</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-green-800">Additional Payment Processor Fees</h3>
                  <div className="space-y-2 text-slate-700">
                    <p><strong>Credit/Debit Cards:</strong> 2.9% + $0.30 per transaction (Stripe)</p>
                    <p><strong>ACH Bank Transfer:</strong> 0.8% (max $5.00) (Stripe)</p>
                    <p><strong>USDC Cryptocurrency:</strong> ~$0.50 network fee (Solana)</p>
                  </div>
                  
                  <p className="text-sm text-slate-600 mt-4">
                    All fees are clearly disclosed before payment authorization and included in total contract amounts.
                  </p>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. User Responsibilities</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Freelancers</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Deliver work according to agreed milestones and timelines</li>
                    <li>Provide accurate project descriptions and scope documentation</li>
                    <li>Respond to client feedback within reasonable timeframes</li>
                    <li>Maintain professional communication standards</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold">Clients</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Review and respond to milestone submissions within 7 days</li>
                    <li>Provide clear, actionable feedback for revisions</li>
                    <li>Maintain sufficient funds in authorized payment methods</li>
                    <li>Honor payment obligations for approved work</li>
                  </ul>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
                <p className="text-slate-700 leading-relaxed">
                  Work product and intellectual property rights are governed by the specific contract terms between freelancer and client. 
                  SmartFlo does not claim ownership of any work product created through the platform.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
                <p className="text-slate-700 leading-relaxed">
                  SmartFlo's liability is limited to the amount of platform fees paid. We are not responsible for disputes between 
                  freelancers and clients regarding work quality, delivery timelines, or contract interpretation beyond our mediation services.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
                <p className="text-slate-700 leading-relaxed">
                  Either party may terminate their SmartFlo account at any time. Active contracts and payment obligations remain in effect 
                  until completion or mutual termination agreement.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
                <p className="text-slate-700 leading-relaxed">
                  We reserve the right to modify these terms at any time. Users will be notified of significant changes via email 
                  and platform notifications. Continued use constitutes acceptance of modified terms.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
                <div className="text-slate-700 space-y-2">
                  <p><strong>SmartFlo Support:</strong> support@getsmartflo.com</p>
                  <p><strong>Legal Issues:</strong> legal@getsmartflo.com</p>
                  <p><strong>Payment Disputes:</strong> disputes@getsmartflo.com</p>
                </div>
              </section>

              <div className="mt-12 p-6 bg-slate-100 rounded-lg">
                <p className="text-sm text-slate-600 text-center">
                  By using SmartFlo, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}