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

interface ContractInvitationProps {
  clientName: string;
  freelancerName: string;
  contractTitle: string;
  totalValue: string;
  contractId: string;
  paymentMethod: string;
}

export default function ContractInvitation({
  clientName = "John Smith",
  freelancerName = "Sarah Johnson",
  contractTitle = "E-commerce Website Development",
  totalValue = "$5,000",
  contractId = "contract_123",
  paymentMethod = "Credit Card"
}: ContractInvitationProps) {
  const contractUrl = `https://getsmartflo.com/client-payment/${contractId}`;
  const authorizationUrl = "https://getsmartflo.com/payment-authorization";
  const termsUrl = "https://getsmartflo.com/terms-of-service";

  return (
    <Html>
      <Head />
      <Preview>Contract invitation from {freelancerName} - Review and authorize payment</Preview>
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
            <Heading style={h1}>Contract Invitation</Heading>
            
            <Text style={text}>Hi {clientName},</Text>
            
            <Text style={text}>
              <strong>{freelancerName}</strong> has sent you a contract for review and payment authorization:
            </Text>

            {/* Contract Details Box */}
            <Section style={contractBox}>
              <Heading style={h2}>{contractTitle}</Heading>
              <Text style={contractDetail}>
                <strong>Total Value:</strong> {totalValue}
              </Text>
              <Text style={contractDetail}>
                <strong>Payment Method:</strong> {paymentMethod}
              </Text>
              <Text style={contractDetail}>
                <strong>Freelancer:</strong> {freelancerName}
              </Text>
            </Section>

            {/* Payment Authorization Notice */}
            <Section style={authorizationBox}>
              <Heading style={h3}>💳 Payment Authorization Required</Heading>
              <Text style={authText}>
                By reviewing this contract, you'll be asked to authorize SmartFlo to charge your {paymentMethod.toLowerCase()} 
                for milestone payments. <strong>Important:</strong>
              </Text>
              <ul style={authList}>
                <li>✓ Payments are only processed when YOU approve completed milestones</li>
                <li>✓ You have 7 days to review each milestone submission</li>
                <li>✓ Auto-approval after 7 days if no action is taken</li>
                <li>✓ You can revoke authorization anytime in your account settings</li>
                <li>✓ 48-hour dispute window for all processed payments</li>
              </ul>
            </Section>

            {/* Fee Disclosure */}
            <Section style={feeBox}>
              <Text style={feeText}>
                <strong>Platform Fee:</strong> 1% SmartFlo fee + payment processor fees apply. 
                Total fees are included in the contract amount above.
              </Text>
            </Section>

            {/* Action Button */}
            <Section style={buttonContainer}>
              <Button pX={20} pY={12} style={button} href={contractUrl}>
                Review Contract & Authorize Payment
              </Button>
            </Section>

            <Text style={text}>
              This contract includes milestone-based payments with smart escrow protection. 
              Your payment method will only be charged after you explicitly approve completed work.
            </Text>

            <Hr style={hr} />

            {/* Legal Links */}
            <Section style={footer}>
              <Text style={footerText}>
                <strong>Important Legal Information:</strong>
              </Text>
              <Text style={footerText}>
                • <Link href={authorizationUrl} style={link}>Payment Authorization Agreement</Link>
                <br />
                • <Link href={termsUrl} style={link}>Terms of Service</Link> (includes automated payment terms)
                <br />
                • <Link href="https://getsmartflo.com/privacy-policy" style={link}>Privacy Policy</Link>
              </Text>
              
              <Hr style={hr} />
              
              <Text style={footerText}>
                • <Link href={`https://getsmartflo.com/payment-settings?contract=${contractId}`} style={link}>
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
                This email contains important contract and payment authorization information.
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
  margin: "0 0 10px",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const contractBox = {
  backgroundColor: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const contractDetail = {
  color: "#374151",
  fontSize: "16px",
  margin: "8px 0",
};

const authorizationBox = {
  backgroundColor: "#dbeafe",
  border: "1px solid #93c5fd",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const authText = {
  color: "#1e40af",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "12px 0",
};

const authList = {
  color: "#1e40af",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "12px 0",
  paddingLeft: "20px",
};

const feeBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #fbbf24",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
};

const feeText = {
  color: "#92400e",
  fontSize: "14px",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
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