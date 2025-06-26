// admin-public/admin-cars-script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const carsTableBody = document.getElementById('cars-table-body');
    const actionMessageDiv = document.getElementById('action-message'); // Message for table actions

    const carForm = document.getElementById('car-form');
    const carRecordIdInput = document.getElementById('car-id-form'); // Hidden input to store car ID for update
    const carUniqueIdInput = document.getElementById('car-unique-id');
    const makeInput = document.getElementById('make');
    const modelInput = document.getElementById('model');
    const yearInput = document.getElementById('year');
    const pricePerDayInput = document.getElementById('pricePerDay');
    const imageUrlInput = document.getElementById('imageUrl');
    const availableSelect = document.getElementById('available');
    const locationSelectCarForm = document.getElementById('location');

    const bodyTypeSelect = document.getElementById('bodyType');
    const transmissionSelect = document.getElementById('transmission');
    const fuelTypeSelect = document.getElementById('fuelType');
    const seatsInput = document.getElementById('seats');

    const featuresCheckboxes = document.querySelectorAll('input[name="features"]');

    const submitButton = document.getElementById('submit-car-button');
    const cancelButton = document.getElementById('cancel-edit-button');
    const formMessageDiv = document.getElementById('form-message'); // For messages related to the form (add/update)

    // NEW DOM Elements for view switching (assuming these IDs are in your HTML)
    const listViewWrapper = document.getElementById('list-view-wrapper');
    const formViewWrapper = document.getElementById('form-view-wrapper');
    const showAddFormButton = document.getElementById('show-add-form-btn'); // The "Add" button in the list view


    const ADMIN_API_URL = '/admin/cars';
    const ALL_CARS_API_URL = '/admin/cars'; // Use this API to fetch all cars, including unavailable ones

    // --- Utility Function to display messages ---
    /**
     * Displays a message in a designated message div.
     * @param {string} message The message text.
     * @param {string} type The type of message ('success' or 'error').
     * @param {HTMLElement} targetElement The DOM element to display the message in (defaults to formMessageDiv).
     */
    function showMessage(message, type = 'success', targetElement = formMessageDiv) {
        if (!targetElement) {
            console.warn("Attempted to show message on a null element:", message);
            return;
        }
        targetElement.textContent = message;
        targetElement.className = 'form-message-placeholder'; // Reset base class
        targetElement.classList.add(type); // Add success or error class

        // Clear message after 4 seconds
        setTimeout(() => {
            targetElement.textContent = '';
            targetElement.className = '';
        }, 4000);
    }

    // --- Function to switch between list view and form view ---
    /**
     * Switches the display between the list view and the form view.
     * @param {string} viewId 'list' to show the table, 'form' to show the add/edit form.
     */
    function showView(viewId) {
        if (viewId === 'list') {
            listViewWrapper.classList.remove('hidden');
            formViewWrapper.classList.add('hidden');
            // Clear all messages when switching back to list view
            if(formMessageDiv) {
                formMessageDiv.textContent = '';
                formMessageDiv.className = '';
            }
            if(actionMessageDiv) {
                actionMessageDiv.textContent = '';
                actionMessageDiv.className = '';
            }
            // Khi về list view, nút Cancel trong form phải ẩn đi
            if(cancelButton) cancelButton.style.display = 'none';
        } else if (viewId === 'form') {
            listViewWrapper.classList.add('hidden');
            formViewWrapper.classList.remove('hidden');
            // Clear all messages when switching to form view
            if(actionMessageDiv) {
                actionMessageDiv.textContent = '';
                actionMessageDiv.className = '';
            }
            if(formMessageDiv) {
                formMessageDiv.textContent = '';
                formMessageDiv.className = '';
            }
            // Khi mở form view, nút Cancel phải hiện ra
            if(cancelButton) cancelButton.style.display = 'inline-block';
        }
        window.scrollTo(0, 0); // Always scroll to top of the page when changing views
    }

    // --- Fetch and Display Cars List in the Table ---
    async function fetchAndDisplayCars() {
        if (!carsTableBody) return;
        try {
            // Change API endpoint to fetch all cars from /admin/cars
            const response = await fetch(ALL_CARS_API_URL); //
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const cars = await response.json();
            carsTableBody.innerHTML = '';

            if (cars.length === 0) {
                carsTableBody.innerHTML = '<tr><td colspan="10">No cars found.</td></tr>'; // Changed colspan to 10 for new Image column
                return;
            }

            cars.forEach(car => {
                const row = carsTableBody.insertRow();
                // Determine availability status text in Vietnamese
                const availabilityStatusText = car.available ? 'Available' : 'Unavailable'; //
                const availabilityStatusClass = car.available ? 'status-available' : 'status-unavailable';
// Ensure imageUrl starts with a '/' if it doesn't already
                // Some images in your cars.json might already have this, some might not.
                // It's safer to prepend '/' here if it's missing,
                // or ensure all images in cars.json start with 'assets/images/'
                // and then always add '/' at the beginning here.

                const carImageUrl = car.imageUrl;
                let finalImageUrl = '';

                // Check if the URL is already absolute or relative to public root
                if (carImageUrl.startsWith('http://') || carImageUrl.startsWith('https://') || carImageUrl.startsWith('/')) {
                    finalImageUrl = carImageUrl;
                } else {
                    // Assume it's relative to public, like "assets/images/cars/LuxA.jpg"
                    finalImageUrl = `/${carImageUrl}`; // Prepend '/'
                }

                // Fallback to placeholder if imageUrl is empty or invalid
                if (!finalImageUrl || finalImageUrl === '/') {
                    finalImageUrl = '/public/assets/images/placeholder-car.png'; // Direct path to a fallback placeholder
                }

                row.innerHTML = `
                    <td data-label="ID">${car.id || 'N/A'}</td>
                    <td data-label="Make">${car.make || 'N/A'}</td>
                    <td data-label="Model">${car.model || 'N/A'}</td>
                    <td data-label="Body Type">${car.specifications?.bodyType || 'N/A'}</td>
                    <td data-label="Year">${car.year || 'N/A'}</td>
                    <td data-label="Image">
                        <img src="${finalImageUrl}" alt="${car.make} ${car.model}" class="car-thumbnail">
                    </td>
                    <td data-label="Price/day">$${car.pricePerDay !== undefined ? car.pricePerDay : 'N/A'}</td>
                    <td data-label="Location">${car.location || 'N/A'}</td>                   
                    <td data-label="Status">
                        <span class="status-badge ${availabilityStatusClass}">${availabilityStatusText}</span>
                    </td>
                    <td data-label="Actions">
                        <button class="edit-btn" data-car='${JSON.stringify(car)}'><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-btn" data-id="${car.id}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });
        } catch (error) {
            console.error("Error fetching cars for admin table:", error);
            carsTableBody.innerHTML = '<tr><td colspan="10">Error loading cars. Please try again.</td></tr>'; // Changed colspan to 10
            showMessage('Error loading cars: ' + error.message, 'error', actionMessageDiv);
        }
    }

    // --- Handle Car Form Submission (Add or Update) ---
    if (carForm) {
        carForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission behavior

            // Clear previous form messages
            if(formMessageDiv) {
                formMessageDiv.textContent = '';
                formMessageDiv.className = '';
            }

            // Collect selected features from checkboxes
            const selectedFeatures = [];
            featuresCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selectedFeatures.push(checkbox.value);
                }
            });

            // Create a car data object from form inputs
            const carData = {
                id: carUniqueIdInput.value.trim(),
                make: makeInput.value.trim(),
                model: modelInput.value.trim(),
                year: parseInt(yearInput.value),
                pricePerDay: parseFloat(pricePerDayInput.value),
                imageUrl: imageUrlInput.value.trim(),
                available: availableSelect.value === 'true', // Convert string "true"/"false" to boolean
                location: locationSelectCarForm.value,
                specifications: {
                    bodyType: bodyTypeSelect.value,
                    transmission: transmissionSelect.value,
                    fuelType: fuelTypeSelect.value,
                    seats: parseInt(seatsInput.value)
                },
                features: selectedFeatures
            };

            // Perform basic frontend validation
            if (!carData.id || !carData.make || !carData.model || isNaN(carData.year) || isNaN(carData.pricePerDay) || !carData.location) {
                showMessage('Please fill in all required fields (ID, Make, Model, Year, Price, Location).', 'error');
                return;
            }
            if (carData.pricePerDay < 0 || carData.seats < 1 || carData.year < 2000 || carData.year > new Date().getFullYear() + 1) {
                showMessage('Invalid input: Price must be non-negative, Seats must be positive, Year must be reasonable.', 'error');
                return;
            }

            // Determine if it's an 'Add' or 'Update' operation based on carRecordIdInput
            const editingRecordId = carRecordIdInput.value;
            let method = editingRecordId ? 'PUT' : 'POST';
            let url = editingRecordId ? `${ADMIN_API_URL}/${encodeURIComponent(editingRecordId)}` : ADMIN_API_URL;

            console.log("Submitting car data:", carData, "Method:", method, "URL:", url, "Editing Record ID:", editingRecordId);

            try {
                // Disable submit button and change text while processing
                if(submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = editingRecordId ? 'Updating...' : 'Adding...';
                }

                // Send the data to the server
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(carData),
                });

                const result = await response.json(); // Parse the server response

                if (response.ok) {
                    // Show success message, reset form, refresh list, and switch to list view
                    showMessage(result.message || (editingRecordId ? 'Car updated successfully!' : 'Car added successfully!'), 'success');
                    resetForm();
                    await fetchAndDisplayCars(); // Await refresh to ensure updated data
                    showView('list'); // Switch back to list view after successful operation
                } else {
                    // Show error message from server
                    showMessage(result.message || 'Operation failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error submitting car form:', error);
                showMessage('Client-side error: ' + error.message, 'error');
            } finally {
                // Re-enable submit button and revert text
                if(submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = carRecordIdInput.value ? 'Update Car' : 'Add Car';
                }
            }
        });
    }

    // --- Handle Edit and Delete Button Clicks in the Table ---
    if (carsTableBody) {
        carsTableBody.addEventListener('click', async (event) => {
            const target = event.target; // The element that was clicked

            // Logic for Edit Car button
            if (target.classList.contains('edit-btn')) {
                const carDataString = target.dataset.car; // Get the JSON string of car data from data-car attribute
                if (!carDataString) {
                    console.error("Car data not found on edit button's data-car attribute.");
                    showMessage("Error: Could not retrieve car data for editing.", "error", actionMessageDiv);
                    return;
                }
                try {
                    const carToEdit = JSON.parse(carDataString); // Parse the car data object
                    console.log("Editing car:", carToEdit);

                    // 1. Switch to form view first (this hides the list and shows the form)
                    showView('form');

                    // 2. Populate the hidden car ID input (used to determine 'Update' operation)
                    carRecordIdInput.value = carToEdit.id;

                    // 3. Populate all form fields with the car's data
                    if(carUniqueIdInput) carUniqueIdInput.value = carToEdit.id || '';
                    if(makeInput) makeInput.value = carToEdit.make || '';
                    if(modelInput) modelInput.value = carToEdit.model || '';
                    if(yearInput) yearInput.value = carToEdit.year || '';
                    if(pricePerDayInput) pricePerDayInput.value = carToEdit.pricePerDay !== undefined ? carToEdit.pricePerDay : '';
                    if(imageUrlInput) imageUrlInput.value = carToEdit.imageUrl || '';
                    // Convert boolean `available` to string "true" or "false" for select element
                    if(availableSelect) availableSelect.value = String(carToEdit.available);
                    if(locationSelectCarForm) locationSelectCarForm.value = carToEdit.location || 'Hanoi';

                    // Populate specifications fields
                    if (carToEdit.specifications) {
                        if(bodyTypeSelect) bodyTypeSelect.value = carToEdit.specifications.bodyType || 'SUV';
                        if(transmissionSelect) transmissionSelect.value = carToEdit.specifications.transmission || 'AT';
                        if(fuelTypeSelect) fuelTypeSelect.value = carToEdit.specifications.fuelType || 'Petrol';
                        if(seatsInput) seatsInput.value = carToEdit.specifications.seats || 5;
                    } else {
                        // Set default values if specifications object is missing
                        if(bodyTypeSelect) bodyTypeSelect.value = 'SUV';
                        if(transmissionSelect) transmissionSelect.value = 'AT';
                        if(fuelTypeSelect) fuelTypeSelect.value = 'Petrol';
                        if(seatsInput) seatsInput.value = 5;
                    }

                    // Populate features checkboxes
                    featuresCheckboxes.forEach(checkbox => {
                        // Check the box if its value is present in the carToEdit.features array
                        checkbox.checked = carToEdit.features ? carToEdit.features.includes(checkbox.value) : false;
                    });

                    // 4. Update submit button text and show cancel button
                    if(submitButton) submitButton.textContent = 'Update Car';
                    
                    // 5. Update the <h2> title for editing a car
                const carFormTitle = document.getElementById('car-form-title');
                if (carFormTitle) carFormTitle.textContent = 'Update Car';

                } catch (e) {
                    console.error("Error parsing car data for edit:", e);
                    showMessage("Error: Could not load car data for editing.", "error", actionMessageDiv);
                }
            }

            // Logic for Delete Car button
            if (target.classList.contains('delete-btn')) {
                const carIdToDelete = target.dataset.id; // Get the car ID to delete
                if (!carIdToDelete) {
                     showMessage("Error: Car ID not found for deletion.", "error", actionMessageDiv);
                     return;
                }
                // Confirm deletion with the user
                if (confirm(`Are you sure you want to delete car with ID: ${carIdToDelete}?`)) {
                    try {
                        target.disabled = true; // Disable button during deletion
                        target.textContent = "Deleting..."; // Change button text

                        // Send DELETE request to the server
                        const response = await fetch(`${ADMIN_API_URL}/${encodeURIComponent(carIdToDelete)}`, {
                            method: 'DELETE',
                        });
                        const result = await response.json(); // Parse server response

                        if (response.ok) {
                            // Show success message and refresh the car list
                            showMessage(result.message || 'Car deleted successfully!', 'success', actionMessageDiv);
                            fetchAndDisplayCars();
                        } else {
                            // Show error message from server
                            showMessage(result.message || 'Error deleting car.', 'error', actionMessageDiv);
                        }
                    } catch (error) {
                        console.error("Error deleting car:", error);
                        showMessage('Client-side error: ' + error.message, 'error', actionMessageDiv);
                    } finally {
                        // Re-enable button and revert text regardless of success/failure
                        target.disabled = false;
                        target.textContent = "Delete";
                    }
                }
            }
        });
    }

    // --- Reset Form Function (used for both Add and Cancel) ---

function resetForm() {
    if (carForm) carForm.reset(); // Resets all form fields
    if (carRecordIdInput) carRecordIdInput.value = ''; // Clear hidden ID
    if (submitButton) submitButton.textContent = 'Add Car'; // Reset submit button text

    // Update the <h2> title for adding a new car
    const carFormTitle = document.getElementById('car-form-title');
    if (carFormTitle) carFormTitle.textContent = 'Add New Car';

    // Reset select dropdowns to their default/first options
    if (availableSelect) availableSelect.value = 'true';
    if (locationSelectCarForm) locationSelectCarForm.value = 'Hanoi';
    if (bodyTypeSelect) bodyTypeSelect.value = 'SUV';
    if (transmissionSelect) transmissionSelect.value = 'AT';
    if (fuelTypeSelect) fuelTypeSelect.value = 'Petrol';
    if (seatsInput) seatsInput.value = 5;

    // Uncheck all feature checkboxes
    featuresCheckboxes.forEach(checkbox => (checkbox.checked = false));

    // Set focus to the first input field
    if (carUniqueIdInput) carUniqueIdInput.focus();
}

    // --- Event Listeners for view switching buttons ---
    // Event listener for the "Add" button in the list view
    if (showAddFormButton) {
        showAddFormButton.addEventListener('click', () => {
            resetForm(); // Clear form fields before showing for a new entry
            showView('form'); // Switch to the form view
            // The submit button text is already set to 'Add Car' by resetForm()
            // The cancel button display is handled by showView('form')
        });
    }

    // Event listener for the "Cancel" button in the form view
    if(cancelButton) {
        cancelButton.addEventListener('click', () => {
            resetForm(); // Clear form fields on cancel
            showView('list'); // Switch back to the list view
        });
    }

    // --- Initial Load Logic ---
    // Fetch and display cars when the page first loads
    fetchAndDisplayCars();
    // Default to showing the list view on page load
    showView('list');
});