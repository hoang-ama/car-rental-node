Car Rental Platform

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

3. Admin Portal
- Login: admin-login.html/.js
- Dashboard: admin-dashboard.html/.js 
- Car management: admin-cars.htnl/.js 
- Booking management: admin-bookings.html/.js
- Customer management/ Customer Detail: admin-customers.html/.js
- Promotion: admin-promotions.html/.js/
- Report: admin-reports.html//.js
- Setting: admin-settings.html/.js
  
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
