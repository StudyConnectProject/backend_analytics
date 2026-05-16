const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/analyticsdb";

const connectDB = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB (Analytics) conectado");
};

module.exports = connectDB;
