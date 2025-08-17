import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, Wallet, Shield, Clock, 
  AlertCircle, CheckCircle, ArrowRight
} from "lucide-react";

export default function PaymentAuthorization() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-700">Payment Authorization Agreement</CardTitle>
            <p className="text-slate-600">Milestone-Based Payment Terms & Authorization</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-8">
              
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Important:</strong> This agreement authorizes SmartFlo to charge your payment method only when you explicitly approve completed milestone deliverables. 
                  You maintain full control over when payments are processed.
                </AlertDescription>
              </Alert>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-green-700">Payment Authorization Declaration</h2>
                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                  <div className="space-y-4 text-lg">
                    <p className="font-semibold text-green-800">
                      ✓ I authorize SmartFlo to charge my selected payment method for milestone payments
                    </p>
                    <p className="font-semibold text-green-800">
                      ✓ Only upon my explicit approval of completed milestone deliverables
                    </p>
                    <p className="font-semibold text-green-800">
                      ✓ I understand I can revoke this authorization at any time
                    </p>
                    <p className="font-semibold text-green-800">
                      ✓ I acknowledge the 7-day auto-approval policy if I do not respond to milestone submissions
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">How Milestone Payments Work</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-blue-600">1</span>
                      </div>
                      <h3 className="font-semibold mb-2">Freelancer Submits</h3>
                      <p className="text-sm text-slate-600">Completed milestone deliverables are submitted for your review</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-yellow-600">2</span>
                      </div>
                      <h3 className="font-semibold mb-2">You Review & Approve</h3>
                      <p className="text-sm text-slate-600">7 days to approve, request changes, or auto-approve if no action</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-green-600">3</span>
                      </div>
                      <h3 className="font-semibold mb-2">Payment Processed</h3>
                      <p className="text-sm text-slate-600">Your payment method is charged within 24 hours of approval</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">Accepted Payment Methods</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="w-8 h-8 text-purple-600" />
                        <div>
                          <h3 className="font-semibold">Credit/Debit Cards</h3>
                          <p className="text-sm text-slate-500">Visa, Mastercard, American Express</p>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Fee:</strong> 2.9% + $0.30</p>
                        <p><strong>Processing:</strong> Instant</p>
                        <p><strong>Disputes:</strong> Chargeback protection</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="w-8 h-8 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">ACH Bank Transfer</h3>
                          <p className="text-sm text-slate-500">Direct from your bank account</p>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Fee:</strong> 0.8% (max $5.00)</p>
                        <p><strong>Processing:</strong> 3-5 business days</p>
                        <p><strong>Disputes:</strong> ACH return protection</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Wallet className="w-8 h-8 text-green-600" />
                        <div>
                          <h3 className="font-semibold">USDC Cryptocurrency</h3>
                          <p className="text-sm text-slate-500">Solana blockchain</p>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Fee:</strong> ~$0.50 network fee</p>
                        <p><strong>Processing:</strong> Instant</p>
                        <p><strong>Disputes:</strong> Smart contract escrow</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-orange-700">Auto-Approval Policy</h2>
                <div className="bg-orange-50 p-6 rounded-lg space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-6 h-6 text-orange-600 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-orange-800">7-Day Review Window</h3>
                      <p className="text-slate-700 leading-relaxed">
                        When a freelancer submits milestone deliverables, you have 7 calendar days to review and take action:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 mt-2">
                        <li><strong>Approve:</strong> Release payment immediately</li>
                        <li><strong>Request Changes:</strong> Provide feedback for revisions</li>
                        <li><strong>Dispute:</strong> Escalate to SmartFlo mediation</li>
                        <li><strong>No Action:</strong> Milestone automatically approved after 7 days</li>
                      </ul>
                    </div>
                  </div>
                  
                  <Alert className="border-orange-200 bg-orange-100">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Important:</strong> Auto-approval ensures freelancers are paid promptly for completed work. 
                      Please review submissions promptly to avoid automatic charges.
                    </AlertDescription>
                  </Alert>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-red-700">Platform Fees & Total Costs</h2>
                <div className="bg-red-50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-red-800">SmartFlo Platform Fee: 1%</h3>
                  <p className="text-slate-700 leading-relaxed">
                    All milestone payments include a 1% platform fee to cover AI contract generation, escrow protection, 
                    dispute mediation, and 24/7 support services.
                  </p>
                  
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-semibold mb-2">Example Calculation:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Milestone Amount:</span>
                        <span>$1,000.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Processor Fee (2.9%):</span>
                        <span>$29.30</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SmartFlo Platform Fee (1%):</span>
                        <span>$10.00</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total You Pay:</span>
                        <span>$1,039.30</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-blue-700">Authorization Revocation</h2>
                <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-blue-800">How to Cancel Payment Authorization</h3>
                  <p className="text-slate-700 leading-relaxed">
                    You may revoke your payment authorization at any time through any of these methods:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white border">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">⚙️</span>
                        </div>
                        <h4 className="font-semibold mb-2">Account Settings</h4>
                        <p className="text-sm text-slate-600">Access payment settings in your SmartFlo dashboard</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white border">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">📧</span>
                        </div>
                        <h4 className="font-semibold mb-2">Email Links</h4>
                        <p className="text-sm text-slate-600">Click "Manage Payment Settings" in any payment email</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white border">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-xl">💬</span>
                        </div>
                        <h4 className="font-semibold mb-2">Contact Support</h4>
                        <p className="text-sm text-slate-600">Email support@getsmartflo.com for immediate cancellation</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Contract Impact:</strong> Revoking payment authorization may result in contract termination and potential legal obligations for work already completed.
                    </AlertDescription>
                  </Alert>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">48-Hour Dispute Window</h3>
                  <p className="text-slate-700 leading-relaxed">
                    You have 48 hours from payment processing to file a dispute through SmartFlo's platform. 
                    Disputes include full refund protection and professional mediation.
                  </p>
                  
                  <h3 className="text-lg font-semibold">Dispute Process</h3>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700">
                    <li>File dispute in your SmartFlo dashboard within 48 hours</li>
                    <li>Provide detailed explanation and supporting evidence</li>
                    <li>SmartFlo mediates between parties for up to 5 business days</li>
                    <li>If unresolved, funds are held in escrow pending external arbitration</li>
                  </ol>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-semibold mb-4">Contact & Support</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">Payment Support</h3>
                      <p className="text-sm text-slate-600 mb-2">Questions about authorization, fees, or billing</p>
                      <p className="text-blue-600">payments@getsmartflo.com</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">Dispute Resolution</h3>
                      <p className="text-sm text-slate-600 mb-2">File disputes or escalate payment issues</p>
                      <p className="text-blue-600">disputes@getsmartflo.com</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <div className="mt-12 p-6 bg-green-100 rounded-lg border border-green-300">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">Ready to Authorize Payments?</h3>
                </div>
                <p className="text-green-700 mb-4">
                  By proceeding with contract creation, you agree to this Payment Authorization Agreement and authorize 
                  SmartFlo to process milestone payments according to the terms outlined above.
                </p>
                <div className="flex gap-3">
                  <Button className="bg-green-600 hover:bg-green-700">
                    I Accept & Authorize Payments
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="outline">
                    Download Agreement PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}