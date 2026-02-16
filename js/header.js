// Global top header injector (Admin app)
// - Adds a uniform top header across pages (except login)
// - Uses existing .page-header h1/p as source for title/subtitle
// - Preserves any extra controls from .page-header as a separate "extras" row
(function () {
    const pathname = String(window.location.pathname || '').toLowerCase();
    const isLoginPage = pathname.endsWith('/login.html') || pathname.endsWith('login.html');
    if (isLoginPage) return;

    const root = document.documentElement;
    const MOBILE_SIDEBAR_QUERY = '(max-width: 1024px)';

    function isElementEmpty(el) {
        if (!el) return true;
        if (el.children && el.children.length > 0) return false;
        return String(el.textContent || '').trim().length === 0;
    }

    function pruneEmptyElements(container) {
        if (!container || !container.querySelectorAll) return;
        // Remove empty nodes bottom-up so wrappers without content do not remain.
        const all = Array.from(container.querySelectorAll('*')).reverse();
        all.forEach((node) => {
            if (node && node.parentElement && isElementEmpty(node)) {
                node.parentElement.removeChild(node);
            }
        });
    }

    function formatLiveDateTime(date) {
        try {
            const datePart = date.toLocaleDateString(undefined, {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            const timePart = date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            });
            return `${datePart} | ${timePart}`;
        } catch (error) {
            return date.toString();
        }
    }

    function setThemeToggleState(button) {
        if (!button) return;
        const isDark = root.getAttribute('data-theme') === 'dark';
        button.classList.toggle('is-dark', isDark);
        button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        button.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    function isMobileSidebarMode() {
        try {
            return window.matchMedia(MOBILE_SIDEBAR_QUERY).matches;
        } catch (error) {
            return false;
        }
    }

    function closeSidebar() {
        if (document.body) {
            document.body.classList.remove('sidebar-open');
        }
    }

    function toggleSidebar() {
        if (document.body) {
            document.body.classList.toggle('sidebar-open');
        }
    }

    function ensureSidebarOverlay() {
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.addEventListener('click', closeSidebar);
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    function updateSidebarToggleState(button) {
        if (!button) return;
        const expanded = document.body ? document.body.classList.contains('sidebar-open') : false;
        button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }

    function enhanceSidebar() {
        const sidebar = document.querySelector('aside.sidebar');
        const nav = sidebar ? sidebar.querySelector('nav.nav') : null;
        if (!sidebar || !nav) return;

        // Group labels
        nav.querySelectorAll('.sidebar-section-label').forEach((el) => {
            if (el.parentElement) el.parentElement.removeChild(el);
        });

        const navItems = Array.from(nav.querySelectorAll('.nav-item'));
        if (!navItems.length) return;

        const itemByHref = (href) => navItems.find((item) => String(item.getAttribute('href') || '').toLowerCase() === href);
        const mainStart = itemByHref('index.html') || navItems[0];
        const publishingStart =
            itemByHref('create-notice.html') ||
            itemByHref('media.html') ||
            itemByHref('schedules.html') ||
            itemByHref('templates.html') ||
            navItems[1] ||
            navItems[0];
        const systemStart =
            itemByHref('analytics.html') ||
            itemByHref('audit-log.html') ||
            itemByHref('settings.html') ||
            navItems[navItems.length - 1];

        const insertLabelBefore = (text, target) => {
            if (!target || !target.parentElement) return;
            const label = document.createElement('div');
            label.className = 'sidebar-section-label';
            label.textContent = text;
            target.parentElement.insertBefore(label, target);
        };

        insertLabelBefore('MAIN', mainStart);
        if (publishingStart !== mainStart) insertLabelBefore('PUBLISHING', publishingStart);
        if (systemStart !== publishingStart && systemStart !== mainStart) insertLabelBefore('SYSTEM', systemStart);

        // Footer admin block
        const existingFooter = sidebar.querySelector('.sidebar-footer');
        if (existingFooter && existingFooter.parentElement) {
            existingFooter.parentElement.removeChild(existingFooter);
        }

        const adminName =
            (typeof window.getAdminUser === 'function' ? window.getAdminUser() : '') ||
            String(sessionStorage.getItem('adminUser') || 'Admin');
        const avatarLetter = adminName ? adminName.charAt(0).toUpperCase() : 'A';

        const footer = document.createElement('div');
        footer.className = 'sidebar-footer';
        footer.innerHTML = `
            <div class="sidebar-admin-info">
                <div class="sidebar-admin-avatar">${avatarLetter}</div>
                <div class="sidebar-admin-meta">
                    <div class="sidebar-admin-name">${adminName}</div>
                    <button type="button" class="sidebar-signout-btn" id="sidebarSignOutBtn">Sign Out</button>
                </div>
            </div>
        `;

        const signOutBtn = footer.querySelector('#sidebarSignOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                if (typeof window.adminLogout === 'function') {
                    window.adminLogout();
                    return;
                }
                sessionStorage.removeItem('adminLoggedIn');
                sessionStorage.removeItem('adminUser');
                sessionStorage.removeItem('loginTime');
                sessionStorage.removeItem('adminLastActivity');
                window.location.href = 'login.html';
            });
        }

        sidebar.appendChild(footer);
    }

    function buildHeader(titleText, subtitleText) {
        const header = document.createElement('header');
        header.className = 'top-header';

        const left = document.createElement('div');
        left.className = 'top-header-left';

        const sidebarToggle = document.createElement('button');
        sidebarToggle.type = 'button';
        sidebarToggle.className = 'top-header-sidebar-toggle';
        sidebarToggle.setAttribute('aria-label', 'Open navigation');
        sidebarToggle.setAttribute('title', 'Open navigation');
        sidebarToggle.setAttribute('aria-expanded', 'false');
        sidebarToggle.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M4 7h16"></path>
                <path d="M4 12h16"></path>
                <path d="M4 17h16"></path>
            </svg>
        `;
        sidebarToggle.addEventListener('click', () => {
            toggleSidebar();
            updateSidebarToggleState(sidebarToggle);
        });

        const titleWrap = document.createElement('div');
        titleWrap.className = 'top-header-title-wrap';

        const title = document.createElement('div');
        title.className = 'top-header-title';
        title.textContent = titleText || 'Dashboard';
        titleWrap.appendChild(title);

        if (subtitleText) {
            const subtitle = document.createElement('div');
            subtitle.className = 'top-header-subtitle';
            subtitle.textContent = subtitleText;
            titleWrap.appendChild(subtitle);
        }

        left.appendChild(sidebarToggle);
        left.appendChild(titleWrap);

        const right = document.createElement('div');
        right.className = 'top-header-right';

        const dateTime = document.createElement('div');
        dateTime.className = 'top-header-datetime';
        dateTime.id = 'topHeaderDateTime';
        dateTime.textContent = formatLiveDateTime(new Date());

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.id = 'themeToggle';
        toggle.className = 'top-header-theme-toggle';
        toggle.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path>
            </svg>
        `;

        toggle.addEventListener('click', () => {
            if (window.adminTheme && typeof window.adminTheme.toggleDarkMode === 'function') {
                window.adminTheme.toggleDarkMode();
            } else {
                const isDark = root.getAttribute('data-theme') === 'dark';
                root.setAttribute('data-theme', isDark ? 'light' : 'dark');
            }
            setThemeToggleState(toggle);
        });

        setThemeToggleState(toggle);

        right.appendChild(dateTime);
        right.appendChild(toggle);

        header.appendChild(left);
        header.appendChild(right);

        return header;
    }

    function init() {
        const main = document.querySelector('main.main');
        if (!main) return;

        enhanceSidebar();
        ensureSidebarOverlay();

        const pageHeader = main.querySelector('.page-header');
        let titleText = '';
        let subtitleText = '';
        let extras = null;

        if (pageHeader) {
            const titleEl = pageHeader.querySelector('h1');
            const subtitleEl = pageHeader.querySelector('p');
            titleText = titleEl ? String(titleEl.textContent || '').trim() : '';
            subtitleText = subtitleEl ? String(subtitleEl.textContent || '').trim() : '';

            if (titleEl && titleEl.parentElement) titleEl.parentElement.removeChild(titleEl);
            if (subtitleEl && subtitleEl.parentElement) subtitleEl.parentElement.removeChild(subtitleEl);

            pruneEmptyElements(pageHeader);

            const hasExtras = pageHeader.childNodes && Array.from(pageHeader.childNodes).some((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) return true;
                if (node.nodeType === Node.TEXT_NODE) return String(node.textContent || '').trim().length > 0;
                return false;
            });

            if (hasExtras) {
                extras = document.createElement('div');
                extras.className = 'top-header-extras';
                while (pageHeader.firstChild) {
                    extras.appendChild(pageHeader.firstChild);
                }
                pruneEmptyElements(extras);
            }

            if (pageHeader.parentElement) {
                pageHeader.parentElement.removeChild(pageHeader);
            }
        }

        if (!titleText) {
            const activeNav = document.querySelector('.nav-item.active');
            if (activeNav) {
                titleText = String(activeNav.textContent || '').replace(/\s+/g, ' ').trim();
            }
        }
        if (!titleText) {
            titleText = String(document.title || '').split('-')[0].trim() || 'Dashboard';
        }

        const header = buildHeader(titleText, subtitleText);
        main.insertBefore(header, main.firstChild);

        const sidebarToggleBtn = header.querySelector('.top-header-sidebar-toggle');
        updateSidebarToggleState(sidebarToggleBtn);

        document.querySelectorAll('.sidebar .nav-item').forEach((item) => {
            item.addEventListener('click', () => {
                if (isMobileSidebarMode()) {
                    closeSidebar();
                    updateSidebarToggleState(sidebarToggleBtn);
                }
            });
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeSidebar();
                updateSidebarToggleState(sidebarToggleBtn);
            }
        });

        try {
            const media = window.matchMedia(MOBILE_SIDEBAR_QUERY);
            const handleViewportChange = (e) => {
                if (!e.matches) {
                    closeSidebar();
                    updateSidebarToggleState(sidebarToggleBtn);
                }
            };
            if (typeof media.addEventListener === 'function') {
                media.addEventListener('change', handleViewportChange);
            } else if (typeof media.addListener === 'function') {
                media.addListener(handleViewportChange);
            }
        } catch (error) {
            // no-op
        }

        if (extras && extras.childNodes.length) {
            // Insert extras right after header bar.
            main.insertBefore(extras, header.nextSibling);
        }

        const dateTimeEl = header.querySelector('#topHeaderDateTime');
        if (dateTimeEl) {
            const update = () => {
                dateTimeEl.textContent = formatLiveDateTime(new Date());
                setThemeToggleState(header.querySelector('#themeToggle'));
            };
            update();
            setInterval(update, 1000);
        }

        // Ensure current theme is applied once header exists.
        if (window.adminTheme && typeof window.adminTheme.syncFromSettings === 'function') {
            window.adminTheme.syncFromSettings();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
