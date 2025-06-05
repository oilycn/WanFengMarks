
'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { connectToDatabase, query } from '@/lib/mysql';
import bcrypt from 'bcryptjs';
import type { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';

const ADMIN_PASSWORD_KEY = 'adminHashedPassword';
const SETUP_COMPLETED_KEY = 'setupCompleted';

interface ConfigRow extends RowDataPacket {
  config_key: string;
  config_value: string;
}

interface CategoryRow extends RowDataPacket { // For default category check
  id: number;
}

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

async function getConfigValue(key: string, connection?: PoolConnection): Promise<string | null> {
  noStore();
  const execQuery = connection ? connection.query.bind(connection) : query;
  try {
    const rows = await execQuery<ConfigRow[]>("SELECT config_value FROM config WHERE config_key = ?", [key]);
    return rows.length > 0 ? rows[0].config_value : null;
  } catch (error) {
    console.warn(`[AuthAction] Error fetching config key "${key}" (may be normal if table doesn't exist yet):`, error);
    return null;
  }
}

async function setConfigValue(key: string, value: string, connection?: PoolConnection): Promise<void> {
  const execQuery = connection ? connection.query.bind(connection) : query;
  await execQuery("REPLACE INTO config (config_key, config_value) VALUES (?, ?)", [key, value]);
}

export async function testMySQLConnectionAction(): Promise<ActionResult> {
  noStore();
  let connection: PoolConnection | null = null;
  try {
    console.log('[AuthAction] Attempting to test MySQL connection...');
    connection = await connectToDatabase();
    await connection.query('SELECT 1');
    console.log('[AuthAction] MySQL connection test successful.');
    return { success: true, message: '数据库连接成功！' };
  } catch (error: any) {
    console.error('[AuthAction] MySQL connection test failed:', error);
    return { success: false, error: `数据库连接失败: ${error.message}` };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function initializeMySQLDatabaseAction(): Promise<ActionResult> {
  noStore();
  console.log('[AuthAction] Attempting to initialize MySQL database tables...');
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS config (
        config_key VARCHAR(255) PRIMARY KEY,
        config_value TEXT
      )
    `);
    console.log('[AuthAction] `config` table checked/created.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        icon VARCHAR(50) DEFAULT 'Folder',
        is_visible BOOLEAN DEFAULT TRUE,
        is_private BOOLEAN DEFAULT FALSE,
        priority INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('[AuthAction] `categories` table checked/created.');

    await connection.query(`
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
      )
    `);
    console.log('[AuthAction] `bookmarks` table checked/created.');

    const defaultCategoryName = '通用书签';
    const [existingCategories] = await connection.query<CategoryRow[]>("SELECT id FROM categories WHERE name = ?", [defaultCategoryName]);
    if (existingCategories.length === 0) {
      await connection.query(
        "INSERT INTO categories (name, icon, is_visible, is_private, priority) VALUES (?, ?, ?, ?, ?)",
        [defaultCategoryName, 'Folder', true, false, 1] // Default category with priority 1
      );
      console.log(`[AuthAction] Created default '${defaultCategoryName}' category with priority 1.`);
    }

    await connection.commit();
    console.log('[AuthAction] MySQL database tables initialized successfully.');
    return { success: true, message: '数据库表初始化成功！' };
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('[AuthAction] MySQL database initialization failed:', error);
    return { success: false, error: `数据库初始化失败: ${error.message}` };
  } finally {
    if (connection) connection.release();
  }
}

export async function setInitialAdminConfigAction(password: string): Promise<ActionResult> {
  noStore();
  console.log('[AuthAction] Attempting to set initial admin config (MySQL).');

  if (!password) {
    return { success: false, error: '管理员密码不能为空。' };
  }
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const currentSetupStatus = await getConfigValue(SETUP_COMPLETED_KEY, connection);
    if (currentSetupStatus === 'true') {
      console.warn('[AuthAction] Setup already marked complete. Overwriting admin password.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await setConfigValue(ADMIN_PASSWORD_KEY, hashedPassword, connection);
    await setConfigValue(SETUP_COMPLETED_KEY, 'true', connection);

    await connection.commit();
    console.log('[AuthAction] Admin config SET for MySQL. Setup marked as complete.');
    return { success: true, message: '管理员配置已成功保存！' };
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('[AuthAction] Error setting initial admin config for MySQL:', error);
    return { success: false, error: `无法保存管理员配置: ${error.message}` };
  } finally {
    if (connection) connection.release();
  }
}

export async function verifyAdminPasswordAction(password: string): Promise<boolean> {
  noStore();
  // console.log('[AuthAction] Verifying admin password with MySQL.'); // Reduced verbosity
  try {
    const setupCompleted = await isSetupCompleteAction();
    if (!setupCompleted) {
         console.warn('[AuthAction] MySQL: Admin password verification attempted before setup is complete.');
         return false;
    }

    const hashedPassword = await getConfigValue(ADMIN_PASSWORD_KEY);
    if (!hashedPassword) {
      console.warn('[AuthAction] MySQL: Admin password not found in DB for verification.');
      return false;
    }

    const isValid = await bcrypt.compare(password, hashedPassword);
    // if (isValid) console.log('[AuthAction] Admin password verified (MySQL).');
    // else console.warn('[AuthAction] Admin password verification failed (MySQL).');
    return isValid;
  } catch (error) {
    console.error('[AuthAction] Error verifying admin password with MySQL:', error);
    return false;
  }
}

export async function isSetupCompleteAction(): Promise<boolean> {
  noStore();
  // console.log('[AuthAction] Checking if setup is complete (MySQL).'); // Reduced verbosity
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase(); // Test connectivity first
    const setupCompletedValue = await getConfigValue(SETUP_COMPLETED_KEY, connection);
    const isComplete = setupCompletedValue === 'true';
    // console.log(`[AuthAction] isSetupCompleteAction (MySQL) called. Setup completed value: ${setupCompletedValue}, isComplete: ${isComplete}`);
    return isComplete;
  } catch (error) {
    // console.error('[AuthAction] Error checking setup status with MySQL (DB might be down or tables not created):', error);
    // If DB is not connectable, tables not there, or config key missing, assume setup is NOT complete.
    return false;
  } finally {
    if (connection) connection.release();
  }
}

export async function getSelectedDatabaseTypeAction(): Promise<string> {
    noStore();
    try {
      const isSetupDone = await isSetupCompleteAction();
      if (isSetupDone) {
        return 'mysql';
      }
      return 'unconfigured';
    } catch (error) {
      console.error('[AuthAction] Error getting selected database type (MySQL focus):', error);
      return 'unconfigured';
    }
}

export async function resetSetupStateAction(): Promise<void> {
    noStore();
    let connection: PoolConnection | null = null;
    try {
        connection = await connectToDatabase();
        await connection.beginTransaction();
        await connection.query("DELETE FROM config WHERE config_key = ?", [ADMIN_PASSWORD_KEY]);
        await connection.query("DELETE FROM config WHERE config_key = ?", [SETUP_COMPLETED_KEY]);
        await connection.commit();
        console.log('[AuthAction] Setup state has been reset in MySQL config table.');
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('[AuthAction] Error resetting setup state in MySQL:', error);
    } finally {
        if (connection) connection.release();
    }
}
