// admin-public/admin-dashboard-script.js
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Admin Dashboard Script Initializing...");

    // --- DOM Elements ---
    const totalCarsCount = document.getElementById('total-cars-count');
    const availableCarsCount = document.getElementById('available-cars-count');
    const bookedCarsCount = document.getElementById('booked-cars-count');
    const rentedOutCarsCount = document.getElementById('rented-out-cars-count');

    const totalBookingsCount = document.getElementById('total-bookings-count');
    const confirmedBookingsCount = document.getElementById('confirmed-bookings-count');
    const pendingBookingsCount = document.getElementById('pending-bookings-count');
    const cancelledBookingsCount = document.getElementById('cancelled-bookings-count');
    const completedBookingsCount = document.getElementById('completed-bookings-count');

    const totalRevenueValue = document.getElementById('total-revenue-value');
    const totalDepositsValue = document.getElementById('total-deposits-value');

    // NEW Customer Information DOM Elements
    const totalCustomersCount = document.getElementById('total-customers-count');
    const registeredCustomersCount = document.getElementById('registered-customers-count');
    const bookedCustomersCount = document.getElementById('booked-customers-count');
    const neverBookedCustomersCount = document.getElementById('never-booked-customers-count');

    const latestBookingsTableBody = document.getElementById('latest-bookings-table-body');
    const refreshLatestBookingsBtn = document.getElementById('refresh-latest-bookings');

    const CARS_API_URL = '/admin/cars';
    const BOOKINGS_API_URL = '/admin/bookings';// NEW: API URL for bookings
    const CUSTOMERS_API_URL = '/admin/customers'; // NEW: API URL for customers

    // Utility to format currency
    function formatCurrency(amount) {
        return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }

    // Utility to format date and time for display
    function formatDateTimeForDisplay(isoString) {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            return date.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) { return 'Invalid Date';}
    }

    // --- Fetch Car Data and Update UI ---
    async function fetchCarData() {
        try {
            const response = await fetch(CARS_API_URL);
            if (!response.ok) throw new Error('Failed to fetch car data.');
            const cars = await response.json();

            const total = cars.length;
            const available = cars.filter(car => car.available).length;

            totalCarsCount.textContent = total;
            availableCarsCount.textContent = available;

            // 'Booked' and 'Rented Out' car counts will be derived from booking data below
        } catch (error) {
            console.error("Error fetching car data for dashboard:", error);
            totalCarsCount.textContent = 'N/A';
            availableCarsCount.textContent = 'N/A';
        }
    }

    // --- Fetch Booking Data and Update UI (now also includes customer booking status) ---
    async function fetchBookingData() {
        try {
            const response = await fetch(BOOKINGS_API_URL);
            if (!response.ok) throw new Error('Failed to fetch booking data.');
            const bookings = await response.json();

            const total = bookings.length;
            const confirmed = bookings.filter(b => b.status === 'Confirmed').length;
            const pending = bookings.filter(b => b.status === 'Pending').length;
            const cancelled = bookings.filter(b => b.status.includes('Cancelled')).length;
            const completed = bookings.filter(b => b.status === 'Completed').length;
            const rentedOut = bookings.filter(b => b.status === 'Rented Out').length;

            const booked = confirmed + pending - rentedOut; // Simplified: Confirmed/Pending bookings that are not yet Rented Out

            const revenue = bookings
                .filter(b => b.status === 'Completed' || b.status === 'Confirmed' || b.status === 'Rented Out')
                .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

            const deposits = bookings
                .reduce((sum, b) => sum + (Number(b.depositAmount) || 0), 0);

            // Update Booking Stats
            totalBookingsCount.textContent = total;
            confirmedBookingsCount.textContent = confirmed;
            pendingBookingsCount.textContent = pending;
            cancelledBookingsCount.textContent = cancelled;
            completedBookingsCount.textContent = completed;

            // Update Car Status based on Booking Data
            bookedCarsCount.textContent = Math.max(0, booked);
            rentedOutCarsCount.textContent = rentedOut;

            // Update Revenue and Deposits
            totalRevenueValue.textContent = formatCurrency(revenue);
            totalDepositsValue.textContent = formatCurrency(deposits);

            // Display latest 5 bookings in a table
            const latest5Bookings = bookings
                .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
                .slice(0, 5);

            latestBookingsTableBody.innerHTML = ''; // Clear previous content

            if (latest5Bookings.length === 0) {
                latestBookingsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #777;">No recent bookings.</td></tr>';
            } else {
                latest5Bookings.forEach(booking => {
                    const row = latestBookingsTableBody.insertRow();
                    const statusClass = (booking.status || 'N/A').toLowerCase().replace(/\s/g, '-').replace('by-customer', 'cancelled').replace('by-admin', 'cancelled');

                    row.innerHTML = `
                        <td data-label="Booking ID">${booking.id || 'N/A'}</td>
                        <td data-label="Customer Name">${booking.customerName || 'N/A'}</td>
                        <td data-label="Phone">${booking.customerPhone || 'N/A'}</td>
                        <td data-label="Email">${booking.customerEmail || 'N/A'}</td>
                        <td data-label="Car Name">${booking.carMake || ''} ${booking.carModel || ''}</td>
                        <td data-label="Start Date">${formatDateTimeForDisplay(booking.startDate)}</td>
                        <td data-label="End Date">${formatDateTimeForDisplay(booking.endDate)}</td>
                        <td data-label="Total Price">$${booking.totalPrice !== undefined ? Number(booking.totalPrice).toFixed(2) : 'N/A'}</td>
                        <td data-label="Status"><span class="status-badge status-${statusClass}">${booking.status || 'N/A'}</span></td>
                    `;
                });
            }

            // Return customer emails from bookings for use in fetchCustomerData
            return bookings.map(b => b.customerEmail);

        } catch (error) {
            console.error("Error fetching booking data for dashboard:", error);
            totalBookingsCount.textContent = 'N/A';
            confirmedBookingsCount.textContent = 'N/A';
            pendingBookingsCount.textContent = 'N/A';
            cancelledBookingsCount.textContent = 'N/A';
            completedBookingsCount.textContent = 'N/A';
            totalRevenueValue.textContent = '$N/A';
            totalDepositsValue.textContent = '$N/A';
            latestBookingsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #777;">Error loading recent bookings.</td></tr>';
            return []; // Return empty array on error
        }
    }

    // --- NEW: Fetch Customer Data and Update UI ---
    async function fetchCustomerData(customerEmailsWithBookings) {
        try {
            const response = await fetch(CUSTOMERS_API_URL);
            if (!response.ok) throw new Error('Failed to fetch customer data.');
            const customers = await response.json();

            const total = customers.length;
            const registered = customers.length; // Assuming all fetched customers are 'registered'

            // Determine unique customers who have made at least one booking
            const uniqueBookedCustomerEmails = new Set(customerEmailsWithBookings);
            const bookedCustomers = customers.filter(customer => uniqueBookedCustomerEmails.has(customer.email)).length;

            const neverBookedCustomers = total - bookedCustomers;

            totalCustomersCount.textContent = total;
            registeredCustomersCount.textContent = registered;
            bookedCustomersCount.textContent = bookedCustomers;
            neverBookedCustomersCount.textContent = neverBookedCustomers;

        } catch (error) {
            console.error("Error fetching customer data for dashboard:", error);
            totalCustomersCount.textContent = 'N/A';
            registeredCustomersCount.textContent = 'N/A';
            bookedCustomersCount.textContent = 'N/A';
            neverBookedCustomersCount.textContent = 'N/A';
        }
    }

    // --- Initialize Dashboard ---
    async function initializeDashboard() {
        // Fetch car data (independent)
        await fetchCarData();

        // Fetch booking data first, then use its result to fetch customer data
        const customerEmailsWithBookings = await fetchBookingData();
        await fetchCustomerData(customerEmailsWithBookings);
    }

    // Event listener for refresh button
    if (refreshLatestBookingsBtn) {
        refreshLatestBookingsBtn.addEventListener('click', async () => {
            refreshLatestBookingsBtn.classList.add('fa-spin'); // Add spin animation
            // Re-fetch only booking data and then customer data (as it depends on bookings)
            const customerEmailsWithBookings = await fetchBookingData();
            await fetchCustomerData(customerEmailsWithBookings);
            refreshLatestBookingsBtn.classList.remove('fa-spin'); // Remove spin animation
        });
    }

    initializeDashboard();
});