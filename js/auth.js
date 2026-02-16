/**
 * Auth Guard
 * - Redirects unauthenticated users to login page
 * - Applies session timeout from persisted settings
 */

(function () {
    const SETTINGS_KEY = 'SMART_BOARD_APP_SETTINGS';
    const LAST_ACTIVITY_KEY = 'adminLastActivity';
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

    function enforceSessionTimeout() {
        const timeoutMs = getSessionTimeoutMinutes() * 60 * 1000;
        const lastActivity = getLastActivityTimestamp();
        const elapsed = Date.now() - lastActivity;
        return elapsed > timeoutMs;
    }

    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

    if (!isLoginPage) {
        if (!isLoggedIn) {
            window.location.href = 'login.html';
            return;
        }

        if (enforceSessionTimeout()) {
            sessionStorage.removeItem('adminLoggedIn');
            sessionStorage.removeItem('adminUser');
            sessionStorage.removeItem('loginTime');
            sessionStorage.removeItem(LAST_ACTIVITY_KEY);
            window.location.href = 'login.html';
            return;
        }

        markActivity();
        ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach((eventName) => {
            window.addEventListener(eventName, markActivity, { passive: true });
        });
    }
})();

/**
 * Logout function - call this to log out the admin
 */
function adminLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('loginTime');
    sessionStorage.removeItem('adminLastActivity');
    window.location.href = 'login.html';
}

/**
 * Get current admin user
 */
function getAdminUser() {
    return sessionStorage.getItem('adminUser') || 'Admin';
}
