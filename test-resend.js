const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
    const apiKey = process.env.RESEND_API_KEY;
    console.log('Testing Resend with API Key:', apiKey ? apiKey.slice(0, 10) + '...' : 'MISSING');

    if (!apiKey) {
        console.error('Error: RESEND_API_KEY is not defined in .env.local');
        return;
    }

    try {
        const payload = {
            from: 'Zevian <no-reply@zevian.co>',
            to: ['rezah@example.com'], // Using a dummy but valid format
            subject: 'Zevian SMTP Test',
            html: '<strong>Resend is working correctly!</strong>',
        };

        console.log('Sending payload:', JSON.stringify(payload, null, 2));

        const { data, error } = await resend.emails.send(payload);

        if (error) {
            console.error('Resend Error JSON:', JSON.stringify(error, null, 2));
            if (error.name === 'validation_error') {
                console.error('Tip: Check if zevian.co is fully verified in Resend dashboard.');
            }
        } else {
            console.log('Resend Success Response:', JSON.stringify(data, null, 2));
            console.log('\nSUCCESS! If you see an "id" above, Resend accepted the email.');
        }
    } catch (err) {
        console.error('Unexpected Catch Error:', err);
    }
}

testResend();
