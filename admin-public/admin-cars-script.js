// admin-public/admin-cars-script.js
document.addEventListener('DOMContentLoaded', () => {
    const carsTableBody = document.getElementById('cars-table-body');
    const carForm = document.getElementById('car-form');

    const carRecordIdInput = document.getElementById('car-id-form');
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
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const formMessageDiv = document.getElementById('form-message'); // For messages related to the form (add/update)

    const ADMIN_API_URL = '/admin/cars';
    const PUBLIC_CARS_API_URL = '/api/cars'; // Used to fetch cars for display

    // --- Utility Function to display messages ---
    function showMessage(message, type = 'success', targetElement = formMessageDiv) {
        if (!targetElement) return;
        targetElement.textContent = message;
        targetElement.className = 'form-message-placeholder'; // Reset base class
        targetElement.classList.add(type); // Add success or error class

        setTimeout(() => {
            targetElement.textContent = '';
            targetElement.className = '';
        }, 4000); // Message visible for 4 seconds
    }

    // --- Fetch and Display Cars List ---
    async function fetchAndDisplayCars() {
        if (!carsTableBody) return;
        try {
            const response = await fetch(PUBLIC_CARS_API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const cars = await response.json();
            carsTableBody.innerHTML = ''; // Clear existing rows

            if (cars.length === 0) {
                carsTableBody.innerHTML = '<tr><td colspan="9">No cars found.</td></tr>';
                return;
            }

            cars.forEach(car => {
                const row = carsTableBody.insertRow();
                // Determine availability status for styling
                const availabilityStatusText = car.available ? 'Available' : 'Unavailable';
                const availabilityStatusClass = car.available ? 'status-available' : 'status-unavailable';

                row.innerHTML = `
                    <td data-label="ID">${car.id || 'N/A'}</td>
                    <td data-label="Make">${car.make || 'N/A'}</td>
                    <td data-label="Model">${car.model || 'N/A'}</td>
                    <td data-label="Year">${car.year || 'N/A'}</td>
                    <td data-label="Price/day">$${car.pricePerDay !== undefined ? car.pricePerDay : 'N/A'}</td>
                    <td data-label="Location">${car.location || 'N/A'}</td>
                    <td data-label="Body Type">${car.specifications?.bodyType || 'N/A'}</td>
                    <td data-label="Status">
                        <span class="status-badge ${availabilityStatusClass}">${availabilityStatusText}</span>
                    </td>
                    <td data-label="Actions">
                        <button class="edit-btn" data-car='${JSON.stringify(car)}'>Edit</button>
                        <button class="delete-btn" data-id="${car.id}">Delete</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error("Error fetching cars for admin table:", error);
            carsTableBody.innerHTML = '<tr><td colspan="9">Error loading cars. Please try again.</td></tr>';
            showMessage('Error loading cars: ' + error.message, 'error'); // Display error to user
        }
    }

    // --- Handle Form Submission (Add/Update Car) ---
    if (carForm) {
        carForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if(formMessageDiv) {
                formMessageDiv.textContent = '';
                formMessageDiv.className = '';
            }

            const selectedFeatures = [];
            featuresCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selectedFeatures.push(checkbox.value);
                }
            });

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

            // Basic validation
            if (!carData.id || !carData.make || !carData.model || isNaN(carData.year) || isNaN(carData.pricePerDay) || !carData.location) {
                showMessage('Please fill in all required fields (ID, Make, Model, Year, Price, Location).', 'error');
                return;
            }
            if (carData.pricePerDay < 0 || carData.seats < 1 || carData.year < 2000 || carData.year > new Date().getFullYear() + 1) {
                showMessage('Invalid input: Price must be non-negative, Seats must be positive, Year must be reasonable.', 'error');
                return;
            }

            const editingRecordId = carRecordIdInput.value;
            let method = editingRecordId ? 'PUT' : 'POST';
            let url = editingRecordId ? `${ADMIN_API_URL}/${encodeURIComponent(editingRecordId)}` : ADMIN_API_URL;

            console.log("Submitting car data:", carData, "Method:", method, "URL:", url, "Editing Record ID:", editingRecordId);

            try {
                if(submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = editingRecordId ? 'Updating...' : 'Adding...';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(carData),
                });

                const result = await response.json();

                if (response.ok) {
                    showMessage(result.message || (editingRecordId ? 'Car updated successfully!' : 'Car added successfully!'), 'success');
                    resetForm();
                    fetchAndDisplayCars();
                } else {
                    showMessage(result.message || 'Operation failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error submitting car form:', error);
                showMessage('Client-side error: ' + error.message, 'error');
            } finally {
                if(submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = carRecordIdInput.value ? 'Update Car' : 'Add Car';
                }
            }
        });
    }

    // --- Handle Edit and Delete Button Clicks in Table ---
    if (carsTableBody) {
        carsTableBody.addEventListener('click', async (event) => {
            const target = event.target;

            // Edit Car
            if (target.classList.contains('edit-btn')) {
                const carDataString = target.dataset.car;
                if (!carDataString) {
                    console.error("Car data not found on edit button's data-car attribute.");
                    showMessage("Error: Could not retrieve car data for editing.", "error");
                    return;
                }
                try {
                    const carToEdit = JSON.parse(carDataString);
                    console.log("Editing car:", carToEdit);

                    carRecordIdInput.value = carToEdit.id; // Set hidden ID field for PUT request

                    if(carUniqueIdInput) carUniqueIdInput.value = carToEdit.id || '';
                    if(makeInput) makeInput.value = carToEdit.make || '';
                    if(modelInput) modelInput.value = carToEdit.model || '';
                    if(yearInput) yearInput.value = carToEdit.year || '';
                    if(pricePerDayInput) pricePerDayInput.value = carToEdit.pricePerDay !== undefined ? carToEdit.pricePerDay : '';
                    if(imageUrlInput) imageUrlInput.value = carToEdit.imageUrl || '';
                    if(availableSelect) availableSelect.value = String(carToEdit.available); // Convert boolean to string for select
                    if(locationSelectCarForm) locationSelectCarForm.value = carToEdit.location || 'Hanoi';

                    if (carToEdit.specifications) {
                        if(bodyTypeSelect) bodyTypeSelect.value = carToEdit.specifications.bodyType || 'SUV';
                        if(transmissionSelect) transmissionSelect.value = carToEdit.specifications.transmission || 'AT';
                        if(fuelTypeSelect) fuelTypeSelect.value = carToEdit.specifications.fuelType || 'Petrol';
                        if(seatsInput) seatsInput.value = carToEdit.specifications.seats || 5;
                    } else {
                        // Set default values if specifications are missing
                        if(bodyTypeSelect) bodyTypeSelect.value = 'SUV';
                        if(transmissionSelect) transmissionSelect.value = 'AT';
                        if(fuelTypeSelect) fuelTypeSelect.value = 'Petrol';
                        if(seatsInput) seatsInput.value = 5;
                    }

                    featuresCheckboxes.forEach(checkbox => {
                        checkbox.checked = carToEdit.features ? carToEdit.features.includes(checkbox.value) : false;
                    });

                    if(submitButton) submitButton.textContent = 'Update Car';
                    if(cancelEditButton) cancelEditButton.style.display = 'inline-block';
                    const addCarSection = document.getElementById('add-car-section');
                    if (addCarSection) addCarSection.scrollIntoView({ behavior: 'smooth' });

                } catch (e) {
                    console.error("Error parsing car data for edit:", e);
                    showMessage("Error: Could not load car data for editing.", "error");
                }
            }

            // Delete Car
            if (target.classList.contains('delete-btn')) {
                const carIdToDelete = target.dataset.id;
                if (!carIdToDelete) {
                     showMessage("Error: Car ID not found for deletion.", "error");
                     return;
                }
                if (confirm(`Are you sure you want to delete car with ID: ${carIdToDelete}?`)) {
                    try {
                        target.disabled = true;
                        target.textContent = "Deleting...";
                        const response = await fetch(`${ADMIN_API_URL}/${encodeURIComponent(carIdToDelete)}`, {
                            method: 'DELETE',
                        });
                        const result = await response.json();
                        if (response.ok) {
                            showMessage(result.message || 'Car deleted successfully!', 'success');
                            fetchAndDisplayCars();
                        } else {
                            showMessage(result.message || 'Error deleting car.', 'error');
                        }
                    } catch (error) {
                        console.error("Error deleting car:", error);
                        showMessage('Client-side error: ' + error.message, 'error');
                    } finally {
                        target.disabled = false;
                        target.textContent = "Delete";
                    }
                }
            }
        });
    }

    // --- Reset Form ---
    function resetForm() {
        if(carForm) carForm.reset();
        if(carRecordIdInput) carRecordIdInput.value = '';
        if(submitButton) submitButton.textContent = 'Add Car';
        if(cancelEditButton) cancelEditButton.style.display = 'none';
        if(availableSelect) availableSelect.value = 'true';
        if(locationSelectCarForm) locationSelectCarForm.value = 'Hanoi';
        if(bodyTypeSelect) bodyTypeSelect.value = 'SUV';
        if(transmissionSelect) transmissionSelect.value = 'AT';
        if(fuelTypeSelect) fuelTypeSelect.value = 'Petrol';
        if(seatsInput) seatsInput.value = 5;
        featuresCheckboxes.forEach(checkbox => checkbox.checked = false);
        if(carUniqueIdInput) carUniqueIdInput.focus();
    }

    if(cancelEditButton) {
        cancelEditButton.addEventListener('click', resetForm);
    }

    // --- Initial Data Load ---
    fetchAndDisplayCars();
});