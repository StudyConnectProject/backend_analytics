const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: La variable de entorno DATABASE_URL no está configurada.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const connectDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR NOT NULL,
        source VARCHAR NOT NULL,
        user_id VARCHAR NOT NULL,
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
      CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
      CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_events_type_ts ON events(type, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_events_uid_ts ON events(user_id, timestamp DESC);
    `);
    console.log("PostgreSQL (Analytics) conectado");
  } finally {
    client.release();
  }
};

module.exports = { pool, connectDB };
