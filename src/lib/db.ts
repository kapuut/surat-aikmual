import mysql from 'mysql2/promise';

// Konfigurasi database
const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'si_surat',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '3'),
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