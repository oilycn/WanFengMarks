
import mysql from 'mysql2/promise';

const { MYSQL_CONNECTION_STRING } = process.env;

console.log('[MySQL Lib] Initializing. MYSQL_CONNECTION_STRING from env:', MYSQL_CONNECTION_STRING ? '********(found)' : 'NOT FOUND');

if (!MYSQL_CONNECTION_STRING) {
  console.error('[MySQL Lib] CRITICAL: MYSQL_CONNECTION_STRING environment variable is not defined.');
  throw new Error(
    'Please define the MYSQL_CONNECTION_STRING environment variable inside .env.local. Format: mysql://user:password@host:port/database'
  );
} else {
  try {
    // Attempt to parse to catch malformed URIs early, log parts for confirmation
    const urlParts = new URL(MYSQL_CONNECTION_STRING);
    console.log(`[MySQL Lib] MYSQL_CONNECTION_STRING seems well-formed. Host: ${urlParts.hostname}, DB: ${urlParts.pathname.substring(1)}, User: ${urlParts.username || '(not specified)'}`);
  } catch (e: any) {
    console.error(`[MySQL Lib] Error parsing MYSQL_CONNECTION_STRING: ${e.message}. Ensure it is a valid URI.`);
    // Do not log the full string here in case of sensitive info, but indicate a problem
  }
}

interface MySQLPool extends mysql.Pool {
  getConnection(): Promise<mysql.PoolConnection>;
}

let pool: MySQLPool | null = null;
let poolError: Error | null = null; // To store pool creation error

function getPool(): MySQLPool {
  if (poolError) {
    console.error('[MySQL Lib] getPool: Returning null because pool creation previously failed.', poolError);
    throw poolError;
  }
  if (pool) {
    return pool;
  }
  try {
    console.log('[MySQL Lib] getPool: Attempting to create MySQL connection pool...');
    pool = mysql.createPool({
      uri: MYSQL_CONNECTION_STRING,
      waitForConnections: true,
      connectionLimit: 10, // Default is 10
      queueLimit: 0, // Default, no limit on queued connections
      // Adding connection attributes for potential debugging in MySQL server logs
      connectionAttributes: {
        source_tag: 'wanfeng-marks-app',
        program_name: 'wanfeng-marks-nextjs'
      }
    }) as MySQLPool;
    console.log('[MySQL Lib] getPool: MySQL connection pool created successfully.');
    return pool;
  } catch (error: any) {
    console.error('[MySQL Lib] getPool: CRITICAL error during mysql.createPool():', error.message, error);
    poolError = error;
    throw error;
  }
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const sanitizedSql = sql.substring(0, 150) + (sql.length > 150 ? '...' : '');
  console.log(`[MySQL Lib] query: Executing SQL (sanitized): ${sanitizedSql}`, params ? params : '(no params)');
  let connectionPool;
  try {
    connectionPool = getPool();
  } catch (error: any) {
    console.error(`[MySQL Lib] query: Failed to get pool for SQL: ${sanitizedSql}. Error: ${error.message}`, error);
    throw new Error('Database query failed: Could not establish connection pool.');
  }

  try {
    const [results] = await connectionPool.execute(sql, params);
    console.log(`[MySQL Lib] query: SQL executed successfully. Result count (if array): ${Array.isArray(results) ? results.length : 'N/A'}`);
    return results as T;
  } catch (error: any) {
    console.error(`[MySQL Lib] query: MySQL query execution error for SQL: ${sanitizedSql}. Message: ${error.message}`, error);
    if (error.sqlMessage) console.error('[MySQL Lib] query: SQL Message:', error.sqlMessage);
    if (error.sqlState) console.error('[MySQL Lib] query: SQL State:', error.sqlState);
    if (error.errno) console.error('[MySQL Lib] query: Error Number:', error.errno);
    throw new Error(`Database query failed: ${error.message || 'Unknown database error'}`);
  }
}

export async function connectToDatabase(): Promise<mysql.PoolConnection> {
  console.log('[MySQL Lib] connectToDatabase: Attempting to get a connection from pool...');
  let connectionPool;
  try {
    connectionPool = getPool();
  } catch (error: any) {
    console.error(`[MySQL Lib] connectToDatabase: Failed to get pool. Error: ${error.message}`, error);
    throw new Error('Could not connect to database: Connection pool unavailable.');
  }
  
  try {
    const connection = await connectionPool.getConnection();
    console.log('[MySQL Lib] connectToDatabase: Successfully got a connection from pool.');
    return connection;
  } catch (error: any) {
    console.error(`[MySQL Lib] connectToDatabase: Failed to get connection from pool. Message: ${error.message}`, error);
    if (error.sqlMessage) console.error('[MySQL Lib] connectToDatabase: SQL Message:', error.sqlMessage);
    if (error.sqlState) console.error('[MySQL Lib] connectToDatabase: SQL State:', error.sqlState);
    if (error.errno) console.error('[MySQL Lib] connectToDatabase: Error Number:', error.errno);
    throw new Error(`Could not connect to database: ${error.message || 'Unknown connection error'}`);
  }
}


/*
IMPORTANT: SQL Table Definitions
These commands are executed by the `initializeMySQLDatabaseAction` if the tables don't exist.
You generally don't need to run them manually if you use the in-app setup.

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
  priority INT DEFAULT 0,
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
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
*/

