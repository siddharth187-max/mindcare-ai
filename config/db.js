// config/db.js
// This file is responsible for ONE thing: connecting to MongoDB Atlas.

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI || process.env.MONGO_URI.includes("<username>")) {
      console.warn("\n[MindCare Notice]: MONGO_URI is not configured or contains placeholders in .env.");
      console.warn("The server will start in Standalone / API mode.");
      console.warn("To connect to a live MongoDB database, update MONGO_URI in your .env file.\n");
      return null;
    }

    // mongoose.connect() reads the connection string from .env
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`\n[MindCare Notice]: MongoDB connection failed: ${error.message}`);
    console.warn("The server will continue running so the frontend and API can be accessed.\n");
    return null;
  }
};

module.exports = connectDB;
