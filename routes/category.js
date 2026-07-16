// create a new router
const app = require("express").Router();

// import the models
const { Category } = require("../models/index");

// import the auth middleware
const { authMiddleware } = require("../utils/auth");

// Route to add a new category
app.post("/", authMiddleware, async (req, res) => {
  try {
    const { category_name } = req.body;
    const category = await Category.create({ category_name });
    res.status(201).json(category);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error adding category", error: error });
  }
});

// Route to get all categories
app.get("/", authMiddleware, async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving categories", error: error });
  }
});

// Route to get a single category
app.get("/:id", authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving category" });
  }
});

// Route to update a category
app.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { category_name } = req.body;
    const [affectedRows] = await Category.update(
      { category_name },
      { where: { id: req.params.id } }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    const updatedCategory = await Category.findByPk(req.params.id);
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: "Error updating category" });
  }
});

// Route to delete a category
app.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const affectedRows = await Category.destroy({ where: { id: req.params.id } });

    if (affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting category" });
  }
});

// export the router
module.exports = app;