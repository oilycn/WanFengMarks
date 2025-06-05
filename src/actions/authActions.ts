
'use server';

// IMPORTANT: This is an IN-MEMORY store for the admin password.
// It is NOT secure for production and will be lost on server restart.
// Replace with secure, hashed password storage in a real database.
let memoryAdminPassword: string | null = null;
let setupCompletedFlag = false;

const MIN_PASSWORD_LENGTH = 6;

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function setInitialAdminPasswordAction(password: string): Promise<ActionResult> {
  if (setupCompletedFlag && memoryAdminPassword) {
    // This check might be too restrictive if an admin wants to *change* the password later
    // For now, it implies this action is only for the very first setup.
    // Consider a separate 'changeAdminPasswordAction' for updates.
    // return { success: false, error: "管理员密码已设置。如需更改，请使用密码修改功能。" };
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return { success: false, error: `密码长度至少为 ${MIN_PASSWORD_LENGTH} 位。` };
  }

  // In a real app, hash the password here before storing
  // e.g., using bcrypt or argon2
  memoryAdminPassword = password; // Storing plain text - FOR DEMO ONLY
  setupCompletedFlag = true;
  console.log('Server Action: Initial admin password set (IN-MEMORY).');
  return { success: true };
}

export async function verifyAdminPasswordAction(password: string): Promise<boolean> {
  if (!setupCompletedFlag || !memoryAdminPassword) {
    console.warn('Server Action: Admin password verification attempted before setup or password is null.');
    return false; // No password set means verification fails
  }
  // In a real app, compare the provided password with the stored hash
  const isValid = password === memoryAdminPassword;
  if (isValid) {
    console.log('Server Action: Admin password verified (IN-MEMORY).');
  } else {
    console.warn('Server Action: Admin password verification failed (IN-MEMORY).');
  }
  return isValid;
}

export async function isSetupCompleteAction(): Promise<boolean> {
  // The "setup" is considered complete if an admin password has been set.
  const isComplete = setupCompletedFlag && memoryAdminPassword !== null;
  console.log(`Server Action: isSetupCompleteAction called. Status: ${isComplete}`);
  return isComplete;
}

// Helper to reset setup state (for development/testing purposes)
// This would not exist in a production app.
export async function resetSetupStateAction(): Promise<void> {
    memoryAdminPassword = null;
    setupCompletedFlag = false;
    console.log('Server Action: Setup state has been reset (IN-MEMORY).');
}
