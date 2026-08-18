// create a new router
const app = require("express").Router();

// import the models
const { Comment, User } = require("../models/index");

// import the auth middleware
const { authMiddleware } = require("../utils/auth");

// Route to get all comments for a post — public
app.get("/post/:postId", async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { postId: req.params.postId },
      include: { model: User, as: "author", attributes: ["id", "username"] },
      order: [["createdOn", "ASC"]],
    });

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving comments" });
  }
});

// Route to add a new comment
app.post("/", authMiddleware, async (req, res) => {
  try {
    const { content, postId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const comment = await Comment.create({
      content,
      postId,
      userId: req.user.id,
    });

    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: { model: User, as: "author", attributes: ["id", "username"] },
    });

    res.status(201).json(commentWithAuthor);
  } catch (error) {
    res.status(500).json({ error: "Error adding comment" });
  }
});

// Route to update a comment (only your own)
app.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const [affectedRows] = await Comment.update(
      { content },
      { where: { id: req.params.id, userId: req.user.id } }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: "Comment not found or you don't have permission to edit it" });
    }

    const updatedComment = await Comment.findByPk(req.params.id, {
      include: { model: User, as: "author", attributes: ["id", "username"] },
    });

    res.status(200).json(updatedComment);
  } catch (error) {
    res.status(500).json({ error: "Error updating comment" });
  }
});

// Route to delete a comment (only your own)
app.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const affectedRows = await Comment.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (affectedRows === 0) {
      return res.status(404).json({ error: "Comment not found or you don't have permission to delete it" });
    }

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting comment" });
  }
});

// export the router
module.exports = app;