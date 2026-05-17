const express = require("express");
const cors = require("cors");
const eventRoutes = require("./routes/events");
const reportRoutes = require("./routes/reports");
const authRoutes = require("./routes/auth");
const { authenticateToken } = require("./middlewares/authMiddleware");
const { connectDB } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3003;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Endpoint temporal de autenticación (pruebas locales)
app.use("/auth", authRoutes);

// POST /events es público para comunicación servicio-a-servicio
// Las demás rutas de /events requieren autenticación
const authOrInternal = (req, res, next) => {
  if (req.method === "POST" && req.path === "/") {
    return next();
  }
  return authenticateToken(req, res, next);
};
app.use("/events", authOrInternal, eventRoutes);
app.use("/reports", authenticateToken, reportRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "analytics-service" });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Analytics Service corriendo en http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
