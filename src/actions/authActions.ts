
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

interface AppSettingsResult {
  logoText: string | null;
  logoIcon: string | null;
  adminPasswordSet: boolean;
}


async function getConfigValue(key: string, connection?: PoolConnection): Promise<string | null> {
  noStore();
  // console.log(`[AuthAction] getConfigValue: Called for key: "${key}"`);
  try {
    let actualRows: ConfigRow[];

    if (connection) {
      // console.log(`[AuthAction] getConfigValue: Using provided connection to query for key: "${key}"`);
      const [rowsFromConnectionQuery] = await connection.query<ConfigRow[]>("SELECT config_value FROM config WHERE config_key = ?", [key]);
      actualRows = rowsFromConnectionQuery;
    } else {
      // console.log(`[AuthAction] getConfigValue: Using global query function for key: "${key}"`);
      actualRows = await query<ConfigRow[]>("SELECT config_value FROM config WHERE config_key = ?", [key]);
    }

    // console.log(`[AuthAction] getConfigValue: Query executed for key "${key}". Found ${actualRows.length} rows.`);
    if (actualRows.length > 0) {
      // console.log(`[AuthAction] getConfigValue: Key "${key}" found, value: "${actualRows[0].config_value}"`);
      return actualRows[0].config_value;
    } else {
      // console.log(`[AuthAction] getConfigValue: Key "${key}" NOT found in database.`);
      return null;
    }
  } catch (error: any) {
    console.error(`[AuthAction] getConfigValue: Error fetching config key "${key}". Message: ${error.message}`, error);
    return null;
  }
}

async function setConfigValue(key: string, value: string, connection?: PoolConnection): Promise<void> {
  // console.log(`[AuthAction] setConfigValue: Setting key "${key}" to value "${value}"`);
  const execQuery = connection ? connection.query.bind(connection) : query;
  await execQuery("REPLACE INTO config (config_key, config_value) VALUES (?, ?)", [key, value]);
  // console.log(`[AuthAction] setConfigValue: Successfully set key "${key}"`);
}

