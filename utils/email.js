const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Swap this for a verified domain address once you've set one up in Resend
const FROM_ADDRESS = "KRHDev Tech Blog <onboarding@resend.dev>";

async function sendVerificationEmail(toEmail, username, token) {
  const verifyUrl = `${process.env.APP_URL}/api/users/verify/${token}`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "Verify your KRHDev Tech Blog account",
      html: `
        <p>Hi ${username},</p>
        <p>Thanks for registering on KRHDev Tech Blog. Please confirm your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify my email</a></p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
      `,
    });
  } catch (error) {
    // Don't let a failed email break registration — just log it
    console.log("Failed to send verification email:", error);
  }
}

module.exports = { sendVerificationEmail };