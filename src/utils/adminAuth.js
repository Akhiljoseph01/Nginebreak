/**
 * Admin Role & System Settings Management for Nginebreak
 */

const STORAGE_KEY_ADMIN_MODE = "nginebreak_admin_mode";
const STORAGE_KEY_ADMIN_SETTINGS = "nginebreak_admin_settings";
const STORAGE_KEY_ADMIN_VIEW_MODE = "nginebreak_admin_view_mode"; // 'admin' | 'user'

// Default admin email configured for Nginebreak
export const DEFAULT_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "wopstrat@gmail.com";

// Default system-wide settings configurable only by admin
export const DEFAULT_ADMIN_SETTINGS = {
  // Image Compression: 'saver' (~1MP/1280px, ~50-80KB) vs 'standard' (1920px, ~120KB)
  imageOptimizationMode: "saver",
  // Notification switching options
  notifService: true,
  notifOverdue: true,
  notifUpdates: false,
  // System feature flags & Beta Testing Mode
  darkMode: false,
  maintenanceMode: false,
  betaTestingMode: false, // 🧪 Admin & Tester Preview Mode
  allowGuestMode: true,
  debugLogs: false,
};

/**
 * Checks if the user is an Admin AND currently in Admin View Mode
 */
export function isUserAdmin(currentUser) {
  if (!isRealAdmin(currentUser)) return false;
  return getAdminViewMode() !== "user";
}

/**
 * Checks if the user has Admin rights (strictly restricted to wopstrat@gmail.com)
 */
export function isRealAdmin(currentUser) {
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  
  // If a user is logged in, their email MUST match the official admin email
  if (currentUser?.email) {
    const userEmail = currentUser.email.toLowerCase().trim();
    if (userEmail === adminEmail) {
      return true;
    }
    // Any other authenticated user is strictly NOT an admin.
    // Clear any residual localStorage admin flags to avoid privilege deviation.
    if (localStorage.getItem(STORAGE_KEY_ADMIN_MODE)) {
      localStorage.removeItem(STORAGE_KEY_ADMIN_MODE);
    }
    return false;
  }

  // If no user is logged in (guest / unauthenticated), do NOT give admin privileges
  return false;
}

/**
 * Get current admin view mode ('admin' or 'user')
 */
export function getAdminViewMode() {
  return localStorage.getItem(STORAGE_KEY_ADMIN_VIEW_MODE) || "admin";
}

/**
 * Set admin view mode ('admin' or 'user')
 */
export function setAdminViewMode(mode) {
  localStorage.setItem(STORAGE_KEY_ADMIN_VIEW_MODE, mode);
  window.dispatchEvent(new Event("admin_state_changed"));
  return mode;
}

/**
 * Toggle admin view mode with a single click ('admin' <-> 'user')
 */
export function toggleAdminViewMode() {
  const current = getAdminViewMode();
  const next = current === "user" ? "admin" : "user";
  return setAdminViewMode(next);
}

/**
 * Activate admin mode via credential
 */
export function activateAdminMode(credentialOrPin) {
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  const cleaned = (credentialOrPin || "").trim().toLowerCase();
  
  if (cleaned === adminEmail || cleaned === "wopstrat@2002") {
    localStorage.setItem(STORAGE_KEY_ADMIN_MODE, "true");
    setAdminViewMode("admin");
    window.dispatchEvent(new Event("admin_state_changed"));
    return { success: true };
  }
  return { success: false, error: "Unauthorized. Admin privileges restricted." };
}

/**
 * Deactivate admin mode completely
 */
export function deactivateAdminMode() {
  localStorage.removeItem(STORAGE_KEY_ADMIN_MODE);
  localStorage.removeItem(STORAGE_KEY_ADMIN_VIEW_MODE);
  window.dispatchEvent(new Event("admin_state_changed"));
}

/**
 * Load admin configuration
 */
export function getAdminSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_SETTINGS);
    if (!raw) return DEFAULT_ADMIN_SETTINGS;
    return { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

/**
 * Save admin configuration
 */
export function saveAdminSettings(newSettings) {
  try {
    const merged = { ...getAdminSettings(), ...newSettings };
    localStorage.setItem(STORAGE_KEY_ADMIN_SETTINGS, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent("admin_settings_changed", { detail: merged }));
    return merged;
  } catch (err) {
    console.error("Failed to save admin settings:", err);
    return getAdminSettings();
  }
}
