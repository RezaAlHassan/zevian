import * as React from 'react';

interface WelcomeEmailProps {
    userName: string;
    orgName: string;
}

export const WelcomeEmail = ({ userName, orgName }: WelcomeEmailProps) => {
    return (
        <html>
            <head />
            <body style={main}>
                <div style={container}>
                    <h1 style={h1}>Zevian</h1>
                    <div>
                        <p style={text}>Hi {userName},</p>
                        <p style={text}>
                            Welcome to Zevian! Your organization, <strong>{orgName}</strong>, is now ready for action.
                        </p>
                        <p style={text}>
                            You can now start tracking goals, managing projects, and using AI to streamline your team's reporting.
                        </p>
                        <div style={btnContainer}>
                            <a style={button} href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard`}>
                                Go to Dashboard
                            </a>
                        </div>
                        <p style={text}>
                            If you have any questions, feel free to reply to this email or check out our documentation.
                        </p>
                    </div>
                    <p style={footer}>
                        © 2026 Zevian AI. All rights reserved.
                    </p>
                </div>
            </body>
        </html>
    );
};

const main: React.CSSProperties = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container: React.CSSProperties = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
};

const h1: React.CSSProperties = {
    color: '#3182ce',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '30px 0',
};

const text: React.CSSProperties = {
    color: '#525f7f',
    fontSize: '16px',
    lineHeight: '24px',
    textAlign: 'left',
    padding: '0 40px',
};

const btnContainer: React.CSSProperties = {
    textAlign: 'center',
    margin: '32px 0',
};

const button: React.CSSProperties = {
    backgroundColor: '#3182ce',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
    padding: '12px 24px',
};

const footer: React.CSSProperties = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center',
    padding: '0 40px',
};
