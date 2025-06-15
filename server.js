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

const CARS_FILE_PATH = path.join(__dirname, 'cars.json');
const BOOKINGS_FILE_PATH = path.join(__dirname, 'bookings.json');
const CUSTOMERS_FILE_PATH = path.join(__dirname, 'customers.json'); // NEW

// Initialize empty arrays for cars, bookings, and customers
let cars = [];
let bookings = [];
let customers = []; // NEW
let nextBookingId = 1;   // ID tự tăng cho bản ghi booking
let nextCustomerId = 1; // NEW: ID tự tăng cho khách hàng

//  Function to read JSON file
async function readData(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  // Function to write JSON file
async function writeData(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
    }
  }

// --- Đọc dữ liệu ---
async function loadData() {
    try {
        const carsData = await fs.readFile(CARS_FILE_PATH, 'utf-8');
        cars = JSON.parse(carsData);
        
        const bookingsData = await fs.readFile(BOOKINGS_FILE_PATH, 'utf-8');
        bookings = JSON.parse(bookingsData);

        const customersData = await fs.readFile(CUSTOMERS_FILE_PATH, 'utf-8'); // NEW
        customers = JSON.parse(customersData); // NEW

        if (bookings.length > 0) {
            const maxBookingId = bookings.reduce((max, b) => b.id > max ? b.id : max, 0);
            nextBookingId = maxBookingId + 1;
        } else {
            nextBookingId = 1;
        }
        console.log('Bookings data loaded. Next Booking ID:', nextBookingId);

        if (customers.length > 0) { // NEW: Cập nhật nextCustomerId
            const maxCustomerId = customers.reduce((max, c) => {
                const idNum = parseInt(c.id.replace('customer_', '')); // Chuyển "customer_X" thành số
                return idNum > max ? idNum : max;
            }, 0);
            nextCustomerId = maxCustomerId + 1;
        } else {
            nextCustomerId = 1;
        }
        console.log('Customers data loaded. Next Customer ID:', nextCustomerId); // NEW


        } catch (error) {
        console.warn('Error loading data or files not found, initializing with example data:', error.message);
        // Khởi tạo dữ liệu mẫu cho car và booking nếu file không tồn tại hoặc rỗng
        cars = [
            { "id": "VF8-29A12345", "make": "VinFast", "model": "VF 8 Eco", "year": 2024, "pricePerDay": 80, "available": true, "imageUrl": "assets/images/cars/vinfast_vf8.png", "specifications": { "bodyType": "SUV", "transmission": "AT", "fuelType": "Electric", "seats": 5 }, "features": ["AC", "GPS", "Bluetooth", "Reverse Camera"], "location": "Hanoi", "type": "SUV", "seats": 5 }, // Thêm type, seats ở ngoài cho dễ filter
            { "id": "CAMRY-30E98765", "make": "Toyota", "model": "Camry", "year": 2022, "pricePerDay": 50, "available": true, "imageUrl": "assets/images/cars/toyota_camry.png", "specifications": { "bodyType": "Sedan", "transmission": "AT", "fuelType": "Petrol", "seats": 5 }, "features": ["AC", "Airbag", "Bluetooth"], "location": "Ho Chi Minh City", "type": "Sedan", "seats": 5 },
            { "id": "CIVIC-51K54321", "make": "Honda", "model": "Civic", "year": 2023, "pricePerDay": 45, "available": true, "imageUrl": "assets/images/placeholder-car.png", "specifications": { "bodyType": "Sedan", "transmission": "AT", "fuelType": "Petrol", "seats": 5 }, "features": ["AC", "USB Port"], "location": "Da Nang", "type": "Sedan", "seats": 5 }
        ];
        bookings = [];
        nextBookingId = 1;
        customers = []; // NEW: Khởi tạo rỗng hoặc với dữ liệu mẫu
        nextCustomerId = 1; // NEW
        await saveData();
        }
}

