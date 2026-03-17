import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
    to,
    subject,
    react,
    html,
}: {
    to: string | string[];
    subject: string;
    react?: React.ReactElement;
    html?: string;
}) {
    try {
        let finalHtml = html;

        if (react && !finalHtml) {
            // Import react-dom/server only when needed to avoid compilation errors in Next.js
            const { renderToStaticMarkup } = await import('react-dom/server');
            finalHtml = renderToStaticMarkup(react);
        }

        console.log(`Attempting to send email to ${to} via Resend...`);
        const { data, error } = await resend.emails.send({
            from: 'Zevian <no-reply@zevian.co>', // Verified domain zevian.co
            to,
            subject,
            html: finalHtml as string,
        });

        if (error) {
            console.error('Resend error response:', error);
            return { success: false, error };
        }

        console.log('Email sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Email service absolute failure:', error);
        return { success: false, error };
    }
}
