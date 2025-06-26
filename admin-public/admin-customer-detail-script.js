// admin-public/admin-customer-detail-script.js
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Admin Customer Detail Script Initializing...");

    // --- DOM Elements for Customer Profile ---
    const customerFullNameHeader = document.getElementById('customer-full-name-header');

    // Left Column
    const customerCccd = document.getElementById('customer-cccd');
    const customerDrivingLicense = document.getElementById('customer-driving-license');
    const customerOtherDoc = document.getElementById('customer-other-doc'); // Changed from customerHousehold
    const verificationProgress = document.getElementById('verification-progress');

    //const customerMotorbike = document.getElementById('customer-motorbike');
    //const customerMotorbikeDetails = document.getElementById('customer-motorbike-details');

    const customerMotorbikeStatus = document.getElementById('customer-motorbike-status'); // Changed from customerMotorbike
    const customerMotorbikePlate = document.getElementById('customer-motorbike-plate'); // Changed from customerMotorbikeDetails

    // Right Column
    const profileCustomerName = document.getElementById('profile-customer-name');
    const profileCustomerPhone = document.getElementById('profile-customer-phone');
    const profileCustomerEmail = document.getElementById('profile-customer-email');
    const profileCustomerAddress = document.getElementById('profile-customer-address');
    const profileCustomerDob = document.getElementById('profile-customer-dob');
    const profileCustomerNotes = document.getElementById('profile-customer-notes');
    const profileCustomerStatus = document.getElementById('profile-customer-status');
    const profileCustomerLoyalty = document.getElementById('profile-customer-loyalty');

    const profileSuccessfulBookings = document.getElementById('profile-successful-bookings');
    const profileTotalBookings = document.getElementById('profile-total-bookings');
    const profileTotalRevenue = document.getElementById('profile-total-revenue');

    // Booking List Table
    const customerDetailBookingsTableBody = document.getElementById('customer-detail-bookings-table-body');
    const customerBookingPaginationInfo = document.getElementById('customer-booking-pagination-info');

    // --- APIs ---
    const ADMIN_CUSTOMERS_API_URL = '/admin/customers';
    const ADMIN_BOOKINGS_API_URL = '/admin/bookings';

    // --- Utility Functions ---
    function getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    function formatCurrency(amount) {
        return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }

    function formatDateTimeForDisplay(isoString) {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            return date.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) { return 'Invalid Date';}
    }
// Add a helper function to clear the customer details when an error occurs:
    function clearCustomerDetails() {
        profileCustomerName.textContent = 'N/A';
        profileCustomerPhone.textContent = 'N/A';
        profileCustomerEmail.textContent = 'N/A';
        profileCustomerAddress.textContent = 'N/A';
        profileCustomerDob.textContent = 'N/A';
        profileCustomerNotes.textContent = 'N/A';
        profileCustomerStatus.textContent = 'N/A';
        profileCustomerLoyalty.textContent = 'N/A';
        customerCccd.textContent = 'N/A';
        customerDrivingLicense.textContent = 'N/A';
        customerOtherDoc.textContent = 'N/A';
        customerMotorbikeStatus.textContent = 'N/A';
        customerMotorbikePlate.textContent = 'N/A';
        customerDetailBookingsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: red;">Error loading bookings.</td></tr>';
    }

    // --- Fetch and Display Customer Details ---
async function fetchAndDisplayCustomerDetails(customerId) {
    try {
        console.log(`Fetching customer details for ID: ${customerId}`); // Log the customerId
        const response = await fetch(`${ADMIN_CUSTOMERS_API_URL}/${customerId}`);
        if (!response.ok) {
            if (response.status === 404) {
                customerFullNameHeader.textContent = 'Customer Not Found.';
                console.error(`Customer with ID ${customerId} not found.`);
            } else {
                customerFullNameHeader.textContent = 'Error loading customer details.';
                console.error(`HTTP error! Status: ${response.status}`);
            }
            clearCustomerDetails(); // Clear existing details
            return;
        }
        const customer = await response.json();
        console.log("Fetched customer details:", customer);

        // Populate header
        customerFullNameHeader.textContent = `Customer Information: ${customer.name || 'N/A'}`;

        // Populate Right Column (Profile Summary)
        profileCustomerName.textContent = customer.name || 'N/A';
        profileCustomerPhone.textContent = customer.phone || 'N/A';
        profileCustomerEmail.textContent = customer.email || 'N/A';
        profileCustomerAddress.textContent = customer.address || 'N/A';
        profileCustomerDob.textContent = customer.dob ? new Date(customer.dob).toLocaleDateString('en-GB') : 'N/A';
        profileCustomerNotes.textContent = customer.notes || 'N/A';
        profileCustomerStatus.textContent = customer.status || 'Active';
        profileCustomerLoyalty.textContent = customer.loyalty || 'Good (90/100)';

        // Populate Left Column (Documents/Assets)
        customerCccd.textContent = customer.cccd_passport || 'Verified';
        customerDrivingLicense.textContent = customer.driving_license || 'Verified';
        customerOtherDoc.textContent = customer.other_doc || 'N/A';
        customerMotorbikeStatus.textContent = customer.motorbike_status || 'Verified';
        customerMotorbikePlate.textContent = customer.motorbike_plate || 'N/A';

    function updateVerificationProgress(customer) {
        let verifiedCount = 0;
    
        // Check each document and increment verifiedCount if it exists
        if (customer.cccd_passport) verifiedCount++;
        if (customer.driving_license) verifiedCount++;
        if (customer.other_doc) verifiedCount++;
    
        // Total number of documents to verify
        const totalDocsForProgress = 3;
    
        // Calculate the progress percentage
        const progressPercentage = (verifiedCount / totalDocsForProgress) * 100;
    
        // Debugging logs
        console.log("CCCD/Passport:", customer.cccd_passport ? "Verified" : "Not Verified");
        console.log("Driving License:", customer.driving_license ? "Verified" : "Not Verified");
        console.log("Other Document:", customer.other_doc ? "Verified" : "Not Verified");
        console.log("Verified Count:", verifiedCount);
        console.log("Total Documents for Progress:", totalDocsForProgress);
        console.log("Progress Percentage:", progressPercentage);
    
        // Update the progress bar
    if (verificationProgress) {
            verificationProgress.style.width = `${progressPercentage}%`;
        }
    }

    // Fetch and display bookings for this customer
    await fetchAndDisplayCustomerBookings(customer.email);

    } catch (error) {
        console.error("Error fetching customer details:", error);
        customerFullNameHeader.textContent = 'Error loading customer details.';
    }
}

    // --- Fetch and Display Customer Bookings in the Table ---
    // Lọc bookings dựa trên email khách hàng (ko dùng customerID được vì trong booking (json) không có trường customerID)

