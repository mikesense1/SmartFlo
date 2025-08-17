import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-slate-600">Effective Date: January 17, 2025</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-8">
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Name, email address, and contact information</li>
                    <li>Professional profile details and work history</li>
                    <li>Tax identification numbers for payment processing</li>
                    <li>Government-issued ID for identity verification (when required)</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Contract and Project Data</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Project descriptions, scopes of work, and deliverables</li>
                    <li>Contract terms, milestones, and payment schedules</li>
                    <li>Communication between freelancers and clients</li>
                    <li>File uploads and project documentation</li>
                  </ul>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-blue-700">2. Payment Data Collection & Processing</h2>
                <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-blue-800">Financial Information</h3>
                  <p className="text-slate-700 leading-relaxed">
                    SmartFlo collects and processes payment information necessary for milestone-based payments:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li><strong>Credit/Debit Cards:</strong> Tokenized card data via Stripe (we never store full card numbers)</li>
                    <li><strong>Bank Accounts:</strong> Account and routing numbers for ACH transfers (encrypted)</li>
                    <li><strong>Cryptocurrency:</strong> Wallet addresses for USDC payments on Solana blockchain</li>
                    <li><strong>Transaction History:</strong> Payment amounts, dates, and milestone associations</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-blue-800">Payment Processor Partners</h3>
                  <div className="space-y-2 text-slate-700">
                    <p><strong>Stripe Inc.</strong> - Credit card, debit card, and ACH bank transfer processing</p>
                    <p><strong>Solana Blockchain</strong> - USDC cryptocurrency payments and smart contract escrow</p>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-blue-800">Data Security Standards</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>PCI DSS Level 1 compliance for card data</li>
                    <li>End-to-end encryption for all financial data</li>
                    <li>Multi-factor authentication for account access</li>
                    <li>Regular security audits and vulnerability assessments</li>
                  </ul>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Platform Operations</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Process milestone payments and manage escrow accounts</li>
                    <li>Generate AI-powered contracts and legal documentation</li>
                    <li>Facilitate communication between freelancers and clients</li>
                    <li>Provide customer support and dispute resolution</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Legal and Compliance</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Comply with anti-money laundering (AML) regulations</li>
                    <li>Verify user identity and prevent fraud</li>
                    <li>Generate tax forms (1099s) for payment reporting</li>
                    <li>Respond to legal requests and court orders</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Service Improvement</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Analyze platform usage to enhance features</li>
                    <li>Improve AI contract generation algorithms</li>
                    <li>Optimize payment processing and dispute resolution</li>
                    <li>Personalize user experience and recommendations</li>
                  </ul>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">With Your Consent</h3>
                  <p className="text-slate-700 leading-relaxed">
                    We share contract and project information between freelancers and clients as necessary for project completion.
                  </p>

                  <h3 className="text-lg font-semibold">Service Providers</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Payment processors (Stripe, Solana) for transaction processing</li>
                    <li>Cloud hosting providers (Vercel, Neon) for data storage</li>
                    <li>AI services (OpenAI) for contract generation</li>
                    <li>Email service providers (Resend) for notifications</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Legal Requirements</h3>
                  <p className="text-slate-700 leading-relaxed">
                    We may disclose information when required by law, court order, or to protect our rights and the safety of our users.
                  </p>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Active Accounts</h3>
                  <p className="text-slate-700 leading-relaxed">
                    We retain account and contract data for as long as your account remains active or as needed to provide services.
                  </p>

                  <h3 className="text-lg font-semibold">Closed Accounts</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Financial data: 7 years (tax and legal compliance)</li>
                    <li>Contract documents: 7 years (legal protection)</li>
                    <li>Personal profile data: 30 days after account closure</li>
                    <li>Communication logs: 1 year (dispute resolution)</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Blockchain Records</h3>
                  <p className="text-slate-700 leading-relaxed">
                    USDC transactions on Solana blockchain are permanently recorded and cannot be deleted due to the immutable nature of blockchain technology.
                  </p>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Your Privacy Rights</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Access and Portability</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Request copies of your personal data</li>
                    <li>Export contract and payment history</li>
                    <li>Download AI-generated contract documents</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Correction and Deletion</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Update personal and payment information</li>
                    <li>Request deletion of non-essential data</li>
                    <li>Correct errors in contract or profile information</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Communication Preferences</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Opt out of marketing communications</li>
                    <li>Customize payment notification settings</li>
                    <li>Manage dispute and milestone alert preferences</li>
                  </ul>

                  <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Certain financial and contract data cannot be deleted due to legal and tax compliance requirements.
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Essential Cookies</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Authentication and session management</li>
                    <li>Security and fraud prevention</li>
                    <li>Payment processing and form completion</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Analytics Cookies</h3>
                  <p className="text-slate-700 leading-relaxed">
                    We use analytics to understand how users interact with our platform to improve services. You can opt out through your browser settings.
                  </p>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
                <p className="text-slate-700 leading-relaxed">
                  SmartFlo is hosted in the United States. By using our service, you consent to the transfer of your information to the US, 
                  which may have different data protection laws than your country. We implement appropriate safeguards to protect your data.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
                <p className="text-slate-700 leading-relaxed">
                  SmartFlo is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from children.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Changes to Privacy Policy</h2>
                <p className="text-slate-700 leading-relaxed">
                  We may update this privacy policy to reflect changes in our practices or legal requirements. 
                  Significant changes will be communicated via email and platform notifications.
                </p>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
                <div className="text-slate-700 space-y-2">
                  <p><strong>Privacy Officer:</strong> privacy@getsmartflo.com</p>
                  <p><strong>Data Protection:</strong> dpo@getsmartflo.com</p>
                  <p><strong>General Support:</strong> support@getsmartflo.com</p>
                  <p><strong>Mailing Address:</strong> SmartFlo Privacy Department, [Address to be added]</p>
                </div>
              </section>

              <div className="mt-12 p-6 bg-slate-100 rounded-lg">
                <p className="text-sm text-slate-600 text-center">
                  This privacy policy governs your use of SmartFlo. By using our service, you consent to the collection and use of your information as described in this policy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}