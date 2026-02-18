// ===== Audit Store Compatibility Layer =====
// Audit history is now server-side. Keep this object to avoid breaking old callers.
(function () {
    window.auditStore = {
        addEvent: () => null,
        getLogs: () => [],
        addFromWs: () => { },
        addFromApi: () => { },
        clear: () => { }
    };
})();

// API Helper - Uses config.js + persisted settings for server URL
const runtimeSettings = (typeof getAdminSettings === 'function') ? getAdminSettings() : (window.adminSettings || {});
const RESOLVED_SERVER_URL =
    runtimeSettings.SERVER_URL ||
    (typeof config !== 'undefined' ? config.SERVER_URL : 'http://localhost:3000');
const RESOLVED_WS_URL =
    runtimeSettings.WS_URL ||
    (typeof config !== 'undefined' && config.WS_URL
        ? config.WS_URL
        : RESOLVED_SERVER_URL.replace(/^http/i, 'ws'));
const API_BASE = `${RESOLVED_SERVER_URL}/api`;
const WS_URL = RESOLVED_WS_URL;
const API_REQUEST_TIMEOUT_MS = 12000;
const API_UPLOAD_TIMEOUT_MS = 30000;
const API_GET_RETRIES = 1;
const API_RETRY_DELAY_MS = 650;
const ADMIN_TOKEN_STORAGE_KEY = 'adminAuthToken';
const ADMIN_LOGGED_IN_KEY = 'adminLoggedIn';
const ADMIN_USER_KEY = 'adminUser';
const ADMIN_LOGIN_TIME_KEY = 'loginTime';
const ADMIN_LAST_ACTIVITY_KEY = 'adminLastActivity';
const ADMIN_SESSION_EXPIRES_KEY = 'adminSessionExpiresAt';

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getAdminAuthToken() {
    return String(sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '').trim();
}

function clearAdminSessionStorage() {
    sessionStorage.removeItem(ADMIN_LOGGED_IN_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
    sessionStorage.removeItem(ADMIN_LOGIN_TIME_KEY);
    sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_EXPIRES_KEY);
}

let unauthorizedHandled = false;
function handleUnauthorized(message) {
    if (unauthorizedHandled) return;
    unauthorizedHandled = true;
    clearAdminSessionStorage();
    try {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            ws.close();
        }
    } catch (error) {
        // Ignore socket close errors during logout redirect.
    }

    const pathname = String(window.location.pathname || '').toLowerCase();
    const isLoginPage = pathname.endsWith('/login.html') || pathname.endsWith('login.html');
    if (!isLoginPage) {
        if (message) {
            try {
                showToast(message, 'error');
            } catch (error) {
                // Ignore toast errors during redirect.
            }
        }
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 50);
    }
}

window.escapeHtml = escapeHtml;
window.getAdminAuthToken = getAdminAuthToken;
window.clearAdminSessionStorage = clearAdminSessionStorage;
window.handleUnauthorized = handleUnauthorized;

function getAutoRefreshInterval() {
    if (typeof getAdminSettings === 'function') {
        const settings = getAdminSettings();
        return Number(settings.AUTO_REFRESH_INTERVAL) || 10000;
    }
    return 10000;
}

function getNotificationSettings() {
    if (typeof getAdminSettings === 'function') {
        return getAdminSettings();
    }
    return {
        emergencyAlerts: true,
        boardOfflineAlerts: true,
        soundEffects: false
    };
}

function playNotificationSound() {
    const settings = getNotificationSettings();
    if (!settings.soundEffects) return;

    try {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) return;

        const ctx = new AudioContextCtor();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.16);
        oscillator.onended = () => {
            ctx.close().catch(() => { });
        };
    } catch (error) {
        // Ignore sound errors to avoid affecting workflow.
    }
}

function shouldNotifyEmergency(data) {
    const settings = getNotificationSettings();
    if (!settings.emergencyAlerts) return false;
    const type = String(data && data.type || '').toLowerCase();
    const priority = String(data && data.data && data.data.priority || '').toLowerCase();
    return priority === 'emergency' || type.includes('emergency');
}

function shouldNotifyBoardOffline(data) {
    const settings = getNotificationSettings();
    if (!settings.boardOfflineAlerts) return false;
    const type = String(data && data.type || '').toLowerCase();
    return type === 'board_offline' || type.includes('offline');
}

// API Helper
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(endpoint, options = {}) {
    const {
        method = 'GET',
        data = undefined,
        formData = undefined,
        retries = 0,
        timeoutMs = API_REQUEST_TIMEOUT_MS
    } = options;

    const url = `${API_BASE}${endpoint}`;
    const upperMethod = String(method || 'GET').toUpperCase();

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const token = getAdminAuthToken();
            const fetchOptions = {
                method: upperMethod,
                signal: controller.signal,
                headers: {}
            };

            if (formData) {
                fetchOptions.body = formData;
            } else if (data !== undefined) {
                fetchOptions.headers['Content-Type'] = 'application/json';
                fetchOptions.body = JSON.stringify(data);
            }

            if (token) {
                fetchOptions.headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(url, fetchOptions);
            const rawText = await response.text();
            clearTimeout(timeoutId);

            let json;
            try {
                json = rawText ? JSON.parse(rawText) : {};
            } catch (parseError) {
                json = {
                    success: false,
                    error: response.ok
                        ? 'Invalid server response format'
                        : `Server responded with ${response.status}`
                };
            }

            if (typeof json !== 'object' || json === null) {
                json = { success: false, error: 'Unexpected server response' };
            }
            if (!response.ok) {
                json.success = false;
                if (response.status === 401 || response.status === 403) {
                    const isAuthRoute = String(endpoint || '').startsWith('/admin/login');
                    if (!isAuthRoute) {
                        handleUnauthorized('Session expired. Please log in again.');
                    }
                }
                if (!json.error) {
                    json.error = `Request failed (${response.status})`;
                }
            }

            return json;
        } catch (error) {
            clearTimeout(timeoutId);
            const isTimeout = error && error.name === 'AbortError';
            const hasNextAttempt = attempt < retries;
            if (hasNextAttempt) {
                await sleep(API_RETRY_DELAY_MS * (attempt + 1));
                continue;
            }

            const reason = isTimeout
                ? `Request timeout after ${Math.round(timeoutMs / 1000)}s`
                : (error && error.message ? error.message : 'Network request failed');
            throw new Error(reason);
        }
    }

    throw new Error('Request failed');
}

