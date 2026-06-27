import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';
import 'dotenv/config';

async function sendEmail() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: npm run email <path-to-markdown-file> [path-to-pdf-attachment]');
    console.error('Example: npm run email output/email.md output/cv.pdf');
    process.exit(1);
  }

  const mdFilePath = args[0];
  const attachmentPath = args[1];

  // 1. Check for credentials
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error('Error: SMTP_USER and SMTP_PASS must be set in your .env file.');
    console.error('If using Gmail, use your email and a 16-character App Password.');
    process.exit(1);
  }

  // 2. Read and parse the Markdown file
  let mdContent;
  try {
    mdContent = await fs.readFile(mdFilePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading file: ${mdFilePath}`);
    process.exit(1);
  }

  // Extract To and Subject using regex
  const toMatch = mdContent.match(/\*\*To:\*\*\s*(.*)/i);
  const subjectMatch = mdContent.match(/\*\*Subject:\*\*\s*(.*)/i);

  if (!toMatch || !subjectMatch) {
    console.error('Error: Could not parse **To:** or **Subject:** from the markdown file.');
    console.error('Make sure the file starts with those exact tags.');
    process.exit(1);
  }

  const to = toMatch[1].trim();
  const subject = subjectMatch[1].trim();

  // Strip To and Subject lines to get the body
  let body = mdContent
    .replace(/\*\*To:\*\*\s*(.*)\n?/i, '')
    .replace(/\*\*Subject:\*\*\s*(.*)\n?/i, '')
    .trim();

  // 3. Prepare Attachments
  const attachments = [];
  if (attachmentPath) {
    try {
      await fs.access(attachmentPath);
      attachments.push({
        filename: path.basename(attachmentPath),
        path: attachmentPath
      });
    } catch (err) {
      console.error(`Error: Attachment file not found at ${attachmentPath}`);
      process.exit(1);
    }
  }

  // 4. Configure Nodemailer
  // Defaulting to Gmail as the most common use-case, but can be configured
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });

  // 5. Send Email
  console.log(`Sending email to: ${to}`);
  console.log(`Subject: ${subject}`);
  if (attachments.length > 0) {
    console.log(`Attachment: ${attachments[0].filename}`);
  }
  console.log('Sending...');

  try {
    const info = await transporter.sendMail({
      from: user,
      to: to,
      subject: subject,
      text: body, // Sending as plaintext markdown
      attachments: attachments,
    });
    console.log(`✅ Email sent successfully!`);
    console.log(`Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
}

sendEmail();
