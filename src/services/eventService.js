const Event = require("../models/Event");

const register = async ({ type, source, userId, metadata, timestamp }) => {
  if (!type || !source || !userId) {
    throw { status: 400, message: "Los campos type, source y userId son obligatorios" };
  }

  return await Event.create({
    type,
    source,
    userId,
    metadata: metadata || {},
    timestamp: timestamp || new Date(),
  });
};

const query = async ({ type, source, userId, from, to, page = 1, limit = 20 }) => {
  const filter = {};

  if (type) filter.type = type;
  if (source) filter.source = source;
  if (userId) filter.userId = userId;

  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getById = async (id) => {
  return await Event.findById(id);
};

const remove = async (id) => {
  const event = await Event.findById(id);
  if (!event) return null;

  await event.deleteOne();
  return event;
};

const getUserActivity = async (userId, from, to) => {
  const filter = { userId };

  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }

  const [events, byType] = await Promise.all([
    Event.find(filter).sort({ timestamp: -1 }).limit(100),
    Event.aggregate([
      { $match: filter },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    userId,
    totalEvents: await Event.countDocuments(filter),
    byType,
    recentEvents: events,
  };
};

module.exports = { register, query, getById, remove, getUserActivity };
