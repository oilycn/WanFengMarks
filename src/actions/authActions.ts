
'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { connectToDatabase, query } from '@/lib/mysql';
import bcrypt from 'bcryptjs';
import type { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';

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
  noStore();
  console.log(`[AuthAction] getConfigValue: Fetching config key "${key}"`);
  try {
    let actualRows: ConfigRow[];

    if (connection) {
      console.log(`[AuthAction] getConfigValue: Using provided connection for key "${key}"`);
      const [rowsFromConnectionQuery] = await connection.query<ConfigRow[]>("SELECT config_value FROM config WHERE config_key = ?", [key]);
      actualRows = rowsFromConnectionQuery;
    } else {
      console.log(`[AuthAction] getConfigValue: Using general query for key "${key}"`);
      actualRows = await query<ConfigRow[]>("SELECT config_value FROM config WHERE config_key = ?", [key]);
    }

    if (actualRows.length > 0) {
      console.log(`[AuthAction] getConfigValue: Found value for key "${key}": "${actualRows[0].config_value.substring(0, 20)}..."`);
      return actualRows[0].config_value;
    } else {
      console.log(`[AuthAction] getConfigValue: No value found for key "${key}".`);
      return null;
    }
  } catch (error: any) {
    console.error(`[AuthAction] getConfigValue: Error fetching config key "${key}". Message: ${error.message}`, error);
    // Do not throw here, let caller decide if null is acceptable
    return null;
  }
}

async function setConfigValue(key: string, value: string, connection?: PoolConnection): Promise<void> {
  console.log(`[AuthAction] setConfigValue: Setting config key "${key}" to value "${value.substring(0,20)}..."`);
  const execQuery = connection ? connection.query.bind(connection) : query;
  await execQuery("REPLACE INTO config (config_key, config_value) VALUES (?, ?)", [key, value]);
  console.log(`[AuthAction] setConfigValue: Successfully set key "${key}"`);
}

export async function testMySQLConnectionAction(): Promise<ActionResult> {
  noStore();
  let connection: PoolConnection | null = null;
  console.log('[AuthAction] testMySQLConnectionAction: Attempting to test MySQL connection...');
  try {
    connection = await connectToDatabase(); // This function now has more logging
    await connection.query('SELECT 1');
    console.log('[AuthAction] testMySQLConnectionAction: MySQL connection test successful.');
    return { success: true, message: '数据库连接成功！' };
  } catch (error: any) {
    console.error('[AuthAction] testMySQLConnectionAction: MySQL connection test FAILED. Error type:', typeof error, 'Message:', error.message, 'Full error:', error);
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
      console.log('[AuthAction] testMySQLConnectionAction: Releasing test connection.');
      connection.release();
    }
  }
}

