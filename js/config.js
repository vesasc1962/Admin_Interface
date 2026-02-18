// Runtime configuration for admin web app.
// Tunnel URL can be updated without redeploy using:
//   https://<admin-app-url>/?server=https://<new-server-origin>
//
// Security note:
// - By default, the `server`/`ws` query parameters are applied only for the current browser tab
//   (stored in sessionStorage) to reduce the risk of a "malicious link" persisting a rogue server.
// - To persist a query-provided server into localStorage (explicit operator intent), add:
//     ?server=...&persist=true
(function () {
    const DEFAULT_SERVER_URL = 'http://localhost:3000';
    const DEFAULT_WS_URL = DEFAULT_SERVER_URL.replace(/^http/i, 'ws');
    const DEFAULT_AUTO_REFRESH_INTERVAL = 10000;

    const SETTINGS_KEY = 'SMART_BOARD_APP_SETTINGS';
    const SESSION_SETTINGS_KEY = 'SMART_BOARD_SESSION_SETTINGS';
    const LEGACY_SERVER_STORAGE_KEY = 'SMART_BOARD_SERVER_URL';
    const PINNED_SERVER_KEY = 'serverUrlPinned';
    const APPEARANCE_PREF_KEY = 'appearancePreferenceSet';
    const QUERY_SERVER_KEY = 'server';
    const QUERY_WS_KEY = 'ws';
    const QUERY_PERSIST_KEY = 'persist';
    const QUERY_PIN_KEY = 'pin';

    function normalizeOrigin(value, allowedProtocols) {
        if (!value) return '';
        const trimmed = String(value).trim();
        if (!trimmed) return '';

        try {
            const parsed = new URL(trimmed);
            if (!parsed || !parsed.origin || parsed.origin === 'null') return '';
            const protocol = String(parsed.protocol || '').toLowerCase();
            if (Array.isArray(allowedProtocols) && allowedProtocols.length > 0) {
                if (!allowedProtocols.includes(protocol)) return '';
            }
            return parsed.origin;
        } catch (error) {
            return '';
        }
    }

    function normalizeServerOrigin(value) {
        const normalized = normalizeOrigin(value, ['http:', 'https:', 'ws:', 'wss:']);
        if (!normalized) return '';
        return normalized.replace(/^ws/i, 'http');
    }

    function normalizeWsOrigin(value) {
        const normalized = normalizeOrigin(value, ['ws:', 'wss:', 'http:', 'https:']);
        if (!normalized) return '';
        return normalized.replace(/^http/i, 'ws');
    }

    function getHostname(value) {
        try {
            return new URL(String(value || '')).hostname.toLowerCase();
        } catch (error) {
            return '';
        }
    }

    function isTryCloudflareUrl(value) {
        const hostname = getHostname(value);
        return hostname.endsWith('trycloudflare.com');
    }

    function isLocalLikeUrl(value) {
        const hostname = getHostname(value);
        return (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.endsWith('.local')
        );
    }

    function toHttpOrigin(value) {
        const normalized = normalizeOrigin(value, ['http:', 'https:', 'ws:', 'wss:']);
        if (!normalized) return '';
        return normalized.replace(/^ws/i, 'http');
    }

    function shouldPreferDefaultServer(storedUrl, defaultUrl, pinned) {
        if (pinned) return false;
        const normalizedStored = normalizeServerOrigin(storedUrl);
        const normalizedDefault = normalizeServerOrigin(defaultUrl);
        if (!normalizedDefault) return false;
        if (!normalizedStored) return true;
        if (normalizedStored === normalizedDefault) return false;

        // For temporary Cloudflare URLs, always trust the latest code-level default
        // so stale localStorage tunnel values do not break the admin app.
        if (isTryCloudflareUrl(normalizedDefault)) {
            return isTryCloudflareUrl(normalizedStored) || isLocalLikeUrl(normalizedStored);
        }

        // If the code default is local and previous value was a temporary tunnel,
        // favor the local default to avoid accidental remote admin connections.
        if (isLocalLikeUrl(normalizedDefault) && isTryCloudflareUrl(normalizedStored)) {
            return true;
        }

        return false;
    }

    function toBoolean(value, defaultValue) {
        if (value === undefined || value === null || value === '') return defaultValue;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;

        const normalized = String(value).trim().toLowerCase();
        if (['true', '1', 'yes', 'on', 'enabled'].includes(normalized)) return true;
        if (['false', '0', 'no', 'off', 'disabled'].includes(normalized)) return false;
        return defaultValue;
    }

    function normalizeInterval(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return DEFAULT_AUTO_REFRESH_INTERVAL;
        return Math.min(60000, Math.max(3000, Math.round(parsed)));
    }

    function normalizeTimeoutMinutes(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return 30;
        return Math.min(240, Math.max(5, Math.round(parsed)));
    }

    function readSettingsFromStorage(storage, key) {
        try {
            const raw = storage.getItem(key);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function getStoredSettings() {
        return readSettingsFromStorage(localStorage, SETTINGS_KEY);
    }

    function getSessionSettings() {
        return readSettingsFromStorage(sessionStorage, SESSION_SETTINGS_KEY);
    }

    function buildSettings(input) {
        const source = input && typeof input === 'object' ? input : {};
        const serverUrl =
            normalizeServerOrigin(source.SERVER_URL) ||
            normalizeServerOrigin(source.serverUrl) ||
            DEFAULT_SERVER_URL;
        const wsUrl =
            normalizeWsOrigin(source.WS_URL) ||
            normalizeWsOrigin(source.wsUrl) ||
            serverUrl.replace(/^http/i, 'ws') ||
            DEFAULT_WS_URL;
        const appearancePreferenceSet = toBoolean(source[APPEARANCE_PREF_KEY], false);

        return {
            SERVER_URL: serverUrl,
            WS_URL: wsUrl,
            AUTO_REFRESH_INTERVAL: normalizeInterval(source.AUTO_REFRESH_INTERVAL),
            [PINNED_SERVER_KEY]: toBoolean(source[PINNED_SERVER_KEY], false),
            // Default to light mode unless the admin explicitly opted into dark mode.
            // This prevents stale/legacy localStorage values from forcing dark mode on first load.
            [APPEARANCE_PREF_KEY]: appearancePreferenceSet,
            darkMode: appearancePreferenceSet ? toBoolean(source.darkMode, false) : false,
            animationsEnabled: toBoolean(source.animationsEnabled, true),
            compactMode: toBoolean(source.compactMode, false),
            emergencyAlerts: toBoolean(source.emergencyAlerts, true),
            boardOfflineAlerts: toBoolean(source.boardOfflineAlerts, true),
            soundEffects: toBoolean(source.soundEffects, false),
            sessionTimeoutMinutes: normalizeTimeoutMinutes(source.sessionTimeoutMinutes)
        };
    }

    function persistSettings(settings) {
        const normalized = buildSettings(settings);
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
        } catch (error) {
            // Non-fatal (storage might be disabled/blocked).
        }
        try {
            localStorage.setItem(LEGACY_SERVER_STORAGE_KEY, normalized.SERVER_URL);
        } catch (error) {
            // Non-fatal.
        }
        return normalized;
    }

    function persistSessionSettings(settings) {
        const source = settings && typeof settings === 'object' ? settings : {};
        const payload = {
            SERVER_URL: normalizeServerOrigin(source.SERVER_URL || source.serverUrl),
            WS_URL: normalizeWsOrigin(source.WS_URL || source.wsUrl)
        };
        try {
            sessionStorage.setItem(SESSION_SETTINGS_KEY, JSON.stringify(payload));
        } catch (error) {
            // Ignore session storage failures.
        }
        return payload;
    }

    function clearSessionSettings() {
        try {
            sessionStorage.removeItem(SESSION_SETTINGS_KEY);
        } catch (error) {
            // Ignore session storage failures.
        }
    }

    let runtimeSettingsCache = null;

    function getAdminSettings() {
        if (runtimeSettingsCache) return buildSettings(runtimeSettingsCache);

        const stored = getStoredSettings();
        const legacyUrl = normalizeServerOrigin(localStorage.getItem(LEGACY_SERVER_STORAGE_KEY));
        const mergedStored = {
            ...stored,
            ...(legacyUrl && !stored.SERVER_URL && !stored.serverUrl ? { SERVER_URL: legacyUrl } : {})
        };

        const pinned = toBoolean(mergedStored[PINNED_SERVER_KEY], false);
        if (pinned) {
            clearSessionSettings();
        }
        const session = pinned ? {} : getSessionSettings();

        runtimeSettingsCache = buildSettings({ ...mergedStored, ...session });
        return runtimeSettingsCache;
    }

    function updateAdminSettings(partial) {
        // Persist changes into localStorage only, without unintentionally persisting any
        // session-scoped (tab-only) server overrides.
        const stored = getStoredSettings();
        const legacyUrl = normalizeServerOrigin(localStorage.getItem(LEGACY_SERVER_STORAGE_KEY));
        const baseStored = {
            ...stored,
            ...(legacyUrl && !stored.SERVER_URL && !stored.serverUrl ? { SERVER_URL: legacyUrl } : {})
        };
        const current = buildSettings(baseStored);
        const safePartial = partial && typeof partial === 'object' ? { ...partial } : {};
        // Mark appearance preference as explicit when darkMode is set via UI (settings or header toggle).
        if (Object.prototype.hasOwnProperty.call(safePartial, 'darkMode')) {
            safePartial[APPEARANCE_PREF_KEY] = true;
        }
        const merged = { ...current, ...safePartial };
        const persisted = persistSettings(merged);
        // If the admin explicitly persists server settings, clear any session override to avoid confusion.
        if (
            Object.prototype.hasOwnProperty.call(safePartial, 'SERVER_URL') ||
            Object.prototype.hasOwnProperty.call(safePartial, 'serverUrl') ||
            Object.prototype.hasOwnProperty.call(safePartial, 'WS_URL') ||
            Object.prototype.hasOwnProperty.call(safePartial, 'wsUrl') ||
            Object.prototype.hasOwnProperty.call(safePartial, PINNED_SERVER_KEY)
        ) {
            clearSessionSettings();
        }
        const nextRuntime = buildSettings({
            ...persisted,
            ...(toBoolean(persisted[PINNED_SERVER_KEY], false) ? {} : getSessionSettings())
        });
        applyRuntimeConfig(nextRuntime);
        return nextRuntime;
    }

    function applyRuntimeConfig(settings) {
        const resolved = buildSettings(settings);
        runtimeSettingsCache = resolved;
        window.adminSettings = resolved;
        window.config = {
            SERVER_URL: resolved.SERVER_URL,
            WS_URL: resolved.WS_URL,
            AUTO_REFRESH_INTERVAL: resolved.AUTO_REFRESH_INTERVAL
        };
    }

    const params = new URLSearchParams(window.location.search);
    const queryServerUrl = normalizeServerOrigin(params.get(QUERY_SERVER_KEY));
    const queryWsUrl = normalizeWsOrigin(params.get(QUERY_WS_KEY));
    const queryPersist = toBoolean(params.get(QUERY_PERSIST_KEY), false) || toBoolean(params.get(QUERY_PIN_KEY), false);

    const storedSettings = getAdminSettings();
    const sessionSettings = getSessionSettings();
    const hasSessionOverride = Boolean(normalizeServerOrigin(sessionSettings.SERVER_URL || sessionSettings.serverUrl));
    const pinnedPersistent = toBoolean(storedSettings[PINNED_SERVER_KEY], false);
    if (pinnedPersistent && hasSessionOverride) {
        clearSessionSettings();
    }

    const pinnedForSelection = pinnedPersistent || hasSessionOverride || Boolean(queryServerUrl);
    const preferDefault = shouldPreferDefaultServer(storedSettings.SERVER_URL, DEFAULT_SERVER_URL, pinnedForSelection);
    const resolvedServerUrl =
        queryServerUrl ||
        (preferDefault ? DEFAULT_SERVER_URL : '') ||
        storedSettings.SERVER_URL ||
        DEFAULT_SERVER_URL;

    const storedWsMatchesServer =
        toHttpOrigin(storedSettings.WS_URL) &&
        toHttpOrigin(storedSettings.WS_URL) === toHttpOrigin(resolvedServerUrl);

    const resolvedWsUrl =
        queryWsUrl ||
        (queryServerUrl ? queryServerUrl.replace(/^http/i, 'ws') : '') ||
        (storedWsMatchesServer ? storedSettings.WS_URL : '') ||
        resolvedServerUrl.replace(/^http/i, 'ws');

    if (queryPersist && queryServerUrl) {
        // Explicitly requested persistence to localStorage.
        updateAdminSettings({
            ...storedSettings,
            SERVER_URL: resolvedServerUrl,
            WS_URL: resolvedWsUrl,
            [PINNED_SERVER_KEY]: true
        });
    } else if (queryServerUrl) {
        // Session-only override (tab-scoped).
        persistSessionSettings({
            ...sessionSettings,
            SERVER_URL: resolvedServerUrl,
            WS_URL: resolvedWsUrl
        });
        applyRuntimeConfig({
            ...storedSettings,
            SERVER_URL: resolvedServerUrl,
            WS_URL: resolvedWsUrl
        });
    } else {
        applyRuntimeConfig({
            ...storedSettings,
            SERVER_URL: resolvedServerUrl,
            WS_URL: resolvedWsUrl
        });
    }

    window.getAdminSettings = getAdminSettings;
    window.updateAdminSettings = updateAdminSettings;
})();
