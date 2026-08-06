const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }
};

module.exports = protect;