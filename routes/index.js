const router = require("express").Router();

const postRoutes = require("./post");
const categoryRoutes = require("./category");
const userRoutes = require("./user");
const commentRoutes = require("./comments");
const digestRoutes = require("./digest");

// create a default route for /api
router.get("/api", (req, res) => {
  res.json({ message: "Welcome to the API" });
});

router.use("/api/categories", categoryRoutes);
router.use("/api/posts", postRoutes);
router.use("/api/users", userRoutes);
router.use("/api/comments", commentRoutes);
router.use("/api/digest", digestRoutes);

module.exports = router;