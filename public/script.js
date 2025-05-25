// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    const carsListDiv = document.getElementById('cars-list');
    const carSelect = document.getElementById('car-select');
    const bookingForm = document.getElementById('booking-form');
    const bookingMessageDiv = document.getElementById('booking-message');
    const bookingsListUl = document.getElementById('bookings-list');

    // --- Fetch and Display Cars ---
    async function fetchAndDisplayCars() {
        try {
            const response = await fetch('/api/cars');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const cars = await response.json();

            carsListDiv.innerHTML = ''; // Clear existing cars
            carSelect.innerHTML = '<option value="">--Select a Car--</option>'; // Clear and add default option

            cars.forEach(car => {
                // Display car in the list
                const carDiv = document.createElement('div');
                carDiv.classList.add('car-item');
                carDiv.innerHTML = `
                    <img src="${car.imageUrl || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?Text=No+Image'}" alt="${car.make} ${car.model}">
                    <h3>${car.make} ${car.model} (${car.year})</h3>
                    <p>Price: $${car.pricePerDay}/day</p>
                    <p class="${car.available ? 'available' : 'unavailable'}">
                        ${car.available ? 'Available' : 'Currently Unavailable'}
                    </p>
                `;
                carsListDiv.appendChild(carDiv);

                // Populate car select dropdown only if available
                if (car.available) {
                    const option = document.createElement('option');
                    option.value = car.id;
                    option.textContent = `${car.make} ${car.model} - $${car.pricePerDay}/day`;
                    carSelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error fetching cars:', error);
            carsListDiv.innerHTML = '<p>Error loading cars. Please try again later.</p>';
        }
    }

    // --- Handle Booking Form Submission ---
    bookingForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        bookingMessageDiv.textContent = '';
        bookingMessageDiv.className = ''; // Clear previous classes

        const formData = new FormData(bookingForm);
        const bookingDetails = {
            carId: parseInt(formData.get('carId')),
            customerName: formData.get('customerName'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
        };

        // Basic validation for dates
        if (new Date(bookingDetails.endDate) < new Date(bookingDetails.startDate)) {
            bookingMessageDiv.textContent = 'End date cannot be earlier than start date.';
            bookingMessageDiv.className = 'error';
            return;
        }
        if (!bookingDetails.carId) {
            bookingMessageDiv.textContent = 'Please select a car.';
            bookingMessageDiv.className = 'error';
            return;
        }


        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingDetails),
            });

            const result = await response.json();

            if (response.ok) { // Status 200-299
                bookingMessageDiv.textContent = result.message || 'Booking successful!';
                bookingMessageDiv.className = 'success';
                bookingForm.reset();
                fetchAndDisplayCars(); // Refresh car list (availability might change)
                fetchAndDisplayBookings(); // Refresh bookings list
            } else {
                bookingMessageDiv.textContent = result.message || 'Booking failed. Please try again.';
                bookingMessageDiv.className = 'error';
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            bookingMessageDiv.textContent = 'An unexpected error occurred. Please try again.';
            bookingMessageDiv.className = 'error';
        }
    });

    // --- Fetch and Display Bookings ---
    async function fetchAndDisplayBookings() {
        try {
            const response = await fetch('/api/bookings');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const bookings = await response.json();

            bookingsListUl.innerHTML = ''; // Clear existing bookings
            if (bookings.length === 0) {
                bookingsListUl.innerHTML = '<li>No bookings yet.</li>';
                return;
            }

            bookings.forEach(booking => {
                const li = document.createElement('li');
                const startDate = new Date(booking.startDate).toLocaleDateString();
                const endDate = new Date(booking.endDate).toLocaleDateString();
                li.textContent = `ID: ${booking.id} - ${booking.customerName} booked ${booking.carMake} ${booking.carModel} from ${startDate} to ${endDate}.`;
                bookingsListUl.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching bookings:', error);
            bookingsListUl.innerHTML = '<li>Error loading bookings.</li>';
        }
    }


    // Initial data load
    fetchAndDisplayCars();
    fetchAndDisplayBookings();
});