import { describe, expect, test } from 'bun:test';
import * as React from 'react';
import { render } from '@react-email/components';
import { WelcomeEmail } from '../WelcomeEmail';

describe('WelcomeEmail', () => {
    test('renders user and organization name correctly', async () => {
        const userName = 'Alice Testuser';
        const orgName = 'Wonderland Corp';

        const html = await render(<WelcomeEmail userName={userName} orgName={orgName} />);

        // Assert the rendered HTML contains the correct information
        expect(html).toContain(userName);
        expect(html).toContain(orgName);

        // Assert specific welcome messages
        expect(html).toContain(`Welcome to Zevian, ${userName}!`);
        expect(html).toContain(`Welcome to Zevian! Your organization, <strong>${orgName}</strong>, is now ready for action.`);

        // Check for dashboard link
        // Next.js process.env.NEXT_PUBLIC_APP_URL is not set in this environment,
        // so it defaults to empty string and prepends to /dashboard
        expect(html).toContain('href="/dashboard"');
    });

    test('renders with different environment app url', async () => {
        const originalEnv = process.env.NEXT_PUBLIC_APP_URL;
        process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com';

        const html = await render(<WelcomeEmail userName="Bob" orgName="Builders" />);
        expect(html).toContain('href="https://myapp.com/dashboard"');

        process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    });

    test('renders special characters correctly', async () => {
        const userName = 'O\'Connor & Sons';
        const orgName = '<script>alert("hack")</script>'; // React should escape this

        const html = await render(<WelcomeEmail userName={userName} orgName={orgName} />);

        // Checking for basic presence (escaped or not depending on context, but generally should be safe)
        // React-email renders to static markup so we can check if it properly handles it
        expect(html).toContain('O&#x27;Connor &amp; Sons');
        expect(html).toContain('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;');
    });
});
