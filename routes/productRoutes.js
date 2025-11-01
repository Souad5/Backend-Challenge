// routes/productRoutes.js
const express = require("express");
const { createProduct, updateProduct, getProducts } = require("../controllers/productController");

const router = express.Router();

router.post("/", createProduct);
router.put("/:id", updateProduct);
router.get("/", getProducts);

module.exports = router;