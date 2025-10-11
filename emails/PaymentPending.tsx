import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PaymentPendingProps {
  clientName: string;
  contractTitle: string;
  milestoneTitle: string;
  amount: string;
  paymentMethod: string;
  contractId: string;
  milestoneId: string;
  chargeDate: string;
  timeRemaining: string;
}

export default function PaymentPending({
  clientName = "John Smith",
  contractTitle = "E-commerce Website Development",
  milestoneTitle = "Homepage Design & Development",
  amount = "$1,250.00",
  paymentMethod = "Credit Card ending in ****1234",
  contractId = "contract_123",
  milestoneId = "milestone_456",
  chargeDate = "January 18, 2025 at 2:00 PM EST",
  timeRemaining = "22 hours"
}: PaymentPendingProps) {
  const reviewUrl = `https://getsmartflo.com/contracts/${contractId}/milestones/${milestoneId}`;
  const settingsUrl = `https://getsmartflo.com/payment-settings?contract=${contractId}`;
  const disputeUrl = `https://getsmartflo.com/disputes/new?contract=${contractId}&milestone=${milestoneId}`;

  return (
    <Html>
      <Head />
      <Preview>Payment processing in 24 hours - {milestoneTitle} ({amount})</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://getsmartflo.com/logo.png"
              width="150"
              height="40"
              alt="SmartFlo"
              style={logo}
            />
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>⏰ Payment Processing in 24 Hours</Heading>
            
            <Text style={text}>Hi {clientName},</Text>
            
            <Text style={text}>
              This is a 24-hour notice that your approved milestone will be charged to your authorized payment method.
            </Text>

            {/* Payment Details Box */}
            <Section style={paymentBox}>
              <Heading style={h2}>Payment Details</Heading>
              <Text style={detail}>
                <strong>Contract:</strong> {contractTitle}
              </Text>
              <Text style={detail}>
                <strong>Milestone:</strong> {milestoneTitle}
              </Text>
              <Text style={detail}>
                <strong>Amount:</strong> <span style={amountStyle}>{amount}</span>
              </Text>
              <Text style={detail}>
                <strong>Payment Method:</strong> {paymentMethod}
              </Text>
              <Text style={detail}>
                <strong>Processing Date:</strong> {chargeDate}
              </Text>
              <Text style={detail}>
                <strong>Time Remaining:</strong> <span style={urgent}>{timeRemaining}</span>
              </Text>
            </Section>

            {/* Urgency Notice */}
            <Section style={urgencyBox}>
              <Heading style={h3}>🚨 Final Notice - Action Required</Heading>
              <Text style={urgencyText}>
                You have <strong>{timeRemaining}</strong> remaining to take action before this payment is automatically processed.
              </Text>
              <Text style={urgencyText}>
                <strong>Your options:</strong>
              </Text>
              <ul style={optionsList}>
                <li><strong>No Action Needed:</strong> Payment will process automatically as approved</li>
                <li><strong>Review Again:</strong> Take one final look at the deliverables</li>
                <li><strong>Request Changes:</strong> Ask for revisions before payment</li>
                <li><strong>File Dispute:</strong> Escalate to SmartFlo mediation</li>
                <li><strong>Cancel Authorization:</strong> Revoke payment authorization (may terminate contract)</li>
              </ul>
            </Section>

            {/* Fee Breakdown */}
            <Section style={feeBox}>
              <Heading style={h3}>💰 Charge Breakdown</Heading>
              <div style={feeBreakdown}>
                <Text style={feeItem}>
                  <span>Milestone Amount:</span>
                  <span>$1,000.00</span>
                </Text>
                <Text style={feeItem}>
                  <span>Payment Processor Fee (2.9%):</span>
                  <span>$29.00</span>
                </Text>
                <Text style={feeItem}>
                  <span>SmartFlo Platform Fee (1%):</span>
                  <span>$10.00</span>
                </Text>
                <Hr style={feeHr} />
                <Text style={feeTotal}>
                  <span><strong>Total Charge:</strong></span>
                  <span><strong>{amount}</strong></span>
                </Text>
              </div>
            </Section>

            {/* Action Buttons */}
            <Section style={buttonContainer}>
              <Button pX={20} pY={12} style={primaryButton} href={reviewUrl}>
                Review Milestone Again
              </Button>
              <Button pX={20} pY={12} style={warningButton} href={disputeUrl}>
                File Dispute
              </Button>
              <Button pX={20} pY={12} style={secondaryButton} href={settingsUrl}>
                Payment Settings
              </Button>
            </Section>

            <Hr style={hr} />

            {/* Important Reminders */}
            <Section>
              <Heading style={h3}>📋 Important Reminders</Heading>
              <Text style={text}>
                • <strong>48-Hour Dispute Window:</strong> You can dispute any charge within 48 hours after processing
                <br />
                • <strong>Refund Protection:</strong> All disputes include full refund protection during mediation
                <br />
                • <strong>Contact Support:</strong> Reach out anytime at support@getsmartflo.com
              </Text>
            </Section>

            {/* Auto-Processing Notice */}
            <Section style={autoProcessBox}>
              <Text style={autoProcessText}>
                <strong>Automatic Processing:</strong> This charge will be processed automatically at the scheduled time as part of your milestone-based payment agreement. 
                This is your final notification before processing.
              </Text>
            </Section>

            <Hr style={hr} />

            {/* Footer */}
            <Section style={footer}>
              <Text style={footerText}>
                <strong>Legal & Support Links:</strong>
              </Text>
              <Text style={footerText}>
                • <Link href="https://getsmartflo.com/payment-authorization" style={link}>
                  Payment Authorization Agreement
                </Link>
                <br />
                • <Link href="https://getsmartflo.com/terms-of-service" style={link}>
                  Terms of Service
                </Link> (7-day auto-approval policy)
                <br />
                • <Link href="https://getsmartflo.com/disputes" style={link}>
                  Dispute Resolution Process
                </Link>
              </Text>
              
              <Hr style={hr} />
              
              <Text style={footerText}>
                • <Link href={settingsUrl} style={link}>
                  Manage Payment Settings
                </Link>
                <br />
                • <Link href={`https://getsmartflo.com/unsubscribe?email=${encodeURIComponent(clientName)}`} style={link}>
                  Unsubscribe from SmartFlo emails
                </Link>
              </Text>
              
              <Text style={footerText}>
                Urgent questions? Contact us immediately at <Link href="mailto:support@getsmartflo.com" style={link}>support@getsmartflo.com</Link>
              </Text>
              
              <Text style={disclaimer}>
                SmartFlo - Automated Freelance Payment Platform<br />
                This is a legally required 24-hour notice before automatic payment processing.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const header = {
  padding: "32px 24px",
  backgroundColor: "#1f2937",
};

const logo = {
  margin: "0 auto",
  display: "block",
};

const content = {
  padding: "0 24px",
};

const h1 = {
  color: "#dc2626",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 0 20px",
  textAlign: "center" as const,
};

const h2 = {
  color: "#1f2937",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 10px",
};

const h3 = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "20px 0 10px",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const paymentBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detail = {
  color: "#92400e",
  fontSize: "16px",
  margin: "8px 0",
};

const amountStyle = {
  color: "#dc2626",
  fontWeight: "bold",
  fontSize: "18px",
};

const urgent = {
  color: "#dc2626",
  fontWeight: "bold",
};

const urgencyBox = {
  backgroundColor: "#fee2e2",
  border: "1px solid #dc2626",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const urgencyText = {
  color: "#991b1b",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "12px 0",
};

const optionsList = {
  color: "#991b1b",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "12px 0",
  paddingLeft: "20px",
};

const feeBox = {
  backgroundColor: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const feeBreakdown = {
  margin: "12px 0",
};

const feeItem = {
  display: "flex",
  justifyContent: "space-between",
  color: "#374151",
  fontSize: "14px",
  margin: "8px 0",
};

const feeHr = {
  borderColor: "#d1d5db",
  margin: "12px 0",
};

const feeTotal = {
  display: "flex",
  justifyContent: "space-between",
  color: "#1f2937",
  fontSize: "16px",
  margin: "8px 0",
};

const autoProcessBox = {
  backgroundColor: "#e5e7eb",
  border: "1px solid #9ca3af",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const autoProcessText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
  fontStyle: "italic",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const primaryButton = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  margin: "0 8px 8px 0",
};

const warningButton = {
  backgroundColor: "#dc2626",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  margin: "0 8px 8px 0",
};

const secondaryButton = {
  backgroundColor: "#6b7280",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  margin: "0 8px 8px 0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  margin: "32px 0 0",
};

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};

const disclaimer = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "16px 0 0",
  textAlign: "center" as const,
};