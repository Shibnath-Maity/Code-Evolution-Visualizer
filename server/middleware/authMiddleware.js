
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  console.log("🔐 Auth middleware reached");

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ No valid Authorization Header");

    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("✅ Token verified");

    // Make the authenticated user available to every protected route.
    req.user = decoded;

    // Optional convenience property.
    req.userId = decoded.id || decoded.userId || decoded._id;

    if (!req.userId) {
      console.log("❌ Token does not contain a user ID");

      return res.status(401).json({
        success: false,
        message: "Invalid token: user ID missing",
      });
    }

    console.log("👤 Authenticated User:", req.userId);

    next();
  } catch (err) {
    console.log("❌ JWT Verify Error:", err.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;

