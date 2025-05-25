// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- In-memory Data Store (Replace with a database in a real app) ---
let cars = [
    { id: 1, make: 'Toyota', model: 'Camry', year: 2022, pricePerDay: 50, available: true, imageUrl: 'https://via.placeholder.com/150/FF0000/FFFFFF?Text=ToyotaCamry' },
    { id: 2, make: 'Honda', model: 'Civic', year: 2023, pricePerDay: 45, available: true, imageUrl: 'https://via.placeholder.com/150/0000FF/FFFFFF?Text=HondaCivic' },
    { id: 3, make: 'Ford', model: 'Mustang', year: 2022, pricePerDay: 70, available: false, imageUrl: 'https://via.placeholder.com/150/00FF00/FFFFFF?Text=FordMustang' },
    { id: 4, make: 'BMW', model: 'X5', year: 2023, pricePerDay: 100, available: true, imageUrl: 'https://via.placeholder.com/150/FFFF00/000000?Text=BMWX5' }
];
let bookings = [];
let nextBookingId = 1;

// --- API Endpoints ---

// GET all cars
app.get('/api/cars', (req, res) => {
    res.json(cars);
});

// GET a specific car by ID
app.get('/api/cars/:id', (req, res) => {
    const carId = parseInt(req.params.id);
    const car = cars.find(c => c.id === carId);
    if (car) {
        res.json(car);
    } else {
        res.status(404).json({ message: 'Car not found' });
    }
});

// POST (create) a new booking
app.post('/api/bookings', (req, res) => {
    const { carId, customerName, startDate, endDate } = req.body;

    if (!carId || !customerName || !startDate || !endDate) {
        return res.status(400).json({ message: 'All fields are required: carId, customerName, startDate, endDate' });
    }

    const car = cars.find(c => c.id === parseInt(carId));
    if (!car) {
        return res.status(404).json({ message: 'Car not found' });
    }
    if (!car.available) {
        return res.status(400).json({ message: 'Car is currently not available' });
    }

    // Very simple availability check (in a real app, this needs to be robust)
    // This doesn't truly prevent double bookings for date ranges effectively
    // For a real app, you'd check if the car is booked during the requested date range.
    const existingBookingForCar = bookings.find(b => b.carId === car.id &&
        // Simplified: assumes a car is booked if ANY booking exists for it.
        // A real check would compare start/end dates of new and existing bookings.
        true
    );

    // Let's refine this: for simplicity, we'll make the car unavailable once booked.
    // In a real app, manage availability by date ranges.
    // For this example, we'll just mark the car as unavailable.
    // This isn't ideal for a rental system but keeps the logic simple for now.

    const newBooking = {
        id: nextBookingId++,
        carId: car.id,
        carMake: car.make,
        carModel: car.model,
        customerName,
        startDate,
        endDate,
        bookingDate: new Date().toISOString()
    };

    bookings.push(newBooking);
    // Mark the car as unavailable for this simplified example
    // car.available = false; // Re-enable this if you want a car to be bookable only once

    console.log('New Booking:', newBooking);
    res.status(201).json({ message: 'Booking successful!', booking: newBooking });
});

// GET all bookings
app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

// --- Start the server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});