// create a new router
const app = require("express").Router();

// import the models
const { Post, Category, User } = require("../models/index");

// import the auth middleware
const { authMiddleware, optionalAuth, adminMiddleware } = require("../utils/auth");

// import the image upload middleware
const upload = require("../utils/upload");

const DEFAULT_PAGE_SIZE = 5;

// Route to add a new post
app.post("/", authMiddleware, upload.single("featuredImage"), async (req, res) => {
  try {
    const { title, content, postedBy, categoryId } = req.body;
    const featuredImage = req.file ? req.file.path : null;

    // Trusted (auto-approve) users publish immediately; everyone else's
    // posts go into the pending queue for admin review.
    const author = await User.findByPk(req.user.id);
    const status = author && author.autoApprove ? "approved" : "pending";

    const post = await Post.create({
      title,
      content,
      postedBy,
      categoryId,
      featuredImage,
      userId: req.user.id,
      status,
    });

    res.status(201).json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error adding post" });
  }
});

// Route to get all posts — public, paginated, optionally filtered by
// category (?categoryId=X) or author (?userId=X). Only approved posts are
// shown, EXCEPT a logged-in viewer looking at their own posts also sees
// their own pending ones.
app.get("/", optionalAuth, async (req, res) => {
  try {
    const { categoryId, userId } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || DEFAULT_PAGE_SIZE);
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (categoryId) whereClause.categoryId = categoryId;
    if (userId) whereClause.userId = userId;

    const viewingOwnPosts = req.user && userId && Number(userId) === req.user.id;
    if (!viewingOwnPosts) {
      whereClause.status = "approved";
    }

    const { count, rows: posts } = await Post.findAndCountAll({
      where: whereClause,
      include: [
        { model: Category, as: "category" },
        { model: User, as: "author", attributes: ["id", "username"] },
      ],
      order: [["createdOn", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(count / limit)),
      totalPosts: count,
    });
  } catch (error) {
    res.status(500).json({ error: "Error retrieving posts", error });
  }
});

// ── Admin routes ──

// List all pending posts (admin only)
app.get("/admin/pending", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { status: "pending" },
      include: [
        { model: Category, as: "category" },
        { model: User, as: "author", attributes: ["id", "username"] },
      ],
      order: [["createdOn", "ASC"]],
    });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving pending posts" });
  }
});

// Approve a pending post (admin only)
app.post("/admin/:id/approve", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [affectedRows] = await Post.update(
      { status: "approved" },
      { where: { id: req.params.id } }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json({ message: "Post approved" });
  } catch (error) {
    res.status(500).json({ error: "Error approving post" });
  }
});

// Reject (delete) a pending post (admin only)
app.delete("/admin/:id/reject", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const affectedRows = await Post.destroy({ where: { id: req.params.id } });

    if (affectedRows === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json({ message: "Post rejected and removed" });
  } catch (error) {
    res.status(500).json({ error: "Error rejecting post" });
  }
});

// Route to get a single post — public
app.get("/:id", async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        { model: Category, as: "category" },
        { model: User, as: "author", attributes: ["id", "username"] },
      ],
    });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving post" });
  }
});

// Route to update a post
app.put("/:id", authMiddleware, upload.single("featuredImage"), async (req, res) => {
  try {
    const { title, content, postedBy, categoryId } = req.body;
    const updateData = { title, content, postedBy, categoryId };

    if (req.file) {
      updateData.featuredImage = req.file.path;
    }

    const [affectedRows] = await Post.update(updateData, {
      where: { id: req.params.id, userId: req.user.id },
    });

    if (affectedRows === 0) {
      return res.status(404).json({ error: "Post not found or you don't have permission to edit it" });
    }

    const updatedPost = await Post.findByPk(req.params.id);
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: "Error updating post" });
  }
});

// Route to delete a post
app.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const affectedRows = await Post.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (affectedRows === 0) {
      return res.status(404).json({ error: "Post not found or you don't have permission to delete it" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting post" });
  }
});

// export the router
module.exports = app;