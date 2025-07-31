// admin-public/admin-notifications-all-script.js
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Admin All Notifications Script Initializing...");

    const allNotificationsTableBody = document.getElementById('all-notifications-table-body');
    const notificationsActionMessageDiv = document.getElementById('notifications-action-message');
    const notificationsPaginationInfo = document.getElementById('notifications-pagination-info');

    const ADMIN_BOOKINGS_API_URL = '/api/bookings';
    const ADMIN_CUSTOMERS_API_URL = '/admin/customers';

    // --- Utility Functions ---
    function showMessage(element, message, type = 'success') {
        if (!element) return;
        element.textContent = message;
        element.className = 'form-message-placeholder';
        element.classList.add(type);
        setTimeout(() => {
            element.textContent = '';
            element.className = '';
        }, 5000);
    }

    function formatNotificationTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
    }

    // --- Fetch and Display All Notifications ---
    async function fetchAndDisplayAllNotifications() {
        if (!allNotificationsTableBody) return;
        allNotificationsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading notifications...</td></tr>';
        notificationsPaginationInfo.textContent = '';

        try {
            const [bookingsResponse, customersResponse] = await Promise.all([
                fetch(ADMIN_BOOKINGS_API_URL),
                fetch(ADMIN_CUSTOMERS_API_URL)
            ]);

            if (!bookingsResponse.ok) throw new Error(`HTTP error! Status: ${bookingsResponse.status} for bookings.`);
            if (!customersResponse.ok) throw new Error(`HTTP error! Status: ${customersResponse.status} for customers.`);

            const bookings = await bookingsResponse.json();
            const customers = await customersResponse.json();

            let allNotifications = [];

            // Add all bookings as notifications
            bookings.forEach(b => {
                allNotifications.push({
                    type: 'Booking',
                    id: b.id,
                    message: `Booking for ${b.customerName} (${b.carMake} ${b.carModel}) - Status: ${b.status}`,
                    timestamp: b.bookingDate,
                    rawBooking: b // Store raw booking data if needed for detail view
                });
            });

            // Add all customers as notifications
            customers.forEach(c => {
                allNotifications.push({
                    type: 'Customer',
                    id: c.id,
                    message: `New customer: ${c.name || c.email} registered.`,
                    timestamp: c.registeredAt,
                    rawCustomer: c // Store raw customer data
                });
            });

            // Sort all notifications by timestamp descending (newest first)
            allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            allNotificationsTableBody.innerHTML = ''; // Clear previous content

            if (allNotifications.length === 0) {
                allNotificationsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No notifications found.</td></tr>';
            } else {
                allNotifications.forEach(notification => {
                    const row = allNotificationsTableBody.insertRow();
                    row.innerHTML = `
                        <td data-label="Type">${notification.type}</td>
                        <td data-label="ID">${notification.id}</td>
                        <td data-label="Message">${notification.message}</td>
                        <td data-label="Time">${formatNotificationTime(notification.timestamp)}</td>
                    `;
                });
            }

            notificationsPaginationInfo.textContent = `${allNotifications.length} notifications total.`;

        } catch (error) {
            console.error("Error fetching all notifications:", error);
            allNotificationsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading notifications.</td></tr>';
            showMessage(notificationsActionMessageDiv, 'Error loading all notifications: ' + error.message, 'error');
        }
    }

    // --- Initial Load ---
    fetchAndDisplayAllNotifications();
});