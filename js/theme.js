(function () {
    const SETTINGS_KEY = 'SMART_BOARD_APP_SETTINGS';
    const APPEARANCE_PREF_KEY = 'appearancePreferenceSet';
    const pathname = String(window.location.pathname || '').toLowerCase();
    const isLoginPage = pathname.endsWith('/login.html') || pathname.endsWith('login.html');
    const root = document.documentElement;

    function readSettings() {
        // Use window.* to avoid relying on global identifier bindings.
        if (typeof window.getAdminSettings === 'function') {
            return window.getAdminSettings();
        }

        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function persistSettings(partial) {
        // Use window.* to avoid relying on global identifier bindings.
        if (typeof window.updateAdminSettings === 'function') {
            return window.updateAdminSettings(partial || {});
        }

        const safePartial = partial && typeof partial === 'object' ? { ...partial } : {};
        // When persisting dark mode outside of config.js, mark it as an explicit preference.
        if (Object.prototype.hasOwnProperty.call(safePartial, 'darkMode')) {
            safePartial[APPEARANCE_PREF_KEY] = true;
        }

        const current = readSettings();
        const merged = { ...current, ...safePartial };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
        return merged;
    }

    function setClass(target, className, enabled) {
        if (!target) return;
        target.classList.toggle(className, !!enabled);
    }

    function updateThemeToggle(settings) {
        const button = document.getElementById('themeToggle');
        if (!button) return;

        const isDarkMode = settings.darkMode === true;
        button.classList.toggle('is-dark', isDarkMode);
        button.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
        button.setAttribute('title', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
    }

    function applyAppearanceFromSettings(settings) {
        const darkMode = settings.darkMode === true;
        const animationsEnabled = settings.animationsEnabled !== false;
        const compactMode = settings.compactMode === true;

        root.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        root.style.colorScheme = darkMode ? 'dark' : 'light';
        setClass(root, 'animations-disabled', !animationsEnabled);
        setClass(root, 'compact-mode', compactMode);
        setClass(document.body, 'animations-disabled', !animationsEnabled);
        setClass(document.body, 'compact-mode', compactMode);
        updateThemeToggle(settings);

        // Keep settings page checkbox in sync (no events are fired by setting .checked).
        const settingsDarkToggle = document.getElementById('darkModeToggle');
        if (settingsDarkToggle && settingsDarkToggle.type === 'checkbox') {
            settingsDarkToggle.checked = darkMode;
        }
    }

    function applyTheme(themeOrMode, persist = true) {
        const darkMode = themeOrMode === true || themeOrMode === 'dark';
        const next = persist ? persistSettings({ darkMode }) : { ...readSettings(), darkMode };
        applyAppearanceFromSettings(next);
    }

    function setAnimationsEnabled(enabled, persist = true) {
        const next = persist ? persistSettings({ animationsEnabled: !!enabled }) : { ...readSettings(), animationsEnabled: !!enabled };
        applyAppearanceFromSettings(next);
    }

    function setCompactMode(enabled, persist = true) {
        const next = persist ? persistSettings({ compactMode: !!enabled }) : { ...readSettings(), compactMode: !!enabled };
        applyAppearanceFromSettings(next);
    }

    function toggleDarkMode() {
        const settings = readSettings();
        const next = persistSettings({ darkMode: !(settings.darkMode === true) });
        applyAppearanceFromSettings(next);
    }

    function syncFromSettings() {
        applyAppearanceFromSettings(readSettings());
    }

    window.adminTheme = {
        applyTheme,
        setDarkMode: (enabled, persist = true) => applyTheme(enabled ? 'dark' : 'light', persist),
        setAnimationsEnabled,
        setCompactMode,
        syncFromSettings,
        toggleDarkMode
    };

    if (isLoginPage) {
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
        return;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncFromSettings);
    } else {
        syncFromSettings();
    }
})();
