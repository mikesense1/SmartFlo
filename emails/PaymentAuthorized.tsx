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

interface PaymentAuthorizedProps {
  clientName: string;
  contractTitle: string;
  paymentMethod: string;
  contractId: string;
  authorizationDate: string;
}

export default function PaymentAuthorized({
  clientName = "John Smith",
  contractTitle = "E-commerce Website Development", 
  paymentMethod = "Credit Card ending in ****1234",
  contractId = "contract_123",
  authorizationDate = "January 17, 2025"
}: PaymentAuthorizedProps) {
  const settingsUrl = `https://getsmartflo.com/payment-settings?contract=${contractId}`;
  const contractUrl = `https://getsmartflo.com/contracts/${contractId}`;

  return (
    <Html>
      <Head />
      <Preview>Payment authorization confirmed for {contractTitle}</Preview>
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
            <Heading style={h1}>✅ Payment Authorization Confirmed</Heading>
            
            <Text style={text}>Hi {clientName},</Text>
            
            <Text style={text}>
              Your payment authorization has been successfully confirmed for the following contract:
            </Text>

            {/* Authorization Details Box */}
            <Section style={confirmationBox}>
              <Heading style={h2}>{contractTitle}</Heading>
              <Text style={detail}>
                <strong>Authorization Date:</strong> {authorizationDate}
              </Text>
              <Text style={detail}>
                <strong>Payment Method:</strong> {paymentMethod}
              </Text>
              <Text style={detail}>
                <strong>Contract ID:</strong> {contractId}
              </Text>
              <Text style={detail}>
                <strong>Status:</strong> <span style={statusActive}>Active Authorization</span>
              </Text>
            </Section>

            {/* How It Works */}
            <Section style={infoBox}>
              <Heading style={h3}>🔄 How Milestone Payments Work</Heading>
              <Text style={infoText}>
                Now that your payment method is authorized, here's what happens next:
              </Text>
              <ol style={stepsList}>
                <li><strong>Freelancer submits completed milestones</strong> - You'll receive an email notification</li>
                <li><strong>You have 7 days to review</strong> - Approve, request changes, or dispute the work</li>
                <li><strong>Payment processes automatically</strong> - Only after your approval (or 7-day auto-approval)</li>
                <li><strong>48-hour dispute window</strong> - File disputes immediately if needed</li>
              </ol>
            </Section>

            {/* Control Notice */}
            <Section style={controlBox}>
              <Heading style={h3}>🔐 You Stay in Control</Heading>
              <Text style={controlText}>
                Remember: Your payment method will <strong>only</strong> be charged when:
              </Text>
              <ul style={controlList}>
                <li>✓ You explicitly approve completed milestone deliverables</li>
                <li>✓ Or 7 days pass without action (auto-approval)</li>
                <li>✓ You can revoke this authorization anytime</li>
              </ul>
            </Section>

            {/* Action Buttons */}
            <Section style={buttonContainer}>
              <Button pX={20} pY={12} style={primaryButton} href={contractUrl}>
                View Contract Details
              </Button>
              <Button pX={20} pY={12} style={secondaryButton} href={settingsUrl}>
                Manage Payment Settings
              </Button>
            </Section>

            <Hr style={hr} />

            {/* Next Steps */}
            <Section>
              <Heading style={h3}>📋 What's Next?</Heading>
              <Text style={text}>
                • <strong>Track Progress:</strong> Monitor milestone submissions in your dashboard
                <br />
                • <strong>Stay Responsive:</strong> Review deliverables within 7 days to avoid auto-approval
                <br />
                • <strong>Get Support:</strong> Contact us anytime at support@getsmartflo.com
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
                </Link>
                <br />
                • <Link href="https://getsmartflo.com/privacy-policy" style={link}>
                  Privacy Policy
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
                Questions? Contact us at <Link href="mailto:support@getsmartflo.com" style={link}>support@getsmartflo.com</Link>
              </Text>
              
              <Text style={disclaimer}>
                SmartFlo - Automated Freelance Payment Platform<br />
                You can revoke payment authorization anytime in your account settings.
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
  color: "#1f2937",
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

const confirmationBox = {
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

const statusActive = {
  color: "#10b981",
  fontWeight: "bold",
};

const infoBox = {
  backgroundColor: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const infoText = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "12px 0",
};

const stepsList = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "12px 0",
  paddingLeft: "20px",
};

const controlBox = {
  backgroundColor: "#dbeafe",
  border: "1px solid #3b82f6",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const controlText = {
  color: "#1e40af",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "12px 0",
};

const controlList = {
  color: "#1e40af",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "12px 0",
  paddingLeft: "20px",
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