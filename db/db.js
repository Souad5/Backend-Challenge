// db/db.js
const { MongoClient, ObjectId } = require("mongodb");

let db;

const connectDB = async () => {
  if (db) return db;

  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;

  if (!uri || !dbName) {
    throw new Error("MONGO_URI and DB_NAME must be defined in .env");
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log(`MongoDB connected to: ${dbName}`);
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) throw new Error("Database not connected. Call connectDB first.");
  return db;
};

module.exports = { connectDB, getDB, ObjectId };