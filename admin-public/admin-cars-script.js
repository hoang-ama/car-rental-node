// admin-public/admin-cars-script.js
document.addEventListener('DOMContentLoaded', () => {
    const carsTableBody = document.getElementById('cars-table-body');
    const carForm = document.getElementById('car-form');
    
    // Input ẩn để lưu ID của record xe đang được sửa (nếu backend dùng ID dạng số tự tăng để update)
    // Nếu backend dùng uniqueId (ví dụ biển số) làm key chính để update, thì input này có thể không cần thiết
    // hoặc dùng để phân biệt trạng thái "ADD" và "EDIT"
    const carRecordIdInput = document.getElementById('car-id-form'); // ID này là của record, không phải ID xe admin nhập

    // Form fields
    const carUniqueIdInput = document.getElementById('car-unique-id'); // ID xe do admin nhập (ví dụ biển số)
    const makeInput = document.getElementById('make');
    const modelInput = document.getElementById('model');
    const yearInput = document.getElementById('year');
    const pricePerDayInput = document.getElementById('pricePerDay');
    const imageUrlInput = document.getElementById('imageUrl');
    const availableSelect = document.getElementById('available');
    const locationSelectCarForm = document.getElementById('location'); // Đã đổi tên biến để tránh nhầm lẫn

    // Specification fields
    const bodyTypeSelect = document.getElementById('bodyType');
    const transmissionSelect = document.getElementById('transmission');
    const fuelTypeSelect = document.getElementById('fuelType');
    const seatsInput = document.getElementById('seats');

    // Features checkboxes
    const featuresCheckboxes = document.querySelectorAll('input[name="features"]');

    const submitButton = document.getElementById('submit-car-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const formMessageDiv = document.getElementById('form-message');

    const ADMIN_API_URL = '/admin/cars'; // API endpoint cho quản lý xe bởi admin
    const PUBLIC_CARS_API_URL = '/api/cars'; // API để lấy danh sách xe hiển thị

    // --- Hàm hiển thị thông báo ---
    function showMessage(message, type = 'success') {
        if (!formMessageDiv) return;
        formMessageDiv.textContent = message;
        formMessageDiv.className = type; // 'success' hoặc 'error'
        formMessageDiv.style.padding = '10px';
        formMessageDiv.style.marginBottom = '15px';
        // (Thêm các style khác nếu cần)
        setTimeout(() => {
            formMessageDiv.textContent = '';
            formMessageDiv.className = '';
            formMessageDiv.style.padding = '0';
        }, 4000);
    }

    // --- Hàm tải và hiển thị danh sách xe ---
    async function fetchAndDisplayCars() {
        if (!carsTableBody) return;
        try {
            const response = await fetch(PUBLIC_CARS_API_URL); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const cars = await response.json();
            carsTableBody.innerHTML = ''; 

            cars.forEach(car => {
                const row = carsTableBody.insertRow();
                // Truyền cả object car vào data-car để dễ dàng lấy thông tin khi edit
                // ID trong data-id của nút xóa sẽ là ID duy nhất của xe (ví dụ: biển số)
                row.innerHTML = `
                    <td>${car.id || 'N/A'}</td>
                    <td>${car.make || 'N/A'}</td>
                    <td>${car.model || 'N/A'}</td>
                    <td>${car.year || 'N/A'}</td>
                    <td>$${car.pricePerDay !== undefined ? car.pricePerDay : 'N/A'}</td>
                    <td>${car.location || 'N/A'}</td>
                    <td>${car.specifications?.bodyType || 'N/A'}</td>
                    <td class="${car.available ? 'status-available' : 'status-unavailable'}">
                        ${car.available ? 'Available' : 'Unavailable'}
                    </td>
                    <td>
                        <button class="edit-btn" data-car='${JSON.stringify(car)}'>Edit</button>
                        <button class="delete-btn" data-id="${car.id}">Delete</button>
                    </td>
                `;
            });
        } catch (error) { 
            console.error("Error fetching cars for admin table:", error);
            carsTableBody.innerHTML = '<tr><td colspan="9">Error loading cars. Please try again.</td></tr>';
            showMessage('Error loading cars: ' + error.message, 'error');
        }
    }

    // --- Xử lý submit form (Thêm mới hoặc Cập nhật) ---
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
                id: carUniqueIdInput.value.trim(), // ID duy nhất của xe do admin nhập
                make: makeInput.value.trim(),
                model: modelInput.value.trim(),
                year: parseInt(yearInput.value),
                pricePerDay: parseFloat(pricePerDayInput.value),
                imageUrl: imageUrlInput.value.trim(),
                available: availableSelect.value === 'true',
                location: locationSelectCarForm.value,
                specifications: {
                    bodyType: bodyTypeSelect.value,
                    transmission: transmissionSelect.value,
                    fuelType: fuelTypeSelect.value,
                    seats: parseInt(seatsInput.value)
                },
                features: selectedFeatures
            };

            // Kiểm tra các trường bắt buộc
            if (!carData.id || !carData.make || !carData.model || isNaN(carData.year) || isNaN(carData.pricePerDay) || !carData.location) {
                showMessage('Please fill in all required fields (ID, Make, Model, Year, Price, Location).', 'error');
                return;
            }
            // Kiểm tra điều kiện 
            if (carData.pricePerDay < 0 || carData.seats < 1 || carData.year < 2000 || carData.year > new Date().getFullYear() + 1) {
                showMessage('Invalid input: Price must be non-negative, Seats must be positive, Year must be reasonable.', 'error');
                return;
              }

            const editingRecordId = carRecordIdInput.value; // ID này của record, có thể khác carData.id
            let method = editingRecordId ? 'PUT' : 'POST';
            // URL sẽ dùng ID duy nhất của xe (carData.id) nếu backend PUT/DELETE dựa trên đó
            // Hoặc dùng editingRecordId nếu backend dùng ID tự tăng của record.
            // Giả sử backend dùng ID duy nhất của xe (biển số) làm key chính thì sẽ phải là đổi là {encodeURIComponent(carUniqueIdInput.value)}
            let url = editingRecordId ? `${ADMIN_API_URL}/${encodeURIComponent(editingRecordId)}` : ADMIN_API_URL;
             // Nếu backend dùng ID của record (1,2,3...) để update, thì carData.id sẽ là biển số.
             // Còn editingRecordId sẽ là ID hệ thống.
             // Phụ thuộc vào thiết kế API của bạn.
             // Ví dụ này giả định editingRecordId (nếu có) là ID để PUT/DELETE trên server.
             // Và carData.id là unique ID (biển số) luôn được gửi trong body.

            console.log("Submitting car data:", carData, "Method:", method, "URL:", url, "Editing Record ID:", editingRecordId); // DEBUG


            try {
                if(submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = editingRecordId ? 'Updating...' : 'Adding...';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(carData), // Gửi toàn bộ carData, bao gồm cả carData.id (unique id)
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

    // --- Xử lý nút Sửa và Xóa ---
    if (carsTableBody) {
        carsTableBody.addEventListener('click', async (event) => {
            const target = event.target;
            
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

                    // carRecordIdInput dùng để xác định đây là PUT request và ID của record trên server
                    // Nếu backend dùng ID duy nhất (ví dụ biển số) làm key, thì giá trị này chính là carToEdit.id
                    carRecordIdInput.value = carToEdit.id; // Giả sử carToEdit.id là ID duy nhất được dùng để update

                    if(carUniqueIdInput) carUniqueIdInput.value = carToEdit.id || ''; 
                    if(makeInput) makeInput.value = carToEdit.make || '';
                    if(modelInput) modelInput.value = carToEdit.model || '';
                    if(yearInput) yearInput.value = carToEdit.year || '';
                    if(pricePerDayInput) pricePerDayInput.value = carToEdit.pricePerDay !== undefined ? carToEdit.pricePerDay : '';
                    if(imageUrlInput) imageUrlInput.value = carToEdit.imageUrl || '';
                    if(availableSelect) availableSelect.value = String(carToEdit.available);
                    if(locationSelectCarForm) locationSelectCarForm.value = carToEdit.location || 'Hanoi';

                    if (carToEdit.specifications) {
                        if(bodyTypeSelect) bodyTypeSelect.value = carToEdit.specifications.bodyType || 'SUV';
                        if(transmissionSelect) transmissionSelect.value = carToEdit.specifications.transmission || 'AT';
                        if(fuelTypeSelect) fuelTypeSelect.value = carToEdit.specifications.fuelType || 'Petrol';
                        if(seatsInput) seatsInput.value = carToEdit.specifications.seats || 5;
                    } else { 
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

            if (target.classList.contains('delete-btn')) {
                const carIdToDelete = target.dataset.id; // ID này là ID duy nhất của xe
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
    
    function resetForm() {
        if(carForm) carForm.reset(); // Reset tất cả input trong form
        if(carRecordIdInput) carRecordIdInput.value = ''; 
        // carUniqueIdInput sẽ được reset bởi carForm.reset() nếu nó là input thường
        if(submitButton) submitButton.textContent = 'Add Car';
        if(cancelEditButton) cancelEditButton.style.display = 'none';
        // Set lại giá trị mặc định cho các select nếu cần
        if(availableSelect) availableSelect.value = 'true';
        if(locationSelectCarForm) locationSelectCarForm.value = 'Hanoi';
        if(bodyTypeSelect) bodyTypeSelect.value = 'SUV';
        if(transmissionSelect) transmissionSelect.value = 'AT';
        if(fuelTypeSelect) fuelTypeSelect.value = 'Petrol';
        if(seatsInput) seatsInput.value = 5; // Giá trị mặc định cho seats
        featuresCheckboxes.forEach(checkbox => checkbox.checked = false); // Bỏ chọn tất cả features
        if(carUniqueIdInput) carUniqueIdInput.focus(); // Focus lại vào trường ID
    }

    if(cancelEditButton) {
        cancelEditButton.addEventListener('click', resetForm);
    }

    fetchAndDisplayCars();
});