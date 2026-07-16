// create a new router
const app = require("express").Router();

// import the models
const { Post, Category } = require("../models/index");

// import the auth middleware
const { authMiddleware } = require("../utils/auth");

// Route to add a new post
app.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content, postedBy, categoryId } = req.body;
    const post = await Post.create({
      title,
      content,
      postedBy,
      categoryId,
      userId: req.user.id,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: "Error adding post" });
  }
});

// Route to get all posts — optionally filtered by category via ?categoryId=X
app.get("/", authMiddleware, async (req, res) => {
  try {
    const { categoryId } = req.query;
    const whereClause = categoryId ? { categoryId } : {};

    const posts = await Post.findAll({
      where: whereClause,
      include: { model: Category, as: "category" },
      order: [["createdOn", "DESC"]],
    });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving posts", error });
  }
});

app.get("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: { model: Category, as: "category" },
    });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving post" });
  }
});

// Route to update a post
app.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content, postedBy, categoryId } = req.body;
    const [affectedRows] = await Post.update(
      { title, content, postedBy, categoryId },
      { where: { id: req.params.id, userId: req.user.id } }
    );

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