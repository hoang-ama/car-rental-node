// admin-public/admin-bookings-script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Bookings Script Initializing..."); // DEBUG

    // --- DOM Elements ---
    const bookingsTableBody = document.getElementById('bookings-table-body');
    const bookingActionMessageDiv = document.getElementById('booking-action-message'); // Message for table actions

    const bookingForm = document.getElementById('booking-form');
    const bookingIdFormInput = document.getElementById('booking-id-form'); // Hidden input for booking ID when editing
    const customerNameInputBooking = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerEmailInput = document.getElementById('customer-email');
    const carSelectBooking = document.getElementById('car-select-booking'); // Dropdown to select a car
    const pickupLocationInput = document.getElementById('pickup-location-booking');
    const startDateInputBooking = document.getElementById('start-date-booking'); // datetime-local
    const endDateInputBooking = document.getElementById('end-date-booking');   // datetime-local
    const paymentMethodSelect = document.getElementById('payment-method-booking');
    const totalPriceInput = document.getElementById('total-price-booking');
    const baseCostInput = document.getElementById('base-cost-booking');
    const servicesCostInput = document.getElementById('services-cost-booking');
    const depositAmountInput = document.getElementById('deposit-amount-booking');
    const bookingStatusSelectAdmin = document.getElementById('booking-status-select');
    const notesInputBooking = document.getElementById('notes-booking');
    
    const submitBookingBtn = document.getElementById('submit-booking-button');
    const cancelEditBookingBtn = document.getElementById('cancel-edit-booking-button');
    const bookingFormMessage = document.getElementById('booking-form-message'); // Message for form actions

    const ADMIN_BOOKINGS_API_URL = '/admin/bookings';
    const PUBLIC_CARS_API_URL = '/api/cars'; // To populate car selection dropdown

    // --- Utility Functions ---
    function showMessage(element, message, type = 'success') {
        if (!element) {
            console.warn("Attempted to show message on a null element:", message);
            return;
        }
        element.textContent = message;
        element.className = ''; // Clear previous classes
        element.classList.add(type); // 'success' hoặc 'error'
        
        // Apply some basic styling if not done by CSS classes already
        element.style.padding = '10px';
        element.style.marginBottom = '15px';
        element.style.borderRadius = '4px';
        element.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
        element.style.color = type === 'success' ? '#155724' : '#721c24';
        element.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`;

        setTimeout(() => {
            element.textContent = '';
            element.className = '';
            element.style.padding = '0';
            element.style.marginBottom = '0';
            element.style.border = 'none';
            element.style.backgroundColor = 'transparent';
        }, 5000); // Message visible for 5 seconds
    }

    // Formats an ISO dateTimeString (like "2025-06-10T07:00:00.000Z") 
    // into "YYYY-MM-DDTHH:mm" for datetime-local input.
    function formatDateTimeForInput(dateTimeString) {
        if (!dateTimeString) return '';
        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return ''; // Invalid date

            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (e) {
            console.error("Error formatting date for input:", dateTimeString, e);
            return '';
        }
    }
    // Formats an ISO dateTimeString for display (e.g., dd/mm/yyyy, hh:mm)
     function formatDateTimeForDisplayList(isoString) {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            return date.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) { return 'Invalid Date';}
    }


    // --- Load Cars into Select Dropdown ---
    async function loadCarsIntoBookingSelect() {
        if (!carSelectBooking) return;
        try {
            const response = await fetch(PUBLIC_CARS_API_URL);
            if (!response.ok) throw new Error('Failed to load cars for selection.');
            const cars = await response.json();

            carSelectBooking.innerHTML = '<option value="">-- Select a Car --</option>';
            cars.forEach(car => {
                const option = document.createElement('option');
                option.value = car.id; // Use the unique car ID (e.g., "VF8-29A12345")
                option.textContent = `${car.make} ${car.model} (ID: ${car.id}) - ${car.available ? 'Available' : 'Unavailable'}`;
                // Store make and model in data attributes to easily retrieve them later
                option.dataset.carMake = car.make;
                option.dataset.carModel = car.model;
                carSelectBooking.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading cars into booking select:", error);
            if (bookingFormMessage) showMessage(bookingFormMessage, error.message, 'error');
        }
    }

    // --- Fetch and Display Bookings ---
    async function fetchAndDisplayBookings() {
        if (!bookingsTableBody) return;
        try {
            // Assuming ADMIN_BOOKINGS_API_URL or /api/bookings fetches all bookings
            const response = await fetch(ADMIN_BOOKINGS_API_URL); 
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const bookings = await response.json();
            bookingsTableBody.innerHTML = ''; 

            if (bookings.length === 0) {
                bookingsTableBody.innerHTML = '<tr><td colspan="10">No bookings found.</td></tr>';
                return;
            }

            bookings.forEach(booking => {
                const row = bookingsTableBody.insertRow();
                // Pass the whole booking object to data-booking for easy editing
                row.innerHTML = `
                    <td>${booking.id}</td>
                    <td>${booking.customerName || 'N/A'}</td>
                    <td>${booking.customerPhone || 'N/A'}</td>
                    <td>${booking.customerEmail || 'N/A'}</td>
                    <td>${booking.carMake || ''} ${booking.carModel || ''}</td>
                    <td>${formatDateTimeForDisplayList(booking.startDate)}</td>
                    <td>${formatDateTimeForDisplayList(booking.endDate)}</td>
                    <td>$${booking.totalPrice !== undefined ? Number(booking.totalPrice).toFixed(2) : 'N/A'}</td>
                    <td>${booking.status || 'N/A'}</td>
                    <td>
                        <button class="edit-booking-btn" data-booking='${JSON.stringify(booking)}'>Edit</button>
                        <button class="delete-booking-btn" data-id="${booking.id}">Delete</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error("Error fetching bookings:", error);
            bookingsTableBody.innerHTML = '<tr><td colspan="10">Error loading bookings. Please try again.</td></tr>';
            if(bookingActionMessageDiv) showMessage(bookingActionMessageDiv, 'Error loading bookings: ' + error.message, 'error');
        }
    }

    // --- Handle Booking Form Submission (Add/Update) ---
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (bookingFormMessage) {
                bookingFormMessage.textContent = '';
                bookingFormMessage.className = '';
            }

            const selectedCarOption = carSelectBooking.options[carSelectBooking.selectedIndex];
            const carMake = selectedCarOption ? selectedCarOption.dataset.carMake : '';
            const carModel = selectedCarOption ? selectedCarOption.dataset.carModel : '';

            // Ensure date/time values are converted to ISO strings (UTC)
            // datetime-local input directly gives a string that can be used to construct a Date object
            // which is then converted to ISOString
            const startDateISO = startDateInputBooking.value ? new Date(startDateInputBooking.value).toISOString() : null;
            const endDateISO = endDateInputBooking.value ? new Date(endDateInputBooking.value).toISOString() : null;

            const bookingData = {
                customerName: customerNameInputBooking.value.trim(),
                customerPhone: customerPhoneInput.value.trim(),
                customerEmail: customerEmailInput.value.trim(),
                carId: carSelectBooking.value, // This should be the unique car ID like "VF8-29A12345"
                carMake: carMake,
                carModel: carModel,
                pickupLocation: pickupLocationInput.value.trim(),
                startDate: startDateISO,
                endDate: endDateISO,
                paymentMethod: paymentMethodSelect.value,
                totalPrice: totalPriceInput.value ? parseFloat(totalPriceInput.value) : null,
                baseCost: baseCostInput.value ? parseFloat(baseCostInput.value) : null,
                servicesCost: servicesCostInput.value ? parseFloat(servicesCostInput.value) : null,
                depositAmount: depositAmountInput.value ? parseFloat(depositAmountInput.value) : null,
                status: bookingStatusSelectAdmin.value,
                notes: notesInputBooking.value.trim()
            };
            
            // Basic validation
            if (!bookingData.customerName || !bookingData.carId || !bookingData.startDate || !bookingData.endDate || bookingData.totalPrice === null) {
                showMessage(bookingFormMessage, 'Customer Name, Car, Start/End Dates, and Total Price are required.', 'error');
                return;
            }
            if (new Date(bookingData.endDate) <= new Date(bookingData.startDate)) {
                showMessage(bookingFormMessage, 'End date/time must be after start date/time.', 'error');
                return;
            }


            const editingBookingId = bookingIdFormInput.value; // This is the system ID (1, 2, 3...)
            let method = editingBookingId ? 'PUT' : 'POST';
            let url = editingBookingId ? `${ADMIN_BOOKINGS_API_URL}/${editingBookingId}` : ADMIN_BOOKINGS_API_URL;

            console.log("Submitting booking data:", bookingData, "Method:", method, "URL:", url); // DEBUG

            try {
                if(submitBookingBtn) {
                    submitBookingBtn.disabled = true;
                    submitBookingBtn.textContent = editingBookingId ? 'Updating...' : 'Adding...';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                });
                const result = await response.json();

                if (response.ok) {
                    showMessage(bookingFormMessage, result.message || (editingBookingId ? 'Booking updated successfully!' : 'Booking added successfully!'), 'success');
                    resetBookingForm();
                    fetchAndDisplayBookings();
                } else {
                    showMessage(bookingFormMessage, result.message || 'Operation failed. Please try again.', 'error');
                }
            } catch (error) { 
                console.error("Error submitting booking form:", error);
                showMessage(bookingFormMessage, 'Client-side error: ' + error.message, 'error');
            } finally {
                if(submitBookingBtn) {
                    submitBookingBtn.disabled = false;
                    submitBookingBtn.textContent = bookingIdFormInput.value ? 'Update Booking' : 'Add Booking';
                }
            }
        });
    }

    // --- Handle Edit and Delete Button Clicks in Table ---
    if (bookingsTableBody) {
        bookingsTableBody.addEventListener('click', async (event) => {
            const target = event.target;
            
            // Edit Booking
            if (target.classList.contains('edit-booking-btn')) {
                const bookingDataString = target.dataset.booking;
                if (!bookingDataString) {
                    console.error("Booking data not found on edit button.");
                    showMessage(bookingActionMessageDiv, "Error: Could not retrieve booking data for editing.", "error");
                    return;
                }
                try {
                    const bookingToEdit = JSON.parse(bookingDataString);
                    console.log("Editing booking:", bookingToEdit);

                    bookingIdFormInput.value = bookingToEdit.id; // System ID of the booking
                    customerNameInputBooking.value = bookingToEdit.customerName || '';
                    customerPhoneInput.value = bookingToEdit.customerPhone || '';
                    customerEmailInput.value = bookingToEdit.customerEmail || '';
                    
                    // Ensure car selection dropdown is populated before setting value
                    if (carSelectBooking.options.length <= 1) { // Only default option present
                        await loadCarsIntoBookingSelect(); // Wait for cars to load
                    }
                    carSelectBooking.value = bookingToEdit.carId || ''; // carId is the unique ID like "VF8-29A12345"

                    pickupLocationInput.value = bookingToEdit.pickupLocation || '';
                    // Format for datetime-local input: YYYY-MM-DDTHH:mm
                    startDateInputBooking.value = formatDateTimeForInput(bookingToEdit.startDate);
                    endDateInputBooking.value = formatDateTimeForInput(bookingToEdit.endDate);
                    
                    paymentMethodSelect.value = bookingToEdit.paymentMethod || 'Cash';
                    totalPriceInput.value = bookingToEdit.totalPrice !== undefined ? bookingToEdit.totalPrice : '';
                    baseCostInput.value = bookingToEdit.baseCost !== undefined ? bookingToEdit.baseCost : '';
                    servicesCostInput.value = bookingToEdit.servicesCost !== undefined ? bookingToEdit.servicesCost : '';
                    depositAmountInput.value = bookingToEdit.depositAmount !== undefined ? bookingToEdit.depositAmount : '';
                    bookingStatusSelectAdmin.value = bookingToEdit.status || 'Pending';
                    notesInputBooking.value = bookingToEdit.notes || '';
                    
                    if(submitBookingBtn) submitBookingBtn.textContent = 'Update Booking';
                    if(cancelEditBookingBtn) cancelEditBookingBtn.style.display = 'inline-block';
                    const addBookingSection = document.getElementById('add-booking-section');
                    if(addBookingSection) addBookingSection.scrollIntoView({ behavior: 'smooth' });

                } catch (e) {
                    console.error("Error parsing booking data for edit:", e);
                    showMessage(bookingActionMessageDiv, "Error: Could not load booking data for editing.", "error");
                }
            }

            // Delete Booking
            if (target.classList.contains('delete-booking-btn')) {
                const bookingIdToDelete = target.dataset.id; // System ID of the booking
                if (!bookingIdToDelete) {
                    showMessage(bookingActionMessageDiv, "Error: Booking ID not found for deletion.", "error");
                    return;
                }
                if (confirm(`Are you sure you want to delete booking ID: ${bookingIdToDelete}?`)) {
                    try {
                        target.disabled = true;
                        target.textContent = "Deleting...";
                        const response = await fetch(`${ADMIN_BOOKINGS_API_URL}/${bookingIdToDelete}`, {
                            method: 'DELETE',
                        });
                        const result = await response.json();
                        if (response.ok) {
                            showMessage(bookingActionMessageDiv, result.message || 'Booking deleted successfully!', 'success');
                            fetchAndDisplayBookings(); 
                        } else {
                            showMessage(bookingActionMessageDiv, result.message || 'Error deleting booking.', 'error');
                        }
                    } catch (error) { 
                        console.error("Error deleting booking:", error);
                        showMessage(bookingActionMessageDiv, 'Client-side error: ' + error.message, 'error');
                    } finally {
                        target.disabled = false;
                        target.textContent = "Delete";
                    }
                }
            }
        });
    }
    
    // --- Reset Booking Form ---
    function resetBookingForm(){
        if(bookingForm) bookingForm.reset();
        if(bookingIdFormInput) bookingIdFormInput.value = '';
        if(submitBookingBtn) submitBookingBtn.textContent = 'Add Booking';
        if(cancelEditBookingBtn) cancelEditBookingBtn.style.display = 'none';
        // Reset selects to default or first option
        if(carSelectBooking) carSelectBooking.value = "";
        if(paymentMethodSelect) paymentMethodSelect.value = "Cash";
        if(bookingStatusSelectAdmin) bookingStatusSelectAdmin.value = "Pending";
        if(customerNameInputBooking) customerNameInputBooking.focus();
    }
    
    if(cancelEditBookingBtn) {
        cancelEditBookingBtn.addEventListener('click', resetBookingForm);
    }

    // --- Initial Data Load ---
    async function initializePage() {
        console.log("Initializing Admin Bookings Page..."); // DEBUG
        await loadCarsIntoBookingSelect(); // Load cars first
        await fetchAndDisplayBookings();   // Then load bookings
    }

    initializePage();
});