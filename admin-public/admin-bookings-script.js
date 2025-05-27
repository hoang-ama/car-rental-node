// admin-public/admin-bookings-script.js
document.addEventListener('DOMContentLoaded', () => {
    // Elements cho bảng booking
    const bookingsTableBody = document.getElementById('bookings-table-body');
    const bookingActionMessageDiv = document.getElementById('booking-action-message');

    // Elements cho form booking
    const bookingForm = document.getElementById('booking-form');
    const bookingIdInput = document.getElementById('booking-id');
    const customerNameInput = document.getElementById('customer-name');
    const carSelect = document.getElementById('car-select');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    // const bookingStatusSelect = document.getElementById('booking-status'); // Nếu có trường status
    const submitBookingButton = document.getElementById('submit-booking-button');
    const cancelEditBookingButton = document.getElementById('cancel-edit-booking-button');
    const bookingFormMessageDiv = document.getElementById('booking-form-message');

    const PUBLIC_BOOKINGS_API_URL = '/api/bookings';
    const ADMIN_BOOKINGS_API_URL = '/admin/bookings';
    const PUBLIC_CARS_API_URL = '/api/cars'; // Để lấy danh sách xe cho dropdown

    // --- Hàm hiển thị thông báo (cho form và cho action list) ---
    function showMessage(element, message, type = 'success') {
        element.textContent = message;
        element.className = type; // 'success' hoặc 'error'
        element.style.padding = '10px';
        element.style.marginBottom = '15px';
        element.style.borderRadius = '4px';
        element.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
        element.style.color = type === 'success' ? '#155724' : '#721c24';
        
        setTimeout(() => {
            element.textContent = '';
            element.className = '';
            element.style.padding = '0';
            element.style.marginBottom = '0'; // Reset margin nếu cần
        }, 4000);
    }

    // --- Hàm định dạng ngày tháng ---
    function formatDate(dateString, includeTime = false) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Ngày không hợp lệ';

        const optionsDateOnly = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const optionsDateTime = { ...optionsDateOnly, hour: '2-digit', minute: '2-digit' };
        
        return includeTime ? date.toLocaleDateString('vi-VN', optionsDateTime) : date.toLocaleDateString('vi-VN', optionsDateOnly);
    }
    // Hàm để định dạng ngày cho input type="date" (YYYY-MM-DD)
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }


    // --- Tải danh sách xe vào dropdown ---
    async function loadCarsIntoSelect() {
        try {
            const response = await fetch(PUBLIC_CARS_API_URL);
            if (!response.ok) throw new Error('Không thể tải danh sách xe.');
            const cars = await response.json();

            carSelect.innerHTML = '<option value="">-- Vui lòng chọn xe --</option>'; // Xóa option cũ, thêm option mặc định
            cars.forEach(car => {
                // Chỉ thêm xe "available" vào danh sách chọn (tùy chọn, admin có thể muốn đặt cả xe unavailable)
                // if (car.available) { 
                    const option = document.createElement('option');
                    option.value = car.id;
                    option.textContent = `${car.make} ${car.model} (ID: ${car.id}) - $${car.pricePerDay}/ngày`;
                    // Thêm thuộc tính data để dễ lấy thông tin xe nếu cần
                    option.dataset.carInfo = JSON.stringify(car); 
                    carSelect.appendChild(option);
                // }
            });
        } catch (error) {
            console.error("Lỗi tải xe cho select:", error);
            showMessage(bookingFormMessageDiv, error.message, 'error');
        }
    }

    // --- Hàm tải và hiển thị danh sách bookings ---
    async function fetchAndDisplayBookings() {
        try {
            const response = await fetch(PUBLIC_BOOKINGS_API_URL);
            if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
            const bookings = await response.json();
            bookingsTableBody.innerHTML = ''; 

            if (bookings.length === 0) {
                bookingsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có đơn đặt xe nào.</td></tr>';
                return;
            }

            bookings.forEach(booking => {
                const row = bookingsTableBody.insertRow();
                row.innerHTML = `
                    <td>${booking.id}</td>
                    <td>${booking.customerName || 'N/A'}</td>
                    <td>${booking.carId} - ${booking.carMake || ''} ${booking.carModel || ''}</td>
                    <td>${formatDate(booking.startDate)}</td>
                    <td>${formatDate(booking.endDate)}</td>
                    <td>${formatDate(booking.bookingDate, true)}</td>
                    <td>
                        <button class="edit-booking-btn" data-id="${booking.id}" title="Sửa đơn đặt xe">Sửa</button>
                        <button class="delete-booking-btn" data-id="${booking.id}" title="Xóa đơn đặt xe">Xóa</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Lỗi khi tải danh sách đặt xe:', error);
            showMessage(bookingActionMessageDiv, 'Lỗi tải danh sách đặt xe: ' + error.message, 'error');
        }
    }

    // --- Xử lý submit form booking (Thêm mới hoặc Cập nhật) ---
    bookingForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const bookingData = {
            customerName: customerNameInput.value.trim(),
            carId: parseInt(carSelect.value),
            startDate: startDateInput.value,
            endDate: endDateInput.value,
            // status: bookingStatusSelect.value // Nếu có trường status
        };

        if (!bookingData.customerName || !bookingData.carId || !bookingData.startDate || !bookingData.endDate) {
            showMessage(bookingFormMessageDiv, 'Vui lòng điền đầy đủ các trường bắt buộc.', 'error');
            return;
        }
        if (new Date(bookingData.endDate) < new Date(bookingData.startDate)) {
            showMessage(bookingFormMessageDiv, 'Ngày kết thúc không thể trước ngày bắt đầu.', 'error');
            return;
        }

        // Lấy thông tin carMake, carModel từ car được chọn để lưu cùng booking (nếu API backend yêu cầu)
        const selectedCarOption = carSelect.options[carSelect.selectedIndex];
        if (selectedCarOption && selectedCarOption.dataset.carInfo) {
            const carInfo = JSON.parse(selectedCarOption.dataset.carInfo);
            bookingData.carMake = carInfo.make;
            bookingData.carModel = carInfo.model;
        }


        const currentBookingId = bookingIdInput.value;
        let method = currentBookingId ? 'PUT' : 'POST';
        let url = currentBookingId ? `${ADMIN_BOOKINGS_API_URL}/${currentBookingId}` : ADMIN_BOOKINGS_API_URL;

        try {
            submitBookingButton.disabled = true;
            submitBookingButton.textContent = currentBookingId ? 'Đang cập nhật...' : 'Đang thêm...';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });
            const result = await response.json();

            if (response.ok) {
                showMessage(bookingFormMessageDiv, result.message || (currentBookingId ? 'Cập nhật thành công!' : 'Thêm booking thành công!'), 'success');
                resetBookingForm();
                fetchAndDisplayBookings();
            } else {
                showMessage(bookingFormMessageDiv, result.message || 'Có lỗi xảy ra.', 'error');
            }
        } catch (error) {
            console.error("Lỗi submit form booking:", error);
            showMessage(bookingFormMessageDiv, 'Lỗi kết nối: ' + error.message, 'error');
        } finally {
            submitBookingButton.disabled = false;
            submitBookingButton.textContent = bookingIdInput.value ? 'Cập Nhật Đơn' : 'Thêm Đơn Đặt Xe';
        }
    });

    // --- Xử lý click trên bảng bookings (Sửa, Xóa) ---
    bookingsTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const currentBookingId = target.dataset.id;

        if (!currentBookingId) return;

        // Nút Sửa Booking
        if (target.classList.contains('edit-booking-btn')) {
            // Tìm booking cần sửa trong danh sách đã tải (hoặc fetch lại từ server)
            // Để đơn giản, ta sẽ fetch lại chi tiết booking nếu cần.
            // Tuy nhiên, API GET /api/bookings/:id chưa có, nên ta sẽ điền form từ dữ liệu đã có (nếu đủ)
            // hoặc thông báo cần fetch. Tốt nhất là có API lấy chi tiết 1 booking.
            // Giả định chúng ta sẽ cần fetch chi tiết booking (cần tạo API GET /api/bookings/:id ở backend)
            
            // Lấy thông tin booking từ server (cần API GET /api/bookings/:id)
            // Trong ví dụ này, ta sẽ tạm lấy từ dòng table, nhưng không đầy đủ bằng fetch
            const row = target.closest('tr');
            if (!row) return;
            
            // Tạm thời điền thông tin từ bảng (sẽ không chính xác bằng fetch)
            // Nên có API `GET /admin/bookings/:id` hoặc `GET /api/bookings/:id` để lấy đầy đủ thông tin
            const bookingToEdit = { // Lấy booking từ API thì tốt hơn
                id: currentBookingId,
                customerName: row.cells[1].textContent,
                carId: row.cells[2].textContent.split(' - ')[0], // Lấy carId
                startDate: convertDisplayDateToInputFormat(row.cells[3].textContent),
                endDate: convertDisplayDateToInputFormat(row.cells[4].textContent),
                // status: row.cells[6].textContent // Nếu có status
            };

            bookingIdInput.value = bookingToEdit.id;
            customerNameInput.value = bookingToEdit.customerName;
            carSelect.value = bookingToEdit.carId; // Chọn đúng xe trong dropdown
            startDateInput.value = bookingToEdit.startDate;
            endDateInput.value = bookingToEdit.endDate;
            // bookingStatusSelect.value = bookingToEdit.status;

            submitBookingButton.textContent = 'Cập Nhật Đơn';
            cancelEditBookingButton.style.display = 'inline-block';
            bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            customerNameInput.focus();
        }

        // Nút Xóa Booking
        if (target.classList.contains('delete-booking-btn')) {
            if (confirm(`Bạn có chắc chắn muốn xóa đơn đặt xe ID: ${currentBookingId} không?`)) {
                try {
                    target.disabled = true;
                    target.textContent = 'Đang xóa...';
                    const response = await fetch(`${ADMIN_BOOKINGS_API_URL}/${currentBookingId}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (response.ok) {
                        showMessage(bookingActionMessageDiv, result.message || 'Xóa thành công!', 'success');
                        fetchAndDisplayBookings();
                    } else {
                        showMessage(bookingActionMessageDiv, result.message || 'Lỗi khi xóa.', 'error');
                    }
                } catch (error) {
                    console.error("Lỗi xóa booking:", error);
                    showMessage(bookingActionMessageDiv, 'Lỗi kết nối: ' + error.message, 'error');
                } finally {
                     target.disabled = false;
                     target.textContent = 'Xóa';
                }
            }
        }
    });
    
    // Hàm phụ trợ để chuyển đổi định dạng ngày từ dd/mm/yyyy (hiển thị) sang yyyy-mm-dd (input)
    function convertDisplayDateToInputFormat(displayDate) {
        if (!displayDate || displayDate === 'N/A') return '';
        const parts = displayDate.split(' ')[0].split('/'); // Lấy phần ngày, bỏ phần giờ nếu có
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return '';
    }


    // --- Nút Hủy Cập Nhật ---
    cancelEditBookingButton.addEventListener('click', () => {
        resetBookingForm();
    });

    // --- Hàm reset form booking ---
    function resetBookingForm() {
        bookingForm.reset();
        bookingIdInput.value = '';
        submitBookingButton.textContent = 'Thêm Đơn Đặt Xe';
        cancelEditBookingButton.style.display = 'none';
        carSelect.value = ""; // Reset dropdown xe
        customerNameInput.focus();
    }

    // --- Tải dữ liệu ban đầu ---
    loadCarsIntoSelect(); // Tải danh sách xe vào dropdown trước
    fetchAndDisplayBookings(); // Sau đó tải danh sách bookings
});