const Event = require("../models/Event");

const getActiveUsers = async (from, to) => {
  const filter = {};
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }

  const result = await Event.aggregate([
    { $match: filter },
    { $group: { _id: "$userId" } },
    { $count: "activeUsers" },
  ]);

  return {
    activeUsers: result.length > 0 ? result[0].activeUsers : 0,
    period: { from: from || null, to: to || null },
  };
};

const getPopularCourses = async (from, to, limit = 10) => {
  const filter = { type: "course_enrolled" };
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }

  const result = await Event.aggregate([
    { $match: filter },
    { $group: { _id: "$metadata.courseId", courseName: { $first: "$metadata.courseName" }, enrollments: { $sum: 1 } } },
    { $sort: { enrollments: -1 } },
    { $limit: limit },
  ]);

  return { courses: result, period: { from: from || null, to: to || null } };
};

const getTopTutors = async (from, to, limit = 10) => {
  const filter = { type: { $in: ["session_completed", "tutor_rating", "match_accepted"] } };
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }

  const result = await Event.aggregate([
    { $match: filter },
    { $group: { _id: "$metadata.tutorId", tutorName: { $first: "$metadata.tutorName" }, interactions: { $sum: 1 } } },
    { $sort: { interactions: -1 } },
    { $limit: limit },
  ]);

  return { tutors: result, period: { from: from || null, to: to || null } };
};

const getSystemMetrics = async () => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total, last24hCount, last7dCount, last30dCount, bySource, byType] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({ timestamp: { $gte: last24h } }),
    Event.countDocuments({ timestamp: { $gte: last7d } }),
    Event.countDocuments({ timestamp: { $gte: last30d } }),
    Event.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Event.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    totalEvents: total,
    last24h: last24hCount,
    last7d: last7dCount,
    last30d: last30dCount,
    bySource,
    byType,
  };
};

const getPeakHours = async (from, to) => {
  const filter = {};
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);
  }

  const result = await Event.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $hour: "$timestamp" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $project: { _id: 0, hour: "$_id", count: 1 } },
  ]);

  return {
    peakHours: result,
    period: { from: from || null, to: to || null },
  };
};

const getDateRangeReport = async (from, to) => {
  if (!from || !to) {
    throw { status: 400, message: "Los parámetros from y to son obligatorios" };
  }

  const filter = {
    timestamp: { $gte: new Date(from), $lte: new Date(to) },
  };

  const [totalEvents, uniqueUsers, byType, bySource, byDay] = await Promise.all([
    Event.countDocuments(filter),
    Event.distinct("userId", filter).then((ids) => ids.length),
    Event.aggregate([
      { $match: filter },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Event.aggregate([
      { $match: filter },
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Event.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]),
  ]);

  return {
    period: { from, to },
    totalEvents,
    uniqueUsers,
    byType,
    bySource,
    dailyBreakdown: byDay,
  };
};

module.exports = {
  getActiveUsers,
  getPopularCourses,
  getTopTutors,
  getSystemMetrics,
  getPeakHours,
  getDateRangeReport,
};
