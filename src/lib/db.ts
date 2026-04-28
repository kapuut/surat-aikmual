import mysql from 'mysql2/promise';

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getDbConfigFromUrl() {
  const rawUrl =
    process.env.DB_URL ||
    process.env.DATABASE_URL ||
    process.env.MYSQL_PUBLIC_URL ||
    process.env.MYSQL_URL;

  if (!rawUrl || !rawUrl.startsWith('mysql://')) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);
    return {
      host: parsed.hostname,
      user: decodeURIComponent(parsed.username || ''),
      password: decodeURIComponent(parsed.password || ''),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '') || ''),
      port: parsed.port ? toInt(parsed.port, 3306) : 3306,
    };
  } catch {
    return null;
  }
}

const dbConfigFromUrl = getDbConfigFromUrl();

// Konfigurasi database
const dbConfig = {
  host: dbConfigFromUrl?.host || process.env.DB_HOST || process.env.MYSQL_HOST || process.env.MYSQLHOST || 'localhost',
  user: dbConfigFromUrl?.user || process.env.DB_USER || process.env.MYSQL_USER || process.env.MYSQLUSER || 'root',
  password:
    dbConfigFromUrl?.password ||
    process.env.DB_PASSWORD ||
    process.env.MYSQL_PASSWORD ||
    process.env.MYSQLPASSWORD ||
    process.env.MYSQL_ROOT_PASSWORD ||
    '',
  database:
    dbConfigFromUrl?.database ||
    process.env.DB_NAME ||
    process.env.MYSQL_DATABASE ||
    process.env.MYSQLDATABASE ||
    'si_surat',
  port:
    dbConfigFromUrl?.port ||
    toInt(process.env.DB_PORT, toInt(process.env.MYSQL_PORT, toInt(process.env.MYSQLPORT, 3306))),
  waitForConnections: true,
  connectionLimit: toInt(process.env.DB_CONNECTION_LIMIT, 3),
  queueLimit: 0,
};

type GlobalWithDbPool = typeof globalThis & {
  __siSuratDbPool?: mysql.Pool;
};

const globalForDb = globalThis as GlobalWithDbPool;

// Reuse the same pool across hot reloads in development.
export const db = globalForDb.__siSuratDbPool || mysql.createPool(dbConfig);

if (!globalForDb.__siSuratDbPool) {
  globalForDb.__siSuratDbPool = db;
}

// Test connection
export async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Helper function to execute queries
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const [results] = await db.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}