// ============================================
// Verification Email Template
// ============================================
// This file creates the HTML email that gets sent to users when they sign up.
// It uses @react-email/components which gives us ready-made email-friendly
// components (regular HTML/CSS doesn't always work well in emails).
//
// Think of this like a regular React component, but it renders to an email instead of a webpage.

import {
  Html,     // Wraps the entire email (like <html> in a regular webpage)
  Head,     // Contains meta info like title, fonts (like <head> in a webpage)
  Font,     // Lets us use custom fonts in the email
  Preview,  // The short text shown in the email preview (before opening)
  Heading,  // Like <h1>, <h2> tags
  Row,      // A row for layout (like a table row)
  Section,  // A section of the email (like a <div>)
  Text,     // Regular paragraph text
  Button,   // A clickable button
} from '@react-email/components';

// Define what props (inputs) this email component expects
interface VerificationEmailProps {
  username: string;  // The user's name to personalize the email
  otp: string;       // The 6-digit verification code to send
}

export default function VerificationEmail({ username, otp }: VerificationEmailProps) {
  return (
    // dir="ltr" means text reads left-to-right (for English)
    <Html lang="en" dir="ltr">
      <Head>
        <title>Verification Code</title>
        {/* Load a custom font (Roboto) for better looking emails */}
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"  // If Roboto doesn't load, use Verdana
          webFont={{
            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      {/* Preview text - appears in the inbox list before opening the email */}
      <Preview>Here's your verification code: {otp}</Preview>
      <Section>
        <Row>
          <Heading as="h2">Hello {username},</Heading>
        </Row>
        <Row>
          <Text>
            Thank you for registering. Please use the following verification
            code to complete your registration:
          </Text>
        </Row>
        <Row>
          {/* Display the actual verification code (highlight this for the user) */}
          <Text>{otp}</Text> 
        </Row>
        <Row>
          <Text>
            If you did not request this code, please ignore this email.
          </Text>
        </Row>
        {/* 
          Button approach is commented out for now.
          We're using just the code instead of a clickable link.
        */}
        {/* <Row>
          <Button
            href={`http://localhost:3000/verify/${username}`}
            style={{ color: '#61dafb' }}
          >
            Verify here
          </Button>
        </Row> */}
      </Section>
    </Html>
  );
}
