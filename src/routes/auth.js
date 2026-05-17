const { Router } = require("express");
const jwt = require("jsonwebtoken");

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Endpoint de prueba — solo disponible fuera de producción.
if (process.env.NODE_ENV !== "production") {
router.post("/test-token", (req, res) => {
  const { userId, email, role } = req.body;

  const payload = {
    userId: userId || "test-user-123",
    email: email || "test@example.com",
    role: role || "student",
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.status(200).json({
    temporary: true,
    message: "Token temporal generado para pruebas locales.",
    token,
    payload,
    expiresIn: JWT_EXPIRES_IN,
  });
});
}

module.exports = router;
