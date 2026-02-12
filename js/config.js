// Runtime configuration for admin web app.
// Tunnel URL can be updated without redeploy using:
//   https://<admin-app-url>/?server=https://<new-tunnel-url>
(function () {
    const DEFAULT_SERVER_URL = 'https://medium-chicago-revenues-sue.trycloudflare.com';
    const STORAGE_KEY = 'SMART_BOARD_SERVER_URL';
    const QUERY_KEY = 'server';

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

    const queryUrl = normalizeUrl(new URLSearchParams(window.location.search).get(QUERY_KEY));
    if (queryUrl) {
        localStorage.setItem(STORAGE_KEY, queryUrl);
    }

    const storedUrl = normalizeUrl(localStorage.getItem(STORAGE_KEY));
    const resolvedUrl = queryUrl || storedUrl || DEFAULT_SERVER_URL;

    window.config = {
        SERVER_URL: resolvedUrl
    };
})();
