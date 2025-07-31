// admin-public/admin-customers-script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Customers Script Initializing...");

    // --- DOM Elements ---
    const customersTableBody = document.getElementById('customers-table-body');
    const actionMessageDiv = document.getElementById('action-message'); // Message for table actions

    const customerForm = document.getElementById('customer-form');
    const customerIdFormInput = document.getElementById('customer-id-form'); // Hidden input for customer ID when editing
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerEmailInput = document.getElementById('customer-email');
    const customerPasswordInput = document.getElementById('customer-password'); // Password input

    const submitCustomerBtn = document.getElementById('submit-customer-button');
    const cancelEditCustomerBtn = document.getElementById('cancel-edit-customer-button'); // Renamed for consistency
    const formMessageDiv = document.getElementById('form-message'); // Message for form actions

    // NEW DOM Elements for view switching
    const listViewWrapper = document.getElementById('list-view-wrapper');
    const formViewWrapper = document.getElementById('form-view-wrapper');
    const showAddFormButton = document.getElementById('show-add-form-btn'); // The "Add" button in the list view

    const ADMIN_CUSTOMERS_API_URL = '/admin/customers';
    const ADMIN_BOOKINGS_API_URL = '/api/bookings'; // Assuming this is the correct endpoint for bookings

    // --- Utility Functions ---
    /**
     * Displays a message in a designated message div.
     * @param {HTMLElement} element The DOM element to display the message in.
     * @param {string} message The message text.
     * @param {string} type The type of message ('success' or 'error').
     */
    function showMessage(element, message, type = 'success') {
        if (!element) {
            console.warn("Attempted to show message on a null element:", message);
            return;
        }
        element.textContent = message;
        element.className = 'form-message-placeholder'; // Reset class to base
        element.classList.add(type); // Add 'success' or 'error' class

        setTimeout(() => {
            element.textContent = '';
            element.className = ''; // Remove all classes
        }, 5000); // Message visible for 5 seconds
    }

    // --- Function to switch between list view and form view ---
    function showView(viewId) {
        if (viewId === 'list') {
            listViewWrapper.classList.remove('hidden');
            formViewWrapper.classList.add('hidden');
            // Clear messages when switching back to list view
            if(formMessageDiv) {
                formMessageDiv.textContent = '';
                formMessageDiv.className = '';
            }
            if(actionMessageDiv) {
                actionMessageDiv.textContent = '';
                actionMessageDiv.className = '';
            }
            // Khi về list view, nút Cancel trong form phải ẩn đi
            if(cancelEditCustomerBtn) cancelEditCustomerBtn.style.display = 'none';
        } else if (viewId === 'form') {
            listViewWrapper.classList.add('hidden');
            formViewWrapper.classList.remove('hidden');
            // Clear messages when switching to form view
            if(actionMessageDiv) {
                actionMessageDiv.textContent = '';
                actionMessageDiv.className = '';
            }
            if(formMessageDiv) {
                formMessageDiv.textContent = '';
                formMessageDiv.className = '';
            }
            // Khi mở form view, nút Cancel phải hiện ra
            if(cancelEditCustomerBtn) cancelEditCustomerBtn.style.display = 'inline-block';
        }
        window.scrollTo(0, 0); // Scroll to top
    }

    // --- Fetch and Display Customers ---
    async function fetchAndDisplayCustomers() {
        if (!customersTableBody) return;
        try {
            const [customersResponse, bookingsResponse] = await Promise.all([
                fetch(ADMIN_CUSTOMERS_API_URL),
                fetch(ADMIN_BOOKINGS_API_URL)
            ]);

            if (!customersResponse.ok) throw new Error(`HTTP error! Status: ${customersResponse.status} for customers.`);
            if (!bookingsResponse.ok) throw new Error(`HTTP error! Status: ${bookingsResponse.status} for bookings.`);

            const customers = await customersResponse.json();
            const allBookings = await bookingsResponse.json();

            customersTableBody.innerHTML = '';

            if (customers.length === 0) {
                customersTableBody.innerHTML = '<tr><td colspan="7">No customers found.</td></tr>';
                return;
            }

            const customersWithBookings = new Set(allBookings.map(b => b.customerEmail));

            customers.forEach(customer => {
                const row = customersTableBody.insertRow();
                const hasBookings = customersWithBookings.has(customer.email);
                const bookingStatusText = hasBookings ? 'Already' : 'Not yet';
                const bookingStatusClass = hasBookings ? 'status-confirmed' : 'status-deactive';

                row.innerHTML = `
                    <td data-label="ID">${customer.id}</td>
                    <td data-label="Name">${customer.name || 'N/A'}</td>
                    <td data-label="Phone">${customer.phone || 'N/A'}</td>
                    <td data-label="Email">${customer.email || 'N/A'}</td>
                    <td data-label="Registered At">${customer.registeredAt ? new Date(customer.registeredAt).toLocaleString() : 'N/A'}</td>
                    <td data-label="Booking Status">
                        <span class="status-badge ${bookingStatusClass}">${bookingStatusText}</span>
                    </td>
                    <td data-label="Actions">
                        <button class="edit-btn" data-customer='${JSON.stringify(customer)}'><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-btn" data-id="${customer.id}"><i class="fas fa-trash-alt"></i></button>
                        <button class="view-bookings-btn" data-customer-id="${customer.id}" data-customer-email="${customer.email}"><i class="fas fa-list-alt"></i></button>
                    </td>
                `;
            });
        } catch (error) {
            console.error("Error fetching customers:", error);
            customersTableBody.innerHTML = '<tr><td colspan="7">Error loading customers. Please try again.</td></tr>';
            showMessage(actionMessageDiv, 'Error loading customers: ' + error.message, 'error');
        }
    }

    // --- Handle Customer Form Submission (Add/Update) ---
    if (customerForm) {
        customerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (formMessageDiv) {
                formMessageDiv.textContent = '';
                formMessageDiv.className = 'form-message-placeholder';
            }

            const customerData = {
                name: customerNameInput.value.trim(),
                phone: customerPhoneInput.value.trim(),
                email: customerEmailInput.value.trim(),
                password: customerPasswordInput.value // In a real app: HASH THIS!
            };

            // Basic frontend validation
            if (!customerData.name || !customerData.phone || !customerData.email) {
                showMessage(formMessageDiv, 'Name, Phone, and Email are required.', 'error');
                return;
            }
            const editingCustomerId = customerIdFormInput.value;
            if (!editingCustomerId && customerData.password === '') {
                showMessage(formMessageDiv, 'Password is required for new customers.', 'error');
                return;
            }
            if (customerData.password !== '' && customerData.password.length < 6) {
                showMessage(formMessageDiv, 'Password must be at least 6 characters long.', 'error');
                return;
            }
            // For PUT, if password is not changed, don't send it to prevent accidental empty password overwrites
            if (editingCustomerId && customerData.password === '') {
                delete customerData.password;
            }

            let method = editingCustomerId ? 'PUT' : 'POST';
            let url = editingCustomerId ? `${ADMIN_CUSTOMERS_API_URL}/${editingCustomerId}` : ADMIN_CUSTOMERS_API_URL;

            console.log("Submitting customer data:", customerData, "Method:", method, "URL:", url);

            try {
                if(submitCustomerBtn) {
                    submitCustomerBtn.disabled = true;
                    submitCustomerBtn.textContent = editingCustomerId ? 'Updating...' : 'Adding...';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(customerData)
                });
                const result = await response.json();

                if (response.ok) {
                    showMessage(formMessageDiv, result.message || (editingCustomerId ? 'Customer updated successfully!' : 'Customer added successfully!'), 'success');
                    resetCustomerForm();
                    fetchAndDisplayCustomers();
                    showView('list'); // Switch back to list view after successful operation
                } else {
                    showMessage(formMessageDiv, result.message || 'Operation failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error("Error submitting customer form:", error);
                showMessage(formMessageDiv, 'Client-side error: ' + error.message, 'error');
            } finally {
                if(submitCustomerBtn) {
                    submitCustomerBtn.disabled = false;
                    submitCustomerBtn.textContent = customerIdFormInput.value ? 'Update Customer' : 'Add Customer';
                }
            }
        });
    }

    // --- Handle Edit, Delete, and View Bookings Button Clicks in Table ---
    if (customersTableBody) {
        customersTableBody.addEventListener('click', async (event) => {
            const target = event.target.closest('button');

            if (!target) return;

            // Edit Customer
            if (target.classList.contains('edit-btn')) {
                const customerDataString = target.dataset.customer;
                if (!customerDataString) {
                    console.error("Customer data not found on edit button's data-customer attribute.");
                    showMessage(actionMessageDiv, "Error: Could not retrieve customer data for editing.", "error");
                    return;
                }
                try {
                    const customerToEdit = JSON.parse(customerDataString);

                    showView('form');

                    customerIdFormInput.value = customerToEdit.id;
                    customerNameInput.value = customerToEdit.name || '';
                    customerPhoneInput.value = customerToEdit.phone || '';
                    customerEmailInput.value = customerToEdit.email || '';
                    customerPasswordInput.value = '';

                    if(submitCustomerBtn) submitCustomerBtn.textContent = 'Update Customer';
                      // Update the <h2> title for editing a customer
                    const customerFormTitle = document.getElementById('customer-form-title');
                    if (customerFormTitle) customerFormTitle.textContent = 'Update Customer';
                } catch (e) {
                    console.error("Error parsing customer data for edit:", e);
                    showMessage(actionMessageDiv, "Error: Could not load customer data for editing.", "error");
                }
            }

            // Delete Customer
            else if (target.classList.contains('delete-btn')) {
                const customerIdToDelete = target.dataset.id;
                if (!customerIdToDelete) {
                     showMessage(actionMessageDiv, "Error: Customer ID not found for deletion.", "error");
                     return;
                }
                if (confirm(`Are you sure you want to delete customer ID: ${customerIdToDelete}?`)) {
                    try {
                        target.disabled = true;
                        target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                        const response = await fetch(`${ADMIN_CUSTOMERS_API_URL}/${encodeURIComponent(customerIdToDelete)}`, {
                            method: 'DELETE',
                        });
                        const result = await response.json();
                        if (response.ok) {
                            showMessage(actionMessageDiv, result.message || 'Customer deleted successfully!', 'success');
                            fetchAndDisplayCustomers();
                        } else {
                            showMessage(actionMessageDiv, result.message || 'Error deleting customer.', 'error');
                        }
                    } catch (error) {
                        console.error("Error deleting customer:", error);
                        showMessage(actionMessageDiv, 'Client-side error: ' + error.message, 'error');
                    } finally {
                        target.disabled = false;
                        target.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    }
                }
            }

            // NEW: View Bookings for Customer - REDIRECT TO DETAIL PAGE
            else if (target.classList.contains('view-bookings-btn')) {
                const customerId = target.dataset.customerId; // Get the customer ID (e.g., "customer_1")
                const customerEmail = target.dataset.customerEmail; // Get the customer email
                if (customerId && customerEmail) {
                    // Redirect to the new customer detail page, passing ID and Email
                    window.location.href = `admin-customer-detail.html?id=${customerId}&email=${encodeURIComponent(customerEmail)}`;
                } else {
                    showMessage(actionMessageDiv, "Error: Customer ID or email not found for viewing details.", "error");
                }
            }
        });
    }

    // --- Reset Customer Form ---
    function resetCustomerForm(){
        if(customerForm) customerForm.reset();
        if(customerIdFormInput) customerIdFormInput.value = '';
        if(submitCustomerBtn) submitCustomerBtn.textContent = 'Add Customer';

        // Update the <h2> title for adding a new customer
        const customerFormTitle = document.getElementById('customer-form-title');
        if (customerFormTitle) customerFormTitle.textContent = 'Add New Customer';
        
        if(customerNameInput) customerNameInput.focus();
        if(formMessageDiv) {
            formMessageDiv.textContent = '';
            formMessageDiv.className = 'form-message-placeholder';
        }
    }

    // --- Event Listeners for view switching ---
    if (showAddFormButton) {
        showAddFormButton.addEventListener('click', () => {
            resetCustomerForm(); // Clear form before opening
            showView('form'); // Show the form view
            // The submit button text is already set to 'Add Customer' by resetCustomerForm()
            // The cancel button display is handled by showView('form')
        });
    }

    if(cancelEditCustomerBtn) {
        cancelEditCustomerBtn.addEventListener('click', () => {
            resetCustomerForm(); // Clear form
            showView('list'); // Show the list view
        });
    }

    // --- Initial Data Load ---
    fetchAndDisplayCustomers();
    showView('list'); // Default to showing the list view on page load
});