import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const emailTemplates = {
  welcome: (name) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to ${process.env.APP_NAME}!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering with ${process.env.APP_NAME}. We're excited to have you on board!</p>
      <p>With your account, you can:</p>
      <ul>
        <li>Create and manage your bots</li>
        <li>Track bot interactions and analytics</li>
        <li>Manage your credits and subscriptions</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The ${process.env.APP_NAME} Team</p>
    </div>
  `,

  loginNotification: (name, time, ip) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Login Detected</h2>
      <p>Hello ${name},</p>
      <p>We noticed a new login to your ${process.env.APP_NAME} account:</p>
      <ul>
        <li>Time: ${time}</li>
        <li>IP Address: ${ip}</li>
      </ul>
      <p>If this was you, you can safely ignore this email.</p>
      <p>If you don't recognize this login, please secure your account immediately by:</p>
      <ol>
        <li>Changing your password</li>
        <li>Enabling two-factor authentication</li>
        <li>Contacting our support team</li>
      </ol>
      <p>Best regards,<br>The ${process.env.APP_NAME} Team</p>
    </div>
  `,

  passwordReset: (name, resetLink) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password for your ${process.env.APP_NAME} account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
      <p>Best regards,<br>The ${process.env.APP_NAME} Team</p>
    </div>
  `,
}; 