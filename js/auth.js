/**
 * Auth Guard - Add this script to all admin pages
 * Checks if user is logged in, redirects to login if not
 */

(function () {
    // Check if logged in
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

    // If not on login page and not logged in, redirect
    if (!isLoggedIn && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
})();

/**
 * Logout function - call this to log out the admin
 */
function adminLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('loginTime');
    window.location.href = 'login.html';
}

/**
 * Get current admin user
 */
function getAdminUser() {
    return sessionStorage.getItem('adminUser') || 'Admin';
}
