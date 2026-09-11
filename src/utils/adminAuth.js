/**
 * Admin Role & System Settings Management for Nginebreak
 */

const STORAGE_KEY_ADMIN_MODE = "nginebreak_admin_mode";
const STORAGE_KEY_ADMIN_SETTINGS = "nginebreak_admin_settings";

// Default admin email (can be overridden by VITE_ADMIN_EMAIL env var or user input)
export const DEFAULT_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@nginebreak.com";

// Default system-wide settings configurable only by admin
export const DEFAULT_ADMIN_SETTINGS = {
  // Image Compression: 'saver' (~1MP/1280px, ~50-80KB) vs 'standard' (1920px, ~120KB)
  imageOptimizationMode: "saver",
  // Notification switching options
  notifService: true,
  notifOverdue: true,
  notifUpdates: false,
  // System feature flags
  darkMode: false,
  maintenanceMode: false,
  allowGuestMode: true,
  debugLogs: false,
};

/**
 * Checks if the current user has Admin privileges:
 * 1. Matches configured admin email in Supabase/Auth, OR
 * 2. Admin mode unlocked in browser session via PIN / Admin Credentials
 */
export function isUserAdmin(currentUser) {
  if (currentUser?.email) {
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
    if (currentUser.email.toLowerCase().trim() === adminEmail) {
      return true;
    }
  }
  return localStorage.getItem(STORAGE_KEY_ADMIN_MODE) === "true";
}

/**
 * Activate admin mode via credential / PIN
 */
export function activateAdminMode(credentialOrPin) {
  const adminSecret = import.meta.env.VITE_ADMIN_PIN || "admin2026";
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();

  const cleaned = (credentialOrPin || "").trim().toLowerCase();
  if (cleaned === adminSecret.toLowerCase() || cleaned === adminEmail) {
    localStorage.setItem(STORAGE_KEY_ADMIN_MODE, "true");
    window.dispatchEvent(new Event("admin_state_changed"));
    return { success: true };
  }
  return { success: false, error: "Invalid admin credential or PIN." };
}

/**
 * Deactivate admin mode
 */
export function deactivateAdminMode() {
  localStorage.removeItem(STORAGE_KEY_ADMIN_MODE);
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
