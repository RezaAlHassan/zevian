import * as React from 'react';

interface InvitationEmailProps {
    inviterName: string;
    orgName: string;
    projectName: string;
    inviteLink: string;
}

export const InvitationEmail = ({ inviterName, orgName, projectName, inviteLink }: InvitationEmailProps) => {
    return (
        <html>
            <head />
            <body style={main}>
                <div style={container}>
                    <h1 style={h1}>Zevian</h1>
                    <div>
                        <p style={text}>Hi there,</p>
                        <p style={text}>
                            <strong>{inviterName}</strong> has invited you to join the <strong>{projectName}</strong> project
                            within the <strong>{orgName}</strong> organization on Zevian.
                        </p>
                        <p style={text}>
                            Zevian helps teams track goals and projects with AI-assisted reporting.
                        </p>
                        <div style={btnContainer}>
                            <a style={button} href={inviteLink}>
                                Join Project
                            </a>
                        </div>
                        <p style={text}>
                            Or copy and paste this URL into your browser:{' '}
                            <a href={inviteLink} style={link}>
                                {inviteLink}
                            </a>
                        </p>
                    </div>
                    <p style={footer}>
                        This invitation was sent by Zevian. If you weren't expecting this, you can safely ignore this email.
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

const link: React.CSSProperties = {
    color: '#3182ce',
    textDecoration: 'underline',
};

const footer: React.CSSProperties = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center',
    padding: '0 40px',
};
