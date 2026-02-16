// Runtime configuration for admin web app.
// Tunnel URL can be updated without redeploy using:
//   https://<admin-app-url>/?server=https://<new-tunnel-url>
(function () {
    const DEFAULT_SERVER_URL = 'https://wines-discrimination-semester-apr.trycloudflare.com';
    const DEFAULT_WS_URL = DEFAULT_SERVER_URL.replace(/^http/i, 'ws');
    const DEFAULT_AUTO_REFRESH_INTERVAL = 10000;

    const SETTINGS_KEY = 'SMART_BOARD_APP_SETTINGS';
    const LEGACY_SERVER_STORAGE_KEY = 'SMART_BOARD_SERVER_URL';
    const QUERY_SERVER_KEY = 'server';
    const QUERY_WS_KEY = 'ws';

    function normalizeUrl(value) {
        if (!value) return '';
        const trimmed = String(value).trim();
        if (!trimmed) return '';

        try {
            const parsed = new URL(trimmed);
            return parsed.origin;
        } catch (error) {
            return '';
        }
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
        const normalized = normalizeUrl(value);
        if (!normalized) return '';
        return normalized.replace(/^ws/i, 'http');
    }

    function shouldPreferDefaultServer(storedUrl, defaultUrl) {
        const normalizedStored = normalizeUrl(storedUrl);
        const normalizedDefault = normalizeUrl(defaultUrl);
        if (!normalizedDefault) return false;
        if (!normalizedStored) return true;
        if (normalizedStored === normalizedDefault) return false;

        // For temporary Cloudflare URLs, always trust the latest code-level default
        // so stale localStorage tunnel values do not break the admin app.
        if (isTryCloudflareUrl(normalizedDefault)) {
            return isTryCloudflareUrl(normalizedStored) || isLocalLikeUrl(normalizedStored);
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

    function readSettingsFromStorage() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function buildSettings(input) {
        const source = input && typeof input === 'object' ? input : {};
        const serverUrl = normalizeUrl(source.SERVER_URL) || normalizeUrl(source.serverUrl) || DEFAULT_SERVER_URL;
        const wsUrl = normalizeUrl(source.WS_URL) || normalizeUrl(source.wsUrl) || serverUrl.replace(/^http/i, 'ws') || DEFAULT_WS_URL;

        return {
            SERVER_URL: serverUrl,
            WS_URL: wsUrl,
            AUTO_REFRESH_INTERVAL: normalizeInterval(source.AUTO_REFRESH_INTERVAL),
            darkMode: toBoolean(source.darkMode, false),
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
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
        localStorage.setItem(LEGACY_SERVER_STORAGE_KEY, normalized.SERVER_URL);
        return normalized;
    }

    function getAdminSettings() {
        return buildSettings(readSettingsFromStorage());
    }

    function updateAdminSettings(partial) {
        const current = getAdminSettings();
        const merged = { ...current, ...(partial || {}) };
        const persisted = persistSettings(merged);
        applyRuntimeConfig(persisted);
        return persisted;
    }

    function applyRuntimeConfig(settings) {
        const resolved = buildSettings(settings);
        window.adminSettings = resolved;
        window.config = {
            SERVER_URL: resolved.SERVER_URL,
            WS_URL: resolved.WS_URL,
            AUTO_REFRESH_INTERVAL: resolved.AUTO_REFRESH_INTERVAL
        };
    }

    const params = new URLSearchParams(window.location.search);
    const queryServerUrl = normalizeUrl(params.get(QUERY_SERVER_KEY));
    const queryWsUrl = normalizeUrl(params.get(QUERY_WS_KEY));
    const legacyStoredUrl = normalizeUrl(localStorage.getItem(LEGACY_SERVER_STORAGE_KEY));
    const storedSettings = getAdminSettings();

    const preferDefault = shouldPreferDefaultServer(storedSettings.SERVER_URL, DEFAULT_SERVER_URL);
    const resolvedServerUrl =
        queryServerUrl ||
        (preferDefault ? DEFAULT_SERVER_URL : '') ||
        storedSettings.SERVER_URL ||
        legacyStoredUrl ||
        DEFAULT_SERVER_URL;

    const storedWsMatchesServer =
        toHttpOrigin(storedSettings.WS_URL) &&
        toHttpOrigin(storedSettings.WS_URL) === toHttpOrigin(resolvedServerUrl);

    const resolvedWsUrl =
        queryWsUrl ||
        (queryServerUrl ? queryServerUrl.replace(/^http/i, 'ws') : '') ||
        (preferDefault ? resolvedServerUrl.replace(/^http/i, 'ws') : '') ||
        (storedWsMatchesServer ? storedSettings.WS_URL : '') ||
        resolvedServerUrl.replace(/^http/i, 'ws');

    const hydratedSettings = updateAdminSettings({
        ...storedSettings,
        SERVER_URL: resolvedServerUrl,
        WS_URL: resolvedWsUrl
    });

    applyRuntimeConfig(hydratedSettings);

    window.getAdminSettings = getAdminSettings;
    window.updateAdminSettings = updateAdminSettings;
})();
