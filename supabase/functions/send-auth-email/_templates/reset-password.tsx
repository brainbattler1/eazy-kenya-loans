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

interface ResetPasswordProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const ResetPassword = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: ResetPasswordProps) => (
  <Html>
    <Head />
    <Preview>Reset your password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <div style={logo}>
            <span style={logoText}>E</span>
          </div>
          <Heading style={h1}>Eazy Loan</Heading>
        </Section>
        
        <Heading style={h2}>Reset Your Password</Heading>
        <Text style={text}>
          We received a request to reset your password for your Eazy Loan account. Click the button below to create a new password.
        </Text>
        
        <Section style={buttonContainer}>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            style={button}
          >
            Reset Password
          </Link>
        </Section>
        
        <Text style={text}>
          Or copy and paste this reset code:
        </Text>
        <code style={code}>{token}</code>
        
        <Hr style={hr} />
        
        <Text style={securityText}>
          🔒 <strong>Security Notice:</strong> This password reset link will expire in 1 hour for your security.
        </Text>
        
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </Text>
        
        <Text style={footer}>
          If you're having trouble clicking the button, copy and paste the URL below into your web browser:
        </Text>
        <Text style={urlText}>
          {`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
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

export default ResetPassword

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
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  boxShadow: '0 4px 14px 0 rgba(220, 38, 38, 0.39)',
}

const code = {
  display: 'inline-block',
  padding: '16px 24px',
  width: 'auto',
  backgroundColor: '#fef2f2',
  borderRadius: '6px',
  border: '1px solid #fecaca',
  color: '#dc2626',
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

const securityText = {
  color: '#dc2626',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 20px',
  textAlign: 'center' as const,
  padding: '12px',
  backgroundColor: '#fef2f2',
  borderRadius: '6px',
  border: '1px solid #fecaca',
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

const urlText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 20px',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
  padding: '8px',
  backgroundColor: '#f8fafc',
  borderRadius: '4px',
}