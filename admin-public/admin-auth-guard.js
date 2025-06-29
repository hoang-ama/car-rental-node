// admin-public/admin-auth-guard.js
document.addEventListener('DOMContentLoaded', () => {
    const isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn');
    const currentPage = window.location.pathname;

    const protectedAdminPages = [
        'admin-dashboard.html',
        'admin-cars.html',
        'admin-bookings.html',
        'admin-customers.html',
        'admin-customer-detail.html',
        'admin-notifications-all.html'
    ];

    const isProtectedPage = protectedAdminPages.some(page => currentPage.includes(page));

    // --- Authentication Enforcement ---
    if (isAdminLoggedIn !== 'true' && isProtectedPage) {
        window.location.href = 'admin-login.html';
        return; // Stop execution if not authenticated and on a protected page
    }

    // If logged in and trying to access the login page, redirect to dashboard
    if (isAdminLoggedIn === 'true' && currentPage.includes('admin-login.html')) {
        window.location.href = 'admin-dashboard.html';
        return; // Stop execution
    }

    // --- Logout Functionality (only for protected pages when logged in) ---
    if (isAdminLoggedIn === 'true' && isProtectedPage) {
        const adminUserProfile = document.getElementById('admin-user-profile');
        const userProfileDropdown = document.getElementById('user-profile-dropdown');
        const logoutButton = document.getElementById('logout-button');

        if (adminUserProfile && userProfileDropdown && logoutButton) {
            // Toggle dropdown visibility when clicking on user profile
            adminUserProfile.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent click from bubbling to document
                userProfileDropdown.classList.toggle('show');
            });

            // Hide dropdown when clicking anywhere else on the document
            document.addEventListener('click', (event) => {
                if (userProfileDropdown.classList.contains('show') && !adminUserProfile.contains(event.target)) {
                    userProfileDropdown.classList.remove('show');
                }
            });

            // Handle logout click
            logoutButton.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default link behavior
                event.stopPropagation(); // Stop propagation to prevent dropdown from hiding immediately

                if (confirm('Are you sure you want to log out?')) {
                    sessionStorage.removeItem('adminLoggedIn'); // Clear login flag
                    window.location.href = 'admin-login.html'; // Redirect to login page
                }
            });
        }
    }
});