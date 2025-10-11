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

interface PaymentProcessedProps {
  clientName: string;
  contractTitle: string;
  milestoneTitle: string;
  amount: string;
  paymentMethod: string;
  transactionId: string;
  processedDate: string;
  contractId: string;
  milestoneId: string;
}

export default function PaymentProcessed({
  clientName = "John Smith",
  contractTitle = "E-commerce Website Development",
  milestoneTitle = "Homepage Design & Development",
  amount = "$1,250.00",
  paymentMethod = "Credit Card ending in ****1234",
  transactionId = "txn_1234567890",
  processedDate = "January 18, 2025 at 2:15 PM EST",
  contractId = "contract_123",
  milestoneId = "milestone_456"
}: PaymentProcessedProps) {
  const receiptUrl = `https://getsmartflo.com/receipts/${transactionId}`;
  const disputeUrl = `https://getsmartflo.com/disputes/new?contract=${contractId}&milestone=${milestoneId}&transaction=${transactionId}`;
  const contractUrl = `https://getsmartflo.com/contracts/${contractId}`;
  const settingsUrl = `https://getsmartflo.com/payment-settings?contract=${contractId}`;

  return (
    <Html>
      <Head />
      <Preview>Payment processed: {milestoneTitle} - {amount} charged</Preview>
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
            <Heading style={h1}>✅ Payment Successfully Processed</Heading>
            
            <Text style={text}>Hi {clientName},</Text>
            
            <Text style={text}>
              Your milestone payment has been successfully processed. Here are your transaction details:
            </Text>

            {/* Receipt Box */}
            <Section style={receiptBox}>
              <Heading style={h2}>Payment Receipt</Heading>
              <Text style={detail}>
                <strong>Contract:</strong> {contractTitle}
              </Text>
              <Text style={detail}>
                <strong>Milestone:</strong> {milestoneTitle}
              </Text>
              <Text style={detail}>
                <strong>Amount Charged:</strong> <span style={amountStyle}>{amount}</span>
              </Text>
              <Text style={detail}>
                <strong>Payment Method:</strong> {paymentMethod}
              </Text>
              <Text style={detail}>
                <strong>Transaction ID:</strong> {transactionId}
              </Text>
              <Text style={detail}>
                <strong>Processed Date:</strong> {processedDate}
              </Text>
              <Text style={detail}>
                <strong>Status:</strong> <span style={statusCompleted}>Completed</span>
              </Text>
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
                  <span><strong>Total Charged:</strong></span>
                  <span><strong>{amount}</strong></span>
                </Text>
              </div>
              <Text style={feeNote}>
                Freelancer receives: $1,000.00 (milestone amount minus platform fee)
              </Text>
            </Section>

            {/* Dispute Notice */}
            <Section style={disputeBox}>
              <Heading style={h3}>⚠️ 48-Hour Dispute Window</Heading>
              <Text style={disputeText}>
                You have <strong>48 hours</strong> from this payment to file a dispute if you're not satisfied with the delivered work.
              </Text>
              <Text style={disputeText}>
                <strong>Dispute reasons include:</strong>
              </Text>
              <ul style={disputeList}>
                <li>Work does not match agreed specifications</li>
                <li>Deliverables are incomplete or missing</li>
                <li>Quality does not meet professional standards</li>
                <li>Unauthorized changes to payment amount</li>
              </ul>
              <Text style={disputeText}>
                <strong>Dispute deadline:</strong> <span style={deadline}>January 20, 2025 at 2:15 PM EST</span>
              </Text>
            </Section>

            {/* Action Buttons */}
            <Section style={buttonContainer}>
              <Button pX={20} pY={12} style={primaryButton} href={receiptUrl}>
                Download Receipt
              </Button>
              <Button pX={20} pY={12} style={disputeButton} href={disputeUrl}>
                File Dispute
              </Button>
              <Button pX={20} pY={12} style={secondaryButton} href={contractUrl}>
                View Contract
              </Button>
            </Section>

            <Hr style={hr} />

            {/* Next Milestone */}
            <Section>
              <Heading style={h3}>🔄 What's Next?</Heading>
              <Text style={text}>
                • <strong>Contract Progress:</strong> This milestone is now completed
                <br />
                • <strong>Upcoming Milestones:</strong> Continue tracking progress in your dashboard
                <br />
                • <strong>Payment History:</strong> All receipts are saved in your account
              </Text>
            </Section>

            {/* Satisfaction Survey */}
            <Section style={surveyBox}>
              <Heading style={h3}>📝 How was your experience?</Heading>
              <Text style={surveyText}>
                Help us improve SmartFlo by sharing your feedback on this milestone payment.
              </Text>
              <Button pX={16} pY={8} style={surveyButton} href={`https://getsmartflo.com/feedback?transaction=${transactionId}`}>
                Share Feedback
              </Button>
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
                </Link> (48-hour dispute policy)
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
                Questions about this charge? Contact us at <Link href="mailto:support@getsmartflo.com" style={link}>support@getsmartflo.com</Link>
              </Text>
              
              <Text style={disclaimer}>
                SmartFlo - Automated Freelance Payment Platform<br />
                Keep this receipt for your records. Transaction ID: {transactionId}
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
  color: "#10b981",
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

const receiptBox = {
  backgroundColor: "#ecfdf5",
  border: "1px solid #10b981",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detail = {
  color: "#065f46",
  fontSize: "16px",
  margin: "8px 0",
};

const amountStyle = {
  color: "#10b981",
  fontWeight: "bold",
  fontSize: "18px",
};

const statusCompleted = {
  color: "#10b981",
  fontWeight: "bold",
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

const feeNote = {
  color: "#6b7280",
  fontSize: "12px",
  fontStyle: "italic",
  margin: "12px 0 0",
};

const disputeBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const disputeText = {
  color: "#92400e",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "12px 0",
};

const disputeList = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "12px 0",
  paddingLeft: "20px",
};

const deadline = {
  color: "#dc2626",
  fontWeight: "bold",
};

const surveyBox = {
  backgroundColor: "#e0f2fe",
  border: "1px solid #0ea5e9",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const surveyText = {
  color: "#0c4a6e",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "12px 0 16px",
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

const disputeButton = {
  backgroundColor: "#f59e0b",
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

const surveyButton = {
  backgroundColor: "#0ea5e9",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
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