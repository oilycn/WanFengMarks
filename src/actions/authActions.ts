
'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { connectToDatabase, query } from '@/lib/mysql';
import bcrypt from 'bcryptjs';
import type { RowDataPacket, OkPacket } from 'mysql2';

const ADMIN_PASSWORD_KEY = 'adminHashedPassword';
const DATABASE_TYPE_KEY = 'databaseType';
const SETUP_COMPLETED_KEY = 'setupCompleted';

interface ConfigRow extends RowDataPacket {
  config_key: string;
  config_value: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

async function getConfigValue(key: string): Promise<string | null> {
  noStore();
  try {
    const rows = await query<ConfigRow[]>("SELECT config_value FROM config WHERE config_key = ?", [key]);
    return rows.length > 0 ? rows[0].config_value : null;
  } catch (error) {
    // If table doesn't exist yet during first setup, this might fail.
    // For isSetupComplete, this implies setup is not done.
    console.warn(`[AuthAction] Error fetching config key "${key}":`, error);
    return null;
  }
}

async function setConfigValue(key: string, value: string): Promise<void> {
  await query("REPLACE INTO config (config_key, config_value) VALUES (?, ?)", [key, value]);
}

export async function setInitialAdminConfigAction(password: string, databaseType: string): Promise<ActionResult> {
  noStore();
  console.log('[AuthAction] Attempting to set initial admin config for MySQL.');

  if (!password && databaseType !== 'temporary') { // Allow empty password for temporary for easier testing if needed
    console.log('[AuthAction] Admin password is empty for persistent DB. Setup failed.');
    return { success: false, error: '管理员密码不能为空。' };
  }
  
  // For 'temporary' type, we don't store password in DB, it's in-memory (handled by verifyAdminPasswordAction if needed)
  // Or, we can decide 'temporary' also uses DB for this config to be consistent.
  // For now, this action will always try to write to DB if it's not 'temporary'.

  try {
    const setupCompleted = await getConfigValue(SETUP_COMPLETED_KEY);
    if (setupCompleted === 'true') {
      // Allow re-setting for now.
      console.log('[AuthAction] Setup already marked complete. Proceeding to update config.');
    }

    if (databaseType !== 'temporary') {
        const hashedPassword = await bcrypt.hash(password, 10);
        await setConfigValue(ADMIN_PASSWORD_KEY, hashedPassword);
    } else {
        // For 'temporary', we might not store a password in the DB or a placeholder
        await setConfigValue(ADMIN_PASSWORD_KEY, 'TEMPORARY_NO_DB_PASSWORD');
    }
    
    await setConfigValue(DATABASE_TYPE_KEY, databaseType);
    await setConfigValue(SETUP_COMPLETED_KEY, 'true');

    console.log(`[AuthAction] Admin config SET for MySQL. DB Type: ${databaseType}`);
    return { success: true };
  } catch (error) {
    console.error('[AuthAction] Error setting initial admin config for MySQL:', error);
    return { success: false, error: '无法保存管理员配置到MySQL数据库。' };
  }
}

export async function verifyAdminPasswordAction(password: string): Promise<boolean> {
  noStore();
  console.log('[AuthAction] Verifying admin password with MySQL.');
  try {
    const selectedDbType = await getSelectedDatabaseTypeAction();
    if (selectedDbType === 'temporary') {
        // For temporary, if we adopt an in-memory password set during initial setup,
        // we'd need a separate in-memory store here.
        // For simplicity of this refactor, 'temporary' will mean no password check server-side for now.
        // This should be secured if 'temporary' mode needs actual password protection.
        console.warn('[AuthAction] In temporary mode, skipping DB password verification. THIS IS INSECURE.');
        return true; // Or implement a separate in-memory temporary password logic.
    }

    const hashedPassword = await getConfigValue(ADMIN_PASSWORD_KEY);
    const setupCompleted = await getConfigValue(SETUP_COMPLETED_KEY);

    if (!hashedPassword || setupCompleted !== 'true') {
      console.warn('[AuthAction] MySQL: Admin password verification attempted before setup or password is null in DB.');
      return false;
    }
    if (hashedPassword === 'TEMPORARY_NO_DB_PASSWORD') {
        console.warn('[AuthAction] MySQL: Attempting to verify password for a temporary setup that did not store a hash.');
        return false; // Or true if temporary means no password
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
    await connectToDatabase(); // This establishes the pool if not already done.
    const setupCompleted = await getConfigValue(SETUP_COMPLETED_KEY);
    const isComplete = setupCompleted === 'true';
    console.log(`[AuthAction] isSetupCompleteAction (MySQL) called. Setup completed value: ${setupCompleted}, isComplete: ${isComplete}`);
    return isComplete;
  } catch (error) {
    console.error('[AuthAction] Error checking setup status with MySQL:', error);
    // If config table doesn't exist or DB error, assume setup is not complete.
    return false;
  }
}

export async function getSelectedDatabaseTypeAction(): Promise<string> {
    noStore();
    try {
      const dbType = await getConfigValue(DATABASE_TYPE_KEY);
      return dbType || 'temporary'; // Fallback if not set
    } catch (error) {
      console.error('[AuthAction] Error getting selected database type from MySQL:', error);
      return 'temporary'; // Fallback on error
    }
}

export async function resetSetupStateAction(): Promise<void> {
    noStore();
    // This function should be used with extreme caution.
    // For MySQL, it means deleting specific rows from the config table.
    try {
        await query("DELETE FROM config WHERE config_key = ?", [ADMIN_PASSWORD_KEY]);
        await query("DELETE FROM config WHERE config_key = ?", [DATABASE_TYPE_KEY]);
        await query("DELETE FROM config WHERE config_key = ?", [SETUP_COMPLETED_KEY]);
        console.log('[AuthAction] Setup state has been reset in MySQL config table.');
    } catch (error) {
        console.error('[AuthAction] Error resetting setup state in MySQL:', error);
        // Potentially re-throw or handle more gracefully
    }
}
