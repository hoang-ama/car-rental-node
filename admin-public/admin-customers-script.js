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
    const cancelEditCustomerBtn = document.getElementById('cancel-edit-customer-button');
    const formMessageDiv = document.getElementById('form-message'); // Message for form actions

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
        
        // Basic styling (assuming admin-style.css has these classes defined for visual feedback)
        element.style.padding = '10px';
        element.style.marginBottom = '15px';
        element.style.borderRadius = '4px';
        // These background/color/border styles are usually better handled purely by CSS classes:
        // element.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
        // element.style.color = type === 'success' ? '#155724' : '#721c24';
        // element.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`;

        setTimeout(() => {
            element.textContent = '';
            element.className = ''; // Remove all classes
            element.style.padding = '0';
            element.style.marginBottom = '0';
            // element.style.border = 'none'; // Only if you apply border via JS
            // element.style.backgroundColor = 'transparent'; // Only if you apply BG via JS
        }, 5000); // Message visible for 5 seconds
    }

    // --- Fetch and Display Customers ---
    async function fetchAndDisplayCustomers() {
        if (!customersTableBody) return;
        try {
            const response = await fetch(ADMIN_CUSTOMERS_API_URL);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const customers = await response.json(); // Server will send customers without passwords
            customersTableBody.innerHTML = '';

            if (customers.length === 0) {
                customersTableBody.innerHTML = '<tr><td colspan="6">No customers found.</td></tr>';
                return;
            }

            customers.forEach(customer => {
                const row = customersTableBody.insertRow();
                row.innerHTML = `
                    <td>${customer.id}</td>
                    <td>${customer.name || 'N/A'}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>${customer.email || 'N/A'}</td>
                    <td>${customer.registeredAt ? new Date(customer.registeredAt).toLocaleString() : 'N/A'}</td>
                    <td>
                        <button class="edit-btn" data-customer='${JSON.stringify(customer)}'>Edit</button>
                        <button class="delete-btn" data-id="${customer.id}">Delete</button>
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
                formMessageDiv.className = 'form-message-placeholder'; // Reset class to base
            }

            const customerData = {
                name: customerNameInput.value.trim(),
                phone: customerPhoneInput.value.trim(),
                email: customerEmailInput.value.trim(),
                password: customerPasswordInput.value // In real app: HASH THIS!
            };
            
            // Basic frontend validation
            if (!customerData.name || !customerData.phone || !customerData.email) {
                showMessage(formMessageDiv, 'Name, Phone, and Email are required.', 'error');
                return;
            }
            // Password validation for new customers
            const editingCustomerId = customerIdFormInput.value;
            if (!editingCustomerId && customerData.password === '') { // If adding a new customer and password is empty
                showMessage(formMessageDiv, 'Password is required for new customers.', 'error');
                return;
            }
            if (customerData.password !== '' && customerData.password.length < 6) { // If password is provided (for add or update) and too short
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

                    customerIdFormInput.value = customerToEdit.id; // Populate hidden ID field
                    customerNameInput.value = customerToEdit.name || '';
                    customerPhoneInput.value = customerToEdit.phone || '';
                    customerEmailInput.value = customerToEdit.email || '';
                    customerPasswordInput.value = ''; // Always clear password field for security (never pre-fill passwords)

                    if(submitCustomerBtn) submitCustomerBtn.textContent = 'Update Customer';
                    if(cancelEditCustomerBtn) cancelEditCustomerBtn.style.display = 'inline-block';
                    // Scroll to the form section
                    const addCustomerSection = document.getElementById('add-customer-section');
                    if (addCustomerSection) addCustomerSection.scrollIntoView({ behavior: 'smooth' });

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
                            fetchAndDisplayCustomers(); // Refresh the list
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
        if(customerForm) customerForm.reset(); // Resets all form fields to their initial state
        if(customerIdFormInput) customerIdFormInput.value = ''; // Clear hidden ID field
        if(submitCustomerBtn) submitCustomerBtn.textContent = 'Add Customer'; // Change button text back to Add
        if(cancelEditCustomerBtn) cancelEditCustomerBtn.style.display = 'none'; // Hide cancel button
        if(customerNameInput) customerNameInput.focus(); // Focus on the first input
        if(formMessageDiv) { // Clear any form-specific message
            formMessageDiv.textContent = '';
            formMessageDiv.className = 'form-message-placeholder';
        }
    }

    if(cancelEditCustomerBtn) {
        cancelEditCustomerBtn.addEventListener('click', resetCustomerForm);
    }

    // --- Initial Data Load ---
    fetchAndDisplayCustomers(); // Load customers when the page loads
});