// routes/categoryRoutes.js
const express = require("express");
const { createCategory } = require("../controllers/categoryController");

const router = express.Router();

router.post("/", createCategory);

module.exports = router;