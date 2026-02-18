/**
 * Auth Guard
 * - Redirects unauthenticated users to login page
 * - Applies session timeout from persisted settings
 */

(function () {
    const SETTINGS_KEY = 'SMART_BOARD_APP_SETTINGS';
    const LEGACY_SERVER_STORAGE_KEY = 'SMART_BOARD_SERVER_URL';
    const LAST_ACTIVITY_KEY = 'adminLastActivity';
    const ADMIN_LOGGED_IN_KEY = 'adminLoggedIn';
    const ADMIN_USER_KEY = 'adminUser';
    const ADMIN_LOGIN_TIME_KEY = 'loginTime';
    const ADMIN_TOKEN_STORAGE_KEY = 'adminAuthToken';
    const ADMIN_SESSION_EXPIRES_KEY = 'adminSessionExpiresAt';
    const pathname = String(window.location.pathname || '').toLowerCase();
    const isLoginPage = pathname.endsWith('/login.html') || pathname.endsWith('login.html');

    function getSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function normalizeServerUrl(value) {
        try {
            return new URL(String(value || '').trim()).origin;
        } catch (error) {
            return '';
        }
    }

    function getServerUrl() {
        try {
            if (typeof window.getAdminSettings === 'function') {
                const runtime = window.getAdminSettings();
                const fromRuntime = normalizeServerUrl(runtime && runtime.SERVER_URL);
                if (fromRuntime) return fromRuntime;
            }
        } catch (error) {
            // Ignore runtime settings failures and fall back to storage.
        }

        const fromGlobal = normalizeServerUrl(window.adminSettings && window.adminSettings.SERVER_URL)
            || normalizeServerUrl(window.config && window.config.SERVER_URL);
        if (fromGlobal) return fromGlobal;

        const settings = getSettings();
        const fromSettings = normalizeServerUrl(settings.SERVER_URL || settings.serverUrl);
        const fromLegacy = normalizeServerUrl(localStorage.getItem(LEGACY_SERVER_STORAGE_KEY));
        return fromSettings || fromLegacy || 'http://localhost:3000';
    }

    function clearSession() {
        sessionStorage.removeItem(ADMIN_LOGGED_IN_KEY);
        sessionStorage.removeItem(ADMIN_USER_KEY);
        sessionStorage.removeItem(ADMIN_LOGIN_TIME_KEY);
        sessionStorage.removeItem(LAST_ACTIVITY_KEY);
        sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(ADMIN_SESSION_EXPIRES_KEY);
    }

    function getSessionTimeoutMinutes() {
        const settings = getSettings();
        const timeout = Number(settings.sessionTimeoutMinutes);
        if (!Number.isFinite(timeout)) return 30;
        return Math.min(240, Math.max(5, Math.round(timeout)));
    }

    function getLastActivityTimestamp() {
        const sessionValue = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));
        if (Number.isFinite(sessionValue) && sessionValue > 0) return sessionValue;

        const loginTimestamp = Number(new Date(sessionStorage.getItem('loginTime')).getTime());
        if (Number.isFinite(loginTimestamp) && loginTimestamp > 0) return loginTimestamp;

        return Date.now();
    }

    function markActivity() {
        sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }

    function getToken() {
        return String(sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '').trim();
    }

    function enforceSessionTimeout() {
        const timeoutMs = getSessionTimeoutMinutes() * 60 * 1000;
        const lastActivity = getLastActivityTimestamp();
        const elapsed = Date.now() - lastActivity;
        return elapsed > timeoutMs;
    }

    async function verifyServerSession() {
        const token = getToken();
        if (!token) return false;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(`${getServerUrl()}/api/admin/session`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                signal: controller.signal
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    return false;
                }
                return null;
            }

            const json = await response.json().catch(() => null);
            if (!json || json.success !== true) return null;

            sessionStorage.setItem(ADMIN_LOGGED_IN_KEY, 'true');
            if (json.userId) {
                sessionStorage.setItem(ADMIN_USER_KEY, String(json.userId));
            }
            if (json.expiresAt) {
                sessionStorage.setItem(ADMIN_SESSION_EXPIRES_KEY, String(json.expiresAt));
            }
            return true;
        } catch (error) {
            return null;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    const isLoggedIn = sessionStorage.getItem(ADMIN_LOGGED_IN_KEY) === 'true';
    const hasToken = Boolean(getToken());

    if (!isLoginPage) {
        if (!isLoggedIn || !hasToken) {
            window.location.href = 'login.html';
            return;
        }

        if (enforceSessionTimeout()) {
            clearSession();
            window.location.href = 'login.html';
            return;
        }

        markActivity();
        ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach((eventName) => {
            window.addEventListener(eventName, markActivity, { passive: true });
        });

        verifyServerSession().then((valid) => {
            if (valid === false) {
                clearSession();
                window.location.href = 'login.html';
            }
        });
    } else if (hasToken) {
        verifyServerSession().then((valid) => {
            if (valid === true) {
                window.location.href = 'index.html';
            } else if (valid === false) {
                clearSession();
            }
        });
    }
})();

/**
 * Logout function - call this to log out the admin
 */
function adminLogout() {
    const SETTINGS_KEY = 'SMART_BOARD_APP_SETTINGS';
    const LEGACY_SERVER_STORAGE_KEY = 'SMART_BOARD_SERVER_URL';
    const ADMIN_LOGGED_IN_KEY = 'adminLoggedIn';
    const ADMIN_USER_KEY = 'adminUser';
    const ADMIN_LOGIN_TIME_KEY = 'loginTime';
    const ADMIN_LAST_ACTIVITY_KEY = 'adminLastActivity';
    const ADMIN_TOKEN_STORAGE_KEY = 'adminAuthToken';
    const ADMIN_SESSION_EXPIRES_KEY = 'adminSessionExpiresAt';

    const clearSession = () => {
        sessionStorage.removeItem(ADMIN_LOGGED_IN_KEY);
        sessionStorage.removeItem(ADMIN_USER_KEY);
        sessionStorage.removeItem(ADMIN_LOGIN_TIME_KEY);
        sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
        sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(ADMIN_SESSION_EXPIRES_KEY);
    };

    const token = String(sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '').trim();
    const redirectToLogin = () => {
        clearSession();
        window.location.href = 'login.html';
    };

    if (!token) {
        redirectToLogin();
        return;
    }

    let serverUrl = '';
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        serverUrl = new URL(String(parsed.SERVER_URL || parsed.serverUrl || '').trim()).origin;
    } catch (error) {
        serverUrl = '';
    }

    if (!serverUrl) {
        try {
            serverUrl = new URL(String(localStorage.getItem(LEGACY_SERVER_STORAGE_KEY) || '').trim()).origin;
        } catch (error) {
            serverUrl = '';
        }
    }
    if (!serverUrl) {
        serverUrl = 'http://localhost:3000';
    }

    fetch(`${serverUrl}/api/admin/logout`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        }
    }).finally(redirectToLogin);
}

/**
 * Get current admin user
 */
function getAdminUser() {
    return sessionStorage.getItem('adminUser') || 'Admin';
}