export async function initializeMySQLDatabaseAction(): Promise<ActionResult> {
  noStore();
  console.log('[AuthAction] initializeMySQLDatabaseAction: Attempting to initialize MySQL database tables...');
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    console.log('[AuthAction] initializeMySQLDatabaseAction: Connected to DB. Beginning transaction.');
    await connection.beginTransaction();

    console.log('[AuthAction] initializeMySQLDatabaseAction: Creating `config` table if not exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS config (
        config_key VARCHAR(255) PRIMARY KEY,
        config_value TEXT
      )
    `);
    console.log('[AuthAction] initializeMySQLDatabaseAction: `config` table checked/created.');

    const currentLogoText = await getConfigValue(LOGO_TEXT_KEY, connection);
    if (!currentLogoText) {
      await setConfigValue(LOGO_TEXT_KEY, '晚风Marks', connection);
      console.log('[AuthAction] initializeMySQLDatabaseAction: Default logo text set.');
    }
    const currentLogoIcon = await getConfigValue(LOGO_ICON_KEY, connection);
    if (!currentLogoIcon) {
      await setConfigValue(LOGO_ICON_KEY, 'ShieldCheck', connection);
      console.log('[AuthAction] initializeMySQLDatabaseAction: Default logo icon set.');
    }


    console.log('[AuthAction] initializeMySQLDatabaseAction: Creating `categories` table if not exists...');
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
    console.log('[AuthAction] initializeMySQLDatabaseAction: `categories` table checked/created.');

    console.log('[AuthAction] initializeMySQLDatabaseAction: Creating `bookmarks` table if not exists...');
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
    console.log('[AuthAction] initializeMySQLDatabaseAction: `bookmarks` table checked/created.');

    const defaultCategoryName = '通用书签';
    const [existingCategories] = await connection.query<CategoryRow[]>("SELECT id FROM categories WHERE name = ?", [defaultCategoryName]);
    if (existingCategories.length === 0) {
      await connection.query(
        "INSERT INTO categories (name, icon, is_visible, is_private, priority) VALUES (?, ?, ?, ?, ?)",
        [defaultCategoryName, 'Folder', true, false, 1]
      );
       console.log(`[AuthAction] initializeMySQLDatabaseAction: Inserted default category '${defaultCategoryName}'.`);
    } else {
       console.log(`[AuthAction] initializeMySQLDatabaseAction: Default category '${defaultCategoryName}' already exists.`);
    }

    console.log('[AuthAction] initializeMySQLDatabaseAction: Committing transaction.');
    await connection.commit();
    console.log('[AuthAction] initializeMySQLDatabaseAction: MySQL database tables initialized successfully.');
    return { success: true, message: '数据库表初始化成功！' };
  } catch (error: any) {
    console.error('[AuthAction] initializeMySQLDatabaseAction: Database initialization FAILED.', error.message, error);
    if (connection) {
      console.log('[AuthAction] initializeMySQLDatabaseAction: Rolling back transaction due to error.');
      await connection.rollback();
    }
    return { success: false, error: `数据库初始化失败: ${error.message}` };
  } finally {
    if (connection) {
      console.log('[AuthAction] initializeMySQLDatabaseAction: Releasing DB connection.');
      connection.release();
    }
  }
}

export async function setInitialAdminConfigAction(password: string): Promise<ActionResult> {
  noStore();
  console.log('[AuthAction] setInitialAdminConfigAction: Attempting to set initial admin config.');

  if (!password) {
    console.error('[AuthAction] setInitialAdminConfigAction: Password cannot be empty.');
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
    console.log('[AuthAction] setInitialAdminConfigAction: Admin config SET. Setup marked as complete.');
    return { success: true, message: '管理员配置已成功保存！' };
  } catch (error: any) {
    console.error('[AuthAction] setInitialAdminConfigAction: Error setting initial admin config.', error.message, error);
    if (connection) {
      await connection.rollback();
    }
    return { success: false, error: `无法保存管理员配置: ${error.message}` };
  } finally {
    if (connection) {
      console.log('[AuthAction] setInitialAdminConfigAction: Releasing DB connection.');
      connection.release();
    }
  }
}

export async function verifyAdminPasswordAction(password: string): Promise<boolean> {
  noStore();
  console.log('[AuthAction] verifyAdminPasswordAction: Verifying admin password attempt.');
  try {
    const setupCompleted = await isSetupCompleteAction(); // This now has more logging
    if (!setupCompleted) {
         console.warn('[AuthAction] verifyAdminPasswordAction: Admin password verification attempted before setup is complete. Returning false.');
         return false;
    }

    const hashedPassword = await getConfigValue(ADMIN_PASSWORD_KEY);
    if (!hashedPassword) {
      console.warn('[AuthAction] verifyAdminPasswordAction: Admin password not found in DB. Returning false.');
      return false;
    }
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(`[AuthAction] verifyAdminPasswordAction: Password validation result: ${isValid}`);
    return isValid;
  } catch (error:any) {
    console.error(`[AuthAction] verifyAdminPasswordAction: Error verifying admin password. Message: ${error.message}`, error);
    return false;
  }
}

export async function isSetupCompleteAction(): Promise<boolean> {
  noStore();
  console.log('[AuthAction] isSetupCompleteAction: Checking if setup is complete...');
  let connection: PoolConnection | null = null;
  try {
    console.log('[AuthAction] isSetupCompleteAction: Attempting to connect to database...');
    connection = await connectToDatabase(); // connectToDatabase now has enhanced logging
    console.log('[AuthAction] isSetupCompleteAction: Successfully connected to database. Now checking config value for SETUP_COMPLETED_KEY.');
    
    const setupCompletedValue = await getConfigValue(SETUP_COMPLETED_KEY, connection); // getConfigValue also has enhanced logging
    console.log(`[AuthAction] isSetupCompleteAction: Value of '${SETUP_COMPLETED_KEY}' from DB: '${setupCompletedValue}'`);

    if (setupCompletedValue === 'true') {
      console.log('[AuthAction] isSetupCompleteAction: Setup is marked as complete.');
      return true;
    } else {
      console.log('[AuthAction] isSetupCompleteAction: Setup is NOT marked as complete (value is not "true").');
      return false;
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    if (errorMessage.includes("Table 'config' doesn't exist") || errorMessage.includes("ER_NO_SUCH_TABLE")) {
      console.warn(`[AuthAction] isSetupCompleteAction: 'config' table does not exist. Assuming setup is not complete.`);
      return false; // This is an expected state if setup hasn't run.
    }
    // For other errors, log them as critical problems.
    console.error(`[AuthAction] isSetupCompleteAction: CRITICAL error while checking setup status. Error: ${errorMessage}`, error);
    return false; // Default to false on unexpected errors to allow potential setup flow.
  } finally {
    if (connection) {
      console.log('[AuthAction] isSetupCompleteAction: Releasing DB connection.');
      connection.release();
    }
  }
}


export async function getSelectedDatabaseTypeAction(): Promise<string> {
    noStore();
    console.log('[AuthAction] getSelectedDatabaseTypeAction: Determining selected database type.');
    try {
      const isSetupDone = await isSetupCompleteAction();
      if (isSetupDone) {
        console.log('[AuthAction] getSelectedDatabaseTypeAction: Setup is complete, type is mysql.');
        return 'mysql';
      }
      console.log('[AuthAction] getSelectedDatabaseTypeAction: Setup not complete, type is unconfigured.');
      return 'unconfigured';
    } catch (error: any) {
      console.error(`[AuthAction] getSelectedDatabaseTypeAction: Error. Message: ${error.message}`, error);
      return 'unconfigured';
    }
}

export async function resetSetupStateAction(): Promise<ActionResult> {
    noStore();
    console.log('[AuthAction] resetSetupStateAction: Attempting to reset setup state.');
    let connection: PoolConnection | null = null;
    try {
        connection = await connectToDatabase();
        await connection.beginTransaction();
        
        const [tables] = await connection.query<RowDataPacket[]>("SHOW TABLES LIKE 'config'");
        if (tables.length > 0) {
            console.log(`[AuthAction] resetSetupStateAction: 'config' table exists. Deleting keys: ${ADMIN_PASSWORD_KEY}, ${SETUP_COMPLETED_KEY}, ${LOGO_TEXT_KEY}, ${LOGO_ICON_KEY}.`);
            await connection.query("DELETE FROM config WHERE config_key = ?", [ADMIN_PASSWORD_KEY]);
            await connection.query("DELETE FROM config WHERE config_key = ?", [SETUP_COMPLETED_KEY]);
            await connection.query("DELETE FROM config WHERE config_key = ?", [LOGO_TEXT_KEY]);
            await connection.query("DELETE FROM config WHERE config_key = ?", [LOGO_ICON_KEY]);
            console.log(`[AuthAction] resetSetupStateAction: Relevant config keys deleted.`);
        } else {
            console.log(`[AuthAction] resetSetupStateAction: 'config' table does not exist. No keys to delete.`);
        }
        
        await connection.commit();
        console.log('[AuthAction] resetSetupStateAction: Setup state has been reset.');
        return { success: true, message: '应用配置已重置。您可以重新开始设置流程。' };
    } catch (error: any) {
        if (connection) {
            console.log('[AuthAction] resetSetupStateAction: Rolling back transaction due to error.');
            await connection.rollback();
        }
        console.error(`[AuthAction] resetSetupStateAction: Error resetting setup state. Message: ${error.message}`, error);
        return { success: false, error: `重置配置失败: ${error.message}` };
    } finally {
        if (connection) {
            console.log('[AuthAction] resetSetupStateAction: Releasing DB connection.');
            connection.release();
        }
    }
}

export async function changeAdminPasswordAction(currentPasswordInput: string, newPasswordInput: string): Promise<ActionResult> {
  noStore();
  console.log('[AuthAction] changeAdminPasswordAction: Attempting to change admin password.');

  if (!newPasswordInput) {
    return { success: false, error: '新密码不能为空。' };
  }

  const setupCompleted = await isSetupCompleteAction();
  if (!setupCompleted) {
    return { success: false, error: '应用尚未完成初始设置，无法更改密码。' };
  }

  const currentHashedPassword = await getConfigValue(ADMIN_PASSWORD_KEY);
  if (!currentHashedPassword) {
      // If no password is set in DB, but user provided a "current password" input
      if (currentPasswordInput) {
         console.warn('[AuthAction] changeAdminPasswordAction: No admin password in DB, but currentPasswordInput was provided.');
         return { success: false, error: '当前管理员密码记录不存在，但您提供了当前密码。请清除当前密码字段或重置应用配置。' };
      }
      // If no password in DB and no currentPasswordInput, proceed to set new password
      console.log('[AuthAction] changeAdminPasswordAction: No existing admin password. Proceeding to set new password.');
  } else {
      // If password exists in DB, currentPasswordInput is required
      if (!currentPasswordInput) {
        console.warn('[AuthAction] changeAdminPasswordAction: Admin password exists in DB, but currentPasswordInput is empty.');
        return { success: false, error: '当前密码不能为空，因为系统记录中存在密码。' };
      }
      const isCurrentPasswordValid = await bcrypt.compare(currentPasswordInput, currentHashedPassword);
      if (!isCurrentPasswordValid) {
        console.warn('[AuthAction] changeAdminPasswordAction: Current password provided is incorrect.');
        return { success: false, error: '当前密码不正确。' };
      }
      console.log('[AuthAction] changeAdminPasswordAction: Current password verified.');
  }

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const newHashedPassword = await bcrypt.hash(newPasswordInput, 10);
    await setConfigValue(ADMIN_PASSWORD_KEY, newHashedPassword, connection);

    await connection.commit();
    console.log('[AuthAction] changeAdminPasswordAction: Admin password changed successfully.');
    return { success: true, message: '管理员密码已成功更新！' };
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`[AuthAction] changeAdminPasswordAction: Error. Message: ${error.message}`, error);
    return { success: false, error: `密码更新失败: ${error.message}` };
  } finally {
    if (connection) {
        console.log('[AuthAction] changeAdminPasswordAction: Releasing DB connection.');
        connection.release();
    }
  }
}

export async function getAppSettingsAction(): Promise<AppSettingsResult> {
  noStore();
  console.log('[AuthAction] getAppSettingsAction: Fetching app settings.');
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
    console.log('[AuthAction] getAppSettingsAction: Successfully fetched settings:', settings);
    return settings;
  } catch (error: any) {
    console.error(`[AuthAction] getAppSettingsAction: Error. Message: ${error.message}`, error);
    const defaultSettings = { 
        logoText: '晚风Marks', 
        logoIcon: 'ShieldCheck', 
        adminPasswordSet: false 
    };
    console.warn('[AuthAction] getAppSettingsAction: Returning default settings due to error.');
    return defaultSettings;
  } finally {
    if (connection) {
        console.log('[AuthAction] getAppSettingsAction: Releasing DB connection.');
        connection.release();
    }
  }
}

export async function updateLogoSettingsAction(logoText: string, logoIcon: string): Promise<ActionResult> {
  noStore();
  console.log(`[AuthAction] updateLogoSettingsAction: Updating logoText to "${logoText}", logoIcon to "${logoIcon}".`);
  if (!logoText || !logoIcon) {
    return { success: false, error: 'Logo 文本和图标不能为空。' };
  }

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    await setConfigValue(LOGO_TEXT_KEY, logoText, connection);
    await setConfigValue(LOGO_ICON_KEY, logoIcon, connection);

    await connection.commit();
    console.log('[AuthAction] updateLogoSettingsAction: Logo settings updated successfully.');
    return { success: true, message: 'Logo 设置已成功更新！' };
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`[AuthAction] updateLogoSettingsAction: Error. Message: ${error.message}`, error);
    return { success: false, error: `Logo 设置更新失败: ${error.message}` };
  } finally {
    if (connection) {
        console.log('[AuthAction] updateLogoSettingsAction: Releasing DB connection.');
        connection.release();
    }
  }
}
    

    
