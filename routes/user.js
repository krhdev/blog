const router = require("express").Router();
const crypto = require("crypto");
const { User, Post } = require("../models");
const { signToken, authMiddleware } = require("../utils/auth");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/email");

// Get current authenticated user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password", "verificationToken"] },
    });
    if (!user) return res.status(401).json({ message: "Token expired" });
    return res.status(200).json({ user });
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET public profile info for a user, plus their post count
router.get("/:id", async (req, res) => {
  try {
    const userData = await User.findByPk(req.params.id, {
      attributes: ["id", "username", "createdOn"],
    });

    if (!userData) {
      res.status(404).json({ message: "No User found with this id" });
      return;
    }

    const postCount = await Post.count({ where: { userId: req.params.id } });

    res.status(200).json({ ...userData.toJSON(), postCount });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password", "verificationToken"] },
    });
    res.status(200).json(users);
  } catch (err) {
    res.status(400).json(err);
  }
});

// Register — creates the account, sends a verification email
router.post("/", async (req, res) => {
  try {
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const userData = await User.create({
      ...req.body,
      verificationToken,
    });

    await sendVerificationEmail(userData.email, userData.username, verificationToken);

    const token = signToken(userData);

    // Strip sensitive fields before sending the user object back
    const safeUser = userData.toJSON();
    delete safeUser.password;
    delete safeUser.verificationToken;

    res.status(200).json({ token, userData: safeUser });
  } catch (err) {
    res.status(400).json(err);
  }
});

// Confirm a verification link — simple HTML response, no front-end route needed
router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      where: { verificationToken: req.params.token },
    });

    if (!user) {
      return res.status(400).send(`
        <html><body style="font-family: sans-serif; text-align: center; padding: 60px 20px;">
          <h2>Verification link invalid or expired</h2>
          <p>Please log in and request a new verification email.</p>
        </body></html>
      `);
    }

    user.verified = true;
    user.verificationToken = null;
    await user.save();

    res.send(`
      <html><body style="font-family: sans-serif; text-align: center; padding: 60px 20px;">
        <h2>Email verified!</h2>
        <p>You can close this tab and head back to the blog.</p>
        <a href="${process.env.APP_URL}">Return to KRHDev Tech Blog</a>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send("Something went wrong verifying your email.");
  }
});

// Resend the verification email (for logged-in but unverified users)
router.post("/resend-verification", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "Your email is already verified" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    await sendVerificationEmail(user.email, user.username, verificationToken);

    res.status(200).json({ message: "Verification email sent" });
  } catch (err) {
    res.status(500).json({ message: "Error resending verification email" });
  }
});

// UPDATE the User record (only your own)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (Number(req.params.id) !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own account" });
    }

    const [affectedRows] = await User.update(req.body, {
      where: {
        id: req.params.id,
      },
    });

    if (affectedRows === 0) {
      res.status(404).json({ message: "No User found with this id" });
      return;
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const userData = await User.findOne({ where: { email: req.body.email } });
    if (!userData) {
      res
        .status(400)
        .json({ message: "Incorrect email or password, please try again" });
      return;
    }

    const validPassword = await userData.checkPassword(req.body.password);

    if (!validPassword) {
      res
        .status(400)
        .json({ message: "Incorrect email or password, please try again" });
      return;
    }

    const token = signToken(userData);

    // Strip sensitive fields before sending the user object back
    const safeUser = userData.toJSON();
    delete safeUser.password;
    delete safeUser.verificationToken;

    res.status(200).json({ token, userData: safeUser });
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

router.post("/logout", (req, res) => {
  res.status(204).end();
});

// Request a password reset — always responds the same way whether or not
// the email exists, so we don't leak which emails are registered
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetToken = resetToken;
      user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      await sendPasswordResetEmail(user.email, user.username, resetToken);
    }

    res.status(200).json({
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (err) {
    res.status(500).json({ message: "Error processing password reset request" });
  }
});

// Complete a password reset using the token from the email
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ message: "This reset link is invalid or has expired" });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: "Password updated — you can now log in" });
  } catch (err) {
    res.status(500).json({ message: "Error resetting password" });
  }
});

module.exports = router;