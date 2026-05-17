const { pool } = require("../config/database");

const buildTimestampWhere = (from, to, startIdx = 1) => {
  const conditions = [];
  const values = [];
  let idx = startIdx;
  if (from) { conditions.push(`timestamp >= $${idx++}`); values.push(new Date(from)); }
  if (to) { conditions.push(`timestamp <= $${idx++}`); values.push(new Date(to)); }
  return { conditions, values, nextIdx: idx };
};

const getActiveUsers = async (from, to) => {
  const { conditions, values } = buildTimestampWhere(from, to);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT COUNT(DISTINCT user_id) as "activeUsers" FROM events ${where}`,
    values
  );

  return {
    activeUsers: parseInt(result.rows[0].activeUsers),
    period: { from: from || null, to: to || null },
  };
};

const getPopularCourses = async (from, to, limit = 10) => {
  const conditions = ["type = 'course_enrolled'"];
  const values = [];
  let idx = 1;
  if (from) { conditions.push(`timestamp >= $${idx++}`); values.push(new Date(from)); }
  if (to) { conditions.push(`timestamp <= $${idx++}`); values.push(new Date(to)); }

  values.push(limit);
  const result = await pool.query(
    `SELECT
       metadata->>'courseId' as "_id",
       MAX(metadata->>'courseName') as "courseName",
       COUNT(*) as "enrollments"
     FROM events WHERE ${conditions.join(" AND ")}
     GROUP BY metadata->>'courseId'
     ORDER BY "enrollments" DESC
     LIMIT $${idx}`,
    values
  );

  return {
    courses: result.rows.map((r) => ({ ...r, enrollments: parseInt(r.enrollments) })),
    period: { from: from || null, to: to || null },
  };
};

const getTopTutors = async (from, to, limit = 10) => {
  const conditions = ["type IN ('session_completed', 'tutor_rating', 'match_accepted')"];
  const values = [];
  let idx = 1;
  if (from) { conditions.push(`timestamp >= $${idx++}`); values.push(new Date(from)); }
  if (to) { conditions.push(`timestamp <= $${idx++}`); values.push(new Date(to)); }

  values.push(limit);
  const result = await pool.query(
    `SELECT
       metadata->>'tutorId' as "_id",
       MAX(metadata->>'tutorName') as "tutorName",
       COUNT(*) as "interactions"
     FROM events WHERE ${conditions.join(" AND ")}
     GROUP BY metadata->>'tutorId'
     ORDER BY "interactions" DESC
     LIMIT $${idx}`,
    values
  );

  return {
    tutors: result.rows.map((r) => ({ ...r, interactions: parseInt(r.interactions) })),
    period: { from: from || null, to: to || null },
  };
};

const getSystemMetrics = async () => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total, r24h, r7d, r30d, bySource, byType] = await Promise.all([
    pool.query("SELECT COUNT(*) as count FROM events"),
    pool.query("SELECT COUNT(*) as count FROM events WHERE timestamp >= $1", [last24h]),
    pool.query("SELECT COUNT(*) as count FROM events WHERE timestamp >= $1", [last7d]),
    pool.query("SELECT COUNT(*) as count FROM events WHERE timestamp >= $1", [last30d]),
    pool.query("SELECT source as _id, COUNT(*) as count FROM events GROUP BY source ORDER BY count DESC"),
    pool.query("SELECT type as _id, COUNT(*) as count FROM events GROUP BY type ORDER BY count DESC"),
  ]);

  return {
    totalEvents: parseInt(total.rows[0].count),
    last24h: parseInt(r24h.rows[0].count),
    last7d: parseInt(r7d.rows[0].count),
    last30d: parseInt(r30d.rows[0].count),
    bySource: bySource.rows.map((r) => ({ _id: r._id, count: parseInt(r.count) })),
    byType: byType.rows.map((r) => ({ _id: r._id, count: parseInt(r.count) })),
  };
};

const getPeakHours = async (from, to) => {
  const { conditions, values } = buildTimestampWhere(from, to);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT EXTRACT(HOUR FROM timestamp)::int as hour, COUNT(*) as count
     FROM events ${where}
     GROUP BY hour
     ORDER BY count DESC`,
    values
  );

  return {
    peakHours: result.rows.map((r) => ({ hour: r.hour, count: parseInt(r.count) })),
    period: { from: from || null, to: to || null },
  };
};

const getDateRangeReport = async (from, to) => {
  if (!from || !to) {
    throw { status: 400, message: "Los parámetros from y to son obligatorios" };
  }

  const values = [new Date(from), new Date(to)];
  const where = "WHERE timestamp >= $1 AND timestamp <= $2";

  const [totalResult, uniqueUsersResult, byTypeResult, bySourceResult, byDayResult] = await Promise.all([
    pool.query(`SELECT COUNT(*) as count FROM events ${where}`, values),
    pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM events ${where}`, values),
    pool.query(`SELECT type as "_id", COUNT(*) as count FROM events ${where} GROUP BY type ORDER BY count DESC`, values),
    pool.query(`SELECT source as "_id", COUNT(*) as count FROM events ${where} GROUP BY source ORDER BY count DESC`, values),
    pool.query(
      `SELECT TO_CHAR(timestamp, 'YYYY-MM-DD') as date, COUNT(*) as count
       FROM events ${where}
       GROUP BY date
       ORDER BY date ASC`,
      values
    ),
  ]);

  return {
    period: { from, to },
    totalEvents: parseInt(totalResult.rows[0].count),
    uniqueUsers: parseInt(uniqueUsersResult.rows[0].count),
    byType: byTypeResult.rows.map((r) => ({ _id: r._id, count: parseInt(r.count) })),
    bySource: bySourceResult.rows.map((r) => ({ _id: r._id, count: parseInt(r.count) })),
    dailyBreakdown: byDayResult.rows.map((r) => ({ date: r.date, count: parseInt(r.count) })),
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

module.exports = {
  getActiveUsers,
  getPopularCourses,
  getTopTutors,
  getSystemMetrics,
  getPeakHours,
  getDateRangeReport,
};
