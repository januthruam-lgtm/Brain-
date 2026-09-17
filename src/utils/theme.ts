import { CustomThemeConfig, ThemeId } from "../types";
import { DEFAULT_THEMES_CONFIG } from "../data/initialData";

const STORAGE_THEME_ID_KEY = "studyhub_active_theme_id";
const STORAGE_THEME_CONFIG_KEY = "studyhub_custom_theme_config";

/**
 * Updates CSS Variables directly in document.documentElement (:root)
 * for instant, reactive real-time theme changing across the whole application.
 */
export function applyThemeToDOM(themeId: ThemeId, customConfig?: CustomThemeConfig): CustomThemeConfig {
  const config = customConfig || DEFAULT_THEMES_CONFIG[themeId] || DEFAULT_THEMES_CONFIG.paper_focus;
  const root = document.documentElement;

  // 1. Core Background Variables
  root.style.setProperty("--bg-color", config.bgMain);
  root.style.setProperty("--bg-main", config.bgMain);
  root.style.setProperty("--bg-card", config.bgCard);
  root.style.setProperty("--bg-card-secondary", config.bgCardSecondary || (config.bgCard === "#FFFFFF" ? "#F1F0E9" : "#1A1A1A"));

  // 2. Core Text Variables
  root.style.setProperty("--text-color", config.textPrimary);
  root.style.setProperty("--text-primary", config.textPrimary);
  root.style.setProperty("--text-secondary", config.textSecondary);
  root.style.setProperty("--text-muted", config.textMuted || config.textSecondary);

  // 3. Action Buttons & Accents
  root.style.setProperty("--btn-primary", config.btnPrimary);
  root.style.setProperty("--btn-primary-text", config.btnPrimaryText || "#FFFFFF");
  root.style.setProperty("--btn-primary-hover", config.btnPrimaryHover || config.btnPrimary);
  root.style.setProperty("--color-success", config.colorSuccess);
  root.style.setProperty("--color-accent", config.colorAccent);

  // 4. Borders & Dividers
  root.style.setProperty("--border-color", config.borderColor);
  root.style.setProperty("--border-subtle", config.borderSubtle || config.borderColor);

  // 5. Backwards Compatibility Aliases
  root.style.setProperty("--color-bg-main", config.bgMain);
  root.style.setProperty("--color-text-primary", config.textPrimary);

  // 6. Direct Body Sync
  if (document.body) {
    document.body.style.backgroundColor = config.bgMain;
    document.body.style.color = config.textPrimary;
  }

  // 7. Browser Tab Meta Color
  const metaTheme = document.querySelector("meta[name='theme-color']");
  if (metaTheme) {
    metaTheme.setAttribute("content", config.bgMain);
  }

  // 8. Persistence to localStorage
  try {
    localStorage.setItem(STORAGE_THEME_ID_KEY, themeId);
    localStorage.setItem(STORAGE_THEME_CONFIG_KEY, JSON.stringify(config));

    // Also synchronize connected user profile in localStorage if present
    const activeEmail = localStorage.getItem("studyhub_active_user_email");
    if (activeEmail) {
      const profileKey = "studyhub_profile_" + activeEmail.toLowerCase();
      const existing = localStorage.getItem(profileKey);
      if (existing) {
        const parsed = JSON.parse(existing);
        parsed.activeTheme = themeId;
        parsed.customThemeConfig = config;
        localStorage.setItem(profileKey, JSON.stringify(parsed));
      }
    }
  } catch (err) {
    console.warn("Could not persist theme to localStorage:", err);
  }

  return config;
}

/**
 * Retrieves the saved theme from localStorage on initial page load
 */
export function getSavedTheme(): { themeId: ThemeId; config: CustomThemeConfig } {
  try {
    const savedThemeId = (localStorage.getItem(STORAGE_THEME_ID_KEY) as ThemeId) || "paper_focus";
    const savedConfigJson = localStorage.getItem(STORAGE_THEME_CONFIG_KEY);

    if (savedConfigJson) {
      const parsedConfig = JSON.parse(savedConfigJson);
      return { themeId: savedThemeId, config: parsedConfig };
    }

    if (savedThemeId && DEFAULT_THEMES_CONFIG[savedThemeId]) {
      return { themeId: savedThemeId, config: DEFAULT_THEMES_CONFIG[savedThemeId] };
    }
  } catch (err) {
    console.warn("Could not read theme from localStorage:", err);
  }

  return { themeId: "paper_focus", config: DEFAULT_THEMES_CONFIG.paper_focus };
}

/**
 * Immediate initialization run on script evaluation
 */
export function initThemeFromStorage() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const { themeId, config } = getSavedTheme();
  applyThemeToDOM(themeId, config);
}

// Auto-run on module import
initThemeFromStorage();
