import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ConfirmEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const ConfirmEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: ConfirmEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirm your email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <div style={logo}>
            <span style={logoText}>E</span>
          </div>
          <Heading style={h1}>Eazy Loan</Heading>
        </Section>
        
        <Heading style={h2}>Confirm Your Email</Heading>
        <Text style={text}>
          Thank you for signing up! Please confirm your email address to complete your registration and start using Eazy Loan.
        </Text>
        
        <Section style={buttonContainer}>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            style={button}
          >
            Confirm Email Address
          </Link>
        </Section>
        
        <Text style={text}>
          Or copy and paste this verification code:
        </Text>
        <code style={code}>{token}</code>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          If you didn't create an account with Eazy Loan, you can safely ignore this email.
        </Text>
        
        <Text style={footer}>
          This link will expire in 24 hours for security reasons.
        </Text>
        
        <Text style={footer}>
          <Link href={redirect_to} style={footerLink}>
            Eazy Loan
          </Link>
          - Your trusted lending partner
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ConfirmEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px 0',
  borderBottom: '1px solid #e1e8ed',
  marginBottom: '32px',
}

const logo = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '12px',
}

const logoText = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '32px 20px 16px',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 20px',
  textAlign: 'center' as const,
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#667eea',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)',
}

const code = {
  display: 'inline-block',
  padding: '16px 24px',
  width: 'auto',
  backgroundColor: '#f8fafc',
  borderRadius: '6px',
  border: '1px solid #e1e8ed',
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  letterSpacing: '2px',
  margin: '16px 20px',
}

const hr = {
  borderColor: '#e1e8ed',
  margin: '32px 0',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 20px',
  textAlign: 'center' as const,
}

const footerLink = {
  color: '#667eea',
  textDecoration: 'underline',
}