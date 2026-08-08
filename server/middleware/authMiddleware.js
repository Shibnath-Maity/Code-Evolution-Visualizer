const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  console.log("🔐 Auth middleware reached");

  let token;

  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader);

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("✅ Token verified");
      console.log("Decoded User:", decoded);

      req.user = decoded;

      next();
    } catch (err) {
      console.log("❌ JWT Verify Error:", err.message);

      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } else {
    console.log("❌ No Authorization Header");

    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }
};

module.exports = protect;