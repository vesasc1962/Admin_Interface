// API Helper - Uses config.js for server URL
const API_BASE = (typeof config !== 'undefined' ? config.SERVER_URL : 'http://localhost:3000') + '/api';
const WS_URL = (typeof config !== 'undefined' ? config.SERVER_URL.replace('http', 'ws') : 'ws://localhost:3000');

// API Helper
const api = {
    async get(endpoint) {
        const response = await fetch(`${API_BASE}${endpoint}`);
        return await response.json();
    },

    async post(endpoint, data) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    },

    async put(endpoint, data) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    },

    async delete(endpoint) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE'
        });
        return await response.json();
    },

    async patch(endpoint, data) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data || {})
        });
        return await response.json();
    },

    async upload(endpoint, formData) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    }
};

// WebSocket connection
let ws = null;
const wsListeners = [];

function connectWebSocket() {
    try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => console.log('WebSocket connected');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            wsListeners.forEach(listener => listener(data));
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected, reconnecting...');
            setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => console.error('WebSocket error:', error);
    } catch (error) {
        console.error('WebSocket connection failed:', error);
        setTimeout(connectWebSocket, 3000);
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
