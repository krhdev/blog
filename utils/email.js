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

async function sendPasswordResetEmail(toEmail, username, token) {
  const resetUrl = `${process.env.APP_URL}/reset-password.htm?token=${token}`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: "Reset your KRHDev Tech Blog password",
      html: `
        <p>Hi ${username},</p>
        <p>We received a request to reset your password. Click the link below to choose a new one — this link expires in 1 hour:</p>
        <p><a href="${resetUrl}">Reset my password</a></p>
        <p>If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
      `,
    });
  } catch (error) {
    console.log("Failed to send password reset email:", error);
  }
}

async function sendDigestEmail(toEmail, username, posts) {
  const postListHtml = posts
    .map(
      (post) => `
        <li style="margin-bottom: 12px;">
          <strong>${post.title}</strong> by ${post.postedBy}<br>
          <span style="color: #666; font-size: 0.9em;">${post.content.slice(0, 120)}${post.content.length > 120 ? "…" : ""}</span>
        </li>
      `
    )
    .join("");

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: `This week on KRHDev Tech Blog: ${posts.length} new post${posts.length === 1 ? "" : "s"}`,
      html: `
        <p>Hi ${username},</p>
        <p>Here's what's new on the blog this week:</p>
        <ul>${postListHtml}</ul>
        <p><a href="${process.env.APP_URL}">Read them all on the blog</a></p>
        <p style="color: #999; font-size: 0.85em;">You're getting this because you subscribed to weekly updates. You can unsubscribe any time from your account.</p>
      `,
    });
  } catch (error) {
    console.log(`Failed to send digest email to ${toEmail}:`, error);
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendDigestEmail };