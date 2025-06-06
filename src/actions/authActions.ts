
'use server';

import { connectToDatabase, query } from '@/lib/mysql';
import bcrypt from 'bcryptjs';
import type { RowDataPacket, PoolConnection } from 'mysql2/promise';

const ADMIN_PASSWORD_KEY = 'adminHashedPassword';
const SETUP_COMPLETED_KEY = 'setupCompleted';
const LOGO_TEXT_KEY = 'logoText';
const LOGO_ICON_KEY = 'logoIcon';

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

export interface AppSettingsResult {
  logoText: string | null;
  logoIcon: string | null;
  adminPasswordSet: boolean;
}


async function getConfigValue(key: string, connection?: PoolConnection): Promise<string | null> {
  console.log(`[AuthAction][getConfigValue] ENTRY - key: "${key}"`);
  try {
    let actualRows: ConfigRow[];

    if (connection) {
      console.log(`[AuthAction][getConfigValue] Using provided connection for key "${key}"`);
      const [rowsFromConnectionQuery] = await connection.query<ConfigRow[]>("SELECT config_value FROM config WHERE config_key = ?", [key]);
      actualRows = rowsFromConnectionQuery;
    } else {
      console.log(`[AuthAction][getConfigValue] Using general query for key "${key}"`);
      actualRows = await query<ConfigRow[]>("SELECT config_value FROM config WHERE config_key = ?", [key]);
    }

    if (actualRows.length > 0) {
      console.log(`[AuthAction][getConfigValue] SUCCESS_EXIT - Found value for key "${key}"`);
      return actualRows[0].config_value;
    } else {
      console.log(`[AuthAction][getConfigValue] SUCCESS_EXIT - No value found for key "${key}".`);
      return null;
    }
  } catch (error: any) {
    console.error(`[AuthAction][getConfigValue] ERROR_EXIT - Error fetching config key "${key}". Message: ${error.message}`, error);
    return null;
  }
}

async function setConfigValue(key: string, value: string, connection?: PoolConnection): Promise<void> {
  console.log(`[AuthAction][setConfigValue] ENTRY - key: "${key}", value (partial): "${value.substring(0,20)}..."`);
  const execQuery = connection ? connection.query.bind(connection) : query;
  try {
    await execQuery("REPLACE INTO config (config_key, config_value) VALUES (?, ?)", [key, value]);
    console.log(`[AuthAction][setConfigValue] SUCCESS_EXIT - Successfully set key "${key}"`);
  } catch (error: any) {
    console.error(`[AuthAction][setConfigValue] ERROR_EXIT - Error setting key "${key}". Message: ${error.message}`, error);
    throw error; // Re-throw to be caught by calling action's transaction logic
  }
}

export async function testMySQLConnectionAction(): Promise<ActionResult> {
  console.log('[AuthAction][testMySQLConnectionAction] ENTRY');
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.query('SELECT 1');
    console.log('[AuthAction][testMySQLConnectionAction] SUCCESS_EXIT - MySQL connection test successful.');
    return { success: true, message: '数据库连接成功！' };
  } catch (error: any) {
    console.error('[AuthAction][testMySQLConnectionAction] ERROR_EXIT - MySQL connection test FAILED. Message:', error.message, error);
    let userMessage = `数据库连接失败: ${error.message || '未知错误'}`;
    if (error.message) {
        if (error.message.includes('ECONNREFUSED')) {
            userMessage = '数据库连接失败: 连接被服务器拒绝。请检查数据库服务器是否正在运行，以及主机名和端口号是否正确无误。防火墙设置也可能导致此问题。';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('EAI_AGAIN')) {
            userMessage = '数据库连接失败: 无法解析数据库主机名。请检查主机名是否拼写正确，并且DNS解析正常。';
        } else if (error.message.includes('access denied') || (error.sqlMessage && error.sqlMessage.toLowerCase().includes('access denied'))) {
            userMessage = '数据库连接失败: 访问被拒绝。请检查提供的用户名和密码是否正确，并且该用户拥有从应用服务器连接到数据库的权限。';
        } else if (error.message.includes('connect ETIMEDOUT')) {
            userMessage = '数据库连接失败: 连接超时。请检查网络连接是否稳定，以及数据库服务器是否响应缓慢或过载。';
        }
    }
    return { success: false, error: userMessage };
  } finally {
    if (connection) {
      console.log('[AuthAction][testMySQLConnectionAction] Releasing test connection.');
      connection.release();
    }
  }
}

