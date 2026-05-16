const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/index");

const SECRET = process.env.JWT_SECRET || "dev-temporal-secret-change-me";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("auth middleware and protected routes", () => {
  test("GET /events responde 401 sin token", async () => {
    const res = await request(app).get("/events");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token no proporcionado");
  });

  test("POST /auth/test-token genera token temporal", async () => {
    const res = await request(app)
      .post("/auth/test-token")
      .send({ userId: "u123", email: "u123@test.com", role: "student" });

    expect(res.status).toBe(200);
    expect(res.body.temporary).toBe(true);
    expect(typeof res.body.token).toBe("string");
  });

  test("GET /events responde 200 con token valido", async () => {
    const token = jwt.sign(
      { userId: "u123", email: "u123@test.com", role: "student" },
      SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/events")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("GET /reports/system-metrics responde 401 sin token", async () => {
    const res = await request(app).get("/reports/system-metrics");
    expect(res.status).toBe(401);
  });

  test("GET /health responde 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("analytics-service");
  });

  test("GET /ruta-inexistente responde 404", async () => {
    const res = await request(app).get("/ruta-inexistente");
    expect(res.status).toBe(404);
  });
});
