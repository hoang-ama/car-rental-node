Simple Car Rental

1. Backend (Node.js with Express.js):

server.js: The main file for our server.
Express.js: A minimal and flexible Node.js web application framework that we'll use to create API endpoints.
API Endpoints:
GET /api/cars: Fetches a list of available cars.
GET /api/cars/:id: Fetches details of a specific car.
POST /api/bookings: Creates a new booking.
GET /api/bookings: Fetches a list of all bookings.

2. Frontend (HTML & Vanilla JavaScript):

public/index.html: The main page to display cars and booking forms.
public/script.js: JavaScript to fetch data from the backend and handle user interactions.
public/style.css: Basic styling.

3. Project Structure:

car-rental-node/
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── server.js
└── package.json

Bước 2: Giao diện Admin - Quản lý Xe

Tạo cấu trúc thư mục và file:

Trong thư mục gốc của dự án car-rental-node (ngang hàng với public/, server.js), tạo một thư mục mới tên là admin-public.
Bên trong admin-public, tạo các file sau:

Admin cars: Quản lý xe 
    admin-cars.html (để quản lý xe)
    admin-cars-script.js (JavaScript cho trang quản lý xe)
    admin-style.css (để trang trí cho các trang admin)

Admin Bookings: thêm trang chức năng quản lý bookings
    admin-bookings.html (quản lý booking)
    admin-bookings-script.js khi làm
