import mysql from 'mysql2/promise';

// Konfigurasi database
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'si_surat',
  port: parseInt(process.env.DB_PORT || '3306'),
};

// Create connection pool
export const db = mysql.createPool(dbConfig);

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