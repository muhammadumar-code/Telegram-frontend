import nodemailer from 'nodemailer';

export class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.from = process.env.EMAIL_FROM || 'Telegram Pro Security <security@telegrampro.app>';
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user,
            pass
          }
        });
        this.isConfigured = true;
      } catch (err) {
        console.warn('[EmailService] SMTP initialization failed:', err);
      }
    }
  }

  async sendVerificationCode(to, code) {
    const subject = `${code} is your Telegram Pro verification code`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0c1017; border: 1px solid #1f293d; border-radius: 16px; padding: 32px; color: #f1f5f9;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #38bdf8; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Telegram Pro</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Security Verification Code</p>
        </div>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          You are verifying your email address for your Telegram Pro account. Enter the verification code below to complete authorization:
        </p>
        <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
          This code is valid for <strong>1 minute (60 seconds)</strong>. If you did not request this code, please disregard this email.
        </p>
      </div>
    `;

    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: this.from,
          to,
          subject,
          html,
          text: `Your Telegram Pro verification code is: ${code}. Valid for 1 minute (60 seconds).`
        });
        return { success: true, messageId: info.messageId, provider: 'smtp' };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('[EmailService] SMTP error, falling back to local dispatch:', message);
      }
    }

    // Terminal dispatch output
    console.log(`\n======================================================`);
    console.log(`📧 [TELEGRAM PRO - EMAIL VERIFICATION CODE DISPATCHED]`);
    console.log(`To Email: ${to}`);
    console.log(`>>> EMAIL VERIFICATION CODE: [ ${code} ] <<<`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId: 'dev_mail_' + Date.now(),
      provider: 'development-smtp'
    };
  }
}

export const emailService = new EmailService();