// --- Lưu dữ liệu ---
async function saveData() {
    try {
        await fs.writeFile(CARS_FILE_PATH, JSON.stringify(cars, null, 2), 'utf-8');
        await fs.writeFile(BOOKINGS_FILE_PATH, JSON.stringify(bookings, null, 2), 'utf-8');
        await fs.writeFile(CUSTOMERS_FILE_PATH, JSON.stringify(customers, null, 2), 'utf-8'); // NEW
        // console.log('Data saved successfully.');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

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


// --- Admin Car API Endpoints ---
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

// Admin Bookings API Endpoints

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

// --- Admin Customer API Endpoints (NEW) ---
// GET all customers
app.get('/admin/customers', (req, res) => {
    // Trong ứng dụng thực tế, không bao giờ gửi mật khẩu (dù đã hash) ra frontend.
    // Chỉ gửi các trường cần thiết.
    const customersWithoutPasswords = customers.map(({ password, ...rest }) => rest);
    res.json(customersWithoutPasswords);
});

// POST a new customer (Admin creates user)
app.post('/admin/customers', async (req, res) => {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
        return res.status(400).json({ message: 'Name, Phone, Email, and Password are required.' });
    }

    // Check for existing customer (by phone or email)
    const customerExists = customers.some(c => c.phone === phone || c.email === email);
    if (customerExists) {
        return res.status(400).json({ message: 'Customer with this phone or email already exists.' });
    }

    const newCustomer = {
        id: `customer_${nextCustomerId++}`, // Generate unique ID
        name,
        phone,
        email,
        password, // In real app: HASH THIS PASSWORD!
        registeredAt: new Date().toISOString()
    };
    customers.push(newCustomer);
    await saveData();
    console.log('Admin added new customer:', newCustomer.id);
    res.status(201).json({ message: 'Customer added successfully', customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, phone: newCustomer.phone } });
});

// PUT (Update) an existing customer by ID
app.put('/admin/customers/:customerId', async (req, res) => {
    const customerIdParam = req.params.customerId;
    const customerIndex = customers.findIndex(c => c.id === customerIdParam);

    if (customerIndex === -1) {
        return res.status(404).json({ message: `Customer with ID ${customerIdParam} not found` });
    }

    const { name, phone, email, password } = req.body;
    const updatedCustomer = { ...customers[customerIndex] };

    if (name !== undefined) updatedCustomer.name = name;
    if (phone !== undefined) updatedCustomer.phone = phone;
    if (email !== undefined) updatedCustomer.email = email;
    if (password !== undefined && password !== '') { // Only update password if provided and not empty
        updatedCustomer.password = password; // In real app: HASH THIS PASSWORD!
    }

    customers[customerIndex] = updatedCustomer;
    await saveData();
    console.log('Admin updated customer ID:', customerIdParam);
    res.json({ message: 'Customer updated successfully', customer: { id: updatedCustomer.id, name: updatedCustomer.name, email: updatedCustomer.email, phone: updatedCustomer.phone } });
});

// DELETE a customer by ID
app.delete('/admin/customers/:customerId', async (req, res) => {
    const customerIdParam = req.params.customerId;
    const customerIndex = customers.findIndex(c => c.id === customerIdParam);

    if (customerIndex === -1) {
        return res.status(404).json({ message: `Customer with ID ${customerIdParam} not found` });
    }

    // Optional: Check if customer has active bookings before deleting
    const customerHasBookings = bookings.some(b => b.customerEmail === customers[customerIndex].email); // Giả sử booking liên kết qua email
    if (customerHasBookings) {
        // Trong thực tế, bạn có thể cấm xóa hoặc chuyển trạng thái khách hàng thành 'Inactive'
        console.warn(`Attempting to delete customer ${customerIdParam} who has bookings.`);
        // return res.status(400).json({ message: `Customer ${customerIdParam} has existing bookings. Cannot delete.` });
    }

    const deletedCustomer = customers.splice(customerIndex, 1);
    await saveData();
    console.log('Admin deleted customer ID:', customerIdParam);
    res.json({ message: 'Customer deleted successfully', customer: deletedCustomer[0] });
});

// NEW: Client-side Login API (if you decide to implement direct user login/signup)
// POST /api/signup
app.post('/api/signup', async (req, res) => {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
        return res.status(400).json({ message: 'Name, Phone, Email, and Password are required.' });
    }

    const customerExists = customers.some(c => c.phone === phone || c.email === email);
    if (customerExists) {
        return res.status(400).json({ message: 'User with this phone number or email already exists.' });
    }

    const newCustomer = {
        id: `customer_${nextCustomerId++}`,
        name,
        phone,
        email,
        password, // AGAIN: HASH THIS PASSWORD IN REAL APP!
        registeredAt: new Date().toISOString()
    };
    customers.push(newCustomer);
    await saveData();
    console.log('Client registered new user:', newCustomer.id);
    res.status(201).json({ message: 'Registration successful! You can now log in.', user: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email } });
});
// POST /api/login
app.post('/api/login', async (req, res) => {
    const { identifier, password } = req.body; // identifier can be email or phone
    const user = customers.find(c => (c.email === identifier || c.phone === identifier));

    if (!user || user.password !== password) { // In real app: compare hashed password
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    // In real app: create and return a JWT token or session
    res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
});


// --- Start the server ---
async function startServer() {
    await loadData();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();