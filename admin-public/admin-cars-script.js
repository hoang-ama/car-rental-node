// admin-public/admin-cars-script.js
document.addEventListener('DOMContentLoaded', () => {
    const carsTableBody = document.getElementById('cars-table-body');
    const carForm = document.getElementById('car-form');
    const carIdInput = document.getElementById('car-id');
    const makeInput = document.getElementById('make');
    const modelInput = document.getElementById('model');
    const yearInput = document.getElementById('year');
    const pricePerDayInput = document.getElementById('pricePerDay');
    const imageUrlInput = document.getElementById('imageUrl');
    const availableSelect = document.getElementById('available');
    const submitButton = document.getElementById('submit-car-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const formMessageDiv = document.getElementById('form-message');

    const ADMIN_API_URL = '/admin/cars'; // API endpoint cho quản lý xe bởi admin
    const PUBLIC_API_URL = '/api/cars';   // API endpoint công khai để lấy danh sách/chi tiết xe

    // --- Hàm hiển thị thông báo ---
    function showMessage(message, type = 'success') {
        formMessageDiv.textContent = message;
        formMessageDiv.className = type; // 'success' hoặc 'error'
        // Tự động xóa thông báo sau một khoảng thời gian
        setTimeout(() => {
            formMessageDiv.textContent = '';
            formMessageDiv.className = '';
        }, 4000); // 4 giây
    }

    // --- Hàm tải và hiển thị danh sách xe ---
    async function fetchAndDisplayCars() {
        try {
            const response = await fetch(PUBLIC_API_URL); // Sử dụng API công khai để lấy danh sách
            if (!response.ok) {
                throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
            }
            const cars = await response.json();
            carsTableBody.innerHTML = ''; // Xóa các dòng cũ trong bảng

            if (cars.length === 0) {
                carsTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Không có xe nào trong hệ thống.</td></tr>';
                return;
            }

            cars.forEach(car => {
                const row = carsTableBody.insertRow();
                row.innerHTML = `
                    <td>${car.id}</td>
                    <td>${car.make}</td>
                    <td>${car.model}</td>
                    <td>${car.year}</td>
                    <td>$${parseFloat(car.pricePerDay).toFixed(2)}</td>
                    <td><img src="${car.imageUrl || 'https://via.placeholder.com/100/CCCCCC/FFFFFF?Text=No+Image'}" alt="${car.make} ${car.model}" style="width:100px; height:auto; border-radius:4px;"></td>
                    <td style="color: ${car.available ? 'green' : 'red'}; font-weight: bold;">
                        ${car.available ? 'Có sẵn' : 'Hết hàng'}
                    </td>
                    <td>
                        <button class="edit-btn" data-id="${car.id}" title="Sửa xe">Sửa</button>
                        <button class="delete-btn" data-id="${car.id}" title="Xóa xe">Xóa</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Lỗi khi tải danh sách xe:', error);
            carsTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Lỗi tải danh sách xe. Vui lòng thử lại.</td></tr>';
            showMessage('Lỗi tải danh sách xe: ' + error.message, 'error');
        }
    }

    // --- Xử lý submit form (Thêm mới hoặc Cập nhật xe) ---
    carForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Ngăn form submit theo cách truyền thống

        // Thu thập dữ liệu từ form
        const carData = {
            make: makeInput.value.trim(),
            model: modelInput.value.trim(),
            year: parseInt(yearInput.value),
            pricePerDay: parseFloat(pricePerDayInput.value),
            imageUrl: imageUrlInput.value.trim(),
            available: availableSelect.value === 'true' // Chuyển string "true"/"false" thành boolean
        };

        // Kiểm tra dữ liệu cơ bản (bạn có thể thêm kiểm tra chi tiết hơn)
        if (!carData.make || !carData.model || isNaN(carData.year) || isNaN(carData.pricePerDay)) {
            showMessage('Vui lòng điền đầy đủ các trường bắt buộc (Hãng, Mẫu, Năm, Giá/ngày).', 'error');
            return;
        }
        if (carData.year < 1900 || carData.year > new Date().getFullYear() + 2) {
            showMessage('Năm sản xuất không hợp lệ.', 'error');
            return;
        }
        if (carData.pricePerDay <= 0) {
            showMessage('Giá thuê mỗi ngày phải lớn hơn 0.', 'error');
            return;
        }


        const carId = carIdInput.value; // Lấy ID từ input ẩn để biết là thêm mới hay cập nhật
        let response;
        let method;
        let url;

        if (carId) { // Nếu có carId -> Cập nhật xe (PUT)
            method = 'PUT';
            url = `${ADMIN_API_URL}/${carId}`;
        } else { // Không có carId -> Thêm xe mới (POST)
            method = 'POST';
            url = ADMIN_API_URL;
        }

        try {
            // Vô hiệu hóa nút submit để tránh click nhiều lần
            submitButton.disabled = true;
            submitButton.textContent = carId ? 'Đang cập nhật...' : 'Đang thêm...';

            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(carData),
            });

            const result = await response.json(); // Parse JSON từ phản hồi của server

            if (response.ok) { // Kiểm tra xem request có thành công không (status code 200-299)
                showMessage(result.message || (carId ? 'Cập nhật xe thành công!' : 'Thêm xe thành công!'), 'success');
                resetForm(); // Đặt lại form về trạng thái ban đầu
                fetchAndDisplayCars(); // Tải lại danh sách xe để hiển thị thay đổi
            } else {
                // Nếu có lỗi từ server (ví dụ: validation error, server error)
                showMessage(result.message || 'Có lỗi xảy ra từ phía server.', 'error');
            }
        } catch (error) {
            // Nếu có lỗi mạng hoặc lỗi trong quá trình fetch
            console.error('Lỗi khi submit form:', error);
            showMessage('Lỗi kết nối hoặc server không phản hồi: ' + error.message, 'error');
        } finally {
            // Kích hoạt lại nút submit dù thành công hay thất bại
            submitButton.disabled = false;
            submitButton.textContent = carIdInput.value ? 'Cập Nhật Xe' : 'Thêm Xe';
        }
    });

    // --- Xử lý sự kiện click trên bảng xe (cho nút Sửa và Xóa) ---
    carsTableBody.addEventListener('click', async (event) => {
        const target = event.target; // Element được click
        const carId = target.dataset.id; // Lấy giá trị của thuộc tính data-id

        if (!carId) return; // Bỏ qua nếu không phải click vào nút có data-id

        // Xử lý khi nhấn nút "Sửa"
        if (target.classList.contains('edit-btn')) {
            try {
                // Lấy thông tin chi tiết của xe cần sửa từ API công khai
                const res = await fetch(`${PUBLIC_API_URL}/${carId}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error('Không tìm thấy xe để sửa (ID: ' + carId + ').');
                    throw new Error(`Lỗi HTTP khi lấy chi tiết xe: ${res.status}`);
                }
                const carToEdit = await res.json();

                // Điền thông tin xe vào form
                carIdInput.value = carToEdit.id;
                makeInput.value = carToEdit.make;
                modelInput.value = carToEdit.model;
                yearInput.value = carToEdit.year;
                pricePerDayInput.value = carToEdit.pricePerDay;
                imageUrlInput.value = carToEdit.imageUrl || '';
                availableSelect.value = String(carToEdit.available); // Chuyển boolean thành string "true" hoặc "false"

                submitButton.textContent = 'Cập Nhật Xe'; // Thay đổi text nút submit
                cancelEditButton.style.display = 'inline-block'; // Hiển thị nút "Hủy Cập Nhật"
                
                // Cuộn lên đầu trang hoặc tới form để người dùng dễ thấy
                carForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                makeInput.focus(); // Focus vào trường đầu tiên

            } catch (error) {
                console.error('Lỗi khi chuẩn bị sửa xe:', error);
                showMessage(error.message, 'error');
            }
        }

        // Xử lý khi nhấn nút "Xóa"
        if (target.classList.contains('delete-btn')) {
            // Hỏi xác nhận trước khi xóa
            if (confirm(`Bạn có chắc chắn muốn xóa xe có ID: ${carId} không? Hành động này không thể hoàn tác.`)) {
                try {
                    target.disabled = true; // Vô hiệu hóa nút xóa tạm thời
                    target.textContent = 'Đang xóa...';

                    const response = await fetch(`${ADMIN_API_URL}/${carId}`, {
                        method: 'DELETE',
                    });
                    const result = await response.json();

                    if (response.ok) {
                        showMessage(result.message || 'Xóa xe thành công!', 'success');
                        fetchAndDisplayCars(); // Tải lại danh sách xe
                    } else {
                        showMessage(result.message || 'Lỗi khi xóa xe từ server.', 'error');
                        target.disabled = false;
                        target.textContent = 'Xóa';
                    }
                } catch (error) {
                    console.error('Lỗi khi xóa xe:', error);
                    showMessage('Lỗi kết nối khi xóa xe: ' + error.message, 'error');
                    target.disabled = false;
                    target.textContent = 'Xóa';
                }
            }
        }
    });

    // --- Xử lý nút "Hủy Cập Nhật" ---
    cancelEditButton.addEventListener('click', () => {
        resetForm();
    });

    // --- Hàm đặt lại (reset) form về trạng thái ban đầu ---
    function resetForm() {
        carForm.reset(); // Xóa hết giá trị trong các trường của form
        carIdInput.value = ''; // Quan trọng: xóa ID xe đang sửa (nếu có)
        submitButton.textContent = 'Thêm Xe'; // Đặt lại text nút submit
        cancelEditButton.style.display = 'none'; // Ẩn nút "Hủy Cập Nhật"
        availableSelect.value = 'true'; // Mặc định tình trạng là "Có sẵn"
        makeInput.focus(); // Focus vào trường đầu tiên
    }

    // --- Tải dữ liệu ban đầu khi trang được load ---
    fetchAndDisplayCars();
});