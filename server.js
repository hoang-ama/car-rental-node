// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

// Cấu hình Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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
                <h2 style="color: #e67e22; margin-top: 0;">Dear ${booking.customerName},</h2>

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
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin-public')));

// Redirect /admin to admin-login.html
app.get('/admin', (req, res) => {
    res.redirect('/admin/admin-login.html');
});


// ----------------------------------------------------
// MONGODB CONNECTION VÀ SCHEMAS
// ----------------------------------------------------

// Kết nối đến MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Định nghĩa Car Schema
const carSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    available: { type: Boolean, default: true },
    imageUrl: { type: String, default: '' },
    location: { type: String, required: true },
    specifications: {
        bodyType: { type: String, default: 'N/A' },
        transmission: { type: String, default: 'N/A' },
        fuelType: { type: String, default: 'N/A' },
        seats: { type: Number, default: 4 }
    },
    features: [{ type: String }],
    isFeatured: { type: Boolean, default: false }
});

// Định nghĩa Booking Schema
const bookingSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    carId: { type: String, required: true },
    carMake: { type: String, required: true },
    carModel: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    customerEmail: { type: String },
    notes: { type: String },
    pickupLocation: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paymentMethod: { type: String },
    totalPrice: { type: Number, required: true },
    baseCost: { type: Number },
    servicesCost: { type: Number },
    depositAmount: { type: Number },
    status: { type: String, default: 'Pending' },
    bookingDate: { type: Date, default: Date.now },
    appliedPromotionCode: { type: String }

});

// Định nghĩa Customer Schema
const customerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    registeredAt: { type: Date, default: Date.now },
    cccd_passport: { type: String, default: 'N/A' },
    driving_license: { type: String, default: 'N/A' },
    other_doc: { type: String, default: 'N/A' },
    motorbike_status: { type: String, default: 'N/A' },
    motorbike_plate: { type: String, default: 'N/A' },
    address: { type: String, default: 'N/A' },
    dob: { type: Date },
    loyalty: { type: String, default: 'Good (90/100)' },
    status: { type: String, default: 'Active' }
});

// Định nghĩa Promotion Schema
const promotionSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    discountType: { type: String, required: true, enum: ['percentage', 'fixed'] },
    discountValue: { type: Number, required: true, min: 0 },
    applicableCarMakes: [{ type: String }],
    applicableLocations: [{ type: String }],
    minRentalDays: { type: Number, min: 1, default: 1 },
    maxRentalDays: { type: Number, min: 1 },
    minTotalPrice: { type: Number, min: 0, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0 }
});

// Định nghĩa AdditionalService Schema
const additionalServiceSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    pricePerDay: { type: Number, required: true, min: 0 }
});

// Định nghĩa Setting Schema
const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, default: 'global_settings' },
    systemName: { type: String, default: 'Vshare Car Rental' },
    defaultPickupTime: { type: String, default: '07:00' },
    defaultReturnTime: { type: String, default: '19:00' },
    masterCarMakes: [{ type: String }],
    masterCarFeatures: [{ type: String }],
    rentalLocations: [{ type: String }],
    rentalProcedures: {
        requiredDocuments: [{ type: String }],
        securityDepositOptions: [{ type: String }],
        distanceLimitations: [{ type: String }],
        otherRegulations: [{ type: String }]
    },
}, { timestamps: true });


