// create a new router
const app = require("express").Router();

// import the models
const { User, Post } = require("../models/index");

// import the email helper
const { sendDigestEmail } = require("../utils/email");

const { Op } = require("sequelize");

// Triggered by an external scheduler (e.g. cron-job.org), not a logged-in
// user — protected by a shared secret instead of a JWT.
app.post("/send", async (req, res) => {
  try {
    const secret = req.headers["x-digest-secret"];
    if (!secret || secret !== process.env.DIGEST_SECRET) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentPosts = await Post.findAll({
      where: { createdOn: { [Op.gte]: oneWeekAgo } },
      order: [["createdOn", "DESC"]],
    });

    if (recentPosts.length === 0) {
      return res.status(200).json({ message: "No new posts this week — no emails sent" });
    }

    const subscribers = await User.findAll({
      where: { digestSubscribed: true },
    });

    for (const subscriber of subscribers) {
      await sendDigestEmail(subscriber.email, subscriber.username, recentPosts);
    }

    res.status(200).json({
      message: `Digest sent to ${subscribers.length} subscriber(s) covering ${recentPosts.length} post(s)`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error sending digest" });
  }
});

// export the router
module.exports = app;