// admin-public/admin-auth-guard.js
document.addEventListener('DOMContentLoaded', () => {
    const isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn');
    const currentPage = window.location.pathname;

    const protectedAdminPages = [
        'admin-dashboard.html',
        'admin-cars.html',
        'admin-bookings.html',
        'admin-calendar.html',
        'admin-customers.html',
        'admin-customer-detail.html',
        'admin-notifications-all.html',
        'admin-promotions.html',
        'admin-reports.html',
        'admin-settings.html'
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

    // --- Submenu Toggle Logic ---

const submenuToggles = document.querySelectorAll('.submenu-toggle');

    submenuToggles.forEach(toggle => {
        const submenu = toggle.closest('.has-submenu').querySelector('.submenu');
        const chevronDown = toggle.querySelector('.fa-chevron-down');
        const chevronUp = document.createElement('i'); // Dynamically add chevron-up
        chevronUp.className = 'fas fa-chevron-up';
        toggle.appendChild(chevronUp);

        toggle.addEventListener('click', (event) => {
            event.preventDefault();
            const parentItem = toggle.closest('.has-submenu');
            
            if (submenu) {
                const isExpanded = submenu.classList.contains('show');
                submenu.classList.toggle('show');
                parentItem.classList.toggle('active');

                // Toggle chevron visibility
                chevronDown.style.display = isExpanded ? 'inline-block' : 'none';
                chevronUp.style.display = isExpanded ? 'none' : 'inline-block';

                // Adjust height dynamically
                if (isExpanded) {
                    submenu.style.height = '0';
                } else {
                    submenu.style.height = submenu.scrollHeight + 'px';
                    setTimeout(() => {
                        if (submenu.classList.contains('show')) {
                            submenu.style.height = 'auto';
                        }
                    }, 300);
                }
            }
        });
    });

    // Ensure submenu is shown if on the calendar page

    if (currentPage.includes('admin-calendar.html')) {
        const calendarSubmenu = document.querySelector('.has-submenu .submenu');
        const toggle = document.querySelector('.submenu-toggle');
        const chevronDown = toggle.querySelector('.fa-chevron-down');
        const chevronUp = toggle.querySelector('.fa-chevron-up');
        
        if (calendarSubmenu && toggle) {
            calendarSubmenu.classList.add('show');
            calendarSubmenu.style.height = 'auto';
            toggle.closest('.has-submenu').classList.add('active');
            chevronDown.style.display = 'none';
            chevronUp.style.display = 'inline-block';
        }
    }

 // --- End: Submenu Toggle Logic ---
   
});