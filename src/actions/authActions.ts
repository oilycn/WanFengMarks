
'use server';

// IMPORTANT: This is an IN-MEMORY store for the admin password and setup state.
// It is NOT secure for production and will be lost on server restart.
// Replace with secure, hashed password storage and configuration in a real database.
let memoryAdminPassword: string | null = null;
let setupCompletedFlag = false;
let selectedDatabaseType: string = 'temporary'; // Default to temporary

// const MIN_PASSWORD_LENGTH = 6; // Removed length restriction

interface ActionResult {
  success: boolean;
  error?: string;
}

// Added databaseType parameter, though it's only stored in memory for now.
export async function setInitialAdminConfigAction(password: string, databaseType: string): Promise<ActionResult> {
  console.log('[AuthAction] Attempting to set initial admin config.');
  if (setupCompletedFlag && memoryAdminPassword) {
    // This check might be too restrictive if an admin wants to *change* the password later
    // For now, it implies this action is only for the very first setup.
  }

  // Removed password length check
  // if (!password || password.length < MIN_PASSWORD_LENGTH) {
  //   return { success: false, error: `密码长度至少为 ${MIN_PASSWORD_LENGTH} 位。` };
  // }
  if (!password) {
    console.log('[AuthAction] Admin password is empty. Setup failed.');
    return { success: false, error: `管理员密码不能为空。` };
  }


  // In a real app, hash the password here before storing
  memoryAdminPassword = password; // Storing plain text - FOR DEMO ONLY
  selectedDatabaseType = databaseType; // Storing selected DB type in memory
  setupCompletedFlag = true;
  console.log(`[AuthAction] Admin config SET. setupCompletedFlag: ${setupCompletedFlag}, memoryAdminPassword: ${memoryAdminPassword ? 'set' : 'null'}, DB Type: ${selectedDatabaseType}`);
  return { success: true };
}

export async function verifyAdminPasswordAction(password: string): Promise<boolean> {
  if (!setupCompletedFlag || !memoryAdminPassword) {
    console.warn('[AuthAction] Admin password verification attempted before setup or password is null.');
    return false; // No password set means verification fails
  }
  // In a real app, compare the provided password with the stored hash
  const isValid = password === memoryAdminPassword;
  if (isValid) {
    console.log('[AuthAction] Admin password verified (IN-MEMORY).');
  } else {
    console.warn('[AuthAction] Admin password verification failed (IN-MEMORY).');
  }
  return isValid;
}

export async function isSetupCompleteAction(): Promise<boolean> {
  // The "setup" is considered complete if an admin password has been set.
  const isComplete = setupCompletedFlag && memoryAdminPassword !== null;
  console.log(`[AuthAction] isSetupCompleteAction called. setupCompletedFlag: ${setupCompletedFlag}, memoryAdminPassword: ${memoryAdminPassword ? 'set' : 'null'}, isComplete: ${isComplete}`);
  return isComplete;
}

export async function getSelectedDatabaseTypeAction(): Promise<string> {
    return selectedDatabaseType;
}

// Helper to reset setup state (for development/testing purposes)
// This would not exist in a production app.
export async function resetSetupStateAction(): Promise<void> {
    memoryAdminPassword = null;
    setupCompletedFlag = false;
    selectedDatabaseType = 'temporary';
    console.log('[AuthAction] Setup state has been reset (IN-MEMORY).');
}

