const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("ERROR: La variable de entorno JWT_SECRET no está configurada.");
  process.exit(1);
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.sub || decoded.userId,
      email: decoded.email,
      roles: decoded.roles || [],
      role: decoded.roles ? decoded.roles[0]?.toLowerCase() : decoded.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido o expirado" });
  }
};

module.exports = { authenticateToken };
