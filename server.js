// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

require('dotenv').config(); // THÊM DÒNG NÀY ĐỂ TẢI BIẾN MÔI TRƯỜNG
const nodemailer = require('nodemailer'); // THÊM DÒNG NÀY ĐỂ SỬ DỤNG NODEMAILER

// Cấu hình Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Hoặc 'Outlook', hoặc 'smtp.yourdomain.com'
    auth: {
        user: process.env.EMAIL_USER, // Lấy từ biến môi trường
        pass: process.env.EMAIL_PASS  // Lấy từ biến môi trường
    }
});

// Hàm gửi email xác nhận booking
async function sendBookingConfirmationEmail(booking) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.customerEmail,
        subject: `[Vshare] Confirm Booking #${booking.id}`,
        html: `
        <div style="font-family: Montserrat, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">

        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #eee;">
            <img src="https://vshare.asia/assets/logo/logo.png" alt="Vshare Logo" style="max-height: 45px; display: block; margin: 0 auto;">
        </div>
        
        <div style="padding: 25px; background-color: #ffffff;">
                <h2 style="color: #e67e22; margin-top: 0;">Dear <span class="math-inline">${booking.customerName},</h2\>

    <p>Thank you for choosing Vshare! Your booking has been confirmed with the following details:</p>  
    <h3 style="color: #2c3e50;">Booking Information:</h3>

    <ul style="list-style: none; padding: 0; margin: 0 0 15px 0;">
<li style="margin-bottom: 8px;"><strong>Booking ID:</strong> #${booking.id}</li>
<li style="margin-bottom: 8px;"><strong>Customer Name:</strong> ${booking.customerName}</li>
<li style="margin-bottom: 8px;"><strong>Email:</strong> ${booking.customerEmail}</li>
<li style="margin-bottom: 8px;"><strong>Phone:</strong> ${booking.customerPhone}</li>
<li style="margin-bottom: 8px;"><strong>Vehicle Rented:</strong> ${booking.carMake} ${booking.carModel} </li>
<li style="margin-bottom: 8px;"><strong>Pickup Location:</strong> ${booking.pickupLocation}</li>
<li style="margin-bottom: 8px;"><strong>Rental Period:</strong> From ${new Date(booking.startDate).toLocaleString('en-US')} to ${new Date(booking.endDate).toLocaleString('en-US')}</li>
<li style="margin-bottom: 8px;"><strong>Total Price:</strong> $${Number(booking.totalPrice).toLocaleString('en-US')}</li>
<li style="margin-bottom: 8px;"><strong>Payment Method:</strong> ${booking.paymentMethod}</li>

${booking.depositAmount > 0 ? `<li style="margin-bottom: 8px;"><strong>Deposit Amount:</strong> $${Number(booking.depositAmount).toLocaleString('en-US')}</strong></li>` : ''}
<li style="margin-bottom: 8px;"><strong>Status:</strong> ${booking.status}</li>
</ul>

    <p>We will contact you soon to finalize the vehicle pickup arrangements.</p>
    <p>Should you have any questions, please contact our hotline: <strong>0903.229.906</strong></p>
    <p>Sincerely,<br/>Vshare Team</p>
        </div>

    <div style="background-color: #212529; color: #adb5bd; padding: 20px 25px; font-size: 0.85em; text-align: center;">
                    <p style="margin-top: 0; margin-bottom: 10px; font-weight: bold; color: #fff;">Vshare, Car Rental at Vinhomes</p>
                    <p style="margin-bottom: 5px;"><a href="mailto:contact@vshare.asia" style="color: #adb5bd; text-decoration: none;">contact@vshare.asia</a></p>
                    <p style="margin-bottom: 15px;">Phone: <a href="tel:0903229906" style="color: #adb5bd; text-decoration: none;">0903.229.906</a> (8:00 AM - 9:00 PM)</p>
                    <p style="margin-bottom: 0; color: #6c757d;">Copyright &copy; 2025 by Vshare. All rights reserved.</p>
    </div>
                
    <p style="font-size: 0.8em; color: #777;"><i>This is an automated email, please do not reply directly.</i></p>
</div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email of booking #${booking.id} sent successfully to ${booking.customerEmail}`);
    } catch (error) {
        console.error(`Error sending confirmation email to booking #${booking.id}:`, error);
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin-public')));

// NEW: Redirect /admin to admin-login.html
app.get('/admin', (req, res) => {
    // In a real app, you would check authentication here.
    // For this setup, we'll redirect to the login page.
    res.redirect('/admin/admin-login.html'); // Redirect to login page
});

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
  // Add updateCarAvailability function to update car availability
  async function updateCarAvailability(carId, isAvailable) {
    const carIndex = cars.findIndex(c => c.id === carId);
    if (carIndex !== -1) {
        if (cars[carIndex].available !== isAvailable) { // Chỉ cập nhật nếu trạng thái thay đổi
            cars[carIndex].available = isAvailable;
            await saveData(); // Lưu lại cars.json
            console.log(`Car ID ${carId} availability updated to: ${isAvailable}`);
        }
    } else {
        console.warn(`Attempted to update availability for non-existent car ID: ${carId}`);
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
        // status field không có trong payload từ client frontend, mặc định là 'Pending'
    } = req.body;

    if (!carId || !customerName || !startDate || !endDate || totalPrice === undefined) {
        return res.status(400).json({ message: 'Car ID, Customer Name, Start Date, End Date, and Total Price are required for booking.' });
    }

    const car = cars.find(c => c.id === carId);
    if (!car) {
        return res.status(404).json({ message: `Car with ID ${carId} not found for booking.` });
    }
    const newBookingStatus = 'Pending'; // Hoặc lấy từ req.body nếu client có thể gửi status ban đầu

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
        status: newBookingStatus, // Sử dụng trạng thái mặc định
        bookingDate: new Date().toISOString()
    };
    bookings.push(newBooking);
    await saveData();
    console.log('New Booking by client:', newBooking);

// GỬI EMAIL XÁC NHẬN BOOKING (THÊM DÒNG NÀY)
    // Đảm bảo newBooking có customerEmail trước khi gọi hàm
    if (newBooking.customerEmail) {
        await sendBookingConfirmationEmail(newBooking);
    } else {
        console.warn(`Không thể gửi email xác nhận cho booking #${newBooking.id}: Thiếu email khách hàng.`);
    }

    // ✅ Cập nhật trạng thái xe nếu booking mới có trạng thái làm xe không khả dụng
    if (newBookingStatus === 'Confirmed' || newBookingStatus === 'Rented Out') {
    await updateCarAvailability(carId, false);  
    }
    res.status(201).json({ message: 'Booking successful!', booking: newBooking });
});
// GET bookings for a specific customer (NEW)
app.get('/api/my-bookings', (req, res) => {
    // Trong một ứng dụng thực tế, bạn sẽ lấy customer ID từ session/JWT token
    // được gửi trong header của request, không phải từ query param như thế này
    // vì query param rất dễ bị giả mạo.
    const customerEmail = req.query.email; // Ví dụ đơn giản lấy từ email
    
    if (!customerEmail) {
        return res.status(400).json({ message: 'Customer email is required.' });
    }

    const customerBookings = bookings.filter(b => b.customerEmail === customerEmail);
    
    res.json(customerBookings);
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

// GET all bookings (for admin list)
// Lọc bookings dựa trên email khách hàng (ko dùng customerID được vì trong booking (json) không có trường customerID)

app.get('/admin/bookings', (req, res) => {
    const customerEmail = req.query.email;
    if (customerEmail) {
        const filteredBookings = bookings.filter(b => b.customerEmail === customerEmail);
        res.json(filteredBookings);
    } else {
        res.json(bookings);
    }
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

    // ✅ ĐỊNH NGHĨA oldStatus TẠI ĐÂY, SAU KHI bookingIndex ĐÃ ĐƯỢC KIỂM TRA
    const oldStatus = bookings[bookingIndex].status; // Lấy trạng thái cũ từ booking hiện có
    const currentCarId = bookings[bookingIndex].carId; // Lấy carId của booking hiện tại

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
    updatedBooking.servicesCost = servicesCost !== undefined && servicesCost !== null ? parseFloat(servicesCost) :              updatedBooking.servicesCost;
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

    // ✅ LOGIC MỚI: Cập nhật trạng thái available của xe
    // Nếu trạng thái thay đổi và liên quan đến tình trạng khả dụng của xe
    if (oldStatus !== updatedBooking.status) {
        if (updatedBooking.status === 'Confirmed' || updatedBooking.status === 'Rented Out') {
            await updateCarAvailability(currentCarId, false); // Xe không còn khả dụng
        } else if (oldStatus === 'Confirmed' || oldStatus === 'Rented Out') {
            // Nếu trạng thái cũ là 'Confirmed' hoặc 'Rented Out' và trạng thái mới không phải là vậy
            // Thì kiểm tra xem còn booking nào khác đang chiếm dụng xe đó không
            const carStillBooked = bookings.some(b => 
                b.carId === currentCarId && 
                (b.status === 'Confirmed' || b.status === 'Rented Out') &&
                b.id !== updatedBooking.id // Loại trừ booking hiện tại nếu nó đang được cập nhật
            );
            if (!carStillBooked) {
                await updateCarAvailability(currentCarId, true); // Xe trở lại khả dụng nếu không bị chiếm bởi booking khác
            }
        } else if (updatedBooking.status === 'Cancelled by Customer' || updatedBooking.status === 'Cancelled by Admin' || updatedBooking.status === 'Completed') {
            // Nếu trạng thái chuyển sang Hủy hoặc Hoàn thành, kiểm tra để set lại available
            const carStillBooked = bookings.some(b => 
                b.carId === currentCarId && 
                (b.status === 'Confirmed' || b.status === 'Rented Out')
            );
            if (!carStillBooked) {
                await updateCarAvailability(currentCarId, true);
            }
        }
    }
    // ✅ KẾT THÚC LOGIC MỚI
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

    // ✅ LOGIC MỚI: Cập nhật trạng thái available của xe sau khi xóa booking
    const deletedCarId = deletedBooking[0].carId;
    // Kiểm tra xem còn booking nào khác đang chiếm dụng xe này không
    const carStillBooked = bookings.some(b => 
        b.carId === deletedCarId && 
        (b.status === 'Confirmed' || b.status === 'Rented Out')
    );
    if (!carStillBooked) {
        await updateCarAvailability(deletedCarId, true); // Xe trở lại khả dụng
    }
    // ✅ KẾT THÚC LOGIC MỚI

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

// NEW: GET a single customer by ID
app.get('/admin/customers/:customerId', (req, res) => {
    const customerIdParam = req.params.customerId;
    const customer = customers.find(c => c.id === customerIdParam);
    if (customer) {
        // In real app: do not send password.
        const { password, ...customerWithoutPassword } = customer;
        res.json(customerWithoutPassword);
    } else {
        res.status(404).json({ message: 'Customer not found' });
    }
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
    res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
});


// --- Start the server ---
async function startServer() {
    await loadData();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();