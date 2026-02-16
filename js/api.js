// ===== Audit Store (Front-end Only, No Backend Changes) =====
(function () {
    const STORAGE_KEY = 'SMART_BOARD_AUDIT_LOGS';
    const MAX_LOGS = 1500;

    function safeJsonParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function loadLogs() {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = safeJsonParse(raw, []);
        return Array.isArray(parsed) ? parsed : [];
    }

    function saveLogs(logs) {
        const next = Array.isArray(logs) ? logs.slice(0, MAX_LOGS) : [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
    }

    function createId() {
        return `log_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    }

    function normalizeType(value) {
        const raw = String(value || '').toLowerCase().trim();
        if (['system', 'board', 'schedule', 'group', 'content'].includes(raw)) return raw;
        return 'system';
    }

    function addEvent(entry) {
        try {
            const nowIso = new Date().toISOString();
            const record = {
                id: entry && entry.id ? String(entry.id) : createId(),
                type: normalizeType(entry && entry.type),
                action: String(entry && entry.action || 'Event'),
                message: String(entry && entry.message || ''),
                user: String(entry && entry.user || (typeof getAdminUser === 'function' ? getAdminUser() : 'Admin')),
                timestamp: String(entry && entry.timestamp || nowIso)
            };

            const current = loadLogs();
            const latest = current[0];
            if (latest) {
                const same =
                    String(latest.type) === String(record.type) &&
                    String(latest.action) === String(record.action) &&
                    String(latest.message) === String(record.message) &&
                    String(latest.user) === String(record.user);
                const ageMs = Math.abs(new Date(record.timestamp).getTime() - new Date(latest.timestamp || 0).getTime());
                if (same && ageMs < 3000) {
                    return latest;
                }
            }
            current.unshift(record);
            saveLogs(current);
            return record;
        } catch (error) {
            return null;
        }
    }

    function getLogs() {
        const logs = loadLogs();
        return logs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    }

    function extractIdFromEndpoint(endpoint) {
        const parts = String(endpoint || '').split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1] : '';
    }

    function addFromWs(message) {
        if (!message || !message.type) return;
        const type = String(message.type || '').toLowerCase();
        const data = message.data || {};

        if (type === 'board_registered') {
            addEvent({
                type: 'board',
                action: 'Board Registered',
                message: `Board ${data.boardId || ''}${data.roomNumber ? ` - Room: ${data.roomNumber}` : ''}`
            });
            return;
        }
        if (type === 'board_online') {
            addEvent({ type: 'board', action: 'Board Online', message: `Board ${data.boardId || ''} connected` });
            return;
        }
        if (type === 'board_offline') {
            addEvent({ type: 'board', action: 'Board Offline', message: `Board ${data.boardId || ''} disconnected` });
            return;
        }
        if (type === 'board_removed') {
            addEvent({ type: 'board', action: 'Board Removed', message: `Board ${data.boardId || ''} removed` });
            return;
        }

        if (type === 'notice_created') {
            const moduleType = String(data.moduleType || '').toLowerCase();
            addEvent({
                type: 'schedule',
                action: moduleType === 'media' ? 'Media Scheduled' : 'Marquee Scheduled',
                message: data.title ? `Title: ${data.title}` : 'New schedule created'
            });
            return;
        }
        if (type === 'notice_updated') {
            addEvent({ type: 'schedule', action: 'Schedule Updated', message: data.scheduleId ? `ID: ${data.scheduleId}` : '' });
            return;
        }
        if (type === 'notice_deleted') {
            addEvent({ type: 'schedule', action: 'Schedule Deleted', message: data.scheduleId ? `ID: ${data.scheduleId}` : '' });
            return;
        }

        if (type.startsWith('quote_')) {
            const actionMap = {
                quote_created: 'Quote Created',
                quote_updated: 'Quote Updated',
                quote_deleted: 'Quote Deleted',
                quote_bulk_added: 'Bulk Quotes Imported'
            };
            addEvent({
                type: 'content',
                action: actionMap[type] || 'Quote Event',
                message: data && data.quoteId ? `Quote ID: ${data.quoteId}` : (data && data.count ? `Count: ${data.count}` : '')
            });
        }
    }

    function addFromApi(method, endpoint, requestBody, responseJson) {
        const m = String(method || '').toUpperCase();
        if (m === 'GET') return;
        const ep = String(endpoint || '');
        const success = responseJson && responseJson.success === true;

        // Boards
        if (m === 'DELETE' && ep.startsWith('/boards/')) {
            const boardId = extractIdFromEndpoint(ep);
            addEvent({
                type: 'board',
                action: success ? 'Board Removed' : 'Board Remove Failed',
                message: boardId ? `Board ${boardId}` : ''
            });
            return;
        }

        // Marquee / Media schedule create
        if (m === 'POST' && ep === '/notice/create') {
            const moduleType = String(requestBody && requestBody.moduleType || '').toLowerCase();
            addEvent({
                type: 'schedule',
                action: success ? (moduleType === 'media' ? 'Media Scheduled' : 'Marquee Scheduled') : 'Schedule Publish Failed',
                message: requestBody && requestBody.title ? `Title: ${requestBody.title}` : ''
            });
            return;
        }

        // Schedules toggle/update/delete
        if ((m === 'PATCH' || m === 'PUT') && ep.startsWith('/schedules/')) {
            addEvent({
                type: 'schedule',
                action: success ? 'Schedule Updated' : 'Schedule Update Failed',
                message: ep.includes('/toggle') ? 'Toggle changed' : `Endpoint: ${ep}`
            });
            return;
        }
        if (m === 'DELETE' && ep.startsWith('/schedules/')) {
            addEvent({
                type: 'schedule',
                action: success ? 'Schedule Deleted' : 'Schedule Delete Failed',
                message: `Endpoint: ${ep}`
            });
            return;
        }

        // Media library
        if (m === 'POST' && ep === '/media/upload') {
            addEvent({
                type: 'content',
                action: success ? 'Media Uploaded' : 'Media Upload Failed',
                message: success && responseJson.media && responseJson.media.pathOrUrl ? String(responseJson.media.pathOrUrl) : ''
            });
            return;
        }
        if (m === 'POST' && ep === '/media/url') {
            addEvent({
                type: 'content',
                action: success ? 'Media URL Added' : 'Media URL Add Failed',
                message: requestBody && requestBody.url ? String(requestBody.url) : ''
            });
            return;
        }
        if (m === 'DELETE' && ep.startsWith('/media/')) {
            addEvent({
                type: 'content',
                action: success ? 'Media Deleted' : 'Media Delete Failed',
                message: `ID: ${extractIdFromEndpoint(ep)}`
            });
            return;
        }

        // Quotes
        if (ep.startsWith('/quotes')) {
            const action =
                m === 'POST' && ep === '/quotes' ? 'Quote Added' :
                    m === 'POST' && ep === '/quotes/bulk' ? 'Bulk Quotes Imported' :
                        m === 'PUT' ? 'Quote Updated' :
                            m === 'PATCH' ? 'Quote Updated' :
                                m === 'DELETE' ? 'Quote Deleted' :
                                    'Quote Event';
            addEvent({
                type: 'content',
                action: success ? action : `${action} Failed`,
                message: ''
            });
        }
    }

    window.auditStore = {
        STORAGE_KEY,
        addEvent,
        getLogs,
        addFromWs,
        addFromApi,
        clear: () => saveLogs([])
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
            const fetchOptions = {
                method: upperMethod,
                signal: controller.signal
            };

            if (formData) {
                fetchOptions.body = formData;
            } else if (data !== undefined) {
                fetchOptions.headers = { 'Content-Type': 'application/json' };
                fetchOptions.body = JSON.stringify(data);
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
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            wsReconnectDelayMs = 2000;
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            let data = null;
            try {
                data = JSON.parse(event.data);
            } catch (parseError) {
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

        ws.onclose = () => {
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
