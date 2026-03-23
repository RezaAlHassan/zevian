import { describe, expect, test } from 'bun:test';
import * as React from 'react';
import { render } from '@react-email/components';
import { InvitationEmail } from '../InvitationEmail';

describe('InvitationEmail', () => {
    test('renders inviter, organization, project, and invite link correctly', async () => {
        const inviterName = 'Charlie';
        const orgName = 'Chocolate Factory';
        const projectName = 'Everlasting Gobstopper';
        const inviteLink = 'https://example.com/invite/12345';

        const html = await render(
            <InvitationEmail
                inviterName={inviterName}
                orgName={orgName}
                projectName={projectName}
                inviteLink={inviteLink}
            />
        );

        expect(html).toContain(inviterName);
        expect(html).toContain(orgName);
        expect(html).toContain(projectName);
        expect(html).toContain(`Join ${orgName} on Zevian`);

        // Assert invite link is present
        expect(html).toContain(`href="${inviteLink}"`);
    });

    test('escapes special characters', async () => {
        const inviterName = 'L\'Oréal & Co.';
        const orgName = '<b>Bold</b> Inc';
        const projectName = '<script>alert(1)</script>';
        const inviteLink = 'https://example.com/invite?param=1&other=2';

        const html = await render(
            <InvitationEmail
                inviterName={inviterName}
                orgName={orgName}
                projectName={projectName}
                inviteLink={inviteLink}
            />
        );

        // The text content should be escaped
        expect(html).toContain('L&#x27;Oréal &amp; Co.');
        expect(html).toContain('&lt;b&gt;Bold&lt;/b&gt; Inc');
        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
        // The href attribute should be correctly handled, though url encoding might occur based on implementation
        // the unencoded form is often still stringified properly by react for hrefs, or ampersands escaped
        expect(html).toContain('href="https://example.com/invite?param=1&amp;other=2"');
    });
});