async function fetchAndDisplayCustomerBookings(customerEmail) {
    if (!customerDetailBookingsTableBody) return;
    customerDetailBookingsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Loading bookings...</td></tr>';
    customerBookingPaginationInfo.textContent = '';

    if (!customerEmail) {
        console.error("Customer email is missing. Cannot fetch bookings.");
        customerDetailBookingsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: red;">Customer email is missing. Cannot load bookings.</td></tr>';
        return;
    }

    try {
        // Fetch bookings filtered by customer email
        const response = await fetch(`${ADMIN_BOOKINGS_API_URL}?email=${encodeURIComponent(customerEmail)}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const bookings = await response.json();

        customerDetailBookingsTableBody.innerHTML = '';

        if (bookings.length === 0) {
            customerDetailBookingsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No bookings found for this customer.</td></tr>';
            profileSuccessfulBookings.textContent = '0';
            profileTotalBookings.textContent = '0';
            profileTotalRevenue.textContent = formatCurrency(0);
            return;
        }

        // Populate bookings table
        const totalBookings = bookings.length;
        const successfulBookings = bookings.filter(b => ['Completed', 'Confirmed', 'Rented Out'].includes(b.status)).length;
        const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

        profileSuccessfulBookings.textContent = successfulBookings;
        profileTotalBookings.textContent = totalBookings;
        profileTotalRevenue.textContent = formatCurrency(totalRevenue);

        bookings.forEach(booking => {
            const row = customerDetailBookingsTableBody.insertRow();
            const statusClass = (booking.status || 'N/A').toLowerCase().replace(/\s/g, '-').replace('by-customer', 'cancelled').replace('by-admin', 'cancelled');

            row.innerHTML = `
                <td data-label="Booking ID">${booking.id || 'N/A'}</td>
                <td data-label="Location">${booking.pickupLocation || 'N/A'}</td>
                <td data-label="Rent Date">${formatDateTimeForDisplay(booking.startDate)} - ${formatDateTimeForDisplay(booking.endDate)}</td>
                <td data-label="Car Name">${booking.carMake || ''} ${booking.carModel || ''}</td>
                <td data-label="Days">${Math.ceil(Math.abs(new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)) || 1}</td>
                <td data-label="Total Price">${formatCurrency(booking.totalPrice)}</td>
                <td data-label="Status"><span class="status-badge status-${statusClass}">${booking.status || 'N/A'}</span></td>
            `;
        });

        customerBookingPaginationInfo.textContent = `1 - ${bookings.length} of ${bookings.length} bookings`;

    } catch (error) {
        console.error("Error fetching customer bookings:", error);
        customerDetailBookingsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: red;">Error loading bookings.</td></tr>';
        customerBookingPaginationInfo.textContent = 'Failed to load bookings.';
    }
}
    // --- Initialization ---
    const customerId = getQueryParam('id'); // Get customer ID from URL
    const customerEmail = getQueryParam('email'); // Get customer email from URL (more reliable for lookup)

    if (customerId) { // Prioritize customerId for fetching customer details
        fetchAndDisplayCustomerDetails(customerId);
        fetchAndDisplayCustomerBookings(customerEmail);
    } else {
        console.error("No customer ID provided in URL for detail page.");
        customerFullNameHeader.textContent = 'Error: No customer ID provided for detail page.'; // Changed label
        // Optionally redirect back to customer list
        // window.location.href = 'admin-customers.html';
    }
});