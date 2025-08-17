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

interface AuthorizationRevokedProps {
  clientName: string;
  contractTitle: string;
  revocationDate: string;
  contractId: string;
  remainingBalance?: string;
  reason?: string;
}

export default function AuthorizationRevoked({
  clientName = "John Smith",
  contractTitle = "E-commerce Website Development",
  revocationDate = "January 18, 2025 at 3:30 PM EST",
  contractId = "contract_123",
  remainingBalance = "$2,500.00",
  reason = "Requested by client"
}: AuthorizationRevokedProps) {
  const contractUrl = `https://getsmartflo.com/contracts/${contractId}`;
  const supportUrl = "https://getsmartflo.com/support";
  const reauthorizeUrl = `https://getsmartflo.com/reauthorize-payment?contract=${contractId}`;

  return (
    <Html>
      <Head />
      <Preview>Payment authorization revoked for {contractTitle}</Preview>
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
            <Heading style={h1}>🚫 Payment Authorization Revoked</Heading>
            
            <Text style={text}>Hi {clientName},</Text>
            
            <Text style={text}>
              This confirms that your payment authorization has been successfully revoked for the following contract:
            </Text>

            {/* Revocation Details Box */}
            <Section style={revocationBox}>
              <Heading style={h2}>Revocation Details</Heading>
              <Text style={detail}>
                <strong>Contract:</strong> {contractTitle}
              </Text>
              <Text style={detail}>
                <strong>Contract ID:</strong> {contractId}
              </Text>
              <Text style={detail}>
                <strong>Revocation Date:</strong> {revocationDate}
              </Text>
              <Text style={detail}>
                <strong>Reason:</strong> {reason}
              </Text>
              <Text style={detail}>
                <strong>Remaining Contract Balance:</strong> <span style={balance}>{remainingBalance}</span>
              </Text>
              <Text style={detail}>
                <strong>Status:</strong> <span style={statusRevoked}>Authorization Revoked</span>
              </Text>
            </Section>

            {/* Impact Notice */}
            <Section style={impactBox}>
              <Heading style={h3}>⚠️ Contract Impact</Heading>
              <Text style={impactText}>
                With payment authorization revoked, the following changes are now in effect:
              </Text>
              <ul style={impactList}>
                <li><strong>No Future Automatic Payments:</strong> Your payment method will not be charged for any future milestones</li>
                <li><strong>Manual Payment Required:</strong> You'll need to manually authorize each payment or reauthorize automatic payments</li>
                <li><strong>Contract Status:</strong> May be suspended pending resolution with freelancer</li>
                <li><strong>Work Continuation:</strong> Freelancer may pause work until payment method is restored</li>
              </ul>
            </Section>

            {/* Outstanding Balance */}
            {remainingBalance && remainingBalance !== "$0.00" && (
              <Section style={balanceBox}>
                <Heading style={h3}>💰 Outstanding Balance</Heading>
                <Text style={balanceText}>
                  There is still <strong>{remainingBalance}</strong> remaining on this contract for upcoming milestones.
                </Text>
                <Text style={balanceText}>
                  <strong>Your options to continue:</strong>
                </Text>
                <ul style={optionsList}>
                  <li><strong>Reauthorize Payments:</strong> Restore automatic milestone payments</li>
                  <li><strong>Manual Payments:</strong> Pay each milestone individually when completed</li>
                  <li><strong>Modify Contract:</strong> Negotiate new payment terms with freelancer</li>
                  <li><strong>Terminate Contract:</strong> End contract and settle any completed work</li>
                </ul>
              </Section>
            )}

            {/* Action Buttons */}
            <Section style={buttonContainer}>
              <Button pX={20} pY={12} style={primaryButton} href={reauthorizeUrl}>
                Reauthorize Payments
              </Button>
              <Button pX={20} pY={12} style={secondaryButton} href={contractUrl}>
                View Contract
              </Button>
              <Button pX={20} pY={12} style={supportButton} href={supportUrl}>
                Contact Support
              </Button>
            </Section>

            <Hr style={hr} />

            {/* Freelancer Communication */}
            <Section>
              <Heading style={h3}>💬 Freelancer Communication</Heading>
              <Text style={text}>
                Your freelancer has been automatically notified of this authorization revocation. 
                We recommend communicating directly to:
              </Text>
              <Text style={text}>
                • Explain the reason for revocation
                <br />
                • Discuss alternative payment arrangements
                <br />
                • Clarify project continuation plans
                <br />
                • Set expectations for future milestones
              </Text>
            </Section>

            {/* Reauthorization Process */}
            <Section style={reauthorizeBox}>
              <Heading style={h3}>🔄 Easy Reauthorization</Heading>
              <Text style={reauthorizeText}>
                Changed your mind? You can reauthorize payments anytime with just a few clicks:
              </Text>
              <ol style={stepsList}>
                <li>Click "Reauthorize Payments" above or in your contract dashboard</li>
                <li>Confirm your payment method (or add a new one)</li>
                <li>Review and accept the payment authorization agreement</li>
                <li>Automatic milestone payments will resume immediately</li>
              </ol>
              <Text style={reauthorizeNote}>
                Reauthorization takes effect immediately and applies to all pending and future milestones.
              </Text>
            </Section>

            <Hr style={hr} />

            {/* Legal Protection */}
            <Section>
              <Heading style={h3}>🔒 Your Rights & Protections</Heading>
              <Text style={text}>
                Even with revoked authorization, you still have access to:
              </Text>
              <Text style={text}>
                • <strong>Dispute Resolution:</strong> File disputes for any completed work
                <br />
                • <strong>Contract Mediation:</strong> SmartFlo mediation services for contract issues
                <br />
                • <strong>Legal Documentation:</strong> All contracts and communications are preserved
                <br />
                • <strong>Refund Protection:</strong> Standard refund policies still apply to completed work
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
                </Link> (authorization revocation policy)
                <br />
                • <Link href="https://getsmartflo.com/disputes" style={link}>
                  Dispute Resolution Process
                </Link>
              </Text>
              
              <Hr style={hr} />
              
              <Text style={footerText}>
                • <Link href={contractUrl} style={link}>
                  View Contract Details
                </Link>
                <br />
                • <Link href={`https://getsmartflo.com/unsubscribe?email=${encodeURIComponent(clientName)}`} style={link}>
                  Unsubscribe from SmartFlo emails
                </Link>
              </Text>
              
              <Text style={footerText}>
                Questions about authorization revocation? Contact us at <Link href="mailto:support@getsmartflo.com" style={link}>support@getsmartflo.com</Link>
              </Text>
              
              <Text style={disclaimer}>
                SmartFlo - Automated Freelance Payment Platform<br />
                Authorization revocation is permanent until manually reauthorized.
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

const revocationBox = {
  backgroundColor: "#fee2e2",
  border: "1px solid #dc2626",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detail = {
  color: "#991b1b",
  fontSize: "16px",
  margin: "8px 0",
};

const balance = {
  color: "#dc2626",
  fontWeight: "bold",
  fontSize: "18px",
};

const statusRevoked = {
  color: "#dc2626",
  fontWeight: "bold",
};

const impactBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const impactText = {
  color: "#92400e",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "12px 0",
};

const impactList = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "12px 0",
  paddingLeft: "20px",
};

const balanceBox = {
  backgroundColor: "#e0f2fe",
  border: "1px solid #0ea5e9",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const balanceText = {
  color: "#0c4a6e",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "12px 0",
};

const optionsList = {
  color: "#0c4a6e",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "12px 0",
  paddingLeft: "20px",
};

const reauthorizeBox = {
  backgroundColor: "#f3f4f6",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const reauthorizeText = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "12px 0",
};

const stepsList = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "12px 0",
  paddingLeft: "20px",
};

const reauthorizeNote = {
  color: "#6b7280",
  fontSize: "14px",
  fontStyle: "italic",
  margin: "12px 0 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const primaryButton = {
  backgroundColor: "#10b981",
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

const supportButton = {
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