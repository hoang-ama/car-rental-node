// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin-public')));

// File paths
// const carsFile = path.join(__dirname, 'cars.json');
const CARS_FILE_PATH = path.join(__dirname, 'cars.json');

const BOOKINGS_FILE_PATH = path.join(__dirname, 'bookings.json');

let cars = [];
let bookings = [];
let nextBookingId = 1;   // ID tự tăng cho bản ghi booking

// Helper function to read JSON file
async function readData(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  // Helper function to write JSON file
async function writeData(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
    }
  }

// --- Helper Functions ---
async function loadData() {
    try {
        const carsData = await fs.readFile(CARS_FILE_PATH, 'utf-8');
        cars = JSON.parse(carsData);
        console.log('Cars data loaded. Number of cars:', cars.length);

        const bookingsData = await fs.readFile(BOOKINGS_FILE_PATH, 'utf-8');
        bookings = JSON.parse(bookingsData);
        if (bookings.length > 0) {
            const maxBookingId = bookings.reduce((max, b) => b.id > max ? b.id : max, 0);
            nextBookingId = maxBookingId + 1;
        } else {
            nextBookingId = 1;
        }
        console.log('Bookings data loaded. Next Booking ID:', nextBookingId);
    } catch (error) {
        console.warn('Error loading data or files not found, initializing with example data:', error.message);
        // Khởi tạo dữ liệu mẫu nếu file không tồn tại hoặc rỗng
        cars = [
            { "id": "VF8-29A12345", "make": "VinFast", "model": "VF 8 Eco", "year": 2024, "pricePerDay": 80, "available": true, "imageUrl": "assets/images/cars/vinfast_vf8.png", "specifications": { "bodyType": "SUV", "transmission": "AT", "fuelType": "Electric", "seats": 5 }, "features": ["AC", "GPS", "Bluetooth", "Reverse Camera"], "location": "Hanoi", "type": "SUV", "seats": 5 }, // Thêm type, seats ở ngoài cho dễ filter
            { "id": "CAMRY-30E98765", "make": "Toyota", "model": "Camry", "year": 2022, "pricePerDay": 50, "available": true, "imageUrl": "assets/images/cars/toyota_camry.png", "specifications": { "bodyType": "Sedan", "transmission": "AT", "fuelType": "Petrol", "seats": 5 }, "features": ["AC", "Airbag", "Bluetooth"], "location": "Ho Chi Minh City", "type": "Sedan", "seats": 5 },
            { "id": "CIVIC-51K54321", "make": "Honda", "model": "Civic", "year": 2023, "pricePerDay": 45, "available": true, "imageUrl": "assets/images/placeholder-car.png", "specifications": { "bodyType": "Sedan", "transmission": "AT", "fuelType": "Petrol", "seats": 5 }, "features": ["AC", "USB Port"], "location": "Danang", "type": "Sedan", "seats": 5 }
        ];
        bookings = [];
        nextBookingId = 1;
        await saveData();
    }
}

