// admin-public/admin-promotions-script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Promotions Script Initializing...");

    // --- DOM Elements ---
    const promotionsTableBody = document.getElementById('promotions-table-body');
    const actionMessageDiv = document.getElementById('action-message'); // Message for table actions

    const promotionForm = document.getElementById('promotion-form');
    const promotionCodeFormHidden = document.getElementById('promotion-code-form-hidden'); // Hidden input for promo code when editing
    const promoCodeInput = document.getElementById('promo-code');
    const promoDescriptionInput = document.getElementById('promo-description');
    const discountTypeSelect = document.getElementById('discount-type');
    const discountValueInput = document.getElementById('discount-value');
    const minRentalDaysInput = document.getElementById('min-rental-days');
    const maxRentalDaysInput = document.getElementById('max-rental-days');
    const minTotalPriceInput = document.getElementById('min-total-price');
    const usageLimitInput = document.getElementById('usage-limit');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const isActiveSelect = document.getElementById('is-active');
    
    const applicableMakesCheckboxesContainer = document.getElementById('applicable-makes-checkboxes');
    const applicableLocationsCheckboxes = document.querySelectorAll('input[name="applicableLocations"]');

    const submitPromotionBtn = document.getElementById('submit-promotion-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const formMessageDiv = document.getElementById('form-message'); // Message for form actions

    // NEW DOM Elements for view switching
    const listViewWrapper = document.getElementById('list-view-wrapper');
    const formViewWrapper = document.getElementById('form-view-wrapper');
    const showAddFormButton = document.getElementById('show-add-form-btn'); // The "Add" button in the list view

    const ADMIN_PROMOTIONS_API_URL = '/admin/promotions';
    const ADMIN_CARS_API_URL = '/admin/cars'; // To fetch car makes for checkboxes

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

    // Function to switch between list view and form view
    function showView(viewId) {
        if (viewId === 'list') {
            listViewWrapper.classList.remove('hidden');
            formViewWrapper.classList.add('hidden');
            if(formMessageDiv) {
                formMessageDiv.textContent = '';
                formMessageDiv.className = '';
            }
            if(actionMessageDiv) {
                actionMessageDiv.textContent = '';
                actionMessageDiv.className = '';
            }
            if(cancelEditButton) cancelEditButton.style.display = 'none';
        } else if (viewId === 'form') {
            listViewWrapper.classList.add('hidden');
            formViewWrapper.classList.remove('hidden');
            if(actionMessageDiv) {
                actionMessageDiv.textContent = '';
                actionMessageDiv.className = '';
            }
            if(formMessageDiv) {
                formMessageDiv.textContent = '';
                formMessageDiv.className = '';
            }
            if(cancelEditButton) cancelEditButton.style.display = 'inline-block';
        }
        window.scrollTo(0, 0); // Scroll to top
    }

    // Format Date for input[type="date"] (YYYY-MM-DD)
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }
    // Format Date for display
    function formatDateForDisplay(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    }

    // --- Load Car Makes for Checkboxes ---
    async function loadCarMakesForCheckboxes() {
        if (!applicableMakesCheckboxesContainer) return;
        try {
            const response = await fetch(ADMIN_CARS_API_URL);
            if (!response.ok) throw new Error('Failed to load car makes.');
            const cars = await response.json();
            
            const uniqueMakes = [...new Set(cars.map(car => car.make))].sort();

            applicableMakesCheckboxesContainer.innerHTML = '';
            uniqueMakes.forEach(make => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" name="applicableCarMakes" value="${make}"> ${make}`;
                applicableMakesCheckboxesContainer.appendChild(label);
            });
        } catch (error) {
            console.error("Error loading car makes:", error);
            showMessage(formMessageDiv, 'Error loading car makes: ' + error.message, 'error');
        }
    }

    // --- Fetch and Display Promotions ---
    async function fetchAndDisplayPromotions() {
        if (!promotionsTableBody) return;
        try {
            const response = await fetch(ADMIN_PROMOTIONS_API_URL);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const promotions = await response.json();
            promotionsTableBody.innerHTML = ''; // Clear existing rows

            if (promotions.length === 0) {
                promotionsTableBody.innerHTML = '<tr><td colspan="11">No promotions found.</td></tr>';
                return;
            }

            promotions.forEach(promo => {
                const row = promotionsTableBody.insertRow();
                const discountDisplay = promo.discountType === 'percentage' 
                                      ? `${promo.discountValue}%` 
                                      : `$${Number(promo.discountValue).toFixed(2)}`;
                const appliesTo = [];
                if (promo.applicableCarMakes && promo.applicableCarMakes.length > 0) {
                    appliesTo.push(`Makes: ${promo.applicableCarMakes.join(', ')}`);
                }
                if (promo.applicableLocations && promo.applicableLocations.length > 0) {
                    appliesTo.push(`Locations: ${promo.applicableLocations.join(', ')}`);
                }
                if (appliesTo.length === 0) appliesTo.push('All');

                const statusClass = promo.isActive ? 'status-active' : 'status-deactive';
                const statusText = promo.isActive ? 'Active' : 'Inactive';

                row.innerHTML = `
                    <td data-label="Code">${promo.code}</td>
                    <td data-label="Description">${promo.description || 'N/A'}</td>
                    <td data-label="Discount">${discountDisplay}</td>
                    <td data-label="Applies To">${appliesTo.join(' | ')}</td>
                    <td data-label="Min Days">${promo.minRentalDays || 'N/A'}</td>
                    <td data-label="Min Total">$${promo.minTotalPrice !== undefined ? Number(promo.minTotalPrice).toFixed(2) : 'N/A'}</td>
                    <td data-label="Start Date">${formatDateForDisplay(promo.startDate)}</td>
                    <td data-label="End Date">${formatDateForDisplay(promo.endDate)}</td>
                    <td data-label="Active"><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td data-label="Used">${promo.usedCount || 0}/${promo.usageLimit || '∞'}</td>
                    <td data-label="Actions">
                        <button class="edit-btn" data-code="${promo.code}"><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-btn" data-code="${promo.code}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });
        } catch (error) {
            console.error("Error fetching promotions:", error);
            promotionsTableBody.innerHTML = '<tr><td colspan="11">Error loading promotions. Please try again.</td></tr>';
            showMessage(actionMessageDiv, 'Error loading promotions: ' + error.message, 'error');
        }
    }

    // --- Handle Promotion Form Submission (Add/Update) ---
    if (promotionForm) {
        promotionForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (formMessageDiv) {
                formMessageDiv.textContent = '';
                formMessageDiv.className = '';
            }

            // Get selected car makes
            const selectedCarMakes = Array.from(document.querySelectorAll('input[name="applicableCarMakes"]:checked'))
                                       .map(cb => cb.value);
            // Get selected locations
            const selectedLocations = Array.from(applicableLocationsCheckboxes)
                                           .filter(cb => cb.checked)
                                           .map(cb => cb.value);

            const promotionData = {
                code: promoCodeInput.value.trim(),
                description: promoDescriptionInput.value.trim(),
                discountType: discountTypeSelect.value,
                discountValue: discountValueInput.value ? parseFloat(discountValueInput.value) : 0,
                applicableCarMakes: selectedCarMakes,
                applicableLocations: selectedLocations,
                minRentalDays: minRentalDaysInput.value ? parseInt(minRentalDaysInput.value) : null,
                maxRentalDays: maxRentalDaysInput.value ? parseInt(maxRentalDaysInput.value) : null,
                minTotalPrice: minTotalPriceInput.value ? parseFloat(minTotalPriceInput.value) : null,
                usageLimit: usageLimitInput.value ? parseInt(usageLimitInput.value) : null,
                startDate: startDateInput.value,
                endDate: endDateInput.value,
                isActive: isActiveSelect.value === 'true'
            };

            // Basic frontend validation
            if (!promotionData.code || !promotionData.discountType || promotionData.discountValue === null || !promotionData.startDate || !promotionData.endDate) {
                showMessage(formMessageDiv, 'Please fill in all required fields (Code, Discount Type, Discount Value, Start/End Dates).', 'error');
                return;
            }
            if (new Date(promotionData.endDate) < new Date(promotionData.startDate)) {
                showMessage(formMessageDiv, 'End Date must be on or after Start Date.', 'error');
                return;
            }
            if (promotionData.discountType === 'percentage' && (promotionData.discountValue < 0 || promotionData.discountValue > 100)) {
                showMessage(formMessageDiv, 'Percentage discount value must be between 0 and 100.', 'error');
                return;
            }

            const editingPromoCode = promotionCodeFormHidden.value; // Use the hidden input for the original code
            let method = editingPromoCode ? 'PUT' : 'POST';
            let url = editingPromoCode ? `${ADMIN_PROMOTIONS_API_URL}/${encodeURIComponent(editingPromoCode)}` : ADMIN_PROMOTIONS_API_URL;

            console.log("Submitting promotion data:", promotionData, "Method:", method, "URL:", url);

            try {
                if(submitPromotionBtn) {
                    submitPromotionBtn.disabled = true;
                    submitPromotionBtn.textContent = editingPromoCode ? 'Updating...' : 'Adding...';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(promotionData)
                });
                const result = await response.json();

                if (response.ok) {
                    showMessage(formMessageDiv, result.message || (editingPromoCode ? 'Promotion updated successfully!' : 'Promotion added successfully!'), 'success');
                    resetPromotionForm();
                    await fetchAndDisplayPromotions();
                    showView('list'); // Switch back to list view after successful operation
                } else {
                    showMessage(formMessageDiv, result.message || 'Operation failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error("Error submitting promotion form:", error);
                showMessage(formMessageDiv, 'Client-side error: ' + error.message, 'error');
            } finally {
                if(submitPromotionBtn) {
                    submitPromotionBtn.disabled = false;
                    submitPromotionBtn.textContent = promotionCodeFormHidden.value ? 'Update Promotion' : 'Add Promotion';
                }
            }
        });
    }

    // --- Handle Edit and Delete Button Clicks in Table ---
    if (promotionsTableBody) {
        promotionsTableBody.addEventListener('click', async (event) => {
            const target = event.target.closest('button');

            if (!target) return;

            // Edit Promotion
            if (target.classList.contains('edit-btn')) {
                const promoCodeToEdit = target.dataset.code;
                if (!promoCodeToEdit) {
                    console.error("Promotion code not found on edit button.");
                    showMessage(actionMessageDiv, "Error: Could not retrieve promotion data for editing.", "error");
                    return;
                }
                try {
                    const response = await fetch(`${ADMIN_PROMOTIONS_API_URL}/${encodeURIComponent(promoCodeToEdit)}`);
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    const promotionToEdit = await response.json();

                    showView('form');

                    promotionCodeFormHidden.value = promotionToEdit.code; // Store original code for PUT request
                    promoCodeInput.value = promotionToEdit.code || '';
                    promoCodeInput.disabled = true; // Prevent changing code during edit
                    promoDescriptionInput.value = promotionToEdit.description || '';
                    discountTypeSelect.value = promotionToEdit.discountType || 'percentage';
                    discountValueInput.value = promotionToEdit.discountValue;
                    minRentalDaysInput.value = promotionToEdit.minRentalDays || '';
                    maxRentalDaysInput.value = promotionToEdit.maxRentalDays || '';
                    minTotalPriceInput.value = promotionToEdit.minTotalPrice || '';
                    usageLimitInput.value = promotionToEdit.usageLimit || '';
                    startDateInput.value = formatDateForInput(promotionToEdit.startDate);
                    endDateInput.value = formatDateForInput(promotionToEdit.endDate);
                    isActiveSelect.value = String(promotionToEdit.isActive);

                    // Populate applicable car makes checkboxes
                    const makesCheckboxes = document.querySelectorAll('input[name="applicableCarMakes"]');
                    makesCheckboxes.forEach(cb => {
                        cb.checked = promotionToEdit.applicableCarMakes && promotionToEdit.applicableCarMakes.includes(cb.value);
                    });
                    // Populate applicable locations checkboxes
                    applicableLocationsCheckboxes.forEach(cb => {
                        cb.checked = promotionToEdit.applicableLocations && promotionToEdit.applicableLocations.includes(cb.value);
                    });

                    if(submitPromotionBtn) submitPromotionBtn.textContent = 'Update Promotion';
                    const promotionFormTitle = document.getElementById('promotion-form-title');
                    if (promotionFormTitle) promotionFormTitle.textContent = 'Update Promotion';

                } catch (e) {
                    console.error("Error fetching or parsing promotion data for edit:", e);
                    showMessage(actionMessageDiv, "Error: Could not load promotion data for editing.", "error");
                }
            }

            // Delete Promotion
            else if (target.classList.contains('delete-btn')) {
                const promoCodeToDelete = target.dataset.code;
                if (!promoCodeToDelete) {
                     showMessage(actionMessageDiv, "Error: Promotion code not found for deletion.", "error");
                     return;
                }
                if (confirm(`Are you sure you want to delete promotion code: ${promoCodeToDelete}?`)) {
                    try {
                        target.disabled = true;
                        target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                        const response = await fetch(`${ADMIN_PROMOTIONS_API_URL}/${encodeURIComponent(promoCodeToDelete)}`, {
                            method: 'DELETE',
                        });
                        const result = await response.json();
                        if (response.ok) {
                            showMessage(actionMessageDiv, result.message || 'Promotion deleted successfully!', 'success');
                            fetchAndDisplayPromotions();
                        } else {
                            showMessage(actionMessageDiv, result.message || 'Error deleting promotion.', 'error');
                        }
                    } catch (error) {
                        console.error("Error deleting promotion:", error);
                        showMessage(actionMessageDiv, 'Client-side error: ' + error.message, 'error');
                    } finally {
                        target.disabled = false;
                        target.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    }
                }
            }
        });
    }

    // --- Reset Promotion Form ---
    function resetPromotionForm(){
        if(promotionForm) promotionForm.reset();
        if(promotionCodeFormHidden) promotionCodeFormHidden.value = '';
        if(promoCodeInput) promoCodeInput.disabled = false; // Re-enable code input for new entry
        if(submitPromotionBtn) submitPromotionBtn.textContent = 'Add Promotion';

        const promotionFormTitle = document.getElementById('promotion-form-title');
        if (promotionFormTitle) promotionFormTitle.textContent = 'Add New Promotion';
        
        // Reset checkboxes
        document.querySelectorAll('input[name="applicableCarMakes"]').forEach(cb => cb.checked = false);
        applicableLocationsCheckboxes.forEach(cb => cb.checked = false);

        if(promoCodeInput) promoCodeInput.focus();
        if(formMessageDiv) {
            formMessageDiv.textContent = '';
            formMessageDiv.className = 'form-message-placeholder';
        }
    }

    // --- Event Listeners for view switching ---
    if (showAddFormButton) {
        showAddFormButton.addEventListener('click', () => {
            resetPromotionForm(); // Clear form before opening
            loadCarMakesForCheckboxes(); // Reload makes in case new cars were added
            showView('form'); // Show the form view
        });
    }

    if(cancelEditButton) {
        cancelEditButton.addEventListener('click', () => {
            resetPromotionForm(); // Clear form
            showView('list'); // Show the list view
        });
    }

    // --- Initial Data Load ---
    async function initializePage() {
        console.log("Initializing Admin Promotions Page...");
        await loadCarMakesForCheckboxes(); // Load car makes on initial load for the form
        await fetchAndDisplayPromotions(); // Then load promotions for the table
        showView('list'); // Default to showing the list view on page load
    }

    initializePage();
});