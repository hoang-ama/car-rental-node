// server.js
const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Sử dụng fs.promises để thao tác file bất đồng bộ
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); 
// Middleware to serve static files (HTML, CSS, JS) from the 'public' directory for CLIENT
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to serve static files from the 'admin-public' directory for ADMIN
// Các file trong admin-public sẽ được truy cập qua /admin/ten-file.html
app.use('/admin', express.static(path.join(__dirname, 'admin-public')));



// Đường dẫn tới file JSON
const CARS_FILE_PATH = path.join(__dirname, 'cars.json');
const BOOKINGS_FILE_PATH = path.join(__dirname, 'bookings.json');

// --- Biến lưu trữ dữ liệu (sẽ được tải từ file) ---
let cars = [];
let bookings = [];
let nextCarId = 1; // Sẽ được tính toán lại dựa trên dữ liệu đã có
let nextBookingId = 1; // Sẽ được tính toán lại dựa trên dữ liệu đã có

// --- Helper functions để đọc/ghi file JSON ---
async function loadData() {
    try {
        // Đọc cars.json
        const carsData = await fs.readFile(CARS_FILE_PATH, 'utf-8');
        cars = JSON.parse(carsData);
        if (cars.length > 0) {
            // Tính nextCarId dựa trên id lớn nhất hiện có
            nextCarId = Math.max(...cars.map(c => c.id)) + 1;
        } else {
            nextCarId = 1;
        }

        // Đọc bookings.json
        const bookingsData = await fs.readFile(BOOKINGS_FILE_PATH, 'utf-8');
        bookings = JSON.parse(bookingsData);
        if (bookings.length > 0) {
            nextBookingId = Math.max(...bookings.map(b => b.id)) + 1;
        } else {
            nextBookingId = 1;
        }
        console.log('Data loaded successfully from JSON files.');
    } catch (error) {
        // Nếu file không tồn tại hoặc có lỗi, khởi tạo với mảng rỗng
        console.error('Error loading data, initializing with empty arrays:', error.message);
        cars = [];
        bookings = [];
        nextCarId = 1;
        nextBookingId = 1;
        // Tạo file nếu chưa có để lần sau không lỗi
        await saveData(); // Lưu mảng rỗng vào file
    }
}

async function saveData() {
    try {
        await fs.writeFile(CARS_FILE_PATH, JSON.stringify(cars, null, 2), 'utf-8');
        await fs.writeFile(BOOKINGS_FILE_PATH, JSON.stringify(bookings, null, 2), 'utf-8');
        console.log('Data saved successfully to JSON files.');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// --- API Endpoints cho Client (không thay đổi nhiều) ---

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
app.post('/api/bookings', async (req, res) => { // Thêm async ở đây
    const { carId, customerName, startDate, endDate } = req.body;

    if (!carId || !customerName || !startDate || !endDate) {
        return res.status(400).json({ message: 'All fields are required: carId, customerName, startDate, endDate' });
    }

    const car = cars.find(c => c.id === parseInt(carId));
    if (!car) {
        return res.status(404).json({ message: 'Car not found' });
    }
    // Tạm thời bỏ qua logic check car.available vì admin sẽ quản lý
    // if (!car.available) {
    //     return res.status(400).json({ message: 'Car is currently not available' });
    // }

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
    await saveData(); // Lưu lại bookings.json
    console.log('New Booking:', newBooking);
    res.status(201).json({ message: 'Booking successful!', booking: newBooking });
});

// GET all bookings
app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});


// --- API Endpoints cho Admin Portal ---

// POST /admin/cars - Thêm xe mới
app.post('/admin/cars', async (req, res) => {
    // TODO: Thêm xác thực admin ở đây sau này
    const { make, model, year, pricePerDay, available = true, imageUrl = '' } = req.body;

    if (!make || !model || !year || pricePerDay === undefined) {
        return res.status(400).json({ message: 'Make, model, year, and pricePerDay are required.' });
    }

    const newCar = {
        id: nextCarId++,
        make,
        model,
        year: parseInt(year),
        pricePerDay: parseFloat(pricePerDay),
        available: Boolean(available),
        imageUrl
    };
    cars.push(newCar);
    await saveData(); // Lưu lại cars.json
    res.status(201).json({ message: 'Car added successfully', car: newCar });
});

// PUT /admin/cars/:id - Cập nhật thông tin xe
app.put('/admin/cars/:id', async (req, res) => {
    // TODO: Thêm xác thực admin
    const carId = parseInt(req.params.id);
    const carIndex = cars.findIndex(c => c.id === carId);

    if (carIndex === -1) {
        return res.status(404).json({ message: 'Car not found' });
    }

    const { make, model, year, pricePerDay, available, imageUrl } = req.body;
    const updatedCar = { ...cars[carIndex] }; // Sao chép xe hiện tại

    // Cập nhật các trường nếu được cung cấp
    if (make !== undefined) updatedCar.make = make;
    if (model !== undefined) updatedCar.model = model;
    if (year !== undefined) updatedCar.year = parseInt(year);
    if (pricePerDay !== undefined) updatedCar.pricePerDay = parseFloat(pricePerDay);
    if (available !== undefined) updatedCar.available = Boolean(available);
    if (imageUrl !== undefined) updatedCar.imageUrl = imageUrl;

    cars[carIndex] = updatedCar;
    await saveData(); // Lưu lại cars.json
    res.json({ message: 'Car updated successfully', car: updatedCar });
});

