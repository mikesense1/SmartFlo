import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components';

interface ContactFormSubmissionProps {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export default function ContactFormSubmission({
  name,
  email,
  subject,
  message,
  submittedAt
}: ContactFormSubmissionProps) {
  return (
    <Html>
      <Head />
      <Preview>New contact form submission from {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={heading}>📬 New Contact Form Submission</Text>
          </Section>

          <Section style={content}>
            <Text style={label}>From:</Text>
            <Text style={value}>{name}</Text>

            <Text style={label}>Email:</Text>
            <Text style={value}>
              <Link href={`mailto:${email}`} style={link}>
                {email}
              </Link>
            </Text>

            <Text style={label}>Subject:</Text>
            <Text style={value}>{subject}</Text>

            <Hr style={hr} />

            <Text style={label}>Message:</Text>
            <Text style={messageText}>{message}</Text>

            <Hr style={hr} />

            <Text style={footer}>
              Submitted: {submittedAt}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '24px 24px 0',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 20px',
};

const content = {
  padding: '0 24px',
};

const label = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '16px 0 4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const value = {
  fontSize: '16px',
  color: '#1f2937',
  margin: '0 0 12px',
};

const messageText = {
  fontSize: '16px',
  color: '#1f2937',
  lineHeight: '1.6',
  margin: '0 0 16px',
  whiteSpace: 'pre-wrap' as const,
  backgroundColor: '#f9fafb',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
};

const link = {
  color: '#2563eb',
  textDecoration: 'none',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '16px 0 0',
};