const api = {
    async get(endpoint) {
        return await requestJson(endpoint, {
            method: 'GET',
            retries: API_GET_RETRIES,
            timeoutMs: API_REQUEST_TIMEOUT_MS
        });
    },

    async post(endpoint, data) {
        const json = await requestJson(endpoint, {
            method: 'POST',
            data,
            timeoutMs: API_REQUEST_TIMEOUT_MS
        });
        if (window.auditStore && typeof window.auditStore.addFromApi === 'function') {
            window.auditStore.addFromApi('POST', endpoint, data, json);
        }
        return json;
    },

    async put(endpoint, data) {
        const json = await requestJson(endpoint, {
            method: 'PUT',
            data,
            timeoutMs: API_REQUEST_TIMEOUT_MS
        });
        if (window.auditStore && typeof window.auditStore.addFromApi === 'function') {
            window.auditStore.addFromApi('PUT', endpoint, data, json);
        }
        return json;
    },

    async delete(endpoint) {
        const json = await requestJson(endpoint, {
            method: 'DELETE',
            timeoutMs: API_REQUEST_TIMEOUT_MS
        });
        if (window.auditStore && typeof window.auditStore.addFromApi === 'function') {
            window.auditStore.addFromApi('DELETE', endpoint, null, json);
        }
        return json;
    },

    async patch(endpoint, data) {
        const json = await requestJson(endpoint, {
            method: 'PATCH',
            data: data || {},
            timeoutMs: API_REQUEST_TIMEOUT_MS
        });
        if (window.auditStore && typeof window.auditStore.addFromApi === 'function') {
            window.auditStore.addFromApi('PATCH', endpoint, data, json);
        }
        return json;
    },

    async upload(endpoint, formData) {
        const json = await requestJson(endpoint, {
            method: 'POST',
            formData,
            timeoutMs: API_UPLOAD_TIMEOUT_MS
        });
        if (window.auditStore && typeof window.auditStore.addFromApi === 'function') {
            window.auditStore.addFromApi('POST', endpoint, null, json);
        }
        return json;
    }
};

// WebSocket connection
let ws = null;
const wsListeners = [];
let wsReconnectDelayMs = 2000;
const WS_RECONNECT_MAX_DELAY_MS = 15000;
let wsReconnectTimer = null;

function scheduleWebSocketReconnect() {
    if (!getAdminAuthToken()) return;
    if (wsReconnectTimer) return;

    const delay = wsReconnectDelayMs;
    wsReconnectDelayMs = Math.min(
        WS_RECONNECT_MAX_DELAY_MS,
        Math.round(wsReconnectDelayMs * 1.6)
    );

    wsReconnectTimer = setTimeout(() => {
        wsReconnectTimer = null;
        connectWebSocket();
    }, delay);
}

function connectWebSocket() {
    try {
        const token = getAdminAuthToken();
        if (!token) {
            return;
        }

        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            wsReconnectDelayMs = 2000;
            ws.send(JSON.stringify({
                type: 'auth',
                token
            }));
            console.log('WebSocket connected, auth sent');
        };

        ws.onmessage = (event) => {
            let data = null;
            try {
                data = JSON.parse(event.data);
            } catch (parseError) {
                return;
            }

            if (data && data.type === 'auth_ok') {
                return;
            }

            if (window.auditStore && typeof window.auditStore.addFromWs === 'function') {
                window.auditStore.addFromWs(data);
            }
            wsListeners.forEach(listener => listener(data));

            if (shouldNotifyEmergency(data)) {
                showToast('Emergency notice event received', 'error');
                playNotificationSound();
            } else if (shouldNotifyBoardOffline(data)) {
                const boardId = data && data.data && data.data.boardId ? data.data.boardId : 'A board';
                showToast(`${boardId} went offline`, 'error');
                playNotificationSound();
            }
        };

        ws.onclose = (event) => {
            const reason = String(event && event.reason || '');
            const isUnauthorized = (event && event.code === 1008)
                && (reason.toLowerCase().includes('unauthorized') || reason.toLowerCase().includes('authentication'));

            if (isUnauthorized) {
                handleUnauthorized('Session expired. Please log in again.');
                return;
            }

            console.log('WebSocket disconnected, reconnecting...');
            scheduleWebSocketReconnect();
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            try {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            } catch (closeError) {
                // Ignore close errors
            }
        };
    } catch (error) {
        console.error('WebSocket connection failed:', error);
        scheduleWebSocketReconnect();
    }
}

function addWSListener(callback) {
    wsListeners.push(callback);
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
}

function timeSince(dateString) {
    if (!dateString) return 'Never';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