// DELETE /admin/cars/:id - Xóa xe
app.delete('/admin/cars/:id', async (req, res) => {
    // TODO: Thêm xác thực admin
    const carId = parseInt(req.params.id);
    const carIndex = cars.findIndex(c => c.id === carId);

    if (carIndex === -1) {
        return res.status(404).json({ message: 'Car not found' });
    }

    // Kiểm tra xem xe có booking nào không trước khi xóa (tùy chọn)
    const hasBookings = bookings.some(booking => booking.carId === carId);
    if (hasBookings) {
        // Có thể không cho xóa hoặc đánh dấu là "archived" thay vì xóa hẳn
        // For simplicity now, we'll allow deletion.
        // Hoặc bạn có thể trả về lỗi:
        // return res.status(400).json({ message: 'Car has existing bookings and cannot be deleted. Consider marking it as unavailable.' });
    }

    const deletedCar = cars.splice(carIndex, 1);
    await saveData(); // Lưu lại cars.json
    res.json({ message: 'Car deleted successfully', car: deletedCar[0] });
});


// DELETE /admin/bookings/:id - Xóa một đơn đặt xe
app.delete('/admin/bookings/:id', async (req, res) => {
    // TODO: Thêm xác thực admin ở đây sau này
    const bookingId = parseInt(req.params.id);
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
        return res.status(404).json({ message: 'Booking not found' });
    }

    const deletedBooking = bookings.splice(bookingIndex, 1);
    await saveData(); // Lưu lại thay đổi vào bookings.json
    
    // Lấy thông tin xe liên quan đến booking đã xóa để có thể log hoặc trả về
    // (Phần này tùy chọn, có thể không cần thiết nếu chỉ trả về message)
    const carDetails = cars.find(car => car.id === deletedBooking[0].carId);

    console.log(`Admin deleted booking ID: ${bookingId} for car: ${carDetails ? carDetails.make + ' ' + carDetails.model : 'N/A'}`);
    res.json({ message: 'Booking deleted successfully by admin', booking: deletedBooking[0] });
});

// POST /admin/bookings - Admin tạo một đơn đặt xe mới
app.post('/admin/bookings', async (req, res) => {
    // TODO: Thêm xác thực admin
    const { customerName, carId, startDate, endDate, carMake, carModel } = req.body; // Thêm carMake, carModel từ client

    if (!customerName || !carId || !startDate || !endDate) {
        return res.status(400).json({ message: 'Customer name, car ID, start date, and end date are required.' });
    }

    const carExists = cars.find(c => c.id === parseInt(carId));
    if (!carExists) {
        return res.status(404).json({ message: 'Selected car not found.' });
    }
    // Có thể thêm kiểm tra car.available ở đây nếu admin không được phép đặt xe unavailable
    // if (!carExists.available) {
    //     return res.status(400).json({ message: 'Selected car is not available for booking.' });
    // }

    const newBooking = {
        id: nextBookingId++, // nextBookingId được quản lý bởi loadData()
        customerName,
        carId: parseInt(carId),
        carMake: carMake || carExists.make, // Ưu tiên thông tin gửi lên, nếu không có thì lấy từ cars.json
        carModel: carModel || carExists.model,
        startDate,
        endDate,
        bookingDate: new Date().toISOString(),
        // status: status || 'pending' // Nếu có trường status
    };

    bookings.push(newBooking);
    await saveData(); // Lưu lại bookings.json
    res.status(201).json({ message: 'Booking created successfully by admin', booking: newBooking });
});

// PUT /admin/bookings/:id - Admin cập nhật một đơn đặt xe
app.put('/admin/bookings/:id', async (req, res) => {
    // TODO: Thêm xác thực admin
    const bookingId = parseInt(req.params.id);
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
        return res.status(404).json({ message: 'Booking not found' });
    }

    const { customerName, carId, startDate, endDate, carMake, carModel } = req.body; // Thêm carMake, carModel

    // Lấy booking hiện tại để cập nhật
    const updatedBooking = { ...bookings[bookingIndex] };

    if (customerName !== undefined) updatedBooking.customerName = customerName;
    if (startDate !== undefined) updatedBooking.startDate = startDate;
    if (endDate !== undefined) updatedBooking.endDate = endDate;
    // if (status !== undefined) updatedBooking.status = status;

    if (carId !== undefined) {
        const carExists = cars.find(c => c.id === parseInt(carId));
        if (!carExists) {
            return res.status(404).json({ message: 'Selected car for update not found.' });
        }
        updatedBooking.carId = parseInt(carId);
        updatedBooking.carMake = carMake || carExists.make; // Cập nhật lại carMake, carModel nếu carId thay đổi
        updatedBooking.carModel = carModel || carExists.model;
    } else { // Nếu không có carId mới, nhưng có carMake/Model mới (ví dụ chỉ sửa tên xe)
        if (carMake !== undefined) updatedBooking.carMake = carMake;
        if (carModel !== undefined) updatedBooking.carModel = carModel;
    }
    
    bookings[bookingIndex] = updatedBooking;
    await saveData(); // Lưu lại bookings.json
    res.json({ message: 'Booking updated successfully by admin', booking: updatedBooking });
});


// --- Start the server ---
async function startServer() {
    await loadData(); // Tải dữ liệu trước khi server bắt đầu nhận request
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Deployed app accessible at: https://car-rental-node.onrender.com (Frontend might need to point to this if deployed backend changes URL)`);
    });
}

startServer(); // Gọi hàm để khởi động server