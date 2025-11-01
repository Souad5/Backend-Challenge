// controllers/productController.js
const { getDB, ObjectId } = require("../db/db");
const { generateProductCode } = require("../utils/generateProductCode");

const createProduct = async (req, res) => {
  try {
    const db = getDB();
    const { name, description, price, discount, image, status, categoryId } = req.body;

    // Full validation
    if (!name?.trim() || !description?.trim() || !image?.trim() || !status || !categoryId) {
      return res.status(400).json({ error: "All fields are required: name, description, image, status, categoryId" });
    }

    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    if (discount != null && (discount < 0 || discount > 100)) {
      return res.status(400).json({ error: "Discount must be 0–100" });
    }

    if (!["In Stock", "Stock Out"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'In Stock' or 'Stock Out'" });
    }

    // Validate category
    let categoryObjId;
    try {
      categoryObjId = new ObjectId(categoryId);
    } catch {
      return res.status(400).json({ error: "Invalid categoryId format" });
    }

    const category = await db.collection("categories").findOne({ _id: categoryObjId });
    if (!category) return res.status(400).json({ error: "Category not found" });

    // Generate unique product code
    const productCode = await generateProductCode(name.trim(), db);

    // Insert product
    const newProduct = {
      name: name.trim(),
      description: description.trim(),
      price,
      discount: discount || 0,
      image: image.trim(),
      status,
      productCode,
      categoryId: categoryObjId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("products").insertOne(newProduct);
    const inserted = { ...newProduct, _id: result.insertedId };

    res.status(201).json({
      success: true,
      message: "Product created",
      data: {
        ...inserted,
        originalPrice: inserted.price,
        finalPrice: inserted.price * (1 - inserted.discount / 100),
        category: category.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { status, description, discount } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    if (!status && !description && discount == null) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updates = { updatedAt: new Date() };
    if (status) {
      if (!["In Stock", "Stock Out"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'In Stock' or 'Stock Out'" });
      }
      updates.status = status;
    }
    if (description) updates.description = description.trim();
    if (discount != null) {
      if (discount < 0 || discount > 100) {
        return res.status(400).json({ error: "Discount must be 0–100" });
      }
      updates.discount = discount;
    }

    const updated = await db.collection("products").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!updated.value) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = updated.value;
    const category = await db.collection("categories").findOne({ _id: product.categoryId });

    res.json({
      success: true,
      data: {
        ...product,
        originalPrice: product.price,
        finalPrice: product.price * (1 - product.discount / 100),
        category: category?.name || null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const db = getDB();
    const { category, search } = req.query;

    const query = {};
    if (category && ObjectId.isValid(category)) {
      query.categoryId = new ObjectId(category);
    }
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const products = await db.collection("products").aggregate([
      { $match: query },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          discount: 1,
          image: 1,
          status: 1,
          productCode: 1,
          createdAt: 1,
          updatedAt: 1,
          finalPrice: {
            $subtract: [
              "$price",
              {
                $multiply: [
                  "$price",
                  { $divide: [{ $ifNull: ["$discount", 0] }, 100] },
                ],
              },
            ],
          },
          category: "$categoryDetails.name",
        },
      },
    ]).toArray();

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

module.exports = { createProduct, updateProduct, getProducts };