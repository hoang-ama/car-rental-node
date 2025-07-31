// admin-public/admin-settings-script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Settings Script Initializing...");

    // --- DOM Elements ---
    const generalSettingsForm = document.getElementById('general-settings-form');
    const systemNameInput = document.getElementById('system-name');
    const defaultPickupTimeInput = document.getElementById('default-pickup-time');
    const defaultReturnTimeInput = document.getElementById('default-return-time'); // ADDED: New element
    const generalSettingsMessage = document.getElementById('general-settings-message');

    const carConfigForm = document.getElementById('car-config-form');
    const addMakeModelBtn = document.getElementById('add-make-model-btn');
    const newMakeModelInput = document.getElementById('new-make-model');
    const makeModelListDiv = document.getElementById('make-model-list');
    const addCarFeatureBtn = document.getElementById('add-car-feature-btn');
    const newCarFeatureInput = document.getElementById('new-car-feature');
    const carFeatureListDiv = document.getElementById('car-feature-list');
    const carConfigMessage = document.getElementById('car-config-message');

    const servicesForm = document.getElementById('services-form');
    const addServiceBtn = document.getElementById('add-service-btn');
    const newServiceNameInput = document.getElementById('new-service-name');
    const newServicePriceInput = document.getElementById('new-service-price');
    const additionalServicesTableBody = document.getElementById('additional-services-table-body');
    const servicesMessage = document.getElementById('services-message');

    // --- APIs ---
    const ADMIN_SETTINGS_API_URL = '/admin/settings';
    const ADMIN_ADDITIONAL_SERVICES_API_URL = '/admin/additional-services';
    const ADMIN_CARS_API_URL = '/admin/cars'; // For getting existing makes/features (indirectly)

    // --- Utility Functions ---
    function showMessage(element, message, type = 'success') {
        if (!element) {
            console.warn("Attempted to show message on a null element:", message);
            return;
        }
        element.textContent = message;
        element.className = 'form-message-placeholder';
        element.classList.add(type);
        setTimeout(() => {
            element.textContent = '';
            element.className = '';
        }, 5000);
    }

    // --- General Settings ---
    async function loadGeneralSettings() {
        try {
            const response = await fetch(ADMIN_SETTINGS_API_URL);
            if (!response.ok) throw new Error('Failed to load general settings.');
            const settings = await response.json();
            
            if (systemNameInput) systemNameInput.value = settings.systemName || 'Vshare Car Rental';
            if (defaultPickupTimeInput) defaultPickupTimeInput.value = settings.defaultPickupTime || '07:00';
            if (defaultReturnTimeInput) defaultReturnTimeInput.value = settings.defaultReturnTime || '19:00'; // ADDED
            
            // Populate car makes and features for display
            displayCarMakes(settings.masterCarMakes || []);
            displayCarFeatures(settings.masterCarFeatures || []);
            displayRentalLocations(settings.rentalLocations || []); // ADDED

            // Populate rental procedures (if you add inputs for them)
            // Example: if (requiredDocumentsInput) requiredDocumentsInput.value = (settings.rentalProcedures && settings.rentalProcedures.requiredDocuments) ? settings.rentalProcedures.requiredDocuments.join('\n') : '';

            showMessage(generalSettingsMessage, 'General settings loaded.', 'success');

        } catch (error) {
            console.error("Error loading general settings:", error);
            showMessage(generalSettingsMessage, 'Error loading general settings: ' + error.message, 'error');
        }
    }

    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const settingsData = {
                systemName: systemNameInput ? systemNameInput.value.trim() : 'Vshare Car Rental',
                defaultPickupTime: defaultPickupTimeInput ? defaultPickupTimeInput.value : '07:00',
                defaultReturnTime: defaultReturnTimeInput ? defaultReturnTimeInput.value : '19:00', // ADDED
                // These lists are managed separately in this script, not directly from general settings form
                masterCarMakes: [], 
                masterCarFeatures: [],
                rentalLocations: [],
                rentalProcedures: {
                    requiredDocuments: [], // Populate these if you add specific inputs
                    securityDepositOptions: [],
                    distanceLimitations: [],
                    otherRegulations: []
                }
            };
            
            // Get existing makes/features/locations from current display/backend data
            const currentSettings = await fetch(ADMIN_SETTINGS_API_URL).then(res => res.json());
            settingsData.masterCarMakes = currentSettings.masterCarMakes || [];
            settingsData.masterCarFeatures = currentSettings.masterCarFeatures || [];
            settingsData.rentalLocations = currentSettings.rentalLocations || [];
            settingsData.rentalProcedures = currentSettings.rentalProcedures || {}; // Keep existing if no inputs


            try {
                const response = await fetch(ADMIN_SETTINGS_API_URL, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settingsData)
                });
                const result = await response.json();
                if (response.ok) {
                    showMessage(generalSettingsMessage, result.message || 'General settings saved successfully!', 'success');
                } else {
                    showMessage(generalSettingsMessage, result.message || 'Failed to save general settings.', 'error');
                }
            } catch (error) {
                console.error("Error saving general settings:", error);
                showMessage(generalSettingsMessage, 'Client-side error: ' + error.message, 'error');
            }
        });
    }

    // --- Car Configuration ---
    // Function to display current makes
    function displayCarMakes(makes) {
        if (!makeModelListDiv) return;
        makeModelListDiv.innerHTML = '<h3>Existing Makes:</h3>';
        if (makes.length === 0) {
            makeModelListDiv.innerHTML += '<p>No makes defined yet.</p>';
        } else {
            const ul = document.createElement('ul');
            makes.forEach(make => {
                const li = document.createElement('li');
                li.innerHTML = `${make} <button class="delete-make-btn button delete" data-make="${make}"><i class="fas fa-trash-alt"></i></button>`;
                ul.appendChild(li);
            });
            makeModelListDiv.appendChild(ul);
            // Add event listeners for delete buttons
            ul.querySelectorAll('.delete-make-btn').forEach(button => {
                button.addEventListener('click', () => deleteCarMake(button.dataset.make));
            });
        }
    }

    // Function to display current features
    function displayCarFeatures(features) {
        if (!carFeatureListDiv) return;
        carFeatureListDiv.innerHTML = '<h3>Existing Features:</h3>';
        if (features.length === 0) {
            carFeatureListDiv.innerHTML += '<p>No features defined yet.</p>';
        } else {
            const ul = document.createElement('ul');
            features.forEach(feature => {
                const li = document.createElement('li');
                li.innerHTML = `${feature} <button class="delete-feature-btn button delete" data-feature="${feature}"><i class="fas fa-trash-alt"></i></button>`;
                ul.appendChild(li);
            });
            carFeatureListDiv.appendChild(ul);
            // Add event listeners for delete buttons
            ul.querySelectorAll('.delete-feature-btn').forEach(button => {
                button.addEventListener('click', () => deleteCarFeature(button.dataset.feature));
            });
        }
    }

    // Function to display current locations
    function displayRentalLocations(locations) {
        const rentalLocationsListDiv = document.getElementById('rental-location-list'); // Assuming you add this div in HTML
        if (!rentalLocationsListDiv) return; // REMOVE THIS CHECK IF YOU DON'T ADD A NEW HTML ELEMENT
        rentalLocationsListDiv.innerHTML = '<h3>Existing Locations:</h3>';
        if (locations.length === 0) {
            rentalLocationsListDiv.innerHTML += '<p>No locations defined yet.</p>';
        } else {
            const ul = document.createElement('ul');
            locations.forEach(location => {
                const li = document.createElement('li');
                li.innerHTML = `${location} <button class="delete-location-btn button delete" data-location="${location}"><i class="fas fa-trash-alt"></i></button>`;
                ul.appendChild(li);
            });
            rentalLocationsListDiv.appendChild(ul);
            ul.querySelectorAll('.delete-location-btn').forEach(button => {
                button.addEventListener('click', () => deleteRentalLocation(button.dataset.location));
            });
        }
    }


    // Add Make & Model
    if (addMakeModelBtn) {
        addMakeModelBtn.addEventListener('click', async () => {
            const newMakeModel = newMakeModelInput.value.trim();
            if (!newMakeModel) {
                showMessage(carConfigMessage, 'Please enter a Make & Model.', 'error');
                return;
            }
            try {
                const currentSettings = await fetch(ADMIN_SETTINGS_API_URL).then(res => res.json());
                const existingMakes = currentSettings.masterCarMakes || [];
                if (existingMakes.includes(newMakeModel)) {
                    showMessage(carConfigMessage, `Make & Model "${newMakeModel}" already exists.`, 'error');
                    return;
                }
                const updatedMakes = [...existingMakes, newMakeModel];
                await updateSettings({ masterCarMakes: updatedMakes });
                showMessage(carConfigMessage, `Added Make & Model: ${newMakeModel}.`, 'success');
                newMakeModelInput.value = '';
                loadGeneralSettings(); // Reload to refresh list
            } catch (error) {
                console.error("Error adding Make & Model:", error);
                showMessage(carConfigMessage, 'Failed to add Make & Model: ' + error.message, 'error');
            }
        });
    }

    // Delete Make (This is simplified: assumes deleting make from the master list)
    async function deleteCarMake(makeToDelete) {
        if (!confirm(`Are you sure you want to delete make "${makeToDelete}"? This will not affect existing cars.`)) return;
        try {
            const currentSettings = await fetch(ADMIN_SETTINGS_API_URL).then(res => res.json());
            const updatedMakes = (currentSettings.masterCarMakes || []).filter(make => make !== makeToDelete);
            await updateSettings({ masterCarMakes: updatedMakes });
            showMessage(carConfigMessage, `Deleted Make: ${makeToDelete}.`, 'success');
            loadGeneralSettings(); // Reload to refresh list
        } catch (error) {
            console.error("Error deleting Make:", error);
            showMessage(carConfigMessage, 'Failed to delete Make: ' + error.message, 'error');
        }
    }

    // Add Car Feature
    if (addCarFeatureBtn) {
        addCarFeatureBtn.addEventListener('click', async () => {
            const newFeature = newCarFeatureInput.value.trim();
            if (!newFeature) {
                showMessage(carConfigMessage, 'Please enter a feature name.', 'error');
                return;
            }
            try {
                const currentSettings = await fetch(ADMIN_SETTINGS_API_URL).then(res => res.json());
                const existingFeatures = currentSettings.masterCarFeatures || [];
                if (existingFeatures.includes(newFeature)) {
                    showMessage(carConfigMessage, `Feature "${newFeature}" already exists.`, 'error');
                    return;
                }
                const updatedFeatures = [...existingFeatures, newFeature];
                await updateSettings({ masterCarFeatures: updatedFeatures });
                showMessage(carConfigMessage, `Added Feature: ${newFeature}.`, 'success');
                newCarFeatureInput.value = '';
                loadGeneralSettings(); // Reload to refresh list
            } catch (error) {
                console.error("Error adding Car Feature:", error);
                showMessage(carConfigMessage, 'Failed to add Car Feature: ' + error.message, 'error');
            }
        });
    }

    // Delete Car Feature
    async function deleteCarFeature(featureToDelete) {
        if (!confirm(`Are you sure you want to delete feature "${featureToDelete}"? This will not affect existing cars.`)) return;
        try {
            const currentSettings = await fetch(ADMIN_SETTINGS_API_URL).then(res => res.json());
            const updatedFeatures = (currentSettings.masterCarFeatures || []).filter(feature => feature !== featureToDelete);
            await updateSettings({ masterCarFeatures: updatedFeatures });
            showMessage(carConfigMessage, `Deleted Feature: ${featureToDelete}.`, 'success');
            loadGeneralSettings(); // Reload to refresh list
        } catch (error) {
            console.error("Error deleting Feature:", error);
            showMessage(carConfigMessage, 'Failed to delete Feature: ' + error.message, 'error');
        }
    }

    // Add Rental Location (Similar to Make/Feature, manage through Settings API)
    const addLocationBtn = document.getElementById('add-location-btn'); // Assuming this button in HTML
    const newLocationInput = document.getElementById('new-location'); // Assuming this input in HTML

    if (addLocationBtn) {
        addLocationBtn.addEventListener('click', async () => {
            const newLocation = newLocationInput.value.trim();
            if (!newLocation) {
                showMessage(carConfigMessage, 'Please enter a location name.', 'error'); // Using carConfigMessage for simplicity
                return;
            }
            try {
                const currentSettings = await fetch(ADMIN_SETTINGS_API_URL).then(res => res.json());
                const existingLocations = currentSettings.rentalLocations || [];
                if (existingLocations.includes(newLocation)) {
                    showMessage(carConfigMessage, `Location "${newLocation}" already exists.`, 'error');
                    return;
                }
                const updatedLocations = [...existingLocations, newLocation];
                await updateSettings({ rentalLocations: updatedLocations });
                showMessage(carConfigMessage, `Added Location: ${newLocation}.`, 'success');
                newLocationInput.value = '';
                loadGeneralSettings(); // Reload to refresh list
            } catch (error) {
                console.error("Error adding Rental Location:", error);
                showMessage(carConfigMessage, 'Failed to add Rental Location: ' + error.message, 'error');
            }
        });
    }

    // Delete Rental Location
    async function deleteRentalLocation(locationToDelete) {
        if (!confirm(`Are you sure you want to delete location "${locationToDelete}"?`)) return;
        try {
            const currentSettings = await fetch(ADMIN_SETTINGS_API_URL).then(res => res.json());
            const updatedLocations = (currentSettings.rentalLocations || []).filter(loc => loc !== locationToDelete);
            await updateSettings({ rentalLocations: updatedLocations });
            showMessage(carConfigMessage, `Deleted Location: ${locationToDelete}.`, 'success');
            loadGeneralSettings();
        } catch (error) {
            console.error("Error deleting Location:", error);
            showMessage(carConfigMessage, 'Failed to delete Location: ' + error.message, 'error');
        }
    }


    // Helper to send PUT request to update settings
    async function updateSettings(partialSettingsData) {
        const response = await fetch(ADMIN_SETTINGS_API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partialSettingsData)
        });
        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || `HTTP error! Status: ${response.status}`);
        }
        return response.json();
    }


    // --- Additional Services Configuration ---
    async function fetchAndDisplayServices() {
        if (!additionalServicesTableBody) return;
        try {
            const response = await fetch(ADMIN_ADDITIONAL_SERVICES_API_URL);
            if (!response.ok) throw new Error('Failed to load additional services.');
            const services = await response.json();

            additionalServicesTableBody.innerHTML = '';
            if (services.length === 0) {
                additionalServicesTableBody.innerHTML = '<tr><td colspan="3">No additional services configured.</td></tr>';
                return;
            }

            services.forEach(service => {
                const row = additionalServicesTableBody.insertRow();
                row.innerHTML = `
                    <td data-label="Service Name">${service.name}</td>
                    <td data-label="Price ($/day)">$${Number(service.pricePerDay).toFixed(2)}</td>
                    <td data-label="Actions">
                        <button class="edit-service-btn button edit" data-id="${service._id}" data-name="${service.name}" data-price="${service.pricePerDay}"><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-service-btn button delete" data-id="${service._id}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });

            // Add event listeners for edit/delete buttons
            additionalServicesTableBody.querySelectorAll('.edit-service-btn').forEach(button => {
                button.addEventListener('click', () => editService(button.dataset.id, button.dataset.name, button.dataset.price));
            });
            additionalServicesTableBody.querySelectorAll('.delete-service-btn').forEach(button => {
                button.addEventListener('click', () => deleteService(button.dataset.id));
            });

        } catch (error) {
            console.error("Error fetching services:", error);
            showMessage(servicesMessage, 'Error loading services: ' + error.message, 'error');
        }
    }

    // Add Service
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', async () => {
            const name = newServiceNameInput.value.trim();
            const price = newServicePriceInput.value ? parseFloat(newServicePriceInput.value) : null;
            if (!name || price === null || price < 0) {
                showMessage(servicesMessage, 'Service name and a valid price are required.', 'error');
                return;
            }
            try {
                const response = await fetch(ADMIN_ADDITIONAL_SERVICES_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, pricePerDay: price })
                });
                const result = await response.json();
                if (response.ok) {
                    showMessage(servicesMessage, result.message || 'Service added successfully!', 'success');
                    newServiceNameInput.value = '';
                    newServicePriceInput.value = '0';
                    fetchAndDisplayServices(); // Refresh list
                } else {
                    showMessage(servicesMessage, result.message || 'Failed to add service.', 'error');
                }
            } catch (error) {
                console.error("Error adding service:", error);
                showMessage(servicesMessage, 'Client-side error: ' + error.message, 'error');
            }
        });
    }

    // Edit Service (simplified: opens prompt, better to have a modal form)
    async function editService(id, currentName, currentPrice) {
        const newName = prompt(`Edit service name (current: ${currentName}):`, currentName);
        if (newName === null) return; // User cancelled
        const newPrice = prompt(`Edit service price (current: ${currentPrice}):`, currentPrice);
        if (newPrice === null) return; // User cancelled

        const parsedPrice = parseFloat(newPrice);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            showMessage(servicesMessage, 'Invalid price entered.', 'error');
            return;
        }

        try {
            const response = await fetch(`${ADMIN_ADDITIONAL_SERVICES_API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim(), pricePerDay: parsedPrice })
            });
            const result = await response.json();
            if (response.ok) {
                showMessage(servicesMessage, result.message || 'Service updated successfully!', 'success');
                fetchAndDisplayServices(); // Refresh list
            } else {
                showMessage(servicesMessage, result.message || 'Failed to update service.', 'error');
            }
        } catch (error) {
            console.error("Error updating service:", error);
            showMessage(servicesMessage, 'Client-side error: ' + error.message, 'error');
        }
    }

    // Delete Service
    async function deleteService(id) {
        if (!confirm('Are you sure you want to delete this service?')) return;
        try {
            const response = await fetch(`${ADMIN_ADDITIONAL_SERVICES_API_URL}/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (response.ok) {
                showMessage(servicesMessage, result.message || 'Service deleted successfully!', 'success');
                fetchAndDisplayServices(); // Refresh list
            } else {
                showMessage(servicesMessage, result.message || 'Failed to delete service.', 'error');
            }
        } catch (error) {
            console.error("Error deleting service:", error);
            showMessage(servicesMessage, 'Client-side error: ' + error.message, 'error');
        }
    }


    // --- User Role Management (Placeholder) ---
    // No active implementation for this part yet, just the HTML placeholder.


    // --- Initial Load ---
    async function initializePage() {
        console.log("Initializing Admin Settings Page...");
        await loadGeneralSettings(); // Loads general settings including makes/features lists
        await fetchAndDisplayServices(); // Loads additional services list
    }

    initializePage();
});