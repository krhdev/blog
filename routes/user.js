const router = require("express").Router();
const { User, Post } = require("../models");
const { signToken, authMiddleware } = require("../utils/auth");

// Get current authenticated user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
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
      attributes: { exclude: ["password"] },
    });
    res.status(200).json(users);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post("/", async (req, res) => {
  try {
    const userData = await User.create(req.body);

    const token = signToken(userData);

    // Strip the password hash before sending the user object back
    const safeUser = userData.toJSON();
    delete safeUser.password;

    res.status(200).json({ token, userData: safeUser });
  } catch (err) {
    res.status(400).json(err);
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

    // Strip the password hash before sending the user object back
    const safeUser = userData.toJSON();
    delete safeUser.password;

    res.status(200).json({ token, userData: safeUser });
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

router.post("/logout", (req, res) => {
  res.status(204).end();
});

module.exports = router;