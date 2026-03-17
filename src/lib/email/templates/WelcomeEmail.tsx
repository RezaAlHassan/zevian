import {
    Html,
    Body,
    Container,
    Text,
    Preview,
    Section,
    Heading,
    Link,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
    userName: string;
    orgName: string;
}

export const WelcomeEmail = ({
    userName,
    orgName,
}: WelcomeEmailProps) => {
    return (
        <Html>
            <Preview>Welcome to Zevian, {userName}!</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Zevian</Heading>
                    <Section>
                        <Text style={text}>Hi {userName},</Text>
                        <Text style={text}>
                            Welcome to Zevian! Your organization, <strong>{orgName}</strong>, is now ready for action.
                        </Text>
                        <Text style={text}>
                            You can now start tracking goals, managing projects, and using AI to streamline your team's reporting.
                        </Text>
                        <Section style={btnContainer}>
                            <Link style={button} href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard`}>
                                Go to Dashboard
                            </Link>
                        </Section>
                        <Text style={text}>
                            If you have any questions, feel free to reply to this email or check out our documentation.
                        </Text>
                    </Section>
                    <Text style={footer}>
                        © 2026 Zevian AI. All rights reserved.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
};

const h1 = {
    color: '#3182ce',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '30px 0',
};

const text = {
    color: '#525f7f',
    fontSize: '16px',
    lineHeight: '24px',
    textAlign: 'left' as const,
    padding: '0 40px',
};

const btnContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#3182ce',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 24px',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const,
    padding: '0 40px',
};
