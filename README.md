Car Rental Platform

1. Backend (Node.js with Express.js):

server.js: The main file for our server.
Express.js: A minimal and flexible Node.js web application framework that we'll use to create API endpoints.
API Endpoints:
GET /api/cars: Fetches a list of available cars.
GET /api/cars/:id: Fetches details of a specific car.
POST /api/bookings: Creates a new booking.
GET /api/bookings: Fetches a list of all bookings.

server.js: Kiểm tra các endpoint /api/cars, /api/cars/:id, /api/signup, /api/login, /api/my-bookings, /api/bookings, /api/apply-promotion. Đảm bảo xử lý rate limit cho /api/login và validate dữ liệu đầu vào.

2. Frontend (HTML & Vanilla JavaScript):

- public/index.html: The main page to display cars and booking forms.

- public/script.js: JavaScript to fetch data from the backend and handle user interactions. Xử lý luồng chính (initApp, showView, handleCarSelection) và logic auth (login, signup, logout). Đảm bảo fetch API và tính toán giá (calculatePrice) hoạt động với currentBookingDetails và currentAppliedPromotion.

- public/style.css: Basic styling.

- Luồng chính: Từ home-view (form tìm kiếm) → car-listing-view (danh sách xe) → car-detail-view (chi tiết xe) → customer-info-view (thông tin khách) → booking-confirmation-view (xác nhận) hoạt động tốt với currentBookingDetails.

- Auth: Đăng nhập/đăng ký qua /api/login, /api/signup, lưu currentUser trong localStorage, và cập nhật UI qua updateLoginStateUI.

- Promotion: Áp dụng mã khuyến mại qua /api/apply-promotion, tính lại giá với calculatePrice.

- My Bookings: Hiển thị lịch sử qua /api/my-bookings khi đăng nhập.

3. Admin Portal
- Login: admin-login.html/.js
- Dashboard: admin-dashboard.html/.js 
- Car management: Quản lý danh sách xe (admin-cars.htnl/.js)
- Booking management: Quản lý booking (admin-bookings.html/.js)
- Customer management/ Customer Detail: Quản lý thông tin khách (admin-customers.html/.js)
- Promotion: Quản lý mã khuyến mại (admin-promotions.html/.js/)
- Report: Báo cáo (admin-reports.html//.js)
- Setting: Cấu hình hệ thống (admin-settings.html/.js)
  
4. Project Structure:
- public: index.html/scrip.js/style.css
- admin-public: login/dashboard/bookings/cars/customers/promotion/setting/report
- server.js
  
car-rental-node/
├── public/
│   ├── index.html
│   ├── assets
|        |--- js/script.js
|        |--- css/style.css
|        |--- images
|        |--- logo
├── admin-public/
│   ├── login (html/js)
│   ├── dashboard  (html/js)
│   └── cars/bookings/customers  (html/js)
|   └── promotion/setting/report (html/js)
│   ├── admin-style.css
│   ├── assets
|        |--- images
|        |--- logo
├── server.js
└── package.json
