
import mysql from 'mysql2/promise';

const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;

if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
  throw new Error(
    'Please define MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE environment variables inside .env.local. MYSQL_PASSWORD can be empty but must be considered. MYSQL_PORT defaults to 3306 if not set.'
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
    host: MYSQL_HOST,
    port: MYSQL_PORT ? parseInt(MYSQL_PORT, 10) : 3306,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }) as MySQLPool;

  console.log('MySQL connection pool created.');
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
Run these commands in your MySQL database ONCE to set up the necessary tables.

1. Config Table (for admin password and setup status):
CREATE TABLE IF NOT EXISTS config (
  config_key VARCHAR(255) PRIMARY KEY,
  config_value TEXT
);

-- Example: Insert initial setup state (optional, can be done by app)
-- INSERT INTO config (config_key, config_value) VALUES ('setupCompleted', 'false');

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

-- Example: Insert default category (can be done by app)
-- INSERT INTO categories (name, icon, is_visible, is_private) VALUES ('通用书签', 'Folder', TRUE, FALSE);


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
-- Using ON DELETE SET NULL for bookmarks when a category is deleted. 
-- You might prefer ON DELETE CASCADE if bookmarks should be deleted with their category.
-- I've changed this to ON DELETE SET NULL to avoid accidental data loss of bookmarks if a category is deleted.
-- The application logic in deleteCategoryAction should handle moving bookmarks to a default category or confirm deletion.

*/
