// controllers/categoryController.js
const { getDB, ObjectId } = require("../db/db");

const createCategory = async (req, res) => {
  try {
    const db = getDB();
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const existing = await db.collection("categories").findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const result = await db.collection("categories").insertOne({
      name: name.trim(),
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      data: { _id: result.insertedId, name: name.trim() },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

module.exports = { createCategory };