// Tạo Models từ Schemas
const Car = mongoose.model('Car', carSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Promotion = mongoose.model('Promotion', promotionSchema); 
const AdditionalService = mongoose.model('AdditionalService', additionalServiceSchema);
const Setting = mongoose.model('Setting', settingSchema);


// Hàm để lấy ID booking tiếp theo (tự tăng)
async function getNextBookingId() {
    const lastBooking = await Booking.findOne().sort({ id: -1 });
    return lastBooking ? lastBooking.id + 1 : 1;
}

// Hàm để lấy ID khách hàng tiếp theo (tự tăng)
async function getNextCustomerId() {
    const lastCustomer = await Customer.findOne().sort({ _id: -1 });
    if (lastCustomer && lastCustomer.id) {
        const idNum = parseInt(lastCustomer.id.replace('customer_', ''));
        return `customer_${idNum + 1}`;
    }
    return 'customer_1';
}

// Hàm để cập nhật trạng thái khả dụng của xe
async function updateCarAvailability(carId, isAvailable) {
    try {
        const car = await Car.findOne({ id: carId });
        if (car && car.available !== isAvailable) {
            car.available = isAvailable;
            await car.save();
            console.log(`Car ID ${carId} availability updated to: ${isAvailable}`);
        }
    } catch (error) {
        console.error(`Error updating car availability for ${carId}:`, error);
    }
}

// ----------------------------------------------------
// API Endpoints để sử dụng Mongoose Models
// ----------------------------------------------------

// API endpoint to fetch cars
app.get('/api/cars', async (req, res) => {
    try {
        const location = req.query.location;
        let query = { available: true };
        if (location && location !== "Any Location") {
            query.location = location;
        }
        const cars = await Car.find(query);
        res.json(cars);
    } catch (error) {
        console.error('Error in /api/cars:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET specific car by ID
app.get('/api/cars/:carId', async (req, res) => {
    const carIdParam = req.params.carId;
    try {
        const car = await Car.findOne({ id: carIdParam });
        if (car) {
            res.json(car);
        } else {
            res.status(404).json({ message: 'Car not found' });
        }
    } catch (error) {
        console.error('Error fetching car details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/bookings', async (req, res) => {
    const {
        carId,
        customerName, customerPhone, customerEmail, notes,
        pickupLocation, startDate, endDate,
        paymentMethod, totalPrice, baseCost, servicesCost, depositAmount, appliedPromotionCode
    } = req.body;

    if (!carId || !customerName || !startDate || !endDate || totalPrice === undefined) {
        return res.status(400).json({ message: 'Car ID, Customer Name, Start Date, End Date, and Total Price are required for booking.' });
    }

    try {
        const car = await Car.findOne({ id: carId });
        if (!car) {
            return res.status(404).json({ message: `Car with ID ${carId} not found for booking.` });
        }

        if (!car.available) {
            return res.status(400).json({ message: 'Car is not available.' });
        }

        const sDate = new Date(startDate);
        const eDate = new Date(endDate);
        sDate.setHours(0, 0, 0, 0);
        eDate.setHours(0, 0, 0, 0);

        if (eDate < sDate) {
            return res.status(400).json({ message: 'Return date must be on or after pick-up date.' });
        }

        const timeDiff = Math.abs(eDate.getTime() - sDate.getTime());
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        let basePrice = car.pricePerDay * diffDays;
        let finalPrice = basePrice;
        let discountAmount = 0;

        let appliedPromotion = null;
        if (appliedPromotionCode) {
            const promotion = await Promotion.findOne({ code: appliedPromotionCode.toUpperCase(), isActive: true });

            if (promotion) {
                const now = new Date();
                const promoStartDate = new Date(promotion.startDate);
                const promoEndDate = new Date(promotion.endDate);

                const isPromoValid = (now >= promoStartDate && now <= promoEndDate) &&
                                     (!promotion.usageLimit || promotion.usedCount < promotion.usageLimit) &&
                                     (promotion.applicableCarMakes.length === 0 || promotion.applicableCarMakes.includes(car.make)) &&
                                     (promotion.applicableLocations.length === 0 || promotion.applicableLocations.includes(car.location)) &&
                                     (diffDays >= promotion.minRentalDays) &&
                                     (!promotion.maxRentalDays || diffDays <= promotion.maxRentalDays) &&
                                     (basePrice >= promotion.minTotalPrice);

                if (isPromoValid) {
                    if (promotion.discountType === 'percentage') {
                        discountAmount = basePrice * (promotion.discountValue / 100);
                    } else {
                        discountAmount = promotion.discountValue;
                    }
                    finalPrice = Math.max(0, basePrice - discountAmount);
                    appliedPromotion = promotion;
                } else {
                    console.warn(`Promotion ${appliedPromotionCode} found but not applicable or invalid for this specific booking criteria.`);
                }
            } else {
                console.warn(`Promotion code ${appliedPromotionCode} not found or inactive in database.`);
            }
        }

        const newBookingId = await getNextBookingId();

        const newBooking = new Booking({
            id: newBookingId,
            carId: car.id,
            carMake: car.make,
            carModel: car.model,
            customerName,
            customerPhone,
            customerEmail,
            notes,
            pickupLocation: pickupLocation || car.location,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            paymentMethod,
            totalPrice: finalPrice,
            baseCost: basePrice,
            servicesCost: 0,
            depositAmount: 0,
            status: 'Pending',
            bookingDate: new Date(),
            appliedPromotionCode: appliedPromotion ? appliedPromotion.code : null

        });

        await newBooking.save();
        console.log('New Booking by client:', newBooking);

        if (appliedPromotion) {
            await Promotion.updateOne({ _id: appliedPromotion._id }, { $inc: { usedCount: 1 } });
            console.log(`Promotion ${appliedPromotion.code} used. New count for this promo: ${appliedPromotion.usedCount + 1}`);
        }

        if (customerEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await sendBookingConfirmationEmail(newBooking);
        } else {
            console.warn(`Cannot send confirmation email for booking #${newBooking.id}: Missing customer email or email credentials.`);
        }
        
        console.log('New booking created:', newBooking);
        res.status(201).json({ message: 'Booking successful!', booking: newBooking });


    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// GET bookings for a specific customer
app.get('/api/my-bookings', async (req, res) => {
    const customerEmail = req.query.email;
    if (!customerEmail) {
        return res.status(400).json({ message: 'Customer email is required.' });
    }
    try {
        const customerBookings = await Booking.find({ customerEmail: customerEmail }).sort({ bookingDate: -1 });
        res.json(customerBookings);
    } catch (error) {
        console.error('Error fetching my bookings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API to apply promotion code
app.post('/api/apply-promotion', async (req, res) => {
    const { code, carId, startDate, endDate, basePrice, location, carMake } = req.body;

    if (!code || !carId || !startDate || !endDate || basePrice === undefined || !location || !carMake) {
        return res.status(400).json({ message: 'Missing required fields for promotion application (code, carId, dates, basePrice, location, carMake).' });
    }

    try {
        const promotion = await Promotion.findOne({ code: code.toUpperCase(), isActive: true });

        if (!promotion) {
            return res.status(404).json({ message: 'Promotion code does not exist or is inactive.' });
        }

        const now = new Date();
        const promoStartDate = new Date(promotion.startDate);
        const promoEndDate = new Date(promotion.endDate);

        if (now < promoStartDate || now > promoEndDate) {
            return res.status(400).json({ message: 'Promotion code has expired or is not yet active.' });
        }

        if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
            return res.status(400).json({ message: 'Promotion code has reached its usage limit.' });
        }

        const car = await Car.findOne({ id: carId });
        if (!car) {
            return res.status(404).json({ message: 'Car not found for promotion validation.' });
        }

        const rentalStartDate = new Date(startDate);
        const rentalEndDate = new Date(endDate);
        const timeDiff = Math.abs(rentalEndDate.getTime() - rentalStartDate.getTime());
        const rentalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

        if (promotion.applicableCarMakes && promotion.applicableCarMakes.length > 0 && !promotion.applicableCarMakes.includes(car.make)) {
            return res.status(400).json({ message: `Promotion code does not apply to ${car.make} vehicles.` });
        }
        if (promotion.applicableLocations && promotion.applicableLocations.length > 0 && !promotion.applicableLocations.includes(car.location)) {
            return res.status(400).json({ message: `Promotion code does not apply to ${car.location} location.` });
        }
        if (promotion.minRentalDays && rentalDays < promotion.minRentalDays) {
            return res.status(400).json({ message: `Promotion code requires a minimum rental of ${promotion.minRentalDays} days.` });
        }
        if (promotion.maxRentalDays && rentalDays > promotion.maxRentalDays) {
            return res.status(400).json({ message: `Promotion code applies for a maximum rental of ${promotion.maxRentalDays} days.` });
        }
        if (promotion.minTotalPrice && basePrice < promotion.minTotalPrice) {
            return res.status(400).json({ message: `Promotion code requires a minimum total price of $${promotion.minTotalPrice}.` });
        }

        let discountAmount = 0;
        if (promotion.discountType === 'percentage') {
            discountAmount = basePrice * (promotion.discountValue / 100);
        } else {
            discountAmount = promotion.discountValue;
        }

        const finalPrice = Math.max(0, basePrice - discountAmount);

        res.json({
            message: 'Promotion code is valid.',
            promotion: promotion.toObject(),
            discountAmount: discountAmount,
            finalPrice: finalPrice
        });

    } catch (error) {
        console.error('Error applying promotion:', error);
        res.status(500).json({ message: 'Server error when applying promotion.', error: error.message });
    }
});


// --- Admin API Endpoints for listing all bookings/customers ---

// GET all bookings (for admin list)
app.get('/api/bookings', async (req, res) => {
    const customerEmail = req.query.email;
    try {
        if (customerEmail) {
            const filteredBookings = await Booking.find({ customerEmail: customerEmail });
            res.json(filteredBookings);
        } else {
            const allBookings = await Booking.find({});
            res.json(allBookings);
        }
    } catch (error) {
        console.error('Error fetching bookings (admin/api):', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// --- Admin Car API Endpoints ---
app.get('/admin/cars', async (req, res) => {
    try {
        const cars = await Car.find({});
        res.json(cars);
    } catch (error) {
        console.error('Error fetching admin cars:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/admin/cars', async (req, res) => {
    const {
        id,
        make, model, year, pricePerDay, available = true, imageUrl = '',
        location, specifications, features, isFeatured = false
    } = req.body;

    if (!id || !make || !model || !year || pricePerDay === undefined || !location || !specifications || !features) {
        return res.status(400).json({ message: 'Vehicle ID (unique), make, model, year, price, location, specifications, and features are required.' });
    }

    try {
        const existingCar = await Car.findOne({ id: id });
        if (existingCar) {
            return res.status(400).json({ message: `Car with Vehicle ID ${id} already exists.` });
        }

        const newCar = new Car({
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
            features: Array.isArray(features) ? features : [],
            isFeatured: Boolean(isFeatured)
        });

        await newCar.save();
        console.log('Admin added new car:', newCar);
        res.status(201).json({ message: 'Car added successfully by admin', car: newCar });
    } catch (error) {
        console.error('Error adding new car:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

app.put('/admin/cars/:carIdToUpdate', async (req, res) => {
    const carIdParam = req.params.carIdToUpdate;
    const {
        make, model, year, pricePerDay, available, imageUrl,
        location, specifications, features, isFeatured
    } = req.body;

    try {
        const updatedCar = await Car.findOneAndUpdate(
            { id: carIdParam },
            {
                make,
                model,
                year: parseInt(year),
                pricePerDay: parseFloat(pricePerDay),
                available: Boolean(available),
                imageUrl,
                location,
                specifications,
                features: Array.isArray(features) ? features : [],
                isFeatured: Boolean(isFeatured)
            },
            { new: true }
        );

        if (!updatedCar) {
            return res.status(404).json({ message: `Car with ID ${carIdParam} not found` });
        }
        console.log('Admin updated car ID:', carIdParam, updatedCar);
        res.json({ message: 'Car updated successfully by admin', car: updatedCar });
    } catch (error) {
        console.error('Error updating car:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

app.delete('/admin/cars/:carIdToDelete', async (req, res) => {
    const carIdParam = req.params.carIdToDelete;
    try {
        const hasBookings = await Booking.findOne({ carId: carIdParam });
        if (hasBookings) {
            console.warn(`Attempting to delete car ID ${carIdParam} which has bookings. Allowing for now, but consider implications.`);
        }

        const deletedCar = await Car.findOneAndDelete({ id: carIdParam });

        if (!deletedCar) {
            return res.status(404).json({ message: `Car with ID ${carIdParam} not found` });
        }
        console.log('Admin deleted car ID:', carIdParam);
        res.json({ message: 'Car deleted successfully by admin', car: deletedCar });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Admin Bookings API Endpoints

app.post('/admin/bookings', async (req, res) => {
    const {
        customerName, customerPhone, customerEmail, notes,
        carId,
        pickupLocation, startDate, endDate,
        paymentMethod, totalPrice, baseCost, servicesCost, depositAmount, status
    } = req.body;

    if (!customerName || !carId || !startDate || !endDate || totalPrice === undefined || !status) {
        return res.status(400).json({ message: 'Customer Name, Car ID, Start/End Dates, Total Price, and Status are required.' });
    }

    try {
        const car = await Car.findOne({ id: carId });
        if (!car) {
            return res.status(404).json({ message: `Car with ID ${carId} not found for booking.` });
        }

        const newBookingId = await getNextBookingId();

        const newBooking = new Booking({
            id: newBookingId,
            carId: car.id,
            carMake: car.make,
            carModel: car.model,
            customerName, customerPhone, customerEmail, notes,
            pickupLocation: pickupLocation || car.location,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            paymentMethod,
            totalPrice: parseFloat(totalPrice),
            baseCost: baseCost !== undefined && baseCost !== null ? parseFloat(baseCost) : null,
            servicesCost: servicesCost !== undefined && servicesCost !== null ? parseFloat(servicesCost) : null,
            depositAmount: depositAmount !== undefined && depositAmount !== null ? parseFloat(depositAmount) : null,
            status,
            bookingDate: new Date()
        });

        await newBooking.save();
        console.log('Admin created new booking:', newBooking);

        if (status === 'Confirmed' || status === 'Rented Out') {
            await updateCarAvailability(carId, false);
        }
        res.status(201).json({ message: 'Booking created successfully by admin', booking: newBooking });
    } catch (error) {
        console.error('Error creating admin booking:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

app.put('/admin/bookings/:bookingId', async (req, res) => {
    const bookingIdParam = parseInt(req.params.bookingId);
    const {
        customerName, customerPhone, customerEmail, notes,
        carId,
        pickupLocation, startDate, endDate,
        paymentMethod, totalPrice, baseCost, servicesCost, depositAmount, status
    } = req.body;

    try {
        const existingBooking = await Booking.findOne({ id: bookingIdParam });
        if (!existingBooking) {
            return res.status(404).json({ message: `Booking with ID ${bookingIdParam} not found` });
        }

        const oldStatus = existingBooking.status;
        const currentCarId = existingBooking.carId;

        let updatedFields = {
            customerName, customerPhone, customerEmail, notes,
            pickupLocation,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            paymentMethod,
            totalPrice: parseFloat(totalPrice),
            baseCost: baseCost !== undefined && baseCost !== null ? parseFloat(baseCost) : existingBooking.baseCost,
            servicesCost: servicesCost !== undefined && servicesCost !== null ? parseFloat(servicesCost) : existingBooking.servicesCost,
            depositAmount: depositAmount !== undefined && depositAmount !== null ? parseFloat(depositAmount) : existingBooking.depositAmount,
            status
        };

        if (carId !== undefined && carId !== currentCarId) {
            const newCar = await Car.findOne({ id: carId });
            if (!newCar) {
                return res.status(404).json({ message: `New car with ID ${carId} not found for booking update.` });
            }
            updatedFields.carId = newCar.id;
            updatedFields.carMake = newCar.make;
            updatedFields.carModel = newCar.model;
        }

        const updatedBooking = await Booking.findOneAndUpdate(
            { id: bookingIdParam },
            { $set: updatedFields },
            { new: true }
        );

        console.log('Admin updated booking ID:', bookingIdParam, updatedBooking);

        if (oldStatus !== updatedBooking.status || (carId !== undefined && carId !== currentCarId)) {
            if (oldStatus === 'Confirmed' || oldStatus === 'Rented Out') {
                const carStillBookedOld = await Booking.findOne({
                    carId: currentCarId,
                    $or: [{ status: 'Confirmed' }, { status: 'Rented Out' }],
                    id: { $ne: updatedBooking.id }
                });
                if (!carStillBookedOld) {
                    await updateCarAvailability(currentCarId, true);
                }
            }

            if (updatedBooking.status === 'Confirmed' || updatedBooking.status === 'Rented Out') {
                await updateCarAvailability(updatedBooking.carId, false);
            } else if (updatedBooking.status === 'Cancelled by Customer' || updatedBooking.status === 'Cancelled by Admin' || updatedBooking.status === 'Completed') {
                const carStillBookedNew = await Booking.findOne({
                    carId: updatedBooking.carId,
                    $or: [{ status: 'Confirmed' }, { status: 'Rented Out' }]
                });
                if (!carStillBookedNew) {
                    await updateCarAvailability(updatedBooking.carId, true);
                }
            }
        }
        res.json({ message: 'Booking updated successfully by admin', booking: updatedBooking });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

app.delete('/admin/bookings/:bookingId', async (req, res) => {
    const bookingIdParam = parseInt(req.params.bookingId);
    try {
        const deletedBooking = await Booking.findOneAndDelete({ id: bookingIdParam });

        if (!deletedBooking) {
            return res.status(404).json({ message: `Booking with ID ${bookingIdParam} not found` });
        }
        console.log('Admin deleted booking ID:', bookingIdParam);

        const deletedCarId = deletedBooking.carId;
        const carStillBooked = await Booking.findOne({
            carId: deletedCarId,
            $or: [{ status: 'Confirmed' }, { status: 'Rented Out' }]
        });
        if (!carStillBooked) {
            await updateCarAvailability(deletedCarId, true);
        }

        res.json({ message: 'Booking deleted successfully by admin', booking: deletedBooking });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// --- Admin Customer API Endpoints ---
app.get('/admin/customers', async (req, res) => {
    try {
        const customersWithoutPasswords = await Customer.find({}, { password: 0 });
        res.json(customersWithoutPasswords);
    } catch (error) {
        console.error('Error fetching admin customers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET a single customer by ID
app.get('/admin/customers/:customerId', async (req, res) => {
    const customerIdParam = req.params.customerId;
    try {
        const customer = await Customer.findOne({ id: customerIdParam }, { password: 0 });
        if (customer) {
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        console.error('Error fetching single customer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// POST a new customer (Admin creates user)
app.post('/admin/customers', async (req, res) => {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
        return res.status(400).json({ message: 'Name, Phone, Email, and Password are required.' });
    }

    try {
        const customerExists = await Customer.findOne({ $or: [{ phone: phone }, { email: email }] });
        if (customerExists) {
            return res.status(400).json({ message: 'Customer with this phone or email already exists.' });
        }

        const newCustomerId = await getNextCustomerId();

        const newCustomer = new Customer({
            id: newCustomerId,
            name,
            phone,
            email,
            password,
            registeredAt: new Date()
        });
        await newCustomer.save();
        console.log('Admin added new customer:', newCustomer.id);
        const { password: _, ...customerWithoutPassword } = newCustomer.toObject();
        res.status(201).json({ message: 'Customer added successfully', customer: customerWithoutPassword });
    } catch (error) {
        console.error('Error adding new customer:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// PUT (Update) an existing customer by ID
app.put('/admin/customers/:customerId', async (req, res) => {
    const customerIdParam = req.params.customerId;
    const { name, phone, email, password } = req.body;

    try {
        const updatedFields = {};
        if (name !== undefined) updatedFields.name = name;
        if (phone !== undefined) updatedFields.phone = phone;
        if (email !== undefined) updatedFields.email = email;
        if (password !== undefined && password !== '') {
            const saltRounds = 10;
            updatedFields.password = await bcrypt.hash(password, saltRounds);
        }

        const updatedCustomer = await Customer.findOneAndUpdate(
            { id: customerIdParam },
            { $set: updatedFields },
            { new: true, projection: { password: 0 } }
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: `Customer with ID ${customerIdParam} not found` });
        }
        console.log('Admin updated customer ID:', customerIdParam);
        res.json({ message: 'Customer updated successfully', customer: updatedCustomer });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// DELETE a customer by ID
app.delete('/admin/customers/:customerId', async (req, res) => {
    const customerIdParam = req.params.customerId;
    try {
        const customerToDelete = await Customer.findOne({ id: customerIdParam });
        if (!customerToDelete) {
            return res.status(404).json({ message: `Customer with ID ${customerIdParam} not found` });
        }

        const customerHasBookings = await Booking.findOne({ customerEmail: customerToDelete.email });
        if (customerHasBookings) {
            console.warn(`Attempting to delete customer ${customerIdParam} who has bookings. Allowing for now.`);
        }

        const deletedCustomer = await Customer.findOneAndDelete({ id: customerIdParam });
        console.log('Admin deleted customer ID:', customerIdParam);
        res.json({ message: 'Customer deleted successfully', customer: deletedCustomer });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


// --- Admin Promotion API Endpoints ---

// GET all promotions
app.get('/admin/promotions', async (req, res) => {
    try {
        const promotions = await Promotion.find({});
        res.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// GET a single promotion by code
app.get('/admin/promotions/:code', async (req, res) => {
    const promoCode = req.params.code.toUpperCase();
    try {
        const promotion = await Promotion.findOne({ code: promoCode });
        if (promotion) {
            res.json(promotion);
        } else {
            res.status(404).json({ message: 'Promotion code not found' });
        }
    } catch (error) {
        console.error('Error fetching single promotion:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// POST a new promotion
app.post('/admin/promotions', async (req, res) => {
    const {
        code, description, discountType, discountValue,
        applicableCarMakes, applicableLocations,
        minRentalDays, maxRentalDays, minTotalPrice,
        startDate, endDate, isActive, usageLimit
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !startDate || !endDate) {
        return res.status(400).json({ message: 'Code, Discount Type, Discount Value, Start Date, and End Date are required.' });
    }
    if (!['percentage', 'fixed'].includes(discountType)) {
        return res.status(400).json({ message: 'Discount Type must be "percentage" or "fixed".' });
    }
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
        return res.status(400).json({ message: 'Percentage discount value must be between 0 and 100.' });
    }

    try {
        const existingPromotion = await Promotion.findOne({ code: code.toUpperCase() });
        if (existingPromotion) {
            return res.status(400).json({ message: `Promotion code ${code.toUpperCase()} already exists.` });
        }

        const newPromotion = new Promotion({
            code: code.toUpperCase(),
            description,
            discountType,
            discountValue: parseFloat(discountValue),
            applicableCarMakes: Array.isArray(applicableCarMakes) ? applicableCarMakes : [],
            applicableLocations: Array.isArray(applicableLocations) ? applicableLocations : [],
            minRentalDays: minRentalDays ? parseInt(minRentalDays) : undefined,
            maxRentalDays: maxRentalDays ? parseInt(maxRentalDays) : undefined,
            minTotalPrice: minTotalPrice ? parseFloat(minTotalPrice) : undefined,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: isActive !== undefined ? Boolean(isActive) : true,
            usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
            usedCount: 0
        });

        await newPromotion.save();
        console.log('Admin added new promotion:', newPromotion.code);
        res.status(201).json({ message: 'Promotion added successfully', promotion: newPromotion });
    } catch (error) {
        console.error('Error adding new promotion:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// PUT (Update) an existing promotion
app.put('/admin/promotions/:code', async (req, res) => {
    const promoCode = req.params.code.toUpperCase();
    const {
        description, discountType, discountValue,
        applicableCarMakes, applicableLocations,
        minRentalDays, maxRentalDays, minTotalPrice,
        startDate, endDate, isActive, usageLimit, usedCount
    } = req.body;

    try {
        const updatedFields = {
            description,
            discountType,
            discountValue: parseFloat(discountValue),
            applicableCarMakes: Array.isArray(applicableCarMakes) ? applicableCarMakes : [],
            applicableLocations: Array.isArray(applicableLocations) ? applicableLocations : [],
            minRentalDays: minRentalDays ? parseInt(minRentalDays) : undefined,
            maxRentalDays: maxRentalDays ? parseInt(maxRentalDays) : undefined,
            minTotalPrice: minTotalPrice ? parseFloat(minTotalPrice) : undefined,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: isActive !== undefined ? Boolean(isActive) : true,
            usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
            usedCount: usedCount !== undefined ? parseInt(usedCount) : undefined
        };

        const updatedPromotion = await Promotion.findOneAndUpdate(
            { code: promoCode },
            { $set: updatedFields },
            { new: true }
        );

        if (!updatedPromotion) {
            return res.status(404).json({ message: `Promotion code ${promoCode} not found` });
        }
        console.log('Admin updated promotion code:', promoCode, updatedPromotion);
        res.json({ message: 'Promotion updated successfully', promotion: updatedPromotion });
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// DELETE a promotion
app.delete('/admin/promotions/:code', async (req, res) => {
    const promoCode = req.params.code.toUpperCase();
    try {
        const deletedPromotion = await Promotion.findOneAndDelete({ code: promoCode });

        if (!deletedPromotion) {
            return res.status(404).json({ message: `Promotion code ${promoCode} not found` });
        }
        console.log('Admin deleted promotion code:', promoCode);
        res.json({ message: 'Promotion deleted successfully', promotion: deletedPromotion });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// --- Admin Additional Services API Endpoints ---

// GET all additional services
app.get('/admin/additional-services', async (req, res) => {
    try {
        const services = await AdditionalService.find({});
        res.json(services);
    } catch (error) {
        console.error('Error fetching additional services:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// POST a new additional service
app.post('/admin/additional-services', async (req, res) => {
    const { name, pricePerDay } = req.body;
    if (!name || pricePerDay === undefined || pricePerDay < 0) {
        return res.status(400).json({ message: 'Service Name and Price are required, and price must be non-negative.' });
    }
    try {
        const existingService = await AdditionalService.findOne({ name: name });
        if (existingService) {
            return res.status(400).json({ message: `Service "${name}" already exists.` });
        }
        const newService = new AdditionalService({ name, pricePerDay: parseFloat(pricePerDay) });
        await newService.save();
        console.log('Admin added new service:', newService.name);
        res.status(201).json({ message: 'Service added successfully', service: newService });
    } catch (error) {
        console.error('Error adding new service:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// PUT (Update) an existing additional service
app.put('/admin/additional-services/:id', async (req, res) => {
    const serviceId = req.params.id;
    const { name, pricePerDay } = req.body;
    if (!name || pricePerDay === undefined || pricePerDay < 0) {
        return res.status(400).json({ message: 'Service Name and Price are required, and price must be non-negative.' });
    }
    try {
        const updatedService = await AdditionalService.findByIdAndUpdate(
            serviceId,
            { name, pricePerDay: parseFloat(pricePerDay) },
            { new: true }
        );
        if (!updatedService) {
            return res.status(404).json({ message: 'Service not found.' });
        }
        console.log('Admin updated service:', updatedService.name);
        res.json({ message: 'Service updated successfully', service: updatedService });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// DELETE an additional service
app.delete('/admin/additional-services/:id', async (req, res) => {
    const serviceId = req.params.id;
    try {
        const deletedService = await AdditionalService.findByIdAndDelete(serviceId);
        if (!deletedService) {
            return res.status(404).json({ message: 'Service not found.' });
        }
        console.log('Admin deleted service:', deletedService.name);
        res.json({ message: 'Service deleted successfully', service: deletedService });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// --- Admin Settings API Endpoints ---

// Helper to ensure a single settings document exists
async function getGlobalSettings() {
    let settings = await Setting.findOne({ key: 'global_settings' });
    if (!settings) {
        settings = new Setting({ key: 'global_settings' });
        await settings.save();
        console.log('Initialized global settings document.');
    }
    return settings;
}

// GET global settings
app.get('/admin/settings', async (req, res) => {
    try {
        const settings = await getGlobalSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// PUT (Update) global settings
app.put('/admin/settings', async (req, res) => {
    const { systemName, defaultPickupTime, defaultReturnTime,
            masterCarMakes, masterCarFeatures, rentalLocations,
            rentalProcedures } = req.body;
    try {
        const updatedSettings = await Setting.findOneAndUpdate(
            { key: 'global_settings' },
            {
                systemName,
                defaultPickupTime,
                defaultReturnTime,
                masterCarMakes: Array.isArray(masterCarMakes) ? masterCarMakes : [],
                masterCarFeatures: Array.isArray(masterCarFeatures) ? masterCarFeatures : [],
                rentalLocations: Array.isArray(rentalLocations) ? rentalLocations : [],
                rentalProcedures: rentalProcedures
            },
            { new: true, upsert: true }
        );
        console.log('Admin updated settings:', updatedSettings);
        res.json({ message: 'Settings updated successfully', settings: updatedSettings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// --- Admin Reports API Endpoints ---

// GET Bookings & Revenue Report
app.get('/admin/reports/bookings-revenue', async (req, res) => {
    const { period, location } = req.query;
    try {
        let matchQuery = {};
        let groupFormat = {};
        
        if (location && location !== 'All') {
            matchQuery.pickupLocation = location;
        }

        const now = new Date();
        if (period === 'weekly') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            matchQuery.bookingDate = { $gte: startOfWeek };
            groupFormat = {
                year: { $year: "$bookingDate" },
                week: { $week: "$bookingDate" }
            };
        } else if (period === 'monthly') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            matchQuery.bookingDate = { $gte: startOfMonth };
            groupFormat = {
                year: { $year: "$bookingDate" },
                month: { $month: "$bookingDate" }
            };
        }

        const reportData = await Booking.aggregate([
            { $match: matchQuery },
            { $group: {
                _id: groupFormat.year && groupFormat.month ? groupFormat : null,
                totalBookings: { $sum: 1 },
                totalRevenue: { $sum: "$totalPrice" },
                confirmedBookings: { $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, 1, 0] } },
                cancelledBookings: { $sum: { $regex: ["$status", "Cancelled", "i"] } }
            }},
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } }
        ]);

        res.json(reportData);
    } catch (error) {
        console.error('Error fetching bookings/revenue report:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// GET Car Exploitation Report
app.get('/admin/reports/car-exploitation', async (req, res) => {
    const { period, carId } = req.query;
    try {
        let matchQuery = {};
        let groupFormat = {};

        if (carId && carId !== 'All') {
            matchQuery.carId = carId;
        }

        const now = new Date();
        if (period === 'weekly') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            matchQuery.bookingDate = { $gte: startOfWeek };
            groupFormat = { year: { $year: "$bookingDate" }, week: { $week: "$bookingDate" } };
        } else if (period === 'monthly') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            matchQuery.bookingDate = { $gte: startOfMonth };
            groupFormat = { year: { $year: "$bookingDate" }, month: { $month: "$bookingDate" } };
        }

        const reportData = await Booking.aggregate([
            { $match: matchQuery },
            { $group: {
                _id: {
                    carId: "$carId",
                    carMake: "$carMake",
                    carModel: "$carModel",
                    period: groupFormat.year ? groupFormat : null
                },
                totalBookings: { $sum: 1 },
                totalExploitationDays: { 
                    $sum: { 
                        $add: [
                            { $divide: [{ $subtract: ["$endDate", "$startDate"] }, 1000 * 60 * 60 * 24] },
                            1
                        ] 
                    } 
                },
                totalRevenue: { $sum: "$totalPrice" }
            }},
            { $sort: { "_id.carMake": 1, "_id.carModel": 1, "_id.period.year": 1, "_id.period.month": 1, "_id.period.week": 1 } }
        ]);

        res.json(reportData);
    } catch (error) {
        console.error('Error fetching car exploitation report:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


// Client-side Login API
// POST /api/signup
app.post('/api/signup', async (req, res) => {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
        return res.status(400).json({ message: 'Name, Phone, Email, and Password are required.' });
    }

    try {
        const customerExists = await Customer.findOne({ $or: [{ phone: phone }, { email: email }] });
        if (customerExists) {
            return res.status(400).json({ message: 'User with this phone number or email already exists.' });
        }
            const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);    

        const newCustomerId = await getNextCustomerId();

        const newCustomer = new Customer({
            id: newCustomerId,
            name,
            phone,
            email,
            password: hashedPassword,
            registeredAt: new Date()
        });
        await newCustomer.save();
        console.log('Client registered new user:', newCustomer.id);
        const { password: _, ...userWithoutPassword } = newCustomer.toObject();
        res.status(201).json({ message: 'Registration successful! You can now log in.', user: userWithoutPassword });
    } catch (error) {
        console.error('Error during client signup:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Cấu hình rate limiter cho /api/login
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        console.warn(`Rate limit hit for IP: ${req.ip} on /api/login`);
        res.status(429).json({ message: "Too many login attempts from this IP, please try again after 15 minutes" });
    }
});
  
// POST /api/login
app.post('/api/login', loginRateLimiter, async (req, res) => {
    const { email, password } = req.body;
    
    console.log(`Login attempt for email: ${email}`);

    try {
         if (!email || !password) {
            console.log('Login failed: Missing email or password');
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const customer = await Customer.findOne({ email });
        if (!customer) {
            console.log(`Login failed for email ${email}: Customer not found`);
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            console.log(`Login failed for email ${email}: Invalid password`);
            return res.status(400).json({ error: 'Invalid email or password' });
        }

       const { password: _, ...customerWithoutPassword } = customer.toObject();
       console.log(`Login successful for email: ${email}`);
       res.json({ message: 'Login successful', customer: customerWithoutPassword });

    } catch (error) {
        console.error('Error during client login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// NEW: Admin Login API Endpoint with Rate Limiting
const adminLoginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit 5 requests per IP per window
    message: "Too many login attempts from this IP. Please try again after 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        console.warn(`Admin Rate limit hit for IP: ${req.ip} on /api/admin/login`);
        res.status(429).json({ message: "Too many login attempts from this IP. Please try again after 15 minutes." });
    }
});

app.post('/api/admin/login', adminLoginRateLimiter, (req, res) => {
    const { email, password } = req.body;

    // Hardcoded credentials for demo purposes (as per your original admin-login-script.js)
    const ADMIN_EMAIL = 'admin@vshare.asia';
    const ADMIN_PASSWORD = 'vsh@re@123';

    console.log(`Admin login attempt for email: ${email}`);

    if (!email || !password) {
        console.log('Admin login failed: Missing email or password');
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        console.log(`Admin login successful for email: ${email}`);
        // In a real application, you would issue a JWT here
        res.json({ message: 'Login successful!', redirect: '/admin/admin-dashboard.html' });
    } else {
        console.log(`Admin login failed for email ${email}: Invalid credentials`);
        res.status(401).json({ message: 'Invalid email or password.' });
    }
});


// --- Start the server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
