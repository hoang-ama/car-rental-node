// admin-public/admin-notifications.js
document.addEventListener('DOMContentLoaded', () => {
    const notificationBellWrapper = document.getElementById('notification-bell-wrapper');
    const notificationBellIcon = document.getElementById('notification-bell-icon'); // The bell icon itself
    const notificationBadge = document.getElementById('notification-badge-count');
    const notificationDropdown = document.getElementById('notification-dropdown'); // The dropdown content wrapper
    const notificationContent = document.getElementById('notification-content'); // The div to populate notification items
    const closeNotificationDropdownBtn = document.getElementById('close-notification-dropdown'); // Close button for dropdown
    // Get the "View all notifications" link
    const viewAllNotificationsLink = document.querySelector('#notification-dropdown .notification-footer a'); // NEW

    const ADMIN_BOOKINGS_API_URL = '/admin/bookings';
    const ADMIN_CUSTOMERS_API_URL = '/admin/customers';

    const LAST_CHECKED_TIMESTAMP_KEY = 'adminLastCheckedNotifications';
    let currentNewNotifications = []; // Array to store details of new notifications

    // --- Utility Functions ---
    function getLastCheckedTimestamp() {
        return localStorage.getItem(LAST_CHECKED_TIMESTAMP_KEY);
    }

    function setLastCheckedTimestamp(timestamp) {
        localStorage.setItem(LAST_CHECKED_TIMESTAMP_KEY, timestamp);
    }

    function formatNotificationTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
    }

    // --- Fetch data and check for new items ---
    async function checkForNewNotifications() {
        let newItemsFound = []; // To store details of all new items

        const lastChecked = getLastCheckedTimestamp(); // Get last checked timestamp from localStorage

        try {
            // Fetch all bookings
            const bookingsResponse = await fetch(ADMIN_BOOKINGS_API_URL);
            const bookings = await bookingsResponse.json();

            // Fetch all customers
            const customersResponse = await fetch(ADMIN_CUSTOMERS_API_URL);
            const customers = await customersResponse.json();

            // Filter new bookings
            // Use (new Date(lastChecked || 0)) to handle null/undefined lastChecked (first load)
            const newBookings = bookings.filter(b => b.bookingDate && new Date(b.bookingDate) > new Date(lastChecked || 0));
            newBookings.forEach(b => {
                newItemsFound.push({
                    type: 'booking',
                    id: b.id,
                    message: `New booking: ${b.customerName} for ${b.carMake} ${b.carModel}`,
                    timestamp: b.bookingDate
                });
            });

            // Filter new customers
            const newCustomers = customers.filter(c => c.registeredAt && new Date(c.registeredAt) > new Date(lastChecked || 0));
            newCustomers.forEach(c => {
                newItemsFound.push({
                    type: 'customer',
                    id: c.id,
                    message: `New customer registered: ${c.name || c.email}`,
                    timestamp: c.registeredAt
                });
            });

            // Sort new items by timestamp descending (newest first)
            newItemsFound.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            currentNewNotifications = newItemsFound; // Store details for display
            updateNotificationUI(newItemsFound.length);

        } catch (error) {
            console.error("Error checking for new notifications:", error);
            updateNotificationUI(0); // Hide badge on error
            currentNewNotifications = [];
        }
    }

    // --- Update UI (show/hide badge and populate dropdown) ---
    function updateNotificationUI(count) {
        if (notificationBadge) {
            if (count > 0) {
                notificationBadge.textContent = count;
                notificationBadge.classList.remove('hidden');
                // Optional: add a class to bell for distinct styling if needed beyond badge
                // notificationBellIcon.classList.add('has-new-notifications');
            } else {
                notificationBadge.textContent = '';
                notificationBadge.classList.add('hidden');
                // notificationBellIcon.classList.remove('has-new-notifications');
            }
        }

        // Populate dropdown content (only if there are notifications to display it for)
        if (notificationContent) {
            notificationContent.innerHTML = ''; // Clear previous content
            if (currentNewNotifications.length > 0) {
                currentNewNotifications.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.classList.add('notification-item');
                    itemDiv.innerHTML = `
                        <strong>${item.type === 'booking' ? 'Booking' : 'Customer'}:</strong> ${item.message}
                        <span class="time">${formatNotificationTime(item.timestamp)}</span>
                    `;
                    notificationContent.appendChild(itemDiv);
                });
                // Ensure "No new notifications." text is not present if there are items
                const emptyMessage = notificationContent.querySelector('.notification-empty');
                if (emptyMessage) emptyMessage.remove();
            } else {
                // Only add "No new notifications." if it's not already there and list is empty
                if (!notificationContent.querySelector('.notification-empty')) {
                    notificationContent.innerHTML = '<div class="notification-empty">No new notifications.</div>';
                }
            }
        }
    }

    // --- Event Listeners ---
    // Toggle dropdown visibility when clicking on bell wrapper
    if (notificationBellWrapper && notificationBellIcon && notificationDropdown) {
        notificationBellWrapper.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from bubbling to document

            // IMPORTANT FIX: Manage 'hidden' class explicitly for transitions to work
            if (notificationDropdown.classList.contains('show')) {
                // If currently showing, hide it
                notificationDropdown.classList.remove('show');
                // Add 'hidden' after transition, using a timeout
                setTimeout(() => {
                    notificationDropdown.classList.add('hidden');
                }, 200); // Small delay to allow transition (match CSS transition duration)
            } else {
                // If currently hidden, show it
                notificationDropdown.classList.remove('hidden'); // Remove 'hidden' first
                notificationDropdown.classList.add('show'); // Then add 'show'
            }

            // When opening the dropdown, mark all current notifications as read
            // This happens when 'show' class is added
            if (notificationDropdown.classList.contains('show')) {
                const now = new Date().toISOString();
                setLastCheckedTimestamp(now); // Store current timestamp as last checked
                updateNotificationUI(0); // Hide badge and clear list in UI
            }
        });
    }

    // Close dropdown when clicking anywhere else on the document
    document.addEventListener('click', (event) => {
        if (notificationDropdown && notificationDropdown.classList.contains('show') && !notificationBellWrapper.contains(event.target)) {
            notificationDropdown.classList.remove('show');
            // Add 'hidden' after transition
            setTimeout(() => {
                notificationDropdown.classList.add('hidden');
            }, 200); // Small delay
        }
    });

    // Close button inside dropdown
    if (closeNotificationDropdownBtn) {
        closeNotificationDropdownBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from bubbling
            notificationDropdown.classList.remove('show');
            // Add 'hidden' after transition
            setTimeout(() => {
                notificationDropdown.classList.add('hidden');
            }, 200); // Small delay
        });
    }

    // NEW: Link "View all notifications" to the new page
    if (viewAllNotificationsLink) {
        viewAllNotificationsLink.href = 'admin-notifications-all.html'; // Set the href
        viewAllNotificationsLink.addEventListener('click', (event) => {
            // Optional: You can add event.preventDefault() and some analytics here
            // if you don't want direct navigation or want to track clicks.
            // For now, direct navigation is fine.
            notificationDropdown.classList.remove('show'); // Hide dropdown on click
            setTimeout(() => {
                notificationDropdown.classList.add('hidden');
            }, 200);
        });
    }

    // --- Initial Check and Polling (Optional) ---
    checkForNewNotifications(); // Initial check when the page loads

    // Optional: Poll for new notifications every X seconds/minutes
    // setInterval(checkForNewNotifications, 30 * 1000); // Check every 30 seconds
});