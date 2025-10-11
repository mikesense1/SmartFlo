import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PaymentVerificationEmailProps {
  clientName: string;
  verificationCode: string;
  amount: string;
  milestoneTitle: string;
  contractTitle: string;
  expiresInMinutes?: number;
}

export const PaymentVerificationEmail = ({
  clientName,
  verificationCode,
  amount,
  milestoneTitle,
  contractTitle,
  expiresInMinutes = 10,
}: PaymentVerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your SmartFlo payment verification code: {verificationCode}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Verification Required</Heading>
        
        <Text style={text}>Hi {clientName},</Text>
        
        <Text style={text}>
          You're about to approve a payment for the following milestone:
        </Text>

        <Section style={codeBox}>
          <Text style={contractInfo}>
            <strong>Contract:</strong> {contractTitle}
          </Text>
          <Text style={contractInfo}>
            <strong>Milestone:</strong> {milestoneTitle}
          </Text>
          <Text style={contractInfo}>
            <strong>Amount:</strong> {amount}
          </Text>
        </Section>

        <Text style={text}>
          Your verification code is:
        </Text>

        <Section style={verificationCodeBox}>
          <Text style={verificationCode}>
            {verificationCode}
          </Text>
        </Section>

        <Text style={warningText}>
          This code will expire in {expiresInMinutes} minutes.
        </Text>

        <Hr style={hr} />

        <Section style={securityNotice}>
          <Text style={securityText}>
            <strong>Security Notice:</strong>
          </Text>
          <Text style={securityText}>
            • Never share this code with anyone
          </Text>
          <Text style={securityText}>
            • SmartFlo will never ask for this code via phone or email
          </Text>
          <Text style={securityText}>
            • If you didn't request this code, please contact support immediately
          </Text>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          This email was sent by SmartFlo. If you have any questions, please contact our support team.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PaymentVerificationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 20px",
  textAlign: "center" as const,
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 20px",
};

const codeBox = {
  background: "#f8fafc",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 20px",
  border: "1px solid #e2e8f0",
};

const contractInfo = {
  color: "#334155",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};

const verificationCodeBox = {
  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 20px",
  textAlign: "center" as const,
};

const verificationCode = {
  color: "#ffffff",
  fontSize: "36px",
  fontWeight: "bold",
  letterSpacing: "8px",
  margin: "0",
  fontFamily: "monospace",
};

const warningText = {
  color: "#dc2626",
  fontSize: "14px",
  fontWeight: "600",
  textAlign: "center" as const,
  margin: "16px 20px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "32px 20px",
};

const securityNotice = {
  background: "#fef3c7",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 20px",
  border: "1px solid #fde047",
};

const securityText = {
  color: "#713f12",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "4px 0",
};

const footer = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "32px 20px",
  textAlign: "center" as const,
};
