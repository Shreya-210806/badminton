import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

let client = null;
const isEnabled = () => Boolean(process.env.SES_FROM_EMAIL);

/**
 * Sends one email through Amazon SES. Enabled when SES_FROM_EMAIL is set
 * (must be a verified identity). Without it, emails are only logged, so local
 * development works without AWS. Never throws: email failure must not break an API call.
 */
export async function sendEmail({ to, subject, text }) {
  if (!to) return false;
  if (!isEnabled()) {
    console.log(`[Mailer] (SES not configured) would email ${to}: ${subject}`);
    return false;
  }
  try {
    client = client || new SESv2Client({ region: process.env.SES_REGION || process.env.AWS_REGION || 'ap-south-1' });
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: process.env.SES_FROM_EMAIL,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: { Text: { Data: text, Charset: 'UTF-8' } },
          },
        },
      })
    );
    return true;
  } catch (err) {
    console.error(`[Mailer] SES send to ${to} failed:`, err.message);
    return false;
  }
}

export async function sendBulkEmail(recipients, { subject, text }, limit = 100) {
  const list = [...new Set(recipients.filter(Boolean))].slice(0, limit);
  const results = await Promise.all(list.map((to) => sendEmail({ to, subject, text })));
  return { attempted: list.length, sent: results.filter(Boolean).length };
}

export const mailerEnabled = isEnabled;