async function saveData() {
    try {
        await fs.writeFile(CARS_FILE_PATH, JSON.stringify(cars, null, 2), 'utf-8');
        await fs.writeFile(BOOKINGS_FILE_PATH, JSON.stringify(bookings, null, 2), 'utf-8');
        // console.log('Data saved successfully.');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// --- Client API Endpoints ---

// API endpoint to fetch cars
app.get('/api/cars', async (req, res) => {
  try {
    const cars = await readData(CARS_FILE_PATH);
    const location = req.query.location;
    let filteredCars = cars.filter(car => car.available); // Only return available cars
    if (location && location !== "AnyLocation") {
      filteredCars = filteredCars.filter(car => car.location === location);
    }
    res.json(filteredCars);
  } catch (error) {
    console.error('Error in /api/cars:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/api/cars/:carId', (req, res) => { 
    const carIdParam = req.params.carId;
    const car = cars.find(c => c.id === carIdParam);
    if (car) {
        res.json(car);
    } else {
        res.status(404).json({ message: 'Car not found' });
    }
});

app.post('/api/bookings', async (req, res) => {
    const {
        carId, 
        customerName, customerPhone, customerEmail, notes,
        pickupLocation, startDate, endDate,
        paymentMethod, totalPrice, baseCost, servicesCost, depositAmount
    } = req.body;

    if (!carId || !customerName || !startDate || !endDate || totalPrice === undefined) {
        return res.status(400).json({ message: 'Car ID, Customer Name, Start Date, End Date, and Total Price are required for booking.' });
    }

    const car = cars.find(c => c.id === carId);
    if (!car) {
        return res.status(404).json({ message: `Car with ID ${carId} not found for booking.` });
    }
    
    const newBooking = {
        id: nextBookingId++, 
        carId: car.id, 
        carMake: car.make, 
        carModel: car.model, 
        customerName,
        customerPhone,
        customerEmail,
        notes,
        pickupLocation: pickupLocation || car.location, 
        startDate, 
        endDate,   
        paymentMethod,
        totalPrice: parseFloat(totalPrice),
        baseCost: baseCost ? parseFloat(baseCost) : null,
        servicesCost: servicesCost ? parseFloat(servicesCost) : null,
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        status: 'Pending', 
        bookingDate: new Date().toISOString()
    };
    bookings.push(newBooking);
    await saveData();
    console.log('New Booking by client:', newBooking);
    res.status(201).json({ message: 'Booking successful!', booking: newBooking });
});

app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});


// --- Admin API Endpoints ---
app.get('/admin/cars', (req, res) => {
    res.json(cars);
});

app.post('/admin/cars', async (req, res) => {
    const {
        id, 
        make, model, year, pricePerDay, available = true, imageUrl = '',
        location, specifications, features
    } = req.body;

    if (!id || !make || !model || !year || pricePerDay === undefined || !location || !specifications || !features) {
        return res.status(400).json({ message: 'Vehicle ID (unique), make, model, year, price, location, specifications, and features are required.' });
    }
    if (cars.find(c => c.id === id)) {
        return res.status(400).json({ message: `Car with Vehicle ID ${id} already exists.` });
    }

    const newCar = {
        id: id, 
        make, model,
        year: parseInt(year),
        pricePerDay: parseFloat(pricePerDay),
        available: Boolean(available),
        imageUrl, location,
        specifications: {
            bodyType: specifications.bodyType || 'N/A',
            transmission: specifications.transmission || 'N/A',
            fuelType: specifications.fuelType || 'N/A',
            seats: specifications.seats ? parseInt(specifications.seats) : 4 
        },
        features: Array.isArray(features) ? features : []
    };
    cars.push(newCar);
    await saveData();
    console.log('Admin added new car:', newCar);
    res.status(201).json({ message: 'Car added successfully by admin', car: newCar });
});

app.put('/admin/cars/:carIdToUpdate', async (req, res) => {
    const carIdParam = req.params.carIdToUpdate; // Đây là ID duy nhất (VD: biển số)
    const carIndex = cars.findIndex(c => c.id === carIdParam);

    if (carIndex === -1) {
        return res.status(404).json({ message: `Car with ID ${carIdParam} not found` });
    }

    const {
        make, model, year, pricePerDay, available, imageUrl,
        location, specifications, features
    } = req.body;

    const updatedCar = { ...cars[carIndex] }; 

    if (make !== undefined) updatedCar.make = make;
    if (model !== undefined) updatedCar.model = model;
    if (year !== undefined) updatedCar.year = parseInt(year);
    if (pricePerDay !== undefined) updatedCar.pricePerDay = parseFloat(pricePerDay);
    if (available !== undefined) updatedCar.available = Boolean(available);
    if (imageUrl !== undefined) updatedCar.imageUrl = imageUrl;
    if (location !== undefined) updatedCar.location = location;
// Chỉ cập nhật specifications nếu nó được gửi lên và là một object
if (specifications && typeof specifications === 'object') {
    // Đảm bảo rằng updatedCar.specifications tồn tại trước khi gán thuộc tính
    if (!updatedCar.specifications) {
        updatedCar.specifications = {};
    }
    if (specifications.bodyType !== undefined) updatedCar.specifications.bodyType = specifications.bodyType;
    if (specifications.transmission !== undefined) updatedCar.specifications.transmission = specifications.transmission;
    if (specifications.fuelType !== undefined) updatedCar.specifications.fuelType = specifications.fuelType;
    if (specifications.seats !== undefined) updatedCar.specifications.seats = parseInt(specifications.seats);
}

if (features && Array.isArray(features)) { // Cập nhật mảng features
    updatedCar.features = features;
}
    
    cars[carIndex] = updatedCar;
    await saveData();
    console.log('Admin updated car ID:', carIdParam, updatedCar);
    res.json({ message: 'Car updated successfully by admin', car: updatedCar });
});

app.delete('/admin/cars/:carIdToDelete', async (req, res) => {
    const carIdParam = req.params.carIdToDelete; // ID duy nhất của xe
    const carIndex = cars.findIndex(c => c.id === carIdParam);

    if (carIndex === -1) {
        return res.status(404).json({ message: `Car with ID ${carIdParam} not found` });
    }
    const hasBookings = bookings.some(booking => booking.carId === carIdParam);
    if (hasBookings) {
        // return res.status(400).json({ message: `Car ID ${carIdParam} has existing bookings. Consider marking it as unavailable.` });
        console.warn(`Attempting to delete car ID ${carIdParam} which has bookings. Allowed for now.`);
    }
    const deletedCar = cars.splice(carIndex, 1);
    await saveData();
    console.log('Admin deleted car ID:', carIdParam);
    res.json({ message: 'Car deleted successfully by admin', car: deletedCar[0] });
});

app.get('/admin/bookings', (req, res) => {
    res.json(bookings);
});

app.post('/admin/bookings', async (req, res) => {
    const {
        customerName, customerPhone, customerEmail, notes,
        carId, // vehicleId của xe
        pickupLocation, startDate, endDate,
        paymentMethod, totalPrice, baseCost, servicesCost, depositAmount, status
    } = req.body;

    if (!customerName || !carId || !startDate || !endDate || totalPrice === undefined || !status) {
        return res.status(400).json({ message: 'Customer Name, Car ID, Start/End Dates, Total Price, and Status are required.' });
    }

    const car = cars.find(c => c.id === carId);
    if (!car) {
        return res.status(404).json({ message: `Car with ID ${carId} not found for booking.` });
    }

    const newBooking = {
        id: nextBookingId++,
        carId: car.id,
        carMake: car.make,
        carModel: car.model,
        customerName, customerPhone, customerEmail, notes,
        pickupLocation: pickupLocation || car.location,
        startDate, endDate,
        paymentMethod,
        totalPrice: parseFloat(totalPrice),
        baseCost: baseCost !== undefined && baseCost !== null ? parseFloat(baseCost) : null,
        servicesCost: servicesCost !== undefined && servicesCost !== null ? parseFloat(servicesCost) : null,
        depositAmount: depositAmount !== undefined && depositAmount !== null ? parseFloat(depositAmount) : null,
        status,
        bookingDate: new Date().toISOString()
    };
    bookings.push(newBooking);
    await saveData();
    console.log('Admin created new booking:', newBooking);
    res.status(201).json({ message: 'Booking created successfully by admin', booking: newBooking });
});

app.put('/admin/bookings/:bookingId', async (req, res) => {
    const bookingIdParam = parseInt(req.params.bookingId); // ID tự tăng của booking
    const bookingIndex = bookings.findIndex(b => b.id === bookingIdParam);

    if (bookingIndex === -1) {
        return res.status(404).json({ message: `Booking with ID ${bookingIdParam} not found` });
    }

    const {
        customerName, customerPhone, customerEmail, notes,
        carId, // vehicleId của xe
        pickupLocation, startDate, endDate,
        paymentMethod, totalPrice, baseCost, servicesCost, depositAmount, status
    } = req.body;

    const updatedBooking = { ...bookings[bookingIndex] };

    if (customerName !== undefined) updatedBooking.customerName = customerName;
    if (customerPhone !== undefined) updatedBooking.customerPhone = customerPhone;
    if (customerEmail !== undefined) updatedBooking.customerEmail = customerEmail;
    if (notes !== undefined) updatedBooking.notes = notes;
    if (pickupLocation !== undefined) updatedBooking.pickupLocation = pickupLocation;
    if (startDate !== undefined) updatedBooking.startDate = startDate;
    if (endDate !== undefined) updatedBooking.endDate = endDate;
    if (paymentMethod !== undefined) updatedBooking.paymentMethod = paymentMethod;
    if (totalPrice !== undefined) updatedBooking.totalPrice = parseFloat(totalPrice);
    updatedBooking.baseCost = baseCost !== undefined && baseCost !== null ? parseFloat(baseCost) : updatedBooking.baseCost;
    updatedBooking.servicesCost = servicesCost !== undefined && servicesCost !== null ? parseFloat(servicesCost) : updatedBooking.servicesCost;
    updatedBooking.depositAmount = depositAmount !== undefined && depositAmount !== null ? parseFloat(depositAmount) : updatedBooking.depositAmount;
    if (status !== undefined) updatedBooking.status = status;

    if (carId !== undefined && carId !== updatedBooking.carId) {
        const car = cars.find(c => c.id === carId);
        if (!car) {
            return res.status(404).json({ message: `Car with Vehicle ID ${carId} not found for booking update.` });
        }
        updatedBooking.carId = car.id;
        updatedBooking.carMake = car.make;
        updatedBooking.carModel = car.model;
    }

    bookings[bookingIndex] = updatedBooking;
    await saveData();
    console.log('Admin updated booking ID:', bookingIdParam, updatedBooking);
    res.json({ message: 'Booking updated successfully by admin', booking: updatedBooking });
});

app.delete('/admin/bookings/:bookingId', async (req, res) => {
    const bookingIdParam = parseInt(req.params.bookingId); // ID tự tăng của booking
    const bookingIndex = bookings.findIndex(b => b.id === bookingIdParam);

    if (bookingIndex === -1) {
        return res.status(404).json({ message: `Booking with ID ${bookingIdParam} not found` });
    }
    const deletedBooking = bookings.splice(bookingIndex, 1);
    await saveData();
    console.log('Admin deleted booking ID:', bookingIdParam);
    res.json({ message: 'Booking deleted successfully by admin', booking: deletedBooking[0] });
});

// --- Start the server ---
async function startServer() {
    await loadData();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();