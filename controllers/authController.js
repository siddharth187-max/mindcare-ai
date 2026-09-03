// controllers/authController.js
// Handles account creation and login.

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @route  POST /api/auth/register
// @desc   Create a new user (patient or caregiver)
// @access Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // --- basic validation ---
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please provide name, email, password and role" });
    }
    if (!["patient", "caregiver"].includes(role)) {
      return res.status(400).json({ message: "Role must be either 'patient' or 'caregiver'" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // check if a user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    // hash the password before saving - NEVER store plain text passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    const token = generateToken(user._id, user.role);

    // respond WITHOUT the password field
    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
};

// @route  POST /api/auth/login
// @desc   Log a user in and return a JWT
// @access Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // .select("+password") because the schema hides password by default
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

// @route  GET /api/auth/me
// @desc   Get the currently logged-in user's info
// @access Private
const getMe = async (req, res) => {
  // req.user is set by authMiddleware.protect
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = { register, login, getMe };
