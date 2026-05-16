const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const reportService = require("../src/services/reportService");
const Event = require("../src/models/Event");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Event.deleteMany({});
});

const seedEvents = async () => {
  const now = new Date();
  const events = [
    { type: "login", source: "user-service", userId: "user-001", timestamp: now },
    { type: "login", source: "user-service", userId: "user-002", timestamp: now },
    { type: "login", source: "user-service", userId: "user-003", timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    { type: "course_enrolled", source: "course-service", userId: "user-001", metadata: { courseId: "c1", courseName: "React Basics" }, timestamp: now },
    { type: "course_enrolled", source: "course-service", userId: "user-002", metadata: { courseId: "c1", courseName: "React Basics" }, timestamp: now },
    { type: "course_enrolled", source: "course-service", userId: "user-003", metadata: { courseId: "c2", courseName: "Node.js Avanzado" }, timestamp: now },
    { type: "session_completed", source: "matching-service", userId: "user-001", metadata: { tutorId: "tutor-001", tutorName: "Carlos M." }, timestamp: now },
    { type: "session_completed", source: "matching-service", userId: "user-002", metadata: { tutorId: "tutor-001", tutorName: "Carlos M." }, timestamp: now },
    { type: "session_completed", source: "matching-service", userId: "user-003", metadata: { tutorId: "tutor-002", tutorName: "Ana T." }, timestamp: now },
    { type: "message_sent", source: "chat-service", userId: "user-001", timestamp: now },
  ];
  await Event.insertMany(events);
};

describe("reportService", () => {
  test("getActiveUsers cuenta usuarios únicos", async () => {
    await seedEvents();
    const result = await reportService.getActiveUsers();
    expect(result.activeUsers).toBe(3);
  });

  test("getPopularCourses retorna cursos ordenados por popularidad", async () => {
    await seedEvents();
    const result = await reportService.getPopularCourses();
    expect(result.courses.length).toBe(2);
    expect(result.courses[0].enrollments).toBe(2);
    expect(result.courses[0].courseName).toBe("React Basics");
  });

  test("getTopTutors retorna tutores por interacciones", async () => {
    await seedEvents();
    const result = await reportService.getTopTutors();
    expect(result.tutors.length).toBe(2);
    expect(result.tutors[0].interactions).toBe(2);
    expect(result.tutors[0].tutorName).toBe("Carlos M.");
  });

  test("getSystemMetrics retorna métricas generales", async () => {
    await seedEvents();
    const result = await reportService.getSystemMetrics();
    expect(result.totalEvents).toBe(10);
    expect(result.last24h).toBeGreaterThanOrEqual(7);
    expect(result.bySource.length).toBeGreaterThan(0);
    expect(result.byType.length).toBeGreaterThan(0);
  });

  test("getPeakHours retorna horas con más actividad", async () => {
    await seedEvents();
    const result = await reportService.getPeakHours();
    expect(result.peakHours.length).toBeGreaterThan(0);
    expect(result.peakHours[0]).toHaveProperty("hour");
    expect(result.peakHours[0]).toHaveProperty("count");
  });

  test("getDateRangeReport genera reporte completo", async () => {
    await seedEvents();
    const now = new Date();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const to = now.toISOString();

    const result = await reportService.getDateRangeReport(from, to);
    expect(result.totalEvents).toBe(10);
    expect(result.uniqueUsers).toBe(3);
    expect(result.byType.length).toBeGreaterThan(0);
    expect(result.bySource.length).toBeGreaterThan(0);
    expect(result.dailyBreakdown.length).toBeGreaterThan(0);
  });

  test("getDateRangeReport lanza error sin from/to", async () => {
    await expect(reportService.getDateRangeReport()).rejects.toMatchObject({
      status: 400,
    });
  });
});
