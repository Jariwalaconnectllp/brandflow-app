const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendNotificationEmail = async (to, subject, text) => {
  if (!process.env.EMAIL_USER) {
    console.log(`[Email skipped - no config] To: ${to}, Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Branding System <noreply@brandingsystem.com>',
      to, subject,
      text,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9;">
          <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;">
            <h2 style="color:#e8c547;margin:0;">🎨 Branding System</h2>
          </div>
          <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;">
            <h3 style="color:#333;">${subject}</h3>
            <p style="color:#555;line-height:1.6;">${text.replace(/\n/g, '<br>')}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
            <p style="color:#999;font-size:12px;">This is an automated notification from Branding Process Management System.</p>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

module.exports = { sendNotificationEmail };
