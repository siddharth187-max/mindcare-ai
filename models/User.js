// models/User.js
// Represents anyone who can log in: either a "patient" or a "caregiver".

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    default: "+91 98765 43210",
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
    select: false, // never return password field by default in queries
  },
  role: {
    type: String,
    enum: ["patient", "caregiver"],
    required: [true, "Role is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
