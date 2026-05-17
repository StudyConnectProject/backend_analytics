const { pool } = require("../config/database");

const register = async ({ type, source, userId, metadata, timestamp }) => {
  if (!type || !source || !userId) {
    throw { status: 400, message: "Los campos type, source y userId son obligatorios" };
  }

  const result = await pool.query(
    `INSERT INTO events (type, source, user_id, metadata, timestamp)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [type, source, userId, JSON.stringify(metadata || {}), timestamp || new Date()]
  );
  return result.rows[0];
};

const buildWhereClause = ({ type, source, userId, from, to }, startIdx = 1) => {
  const conditions = [];
  const values = [];
  let idx = startIdx;

  if (type) { conditions.push(`type = $${idx++}`); values.push(type); }
  if (source) { conditions.push(`source = $${idx++}`); values.push(source); }
  if (userId) { conditions.push(`user_id = $${idx++}`); values.push(userId); }
  if (from) { conditions.push(`timestamp >= $${idx++}`); values.push(new Date(from)); }
  if (to) { conditions.push(`timestamp <= $${idx++}`); values.push(new Date(to)); }

  return { conditions, values, nextIdx: idx };
};

const query = async ({ type, source, userId, from, to, page = 1, limit = 20 }) => {
  const { conditions, values } = buildWhereClause({ type, source, userId, from, to });
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  const [eventsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT * FROM events ${where} ORDER BY timestamp DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) as count FROM events ${where}`, values),
  ]);

  const total = parseInt(countResult.rows[0].count);
  return {
    events: eventsResult.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getById = async (id) => {
  const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
  return result.rows[0] || null;
};

const remove = async (id) => {
  const result = await pool.query("DELETE FROM events WHERE id = $1 RETURNING *", [id]);
  return result.rows[0] || null;
};

const getUserActivity = async (userId, from, to) => {
  const conditions = ["user_id = $1"];
  const values = [userId];
  let idx = 2;

  if (from) { conditions.push(`timestamp >= $${idx++}`); values.push(new Date(from)); }
  if (to) { conditions.push(`timestamp <= $${idx++}`); values.push(new Date(to)); }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const [eventsResult, byTypeResult, countResult] = await Promise.all([
    pool.query(`SELECT * FROM events ${where} ORDER BY timestamp DESC LIMIT 100`, values),
    pool.query(`SELECT type, COUNT(*) as count FROM events ${where} GROUP BY type ORDER BY count DESC`, values),
    pool.query(`SELECT COUNT(*) as count FROM events ${where}`, values),
  ]);

  return {
    userId,
    totalEvents: parseInt(countResult.rows[0].count),
    byType: byTypeResult.rows.map((r) => ({ _id: r.type, count: parseInt(r.count) })),
    recentEvents: eventsResult.rows,
  };
};

module.exports = { register, query, getById, remove, getUserActivity };
