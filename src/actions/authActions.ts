
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

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

async function getConfigValue(key: string): Promise<string | null> {
  noStore();
  try {
    // Ensure table exists by attempting a read, which might fail if table isn't there yet.
    // This is okay as isSetupCompleteAction would then correctly return false.
    const rows = await query<ConfigRow[]>("SELECT config_value FROM config WHERE config_key = ?", [key]);
    return rows.length > 0 ? rows[0].config_value : null;
  } catch (error) {
    console.warn(`[AuthAction] Error fetching config key "${key}" (may be normal if table doesn't exist yet):`, error);
    return null;
  }
}

async function setConfigValue(key: string, value: string): Promise<void> {
  await query("REPLACE INTO config (config_key, config_value) VALUES (?, ?)", [key, value]);
}

export async function testMySQLConnectionAction(): Promise<ActionResult> {
  noStore();
  let connection: PoolConnection | null = null;
  try {
    console.log('[AuthAction] Attempting to test MySQL connection...');
    connection = await connectToDatabase(); // Tries to get a connection from the pool
    // Simple query to confirm connectivity
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
  try {
    // Create config table
    await query(`
      CREATE TABLE IF NOT EXISTS config (
        config_key VARCHAR(255) PRIMARY KEY,
        config_value TEXT
      )
    `);
    console.log('[AuthAction] `config` table checked/created.');

    // Create categories table
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        icon VARCHAR(50) DEFAULT 'Folder',
        is_visible BOOLEAN DEFAULT TRUE,
        is_private BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('[AuthAction] `categories` table checked/created.');

    // Create bookmarks table
    await query(`
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
      )
    `);
    console.log('[AuthAction] `bookmarks` table checked/created.');

    // Ensure default category exists
    const defaultCategoryName = '通用书签';
    const existing = await query<CategoryRow[]>("SELECT id FROM categories WHERE name = ?", [defaultCategoryName]);
    if (existing.length === 0) {
      await query(
        "INSERT INTO categories (name, icon, is_visible, is_private) VALUES (?, ?, ?, ?)",
        [defaultCategoryName, 'Folder', true, false]
      );
      console.log(`[AuthAction] Created default '${defaultCategoryName}' category.`);
    }

    console.log('[AuthAction] MySQL database tables initialized successfully.');
    return { success: true, message: '数据库表初始化成功！' };
  } catch (error: any) {
    console.error('[AuthAction] MySQL database initialization failed:', error);
    return { success: false, error: `数据库初始化失败: ${error.message}` };
  }
}

export async function setInitialAdminConfigAction(password: string): Promise<ActionResult> {
  noStore();
  console.log('[AuthAction] Attempting to set initial admin config (MySQL).');

  if (!password) {
    console.log('[AuthAction] Admin password is empty. Setup failed.');
    return { success: false, error: '管理员密码不能为空。' };
  }
  
  try {
    // Check if setup is already marked as complete in the DB (e.g. by checking for admin pass or setup_completed_key)
    // This is more of a safeguard, primary check is isSetupCompleteAction.
    const currentSetupStatus = await getConfigValue(SETUP_COMPLETED_KEY);
    if (currentSetupStatus === 'true') {
      // This case should ideally be prevented by UI flow if isSetupCompleteAction works correctly.
      console.warn('[AuthAction] Setup already marked complete. Overwriting admin password.');
      // Allow re-setting for now. A more robust system might prevent this or require current pass.
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await setConfigValue(ADMIN_PASSWORD_KEY, hashedPassword);
    await setConfigValue(SETUP_COMPLETED_KEY, 'true'); // Mark setup as complete

    console.log('[AuthAction] Admin config SET for MySQL. Setup marked as complete.');
    return { success: true, message: '管理员配置已成功保存！' };
  } catch (error: any) {
    console.error('[AuthAction] Error setting initial admin config for MySQL:', error);
    return { success: false, error: `无法保存管理员配置: ${error.message}` };
  }
}

export async function verifyAdminPasswordAction(password: string): Promise<boolean> {
  noStore();
  console.log('[AuthAction] Verifying admin password with MySQL.');
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
    if (isValid) {
      console.log('[AuthAction] Admin password verified (MySQL).');
    } else {
      console.warn('[AuthAction] Admin password verification failed (MySQL).');
    }
    return isValid;
  } catch (error) {
    console.error('[AuthAction] Error verifying admin password with MySQL:', error);
    return false;
  }
}

export async function isSetupCompleteAction(): Promise<boolean> {
  noStore();
  console.log('[AuthAction] Checking if setup is complete (MySQL).');
  try {
    // Ensure DB connection before trying to query config table
    // This is important: if connectToDatabase throws, it means DB is not accessible.
    await connectToDatabase(); 
    const setupCompletedValue = await getConfigValue(SETUP_COMPLETED_KEY);
    const isComplete = setupCompletedValue === 'true';
    console.log(`[AuthAction] isSetupCompleteAction (MySQL) called. Setup completed value: ${setupCompletedValue}, isComplete: ${isComplete}`);
    return isComplete;
  } catch (error) {
    console.error('[AuthAction] Error checking setup status with MySQL (DB might be down or tables not created):', error);
    return false; // If any error (DB down, table not found), assume setup is not complete.
  }
}

export async function getSelectedDatabaseTypeAction(): Promise<string> {
    noStore();
    // Since we removed the temporary option from setup and are focusing on MySQL,
    // this action effectively indicates if setup for MySQL is done.
    try {
      const isSetupDone = await isSetupCompleteAction();
      if (isSetupDone) {
        return 'mysql';
      }
      // If setup is not complete, it's in a pre-configuration state.
      // Returning 'temporary' might be misleading. 'unconfigured' or similar might be better.
      // For now, to align with previous logic where 'temporary' was a fallback:
      return 'temporary'; // Indicates setup for a persistent DB (MySQL) is not yet complete.
    } catch (error) {
      console.error('[AuthAction] Error getting selected database type (MySQL focus):', error);
      return 'temporary'; // Fallback on error
    }
}

export async function resetSetupStateAction(): Promise<void> {
    noStore();
    // This function should be used with extreme caution.
    // For MySQL, it means deleting specific rows from the config table.
    try {
        await query("DELETE FROM config WHERE config_key = ?", [ADMIN_PASSWORD_KEY]);
        // We are not storing DATABASE_TYPE_KEY anymore as it's implicitly MySQL.
        await query("DELETE FROM config WHERE config_key = ?", [SETUP_COMPLETED_KEY]);
        console.log('[AuthAction] Setup state has been reset in MySQL config table.');
    } catch (error) {
        console.error('[AuthAction] Error resetting setup state in MySQL:', error);
        // Potentially re-throw or handle more gracefully
    }
}
