const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const eventService = require("../src/services/eventService");
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

describe("eventService", () => {
  const sampleEvent = {
    type: "login",
    source: "user-service",
    userId: "user-001",
    metadata: { ip: "192.168.1.1" },
  };

  test("register crea un evento correctamente", async () => {
    const event = await eventService.register(sampleEvent);
    expect(event.type).toBe("login");
    expect(event.source).toBe("user-service");
    expect(event.userId).toBe("user-001");
    expect(event.metadata.ip).toBe("192.168.1.1");
    expect(event.timestamp).toBeDefined();
  });

  test("register lanza error 400 sin campos obligatorios", async () => {
    await expect(eventService.register({ type: "login" })).rejects.toMatchObject({
      status: 400,
    });
  });

  test("query retorna eventos paginados", async () => {
    for (let i = 0; i < 25; i++) {
      await eventService.register({ ...sampleEvent, metadata: { index: i } });
    }

    const result = await eventService.query({ page: 1, limit: 10 });
    expect(result.events.length).toBe(10);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.totalPages).toBe(3);
  });

  test("query filtra por type y source", async () => {
    await eventService.register(sampleEvent);
    await eventService.register({ ...sampleEvent, type: "logout" });
    await eventService.register({ ...sampleEvent, source: "chat-service" });

    const byType = await eventService.query({ type: "login" });
    expect(byType.pagination.total).toBe(2);

    const bySource = await eventService.query({ source: "chat-service" });
    expect(bySource.pagination.total).toBe(1);
  });

  test("getById retorna un evento por ID", async () => {
    const created = await eventService.register(sampleEvent);
    const found = await eventService.getById(created._id);
    expect(found).not.toBeNull();
    expect(found.type).toBe("login");
  });

  test("getById retorna null para ID inexistente", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const found = await eventService.getById(fakeId);
    expect(found).toBeNull();
  });

  test("remove elimina un evento", async () => {
    const created = await eventService.register(sampleEvent);
    const removed = await eventService.remove(created._id);
    expect(removed).not.toBeNull();

    const found = await eventService.getById(created._id);
    expect(found).toBeNull();
  });

  test("getUserActivity retorna actividad del usuario", async () => {
    await eventService.register(sampleEvent);
    await eventService.register({ ...sampleEvent, type: "page_view" });
    await eventService.register({ ...sampleEvent, type: "page_view" });

    const activity = await eventService.getUserActivity("user-001");
    expect(activity.userId).toBe("user-001");
    expect(activity.totalEvents).toBe(3);
    expect(activity.byType.length).toBe(2);
  });
});
