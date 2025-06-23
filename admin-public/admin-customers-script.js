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
            const response = await fetch(ADMIN_CUSTOMERS_API_URL);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const customers = await response.json(); // Server will send customers without passwords
            customersTableBody.innerHTML = ''; // Clear existing rows

            if (customers.length === 0) {
                customersTableBody.innerHTML = '<tr><td colspan="6">No customers found.</td></tr>';
                return;
            }

            customers.forEach(customer => {
                const row = customersTableBody.insertRow();
                row.innerHTML = `
                    <td data-label="ID">${customer.id}</td>
                    <td data-label="Name">${customer.name || 'N/A'}</td>
                    <td data-label="Phone">${customer.phone || 'N/A'}</td>
                    <td data-label="Email">${customer.email || 'N/A'}</td>
                    <td data-label="Registered At">${customer.registeredAt ? new Date(customer.registeredAt).toLocaleString() : 'N/A'}</td>
                    <td data-label="Actions">
                        <button class="edit-btn" data-customer='${JSON.stringify(customer)}'><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-btn" data-id="${customer.id}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });
        } catch (error) {
            console.error("Error fetching customers:", error);
            customersTableBody.innerHTML = '<tr><td colspan="6">Error loading customers. Please try again.</td></tr>';
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

    // --- Handle Edit and Delete Button Clicks in Table ---
    if (customersTableBody) {
        customersTableBody.addEventListener('click', async (event) => {
            const target = event.target;

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
                    console.log("Editing customer:", customerToEdit);

                    // 1. Switch to form view first
                    showView('form');

                    // 2. Populate form fields
                    customerIdFormInput.value = customerToEdit.id;
                    customerNameInput.value = customerToEdit.name || '';
                    customerPhoneInput.value = customerToEdit.phone || '';
                    customerEmailInput.value = customerToEdit.email || '';
                    customerPasswordInput.value = ''; // Always clear password field for security (never pre-fill passwords)

                    // 3. Update submit button text
                    if(submitCustomerBtn) submitCustomerBtn.textContent = 'Update Customer';
                    // The cancel button display is handled by showView('form')

                } catch (e) {
                    console.error("Error parsing customer data for edit:", e);
                    showMessage(actionMessageDiv, "Error: Could not load customer data for editing.", "error");
                }
            }

            // Delete Customer
            if (target.classList.contains('delete-btn')) {
                const customerIdToDelete = target.dataset.id;
                if (!customerIdToDelete) {
                     showMessage(actionMessageDiv, "Error: Customer ID not found for deletion.", "error");
                     return;
                }
                if (confirm(`Are you sure you want to delete customer ID: ${customerIdToDelete}?`)) {
                    try {
                        target.disabled = true;
                        target.textContent = "Deleting...";
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
                        target.textContent = "Delete";
                    }
                }
            }
        });
    }

    // --- Reset Customer Form ---
    function resetCustomerForm(){
        if(customerForm) customerForm.reset();
        if(customerIdFormInput) customerIdFormInput.value = '';
        if(submitCustomerBtn) submitCustomerBtn.textContent = 'Add Customer';
        // The display of the cancel button is handled by showView()
        
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