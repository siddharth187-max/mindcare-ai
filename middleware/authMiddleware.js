// middleware/authMiddleware.js
// Checks that a valid JWT was sent in the request, and attaches the
// logged-in user's info to req.user so later code knows who's asking.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // We expect the header: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    // Verify the token using our secret. Throws if invalid/expired.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user (without password) and attach to req for later use
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user no longer exists" });
    }

    req.user = user; // now available in every controller after this middleware
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = { protect };