export async function initializeMySQLDatabaseAction(): Promise<ActionResult> {
  console.log('[AuthAction][initializeMySQLDatabaseAction] ENTRY');
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    console.log('[AuthAction][initializeMySQLDatabaseAction] Connected to DB. Beginning transaction.');
    await connection.beginTransaction();

    console.log('[AuthAction][initializeMySQLDatabaseAction] Creating `config` table if not exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS config (
        config_key VARCHAR(255) PRIMARY KEY,
        config_value TEXT
      )
    `);
    console.log('[AuthAction][initializeMySQLDatabaseAction] `config` table checked/created.');

    const currentLogoText = await getConfigValue(LOGO_TEXT_KEY, connection);
    if (!currentLogoText) {
      await setConfigValue(LOGO_TEXT_KEY, '晚风Marks', connection);
    }
    const currentLogoIcon = await getConfigValue(LOGO_ICON_KEY, connection);
    if (!currentLogoIcon) {
      await setConfigValue(LOGO_ICON_KEY, 'ShieldCheck', connection);
    }

    console.log('[AuthAction][initializeMySQLDatabaseAction] Creating `categories` table if not exists...');
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
    console.log('[AuthAction][initializeMySQLDatabaseAction] `categories` table checked/created.');

    console.log('[AuthAction][initializeMySQLDatabaseAction] Creating `bookmarks` table if not exists...');
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
    console.log('[AuthAction][initializeMySQLDatabaseAction] `bookmarks` table checked/created.');

    const defaultCategoryName = '通用书签';
    const [existingCategories] = await connection.query<CategoryRow[]>("SELECT id FROM categories WHERE name = ?", [defaultCategoryName]);
    if (existingCategories.length === 0) {
      await connection.query(
        "INSERT INTO categories (name, icon, is_visible, is_private, priority) VALUES (?, ?, ?, ?, ?)",
        [defaultCategoryName, 'Folder', true, false, 1]
      );
    }

    console.log('[AuthAction][initializeMySQLDatabaseAction] Committing transaction.');
    await connection.commit();
    console.log('[AuthAction][initializeMySQLDatabaseAction] SUCCESS_EXIT - MySQL database tables initialized successfully.');
    return { success: true, message: '数据库表初始化成功！' };
  } catch (error: any) {
    console.error('[AuthAction][initializeMySQLDatabaseAction] ERROR_EXIT - Database initialization FAILED.', error.message, error);
    if (connection) {
      console.log('[AuthAction][initializeMySQLDatabaseAction] Rolling back transaction due to error.');
      await connection.rollback();
    }
    return { success: false, error: `数据库初始化失败: ${error.message}` };
  } finally {
    if (connection) {
      console.log('[AuthAction][initializeMySQLDatabaseAction] Releasing DB connection.');
      connection.release();
    }
  }
}

export async function setInitialAdminConfigAction(password: string): Promise<ActionResult> {
  console.log('[AuthAction][setInitialAdminConfigAction] ENTRY');

  if (!password) {
    console.error('[AuthAction][setInitialAdminConfigAction] ERROR_EXIT - Password cannot be empty.');
    return { success: false, error: '管理员密码不能为空。' };
  }
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);
    await setConfigValue(ADMIN_PASSWORD_KEY, hashedPassword, connection);
    await setConfigValue(SETUP_COMPLETED_KEY, 'true', connection);

    await connection.commit();
    console.log('[AuthAction][setInitialAdminConfigAction] SUCCESS_EXIT - Admin config SET. Setup marked as complete.');
    return { success: true, message: '管理员配置已成功保存！' };
  } catch (error: any) {
    console.error('[AuthAction][setInitialAdminConfigAction] ERROR_EXIT - Error setting initial admin config.', error.message, error);
    if (connection) {
      await connection.rollback();
    }
    return { success: false, error: `无法保存管理员配置: ${error.message}` };
  } finally {
    if (connection) {
      console.log('[AuthAction][setInitialAdminConfigAction] Releasing DB connection.');
      connection.release();
    }
  }
}

export async function verifyAdminPasswordAction(password: string): Promise<boolean> {
  console.log('[AuthAction][verifyAdminPasswordAction] ENTRY');
  try {
    const setupCompleted = await isSetupCompleteAction();
    if (!setupCompleted) {
         console.warn('[AuthAction][verifyAdminPasswordAction] SUCCESS_EXIT (early) - Admin password verification attempted before setup is complete. Returning false.');
         return false;
    }

    const hashedPassword = await getConfigValue(ADMIN_PASSWORD_KEY);
    if (!hashedPassword) {
      console.warn('[AuthAction][verifyAdminPasswordAction] SUCCESS_EXIT (early) - Admin password not found in DB. Returning false.');
      return false;
    }
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(`[AuthAction][verifyAdminPasswordAction] SUCCESS_EXIT - Password validation result: ${isValid}`);
    return isValid;
  } catch (error:any) {
    console.error(`[AuthAction][verifyAdminPasswordAction] ERROR_EXIT - Error verifying admin password. Message: ${error.message}`, error);
    return false;
  }
}

export async function isSetupCompleteAction(): Promise<boolean> {
  console.log('[AuthAction][isSetupCompleteAction] ENTRY');
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    const setupCompletedValue = await getConfigValue(SETUP_COMPLETED_KEY, connection);
    if (setupCompletedValue === 'true') {
      console.log('[AuthAction][isSetupCompleteAction] SUCCESS_EXIT - Setup is marked as complete.');
      return true;
    } else {
      console.log('[AuthAction][isSetupCompleteAction] SUCCESS_EXIT - Setup is NOT marked as complete.');
      return false;
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    if (errorMessage.includes("Table 'config' doesn't exist") || errorMessage.includes("ER_NO_SUCH_TABLE")) {
      console.warn(`[AuthAction][isSetupCompleteAction] SUCCESS_EXIT (early) - 'config' table does not exist. Assuming setup is not complete.`);
      return false;
    }
    console.error(`[AuthAction][isSetupCompleteAction] ERROR_EXIT - CRITICAL error while checking setup status. Error: ${errorMessage}`, error);
    return false;
  } finally {
    if (connection) {
      console.log('[AuthAction][isSetupCompleteAction] Releasing DB connection.');
      connection.release();
    }
  }
}


export async function getSelectedDatabaseTypeAction(): Promise<string> {
    console.log('[AuthAction][getSelectedDatabaseTypeAction] ENTRY');
    try {
      const isSetupDone = await isSetupCompleteAction();
      if (isSetupDone) {
        console.log('[AuthAction][getSelectedDatabaseTypeAction] SUCCESS_EXIT - Setup is complete, type is mysql.');
        return 'mysql';
      }
      console.log('[AuthAction][getSelectedDatabaseTypeAction] SUCCESS_EXIT - Setup not complete, type is unconfigured.');
      return 'unconfigured';
    } catch (error: any) {
      console.error(`[AuthAction][getSelectedDatabaseTypeAction] ERROR_EXIT - Message: ${error.message}`, error);
      return 'unconfigured';
    }
}

export async function resetSetupStateAction(): Promise<ActionResult> {
    console.log('[AuthAction][resetSetupStateAction] ENTRY');
    let connection: PoolConnection | null = null;
    try {
        connection = await connectToDatabase();
        await connection.beginTransaction();
        
        const [tables] = await connection.query<RowDataPacket[]>("SHOW TABLES LIKE 'config'");
        if (tables.length > 0) {
            await connection.query("DELETE FROM config WHERE config_key = ?", [ADMIN_PASSWORD_KEY]);
            await connection.query("DELETE FROM config WHERE config_key = ?", [SETUP_COMPLETED_KEY]);
            await connection.query("DELETE FROM config WHERE config_key = ?", [LOGO_TEXT_KEY]);
            await connection.query("DELETE FROM config WHERE config_key = ?", [LOGO_ICON_KEY]);
        }
        
        await connection.commit();
        console.log('[AuthAction][resetSetupStateAction] SUCCESS_EXIT - Setup state has been reset.');
        return { success: true, message: '应用配置已重置。您可以重新开始设置流程。' };
    } catch (error: any) {
        if (connection) {
            await connection.rollback();
        }
        console.error(`[AuthAction][resetSetupStateAction] ERROR_EXIT - Error resetting setup state. Message: ${error.message}`, error);
        return { success: false, error: `重置配置失败: ${error.message}` };
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

export async function changeAdminPasswordAction(currentPasswordInput: string, newPasswordInput: string): Promise<ActionResult> {
  console.log('[AuthAction][changeAdminPasswordAction] ENTRY');

  if (!newPasswordInput) {
    console.log('[AuthAction][changeAdminPasswordAction] ERROR_EXIT - New password cannot be empty.');
    return { success: false, error: '新密码不能为空。' };
  }

  const setupCompleted = await isSetupCompleteAction();
  if (!setupCompleted) {
    console.log('[AuthAction][changeAdminPasswordAction] ERROR_EXIT - App not setup.');
    return { success: false, error: '应用尚未完成初始设置，无法更改密码。' };
  }

  const currentHashedPassword = await getConfigValue(ADMIN_PASSWORD_KEY);
  if (!currentHashedPassword) {
      if (currentPasswordInput) {
         console.warn('[AuthAction][changeAdminPasswordAction] ERROR_EXIT - No admin password in DB, but currentPasswordInput was provided.');
         return { success: false, error: '当前管理员密码记录不存在，但您提供了当前密码。请清除当前密码字段或重置应用配置。' };
      }
  } else {
      if (!currentPasswordInput) {
        console.warn('[AuthAction][changeAdminPasswordAction] ERROR_EXIT - Admin password exists in DB, but currentPasswordInput is empty.');
        return { success: false, error: '当前密码不能为空，因为系统记录中存在密码。' };
      }
      const isCurrentPasswordValid = await bcrypt.compare(currentPasswordInput, currentHashedPassword);
      if (!isCurrentPasswordValid) {
        console.warn('[AuthAction][changeAdminPasswordAction] ERROR_EXIT - Current password provided is incorrect.');
        return { success: false, error: '当前密码不正确。' };
      }
  }

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const newHashedPassword = await bcrypt.hash(newPasswordInput, 10);
    await setConfigValue(ADMIN_PASSWORD_KEY, newHashedPassword, connection);

    await connection.commit();
    console.log('[AuthAction][changeAdminPasswordAction] SUCCESS_EXIT - Admin password changed successfully.');
    return { success: true, message: '管理员密码已成功更新！' };
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`[AuthAction][changeAdminPasswordAction] ERROR_EXIT - Message: ${error.message}`, error);
    return { success: false, error: `密码更新失败: ${error.message}` };
  } finally {
    if (connection) {
        connection.release();
    }
  }
}

export async function getAppSettingsAction(): Promise<AppSettingsResult> {
  console.log('[AuthAction][getAppSettingsAction] ENTRY');
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    const logoText = await getConfigValue(LOGO_TEXT_KEY, connection);
    const logoIcon = await getConfigValue(LOGO_ICON_KEY, connection);
    const adminPasswordHash = await getConfigValue(ADMIN_PASSWORD_KEY, connection);
    
    const settings = { 
      logoText: logoText || '晚风Marks', 
      logoIcon: logoIcon || 'ShieldCheck',
      adminPasswordSet: !!adminPasswordHash
    };
    console.log('[AuthAction][getAppSettingsAction] SUCCESS_EXIT - Successfully fetched settings:', settings);
    return settings;
  } catch (error: any) {
    console.error(`[AuthAction][getAppSettingsAction] ERROR_EXIT - Message: ${error.message}`, error);
    const defaultSettings = { 
        logoText: '晚风Marks', 
        logoIcon: 'ShieldCheck', 
        adminPasswordSet: false 
    };
    console.warn('[AuthAction][getAppSettingsAction] Returning default settings due to error.');
    return defaultSettings;
  } finally {
    if (connection) {
        connection.release();
    }
  }
}

export async function updateLogoSettingsAction(logoText: string, logoIcon: string): Promise<ActionResult> {
  console.log(`[AuthAction][updateLogoSettingsAction] ENTRY - logoText: "${logoText}", logoIcon: "${logoIcon}"`);
  if (!logoText || !logoIcon) {
    console.log('[AuthAction][updateLogoSettingsAction] ERROR_EXIT - Logo text and icon cannot be empty.');
    return { success: false, error: 'Logo 文本和图标不能为空。' };
  }

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    await setConfigValue(LOGO_TEXT_KEY, logoText, connection);
    await setConfigValue(LOGO_ICON_KEY, logoIcon, connection);

    await connection.commit();
    console.log('[AuthAction][updateLogoSettingsAction] SUCCESS_EXIT - Logo settings updated successfully.');
    return { success: true, message: 'Logo 设置已成功更新！' };
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`[AuthAction][updateLogoSettingsAction] ERROR_EXIT - Message: ${error.message}`, error);
    return { success: false, error: `Logo 设置更新失败: ${error.message}` };
  } finally {
    if (connection) {
        connection.release();
    }
  }
}
    

    

    
