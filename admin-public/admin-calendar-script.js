// admin-public/admin-calendar-script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Calendar Script Initializing...");

    // --- DOM Elements ---
    const calendarTableBody = document.getElementById('rental-calendar-body');
    const calendarPeriodDisplay = document.getElementById('calendar-period-display');
    const prevWeekBtn = document.querySelector('.calendar-controls .fa-arrow-left').closest('button');
    const nextWeekBtn = document.querySelector('.calendar-controls .fa-arrow-right').closest('button');
    const periodButtons = document.querySelectorAll('.calendar-period-buttons .button');
    const tableHeaderRow = document.querySelector('#rental-calendar-table thead tr');

    const ADMIN_CARS_API_URL = '/admin/cars';
    const ADMIN_BOOKINGS_API_URL = '/admin/bookings';

     // Đặt ngày bắt đầu mặc định là Thứ Hai của tuần hiện tại
     let currentStartDate = getStartOfWeek(new Date());

    // --- Utility Functions ---
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay(); // 0 = Sunday, 1 = Monday
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    function formatDateForDisplay(date) {
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    function formatFullDate(date) {
        const d = new Date(date);
        const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
        return `${day}<br>${formatDateForDisplay(d)}`;
    }

    // --- Fetch and Display Calendar ---
    async function fetchAndDisplayCalendar() {
        if (!calendarTableBody) return;
        calendarTableBody.innerHTML = '<tr><td colspan="8">Loading calendar data...</td></tr>';
        
        try {
            const [carsResponse, bookingsResponse] = await Promise.all([
                fetch(ADMIN_CARS_API_URL),
                fetch(ADMIN_BOOKINGS_API_URL)
            ]);
            
            if (!carsResponse.ok) throw new Error('Failed to fetch car data.');
            if (!bookingsResponse.ok) throw new Error('Failed to fetch booking data.');
            
            const cars = await carsResponse.json();
            const bookings = await bookingsResponse.json();
            
            renderCalendar(cars, bookings);
            
        } catch (error) {
            console.error("Error fetching calendar data:", error);
            calendarTableBody.innerHTML = `<tr><td colspan="8">Error loading calendar: ${error.message}</td></tr>`;
        }
    }

    function renderCalendar(cars, bookings) {
        if (!calendarTableBody || !calendarPeriodDisplay) return;

        calendarTableBody.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Đặt thời gian về 00:00:00 để so sánh chính xác

        const endDate = new Date(currentStartDate);
        endDate.setDate(currentStartDate.getDate() + 6);
        calendarPeriodDisplay.textContent = `${formatDateForDisplay(currentStartDate)} - ${formatDateForDisplay(endDate)}`;


        // Tạo tiêu đề bảng động
        tableHeaderRow.innerHTML = '<th class="car-info-column">Car</th>';
        const daysInWeek = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentStartDate);
            day.setDate(currentStartDate.getDate() + i);
            daysInWeek.push(day);

            const dayOfWeek = day.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
            let headerClass = '';
            if (day.toDateString() === today.toDateString()) {
                headerClass = 'today';
            } else if (dayOfWeek === 0) { // Chủ Nhật
                headerClass = 'sunday';
            } else if (dayOfWeek === 6) { // Thứ Bảy
                headerClass = 'saturday';
            }
            
            tableHeaderRow.innerHTML += `<th class="day-header ${headerClass}" data-date="${day.toISOString().split('T')[0]}">${formatFullDate(day)}</th>`;
        }

        
        cars.forEach(car => {
            const row = calendarTableBody.insertRow();
            
            // Check local image URL and convert to absolute path if necessary
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

            row.innerHTML = `<td class="car-info-column">
                                <div class="car-info-cell">
                                    <img src="${finalImageUrl}" alt="${car.make} ${car.model}" class="car-thumbnail">
                                    <div class="car-details">
                                        <div class="car-name">${car.make} ${car.model}</div>
                                        <div class="car-id">${car.id}</div>
                                        <div class="car-price">$${car.pricePerDay}/day</div>
                                    </div>
                                </div>
                             </td>`;
            
            const carBookings = bookings.filter(b => b.carId === car.id)
                                        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        

                                        daysInWeek.forEach(day => {
                                            const dayCell = row.insertCell();
                                            dayCell.classList.add('calendar-day-cell');
                            
                                            // Thêm class cho ngày hôm nay và cuối tuần vào các ô trong body
                                            const dayOfWeek = day.getDay();
                                            if (day.toDateString() === today.toDateString()) {
                                                dayCell.classList.add('today');
                                            } else if (dayOfWeek === 0) {
                                                dayCell.classList.add('sunday');
                                            } else if (dayOfWeek === 6) {
                                                dayCell.classList.add('saturday');
                                            }
                                            
                                            const dayBookings = carBookings.filter(booking => {
                                                const bookingStart = new Date(booking.startDate);
                                                const bookingEnd = new Date(booking.endDate);
                                                // Kiểm tra xem booking có nằm trong ngày hiện tại không
                                                return day.getTime() >= bookingStart.getTime() && day.getTime() <= bookingEnd.getTime();
                                            });
                            
                                            if (dayBookings.length > 0) {
                                                dayBookings.forEach(booking => {
                                                    const statusClass = (booking.status || 'Pending').toLowerCase().replace(/\s/g, '-');
                                                    const bookingBlock = document.createElement('div');
                                                    bookingBlock.classList.add('booking-block', `status-${statusClass}`);
                                                    bookingBlock.textContent = `Booking #${booking.id}`;
                                                    bookingBlock.title = `Status: ${booking.status}\nCustomer: ${booking.customerName}`;
                                                    dayCell.appendChild(bookingBlock);
                                                });
                                            }
                                        });
                                    });
                                }                                        

    // --- Event Listeners ---
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            currentStartDate.setDate(currentStartDate.getDate() - 7);
            fetchAndDisplayCalendar();
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            currentStartDate.setDate(currentStartDate.getDate() + 7);
            fetchAndDisplayCalendar();
        });
    }

    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            periodButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const today = new Date();
            if (button.textContent.includes('Week')) {
                currentStartDate = getStartOfWeek(today);
            } else if (button.textContent.includes('Month')) {
                currentStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
            } else {
                currentStartDate = getStartOfWeek(today);
            }
            fetchAndDisplayCalendar();
        });
    });

    // --- Initial Load ---
    fetchAndDisplayCalendar();
});