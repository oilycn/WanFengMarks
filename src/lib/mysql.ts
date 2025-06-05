
import mysql from 'mysql2/promise';

const { MYSQL_CONNECTION_STRING } = process.env;

if (!MYSQL_CONNECTION_STRING) {
  throw new Error(
    'Please define the MYSQL_CONNECTION_STRING environment variable inside .env.local. Format: mysql://user:password@host:port/database'
  );
}

interface MySQLPool extends mysql.Pool {
  getConnection(): Promise<mysql.PoolConnection>;
}

let pool: MySQLPool | null = null;

function getPool(): MySQLPool {
  if (pool) {
    return pool;
  }
  pool = mysql.createPool({
    uri: MYSQL_CONNECTION_STRING,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }) as MySQLPool;

  console.log('MySQL connection pool created using connection string.');
  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const connectionPool = getPool();
  try {
    const [results] = await connectionPool.execute(sql, params);
    return results as T;
  } catch (error) {
    console.error('MySQL query error:', error);
    throw new Error('Database query failed.');
  }
}

export async function connectToDatabase(): Promise<mysql.PoolConnection> {
    const connectionPool = getPool();
    try {
        const connection = await connectionPool.getConnection();
        // console.log('Successfully connected to MySQL database via pool.');
        return connection;
    } catch (error) {
        console.error('Failed to connect to MySQL:', error);
        throw new Error('Could not connect to database.');
    }
}


/*
IMPORTANT: SQL Table Definitions
Run these commands in your MySQL database ONCE to set up the necessary tables if you haven't used the in-app initializer.

1. Config Table (for admin password and setup status):
CREATE TABLE IF NOT EXISTS config (
  config_key VARCHAR(255) PRIMARY KEY,
  config_value TEXT
);

2. Categories Table:
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT 'Folder',
  is_visible BOOLEAN DEFAULT TRUE,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

3. Bookmarks Table:
CREATE TABLE IF NOT EXISTS bookmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  category_id INT,
  description TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
*/

