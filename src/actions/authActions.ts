
'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import type { Collection } from 'mongodb';

const CONFIG_COLLECTION = 'config';
const ADMIN_CONFIG_ID = 'adminCredentials'; // Unique ID for the admin config document

interface AdminConfigDocument {
  _id: string;
  hashedPassword?: string;
  databaseType?: string;
  setupCompleted?: boolean;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

async function getConfigCollection(): Promise<Collection<AdminConfigDocument>> {
  const { db } = await connectToDatabase();
  return db.collection<AdminConfigDocument>(CONFIG_COLLECTION);
}

export async function setInitialAdminConfigAction(password: string, databaseType: string): Promise<ActionResult> {
  noStore();
  console.log('[AuthAction] Attempting to set initial admin config.');

  if (!password) {
    console.log('[AuthAction] Admin password is empty. Setup failed.');
    return { success: false, error: `管理员密码不能为空。` };
  }

  try {
    const configCollection = await getConfigCollection();
    const existingConfig = await configCollection.findOne({ _id: ADMIN_CONFIG_ID });

    if (existingConfig?.setupCompleted) {
      // This case should ideally be prevented by client-side checks, but as a safeguard:
      console.log('[AuthAction] Setup already completed. No changes made.');
      // return { success: false, error: '初始配置已完成，不能重复设置。' };
      // Allow re-setting for now, useful if DB was cleared but client still tries to set up.
      // Or, if we want to allow password changes via a different mechanism later.
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await configCollection.updateOne(
      { _id: ADMIN_CONFIG_ID },
      { $set: { hashedPassword, databaseType, setupCompleted: true } },
      { upsert: true }
    );

    console.log(`[AuthAction] Admin config SET in DB. DB Type: ${databaseType}`);
    return { success: true };
  } catch (error) {
    console.error('[AuthAction] Error setting initial admin config:', error);
    return { success: false, error: '无法保存管理员配置到数据库。' };
  }
}

export async function verifyAdminPasswordAction(password: string): Promise<boolean> {
  noStore();
  console.log('[AuthAction] Verifying admin password.');
  try {
    const configCollection = await getConfigCollection();
    const adminConfig = await configCollection.findOne({ _id: ADMIN_CONFIG_ID });

    if (!adminConfig || !adminConfig.hashedPassword || !adminConfig.setupCompleted) {
      console.warn('[AuthAction] Admin password verification attempted before setup or password is null in DB.');
      return false;
    }

    const isValid = await bcrypt.compare(password, adminConfig.hashedPassword);
    if (isValid) {
      console.log('[AuthAction] Admin password verified (DB).');
    } else {
      console.warn('[AuthAction] Admin password verification failed (DB).');
    }
    return isValid;
  } catch (error) {
    console.error('[AuthAction] Error verifying admin password:', error);
    return false;
  }
}

export async function isSetupCompleteAction(): Promise<boolean> {
  noStore();
  console.log('[AuthAction] Checking if setup is complete.');
  try {
    const configCollection = await getConfigCollection();
    const adminConfig = await configCollection.findOne({ _id: ADMIN_CONFIG_ID });
    const isComplete = !!(adminConfig && adminConfig.hashedPassword && adminConfig.setupCompleted);
    console.log(`[AuthAction] isSetupCompleteAction called. Admin config from DB: ${adminConfig ? 'found' : 'not found'}, isComplete: ${isComplete}`);
    return isComplete;
  } catch (error) {
    console.error('[AuthAction] Error checking setup status:', error);
    // In case of DB error, prevent app from proceeding as if setup is done.
    // This might redirect to /setup, which is safer than a broken main app.
    return false;
  }
}

export async function getSelectedDatabaseTypeAction(): Promise<string> {
    noStore();
    try {
      const configCollection = await getConfigCollection();
      const adminConfig = await configCollection.findOne({ _id: ADMIN_CONFIG_ID });
      return adminConfig?.databaseType || 'temporary'; // Fallback if not set
    } catch (error) {
      console.error('[AuthAction] Error getting selected database type:', error);
      return 'temporary'; // Fallback on error
    }
}

export async function resetSetupStateAction(): Promise<void> {
    noStore();
    try {
        const configCollection = await getConfigCollection();
        await configCollection.deleteOne({ _id: ADMIN_CONFIG_ID });
        console.log('[AuthAction] Setup state has been reset in DB.');
    } catch (error) {
        console.error('[AuthAction] Error resetting setup state:', error);
    }
}
