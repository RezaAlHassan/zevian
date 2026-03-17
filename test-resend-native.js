const https = require('https');

const RESEND_API_KEY = 're_U7CG1t4U_LrEFAvKvU4EyHSmg7jxmccbV';
const FROM_EMAIL = 'Zevian <no-reply@zevian.co>';
const TO_EMAIL = 'rezah@example.com'; // Change this to your real email if you want to test receiving

const data = JSON.stringify({
    from: FROM_EMAIL,
    to: [TO_EMAIL],
    subject: 'Zevian API Test (Native)',
    html: '<strong>Resend API is working via native fetch!</strong>'
});

const options = {
    hostname: 'api.resend.com',
    port: 465, // Note: Resend API uses HTTPS over 443 usually, but let's see
    path: '/emails',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Length': data.length
    }
};

// Actually, let's use standard HTTPS on 443 for API
options.port = 443;

console.log('Sending test email to:', TO_EMAIL);
console.log('From:', FROM_EMAIL);

const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Body:', responseData);

        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('\nSUCCESS: Resend accepted the email request.');
        } else {
            console.log('\nFAILED: Check the error message above.');
            if (responseData.includes('not_found')) {
                console.log('Tip: Check if the domain zevian.co is verified.');
            }
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.write(data);
req.end();
