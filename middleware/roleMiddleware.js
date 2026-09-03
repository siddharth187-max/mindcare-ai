// middleware/roleMiddleware.js
// Restricts a route to only certain roles, e.g. only "caregiver".
// Must be used AFTER authMiddleware.protect, since it relies on req.user.

/**
 * Usage: router.get("/dashboard", protect, authorizeRoles("caregiver"), handler)
 * @param  {...string} allowedRoles - roles permitted to access the route
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: requires role(s) ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
