import {
    Html,
    Body,
    Container,
    Text,
    Link,
    Preview,
    Section,
    Heading,
} from '@react-email/components';
import * as React from 'react';

interface InvitationEmailProps {
    inviterName: string;
    orgName: string;
    projectName: string;
    inviteLink: string;
}

export const InvitationEmail = ({
    inviterName,
    orgName,
    projectName,
    inviteLink,
}: InvitationEmailProps) => {
    return (
        <Html>
            <Preview>Join {orgName} on Zevian</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Zevian</Heading>
                    <Section>
                        <Text style={text}>Hi there,</Text>
                        <Text style={text}>
                            <strong>{inviterName}</strong> has invited you to join the <strong>{projectName}</strong> project
                            within the <strong>{orgName}</strong> organization on Zevian.
                        </Text>
                        <Text style={text}>
                            Zevian helps teams track goals and projects with AI-assisted reporting.
                        </Text>
                        <Section style={btnContainer}>
                            <Link style={button} href={inviteLink}>
                                Join Project
                            </Link>
                        </Section>
                        <Text style={text}>
                            Or copy and paste this URL into your browser:{' '}
                            <Link href={inviteLink} style={link}>
                                {inviteLink}
                            </Link>
                        </Text>
                    </Section>
                    <Text style={footer}>
                        This invitation was sent by Zevian. If you weren't expecting this, you can safely ignore this email.
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

const link = {
    color: '#3182ce',
    textDecoration: 'underline',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const,
    padding: '0 40px',
};