export async function testMySQLConnectionAction(): Promise<ActionResult> {
  noStore();
  let connection: PoolConnection | null = null;
  console.log('[AuthAction] testMySQLConnectionAction: Attempting to test MySQL connection...');
  try {
    connection = await connectToDatabase();
    await connection.query('SELECT 1');
    console.log('[AuthAction] testMySQLConnectionAction: MySQL connection test successful.');
    return { success: true, message: '数据库连接成功！' };
  } catch (error: any) {
    console.error('[AuthAction] testMySQLConnectionAction: MySQL connection test failed:', error);
    return { success: false, error: `数据库连接失败: ${error.message}` };
  } finally {
    if (connection) {
      // console.log('[AuthAction] testMySQLConnectionAction: Releasing connection.');
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

    // Set default logo text and icon if not already set
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
    // console.log(`[AuthAction] initializeMySQLDatabaseAction: Checking for default category "${defaultCategoryName}"...`);
    const [existingCategories] = await connection.query<CategoryRow[]>("SELECT id FROM categories WHERE name = ?", [defaultCategoryName]);
    if (existingCategories.length === 0) {
      // console.log(`[AuthAction] initializeMySQLDatabaseAction: Default category not found. Creating "${defaultCategoryName}"...`);
      await connection.query(
        "INSERT INTO categories (name, icon, is_visible, is_private, priority) VALUES (?, ?, ?, ?, ?)",
        [defaultCategoryName, 'Folder', true, false, 1]
      );
      // console.log(`[AuthAction] initializeMySQLDatabaseAction: Created default '${defaultCategoryName}' category with priority 1.`);
    } else {
      // console.log(`[AuthAction] initializeMySQLDatabaseAction: Default category "${defaultCategoryName}" already exists.`);
    }

    console.log('[AuthAction] initializeMySQLDatabaseAction: Committing transaction.');
    await connection.commit();
    console.log('[AuthAction] initializeMySQLDatabaseAction: MySQL database tables initialized successfully.');
    return { success: true, message: '数据库表初始化成功！' };
  } catch (error: any) {
    console.error('[AuthAction] initializeMySQLDatabaseAction: Database initialization FAILED.', error);
    if (connection) {
      console.log('[AuthAction] initializeMySQLDatabaseAction: Rolling back transaction due to error.');
      await connection.rollback();
    }
    return { success: false, error: `数据库初始化失败: ${error.message}` };
  } finally {
    if (connection) {
      // console.log('[AuthAction] initializeMySQLDatabaseAction: Releasing connection.');
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
    // console.log('[AuthAction] setInitialAdminConfigAction: Connected to DB. Beginning transaction.');
    await connection.beginTransaction();

    // console.log('[AuthAction] setInitialAdminConfigAction: Hashing password.');
    const hashedPassword = await bcrypt.hash(password, 10);
    await setConfigValue(ADMIN_PASSWORD_KEY, hashedPassword, connection);
    // console.log('[AuthAction] setInitialAdminConfigAction: Admin password hash stored.');

    await setConfigValue(SETUP_COMPLETED_KEY, 'true', connection);
    // console.log('[AuthAction] setInitialAdminConfigAction: Setup completed flag set to "true".');

    // console.log('[AuthAction] setInitialAdminConfigAction: Committing transaction.');
    await connection.commit();
    console.log('[AuthAction] setInitialAdminConfigAction: Admin config SET. Setup marked as complete.');
    return { success: true, message: '管理员配置已成功保存！' };
  } catch (error: any) {
    console.error('[AuthAction] setInitialAdminConfigAction: Error setting initial admin config.', error);
    if (connection) {
      // console.log('[AuthAction] setInitialAdminConfigAction: Rolling back transaction due to error.');
      await connection.rollback();
    }
    return { success: false, error: `无法保存管理员配置: ${error.message}` };
  } finally {
    if (connection) {
      // console.log('[AuthAction] setInitialAdminConfigAction: Releasing connection.');
      connection.release();
    }
  }
}

export async function verifyAdminPasswordAction(password: string): Promise<boolean> {
  noStore();
  // console.log('[AuthAction] verifyAdminPasswordAction: Verifying admin password.');
  try {
    const setupCompleted = await isSetupCompleteAction();
    if (!setupCompleted) {
         console.warn('[AuthAction] verifyAdminPasswordAction: Admin password verification attempted before setup is complete. Returning false.');
         return false;
    }

    const hashedPassword = await getConfigValue(ADMIN_PASSWORD_KEY);
    if (!hashedPassword) {
      console.warn('[AuthAction] verifyAdminPasswordAction: Admin password not found in DB. Returning false.');
      return false;
    }

    // console.log('[AuthAction] verifyAdminPasswordAction: Comparing provided password with stored hash.');
    const isValid = await bcrypt.compare(password, hashedPassword);
    // console.log(`[AuthAction] verifyAdminPasswordAction: Password validation result: ${isValid}`);
    return isValid;
  } catch (error:any) {
    console.error(`[AuthAction] verifyAdminPasswordAction: Error verifying admin password. Message: ${error.message}`, error);
    return false;
  }
}

export async function isSetupCompleteAction(): Promise<boolean> {
  noStore();
  // console.log('[AuthAction] isSetupCompleteAction: TOP - Checking if setup is complete.');
  let connection: PoolConnection | null = null;
  try {
    // console.log('[AuthAction] isSetupCompleteAction: Attempting to connect to database...');
    connection = await connectToDatabase();
    // console.log('[AuthAction] isSetupCompleteAction: Connected to database. Attempting to get config value for:', SETUP_COMPLETED_KEY);
    
    const setupCompletedValue = await getConfigValue(SETUP_COMPLETED_KEY, connection);
    // console.log(`[AuthAction] isSetupCompleteAction: Raw setupCompletedValue from getConfigValue: '${setupCompletedValue}' (type: ${typeof setupCompletedValue})`);

    if (setupCompletedValue === 'true') {
      // console.log('[AuthAction] isSetupCompleteAction: Returning TRUE (setup is complete).');
      return true;
    } else {
      // console.log(`[AuthAction] isSetupCompleteAction: Returning FALSE (setupCompletedValue is not 'true', it is '${setupCompletedValue}').`);
      return false;
    }
  } catch (error: any) {
    if (error.message && (error.message.includes("Table 'config' doesn't exist") || (error.code && error.code === 'ER_NO_SUCH_TABLE'))) {
      // console.log('[AuthAction] isSetupCompleteAction: Config table does not exist. Returning FALSE (setup is not complete).');
      return false;
    }
    console.error(`[AuthAction] isSetupCompleteAction: Caught error: ${error.message}`, error);
    // console.log('[AuthAction] isSetupCompleteAction: Returning FALSE due to error.');
    return false;
  } finally {
    if (connection) {
      // console.log('[AuthAction] isSetupCompleteAction: Releasing database connection.');
      connection.release();
    }
    // console.log('[AuthAction] isSetupCompleteAction: BOTTOM');
  }
}


export async function getSelectedDatabaseTypeAction(): Promise<string> {
    noStore();
    // console.log('[AuthAction] getSelectedDatabaseTypeAction: Determining database type.');
    try {
      const isSetupDone = await isSetupCompleteAction();
      if (isSetupDone) {
        // console.log('[AuthAction] getSelectedDatabaseTypeAction: Setup is complete, returning "mysql".');
        return 'mysql';
      }
      // console.log('[AuthAction] getSelectedDatabaseTypeAction: Setup not complete, returning "unconfigured".');
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
            console.log(`[AuthAction] resetSetupStateAction: 'config' table exists. Deleting keys.`);
            await connection.query("DELETE FROM config WHERE config_key = ?", [ADMIN_PASSWORD_KEY]);
            await connection.query("DELETE FROM config WHERE config_key = ?", [SETUP_COMPLETED_KEY]);
            await connection.query("DELETE FROM config WHERE config_key = ?", [LOGO_TEXT_KEY]);
            await connection.query("DELETE FROM config WHERE config_key = ?", [LOGO_ICON_KEY]);
            console.log(`[AuthAction] resetSetupStateAction: All relevant config keys deleted.`);
        } else {
            console.log(`[AuthAction] resetSetupStateAction: 'config' table does not exist. No keys to delete.`);
        }
        
        await connection.commit();
        console.log('[AuthAction] resetSetupStateAction: Setup state has been reset.');
        return { success: true, message: '应用配置已重置。您可以重新开始设置流程。' };
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error(`[AuthAction] resetSetupStateAction: Error resetting setup state. Message: ${error.message}`, error);
        return { success: false, error: `重置配置失败: ${error.message}` };
    } finally {
        if (connection) connection.release();
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
      // This case might occur if initial setup was done without a password, or if a reset happened.
      // For security, if no password is set, we might want to force initial password setup flow.
      // However, if we allow changing from "no password" to "new password", we skip verification.
      // For now, let's assume a password must exist to be changed.
      // If there's no current password in DB, it implies an incomplete or reset setup.
      console.warn('[AuthAction] changeAdminPasswordAction: No current admin password hash found in DB. This might indicate an incomplete setup or a reset.');
      // To handle this, let's verify if currentPasswordInput is also empty, signifying user knows no password is set.
      if (currentPasswordInput) {
         return { success: false, error: '当前管理员密码记录不存在，但您提供了当前密码。请检查系统状态或联系支持。' };
      }
      // If no current password in DB AND user provides no currentPasswordInput, proceed to set new password
  } else {
      // If a hashed password exists, verify currentPasswordInput against it
      if (!currentPasswordInput) {
        return { success: false, error: '当前密码不能为空，因为系统记录中存在密码。' };
      }
      const isCurrentPasswordValid = await bcrypt.compare(currentPasswordInput, currentHashedPassword);
      if (!isCurrentPasswordValid) {
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
    console.log('[AuthAction] changeAdminPasswordAction: Admin password changed successfully.');
    return { success: true, message: '管理员密码已成功更新！' };
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`[AuthAction] changeAdminPasswordAction: Error. Message: ${error.message}`, error);
    return { success: false, error: `密码更新失败: ${error.message}` };
  } finally {
    if (connection) connection.release();
  }
}

export async function getAppSettingsAction(): Promise<AppSettingsResult> {
  noStore();
  // console.log('[AuthAction] getAppSettingsAction: Fetching app settings.');
  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    const logoText = await getConfigValue(LOGO_TEXT_KEY, connection);
    const logoIcon = await getConfigValue(LOGO_ICON_KEY, connection);
    const adminPasswordHash = await getConfigValue(ADMIN_PASSWORD_KEY, connection);
    return { 
      logoText: logoText || '晚风Marks', 
      logoIcon: logoIcon || 'ShieldCheck',
      adminPasswordSet: !!adminPasswordHash // True if hash exists, false otherwise
    };
  } catch (error: any) {
    console.error(`[AuthAction] getAppSettingsAction: Error. Message: ${error.message}`, error);
    return { 
        logoText: '晚风Marks', 
        logoIcon: 'ShieldCheck', 
        adminPasswordSet: false 
    }; // Return defaults on error
  } finally {
    if (connection) connection.release();
  }
}

export async function updateLogoSettingsAction(logoText: string, logoIcon: string): Promise<ActionResult> {
  noStore();
  console.log('[AuthAction] updateLogoSettingsAction: Updating logo settings.');
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
    if (connection) connection.release();
  }
}

    