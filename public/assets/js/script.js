// public/assets/js/script.js

const googleSheetScriptURL = 'https://script.google.com/macros/s/AKfycbw3v7HA2uQ5anB9WByDtgZe2fa7cRm3WGG5ZFmblTwd8MyHg4nv5u7POLVZ4ZrdGcMLdg/exec'; 

document.addEventListener('DOMContentLoaded', () => {
    console.log("Vshare Script Initializing... DOMContentLoaded.");

    const homeView = document.getElementById('home-view');
    const carListingView = document.getElementById('car-listing-view');
    const carDetailView = document.getElementById('car-detail-view');
    const customerInfoView = document.getElementById('customer-info-view');
    const bookingConfirmationView = document.getElementById('booking-confirmation-view');

    const homeBookingForm = document.getElementById('home-booking-form');
    const locationSelect = document.getElementById('location');
    const pickupDateInput = document.getElementById('pickup-date');
    const pickupTimeInput = document.getElementById('pickup-time');
    const returnDateInput = document.getElementById('return-date');
    const returnTimeInput = document.getElementById('return-time');
    const featuredCarsListDiv = document.getElementById('featured-cars-list');
    const prevFeaturedBtn = document.getElementById('prev-featured-car');
    const nextFeaturedBtn = document.getElementById('next-featured-car');

    const carsListContainer = document.getElementById('cars-list-container');
    const searchCriteriaSummary = document.getElementById('search-criteria-summary');
    
    const detailCarImage = document.getElementById('detail-car-image');
    const detailCarName = document.getElementById('detail-car-name');
    const detailCarSpecs = document.getElementById('detail-car-specs');
    const detailPickupDateTime = document.getElementById('detail-pickup-datetime');
    const detailReturnDateTime = document.getElementById('detail-return-datetime');
    const vehicleInsuranceCheckbox = document.getElementById('vehicle-insurance');
    const includeDriverCheckbox = document.getElementById('include-driver');
    const detailUnitPrice = document.getElementById('detail-unit-price');
    const detailRentalDuration = document.getElementById('detail-rental-duration');
    const detailBaseCost = document.getElementById('detail-base-cost');
    const detailServicesCost = document.getElementById('detail-services-cost');
    const detailTotalPrice = document.getElementById('detail-total-price');
    const proceedToCustomerInfoBtn = document.getElementById('proceed-to-customer-info-btn');
    
    const customerBookingForm = document.getElementById('customer-booking-form');
    const customerFullnameInput = document.getElementById('customer-fullname');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerEmailInput = document.getElementById('customer-email');
    const customerNotesInput = document.getElementById('customer-notes');
    const finalTotalPriceSpan = document.getElementById('final-total-price');
    const finalDepositPriceSpan = document.getElementById('final-deposit-price');
    const completeBookingBtn = document.getElementById('complete-booking-btn');
    
    const confBookingCode = document.getElementById('conf-booking-code');
    const confCustomerDetails = document.getElementById('conf-customer-details');
    const confVehicleDetails = document.getElementById('conf-vehicle-details');
    const confRentalPeriod = document.getElementById('conf-rental-period');
    const confTotalPrice = document.getElementById('conf-total-price');
    const confPaymentMethod = document.getElementById('conf-payment-method');
        
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');

    if (menuToggle && menu) {
        menuToggle.addEventListener('click', () => {
            menu.classList.toggle('active'); 
        });
    }
    
    let currentSelectedCarData = null; 
    let currentBookingDetails = {
        pickupDateTime: null, returnDateTime: null, location: "Hanoi", carId: null, 
        carData: null, totalPrice: 0, baseCost: 0, servicesCost: 0, rentalDurationDays: 0,
        customerInfo: null, paymentMethod: 'Pay Now', depositAmount: 0
    };
    let allFeaturedCars = []; 
    let currentFeaturedCarIndex = 0; 
    const featuredCarsPerPage = 3; 

    function showView(viewId) {
        console.log(`[showView] Attempting to show view: '${viewId}'`);
        const views = [homeView, carListingView, carDetailView, customerInfoView, bookingConfirmationView];
        const mainPageHeader = document.getElementById('main-page-header'); 
        let foundView = false;

        views.forEach(view => {
            if (view) { 
                if (view.id === viewId) {
                    console.log(`[showView] Showing: #${view.id}`);
                    view.classList.remove('hidden');
                    foundView = true;
                } else {
                    view.classList.add('hidden');
                }
            }
        });

        if (!foundView) {
            console.error(`[showView] View with ID '${viewId}' not found or its element is null. Defaulting to home-view.`);
            if (homeView) homeView.classList.remove('hidden');
        }

        if (mainPageHeader) {
            // Header chính của trang chủ (landing page) sẽ ẩn khi chuyển sang các view con (quy trình đặt xe)
            // và hiện lại khi quay về homeView.
            mainPageHeader.style.display = (viewId === 'home-view') ? 'block' : 'none'; 
        } else {
            console.warn("[showView] mainPageHeader element (id='main-page-header') not found.");
        }
        
        if (viewId === 'home-view' && menu && menu.classList.contains('active')) {
            menu.classList.remove('active');
        }
        window.scrollTo(0, 0); 
    }
    
    function formatDateForInput(date) {
        if (!date) return '';
        try {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) { return ''; }
    }
    
    function formatDateTimeForDisplay(isoString) {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            return date.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) { return 'Invalid Date';}
    }

    function setDefaultPickupReturnTimes() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); 
        console.log("[setDefaultPickupReturnTimes] Tomorrow's date object:", tomorrow);

        if (pickupDateInput && returnDateInput && pickupTimeInput && returnTimeInput) {
            pickupDateInput.value = formatDateForInput(tomorrow);
            const defaultReturnDate = new Date(tomorrow); 
            returnDateInput.value = formatDateForInput(defaultReturnDate);
            // Giữ lại value mặc định từ HTML cho time
            // pickupTimeInput.value = "07:00";
            // returnTimeInput.value = "19:00"; 
            console.log('[setDefaultPickupReturnTimes] Default dates set. Pickup:', pickupDateInput.value, "Return:", returnDateInput.value);
        } else {
            console.error('[setDefaultPickupReturnTimes] Date input elements not all found.');
        }
    }

    function renderFeaturedCars() {
        if (!featuredCarsListDiv) { console.error("[renderFeaturedCars] featuredCarsListDiv is null"); return; }
        featuredCarsListDiv.innerHTML = '';
        
        const carsToDisplayInSlider = allFeaturedCars.slice(currentFeaturedCarIndex, currentFeaturedCarIndex + featuredCarsPerPage);
        console.log(`[renderFeaturedCars] Index: ${currentFeaturedCarIndex}, Cars to display:`, carsToDisplayInSlider.length);


        if (carsToDisplayInSlider.length === 0) {
             featuredCarsListDiv.innerHTML = "<p>No featured vehicles currently available.</p>";
             if(prevFeaturedBtn) prevFeaturedBtn.style.display = allFeaturedCars.length > featuredCarsPerPage ? 'flex' : 'none'; // Hiển thị nếu có nhiều hơn 1 trang
             if(nextFeaturedBtn) nextFeaturedBtn.style.display = allFeaturedCars.length > featuredCarsPerPage ? 'flex' : 'none';
             if (allFeaturedCars.length === 0) { // Hoàn toàn không có xe nào
                if(prevFeaturedBtn) prevFeaturedBtn.style.display = 'none';
                if(nextFeaturedBtn) nextFeaturedBtn.style.display = 'none';
             }
             return;
        }
        
        displayCarItems(carsToDisplayInSlider, true); 
        updateFeaturedCarsButtonStates();
    }

    function displayCarItems(carsArray, isFeatured = false) { 
        const container = isFeatured ? featuredCarsListDiv : carsListContainer;
        if (!container) { 
            console.error(`[displayCarItems] Container not found. isFeatured: ${isFeatured}`); 
            return; 
        }
        container.innerHTML = ''; 
        
        if (carsArray.length === 0) {
            container.innerHTML = isFeatured ? "<p>No featured vehicles at the moment.</p>" : "<p>No cars match your current criteria or are available.</p>";
            if (isFeatured) {
                if(prevFeaturedBtn) prevFeaturedBtn.style.display = 'none';
                if(nextFeaturedBtn) nextFeaturedBtn.style.display = 'none';
            }
            return;
        }

        carsArray.forEach(car => {
            const carDiv = document.createElement('div');
            carDiv.classList.add('car-item'); 
            // Cấu trúc HTML cho mỗi item xe trong danh sách (dựa theo image (1).jpg)
            carDiv.innerHTML = `
                <img src="${car.imageUrl || 'assets/images/placeholder-car.png'}" alt="${car.make} ${car.model}">
                <div class="car-item-content">
                    <h4>${car.make} ${car.model} (${car.year})</h4>
                    <p class="price"><strong>${car.pricePerDay.toLocaleString('en-US')} USD/day</strong></p>
                    <div class="car-specs-listing"> 
                        <span><i class="fas fa-car"></i> ${car.type || 'N/A'}</span>
                        <span><i class="fas fa-user-friends"></i> ${car.seats || 'N/A'} seats</span>
                        <span><i class="fas fa-gas-pump"></i> ${car.fuelType || 'Petrol'}</span> 
                    </div>
                    <p class="availability-text car-status-listing">Available</p> 
                    <button class="view-detail-btn select-car-btn" data-car-id="${car.id}">Select This Car</button>
                </div>
            `;
            carDiv.querySelector('.view-detail-btn').addEventListener('click', () => {
                console.log(`[displayCarItems] Select Car/View Details clicked for car ID: ${car.id}, isFeatured: ${isFeatured}`);
                // Nếu là xe nổi bật, cần lấy ngày giờ từ form chính
                if (isFeatured) {
                    const pickupDate = pickupDateInput.value;
                    const pickupTime = pickupTimeInput.value;
                    const returnDate = returnDateInput.value;
                    const returnTime = returnTimeInput.value;
                    if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
                        alert("Please ensure dates and times are set in the search form (or use defaults).");
                        setDefaultPickupReturnTimes(); return;
                    }
                    currentBookingDetails.pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00Z`).toISOString();
                    currentBookingDetails.returnDateTime = new Date(`${returnDate}T${returnTime}:00Z`).toISOString();
                    currentBookingDetails.location = locationSelect.value;
                }
                // Nếu là xe trong danh sách (isFeatured = false), ngày giờ đã có trong currentBookingDetails
                handleCarSelection(car.id); 
            });
            container.appendChild(carDiv);
        });
    }

    function updateFeaturedCarsButtonStates() {
        if(prevFeaturedBtn) prevFeaturedBtn.style.display = currentFeaturedCarIndex > 0 ? 'flex' : 'none';
        if(nextFeaturedBtn) nextFeaturedBtn.style.display = (currentFeaturedCarIndex + featuredCarsPerPage) < allFeaturedCars.length ? 'flex' : 'none';
    }

    async function fetchAndDisplayFeaturedCars() {
        if (!featuredCarsListDiv) { console.log("[fetchAndDisplayFeaturedCars] featuredCarsListDiv not found"); return; }
        featuredCarsListDiv.innerHTML = '<p>Loading featured vehicles...</p>';
        try {
            const response = await fetch('/api/cars');
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const cars = await response.json();
            allFeaturedCars = cars.filter(car => car.available);
            currentFeaturedCarIndex = 0; 
            renderFeaturedCars(); 
        } catch (error) {
            console.error('[fetchAndDisplayFeaturedCars] Error:', error);
            if (featuredCarsListDiv) {
                 featuredCarsListDiv.innerHTML = `<p>Error loading featured vehicles. (${error.message})</p>`;
            }
        }
    }

    if (prevFeaturedBtn) {
        prevFeaturedBtn.addEventListener('click', () => {
            console.log("[prevFeaturedBtn] Clicked. Current index:", currentFeaturedCarIndex); // DEBUG
            currentFeaturedCarIndex = Math.max(0, currentFeaturedCarIndex - 1); 
            renderFeaturedCars();
        });
    }
    if (nextFeaturedBtn) {
        nextFeaturedBtn.addEventListener('click', () => {
            console.log("[nextFeaturedBtn] Clicked. Current index:", currentFeaturedCarIndex, "Total featured:", allFeaturedCars.length); // DEBUG
            if (currentFeaturedCarIndex < allFeaturedCars.length - featuredCarsPerPage) {
                currentFeaturedCarIndex++; 
            }
            renderFeaturedCars();
        });
    }
    
    async function handleHomeBookingFormSubmit(event) {
        if(event) event.preventDefault(); 
        console.log("[handleHomeBookingFormSubmit] Form submitted or Find Vehicle clicked."); 
        const pickupDateVal = pickupDateInput.value;
        const pickupTimeVal = pickupTimeInput.value;
        const returnDateVal = returnDateInput.value;
        const returnTimeVal = returnTimeInput.value;
        const locationVal = locationSelect.value;

        if (!pickupDateVal || !pickupTimeVal || !returnDateVal || !returnTimeVal) {
            alert("Please select pick-up and return dates/times."); return;
        }
        const pickupDateTime = new Date(`${pickupDateVal}T${pickupTimeVal}`);
        const returnDateTime = new Date(`${returnDateVal}T${returnTimeVal}`);
        if (isNaN(pickupDateTime.getTime()) || isNaN(returnDateTime.getTime())) {
            alert("Invalid date or time."); return;
        }
        if (returnDateTime <= pickupDateTime) {
            alert("Return date/time must be after pick-up date/time."); return;
        }
        currentBookingDetails.pickupDateTime = pickupDateTime.toISOString();
        currentBookingDetails.returnDateTime = returnDateTime.toISOString();
        currentBookingDetails.location = locationVal;
        
        console.log("[handleHomeBookingFormSubmit] Calling displayCarListing with details:", currentBookingDetails); 
        await displayCarListing(); 
    }
    if (homeBookingForm) homeBookingForm.addEventListener('submit', handleHomeBookingFormSubmit);

    async function displayCarListing() {
        console.log("[displayCarListing] Attempting to show car-listing-view."); 
        showView('car-listing-view'); 
        if (searchCriteriaSummary) {
            searchCriteriaSummary.innerHTML = `
                <p><strong>Location:</strong> ${currentBookingDetails.location || 'Any'}</p>
                <p><strong>Pick-up:</strong> ${formatDateTimeForDisplay(currentBookingDetails.pickupDateTime)}</p>
                <p><strong>Return:</strong> ${formatDateTimeForDisplay(currentBookingDetails.returnDateTime)}</p>
            `;
        }
        if (!carsListContainer) {console.error("[displayCarListing] carsListContainer not found"); return;}
        carsListContainer.innerHTML = '<p>Loading available cars...</p>';
        try {
            const response = await fetch('/api/cars');
            if (!response.ok) throw new Error(`Error fetching cars: ${response.status}`);
            const allCars = await response.json();
            const availableCars = allCars.filter(car => car.available); 
            
            // Sử dụng lại hàm displayCarItems với isFeatured = false
            displayCarItems(availableCars, false); 

        } catch (error) {
            console.error('[displayCarListing] Error:', error);
            if (carsListContainer) carsListContainer.innerHTML = `<p>Error: ${error.message}. Please try again.</p>`;
        }
    }
    
    async function handleCarSelection(carId) {
        console.log(`[handleCarSelection] Car ID: ${carId}. Fetching details...`); 
        currentBookingDetails.carId = carId;
        try {
            const response = await fetch(`/api/cars/${carId}`);
            if (!response.ok) {
                console.error(`[handleCarSelection] Failed to fetch car details for ID: ${carId}`, response.status);
                throw new Error('Failed to fetch car details.');
            }
            currentSelectedCarData = await response.json(); 
            currentBookingDetails.carData = currentSelectedCarData; 
            console.log("[handleCarSelection] Car details fetched:", currentSelectedCarData); 
            await displayCarDetails();
        } catch (error) {
            console.error("[handleCarSelection] Error:", error);
            alert("Could not load car details. Please try again.");
        }
    }

    function calculatePrice() { 
        if (!currentSelectedCarData || !currentBookingDetails.pickupDateTime || !currentBookingDetails.returnDateTime) return;
        const pickup = new Date(currentBookingDetails.pickupDateTime);
        const ret = new Date(currentBookingDetails.returnDateTime);
        const diffTime = Math.abs(ret - pickup);
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        currentBookingDetails.rentalDurationDays = diffDays > 0 ? diffDays : 1; 
        currentBookingDetails.baseCost = currentSelectedCarData.pricePerDay * currentBookingDetails.rentalDurationDays;
        currentBookingDetails.servicesCost = 0;
        if (vehicleInsuranceCheckbox && vehicleInsuranceCheckbox.checked) {
            currentBookingDetails.servicesCost += parseFloat(vehicleInsuranceCheckbox.dataset.price) * currentBookingDetails.rentalDurationDays;
        }
        if (includeDriverCheckbox && includeDriverCheckbox.checked) {
            currentBookingDetails.servicesCost += parseFloat(includeDriverCheckbox.dataset.price) * currentBookingDetails.rentalDurationDays;
        }
        currentBookingDetails.totalPrice = currentBookingDetails.baseCost + currentBookingDetails.servicesCost;
        if(detailUnitPrice) detailUnitPrice.textContent = currentSelectedCarData.pricePerDay.toLocaleString('en-US');
        if(detailRentalDuration) detailRentalDuration.textContent = currentBookingDetails.rentalDurationDays;
        if(detailBaseCost) detailBaseCost.textContent = currentBookingDetails.baseCost.toLocaleString('en-US');
        if(detailServicesCost) detailServicesCost.textContent = currentBookingDetails.servicesCost.toLocaleString('en-US');
        if(detailTotalPrice) detailTotalPrice.textContent = currentBookingDetails.totalPrice.toLocaleString('en-US');
    }
    async function displayCarDetails() { 
        if (!currentSelectedCarData) { alert("No car selected."); showView('car-listing-view'); return; }
        console.log("[displayCarDetails] Displaying car-detail-view for car ID:", currentSelectedCarData.id);
        showView('car-detail-view');
        if(detailCarImage) detailCarImage.src = currentSelectedCarData.imageUrl || 'assets/images/placeholder-car.png';
        if(detailCarName) detailCarName.textContent = `${currentSelectedCarData.make} ${currentSelectedCarData.model} (${currentSelectedCarData.year})`;
        if(detailCarSpecs) {
            detailCarSpecs.innerHTML = `
                <p><strong>Type:</strong> ${currentSelectedCarData.type || 'N/A'}</p>
                <p><strong>Seats:</strong> ${currentSelectedCarData.seats || 'N/A'}</p>
                <p><strong>Status:</strong> ${currentSelectedCarData.available ? 'Available' : 'Unavailable'}</p>
            `;
        }
        if(detailPickupDateTime) detailPickupDateTime.textContent = formatDateTimeForDisplay(currentBookingDetails.pickupDateTime);
        if(detailReturnDateTime) detailReturnDateTime.textContent = formatDateTimeForDisplay(currentBookingDetails.returnDateTime);
        if(vehicleInsuranceCheckbox) vehicleInsuranceCheckbox.checked = false;
        if(includeDriverCheckbox) includeDriverCheckbox.checked = false;
        calculatePrice(); 
    }

    if(vehicleInsuranceCheckbox) vehicleInsuranceCheckbox.addEventListener('change', calculatePrice);
    if(includeDriverCheckbox) includeDriverCheckbox.addEventListener('change', calculatePrice);

    if (proceedToCustomerInfoBtn) { 
        proceedToCustomerInfoBtn.addEventListener('click', () => {
            if (!currentSelectedCarData) { alert("Please select a car first."); return; }
            console.log("[proceedToCustomerInfoBtn] Clicked."); 
            displayCustomerInfoForm();
        });
    }
    function displayCustomerInfoForm() { 
        console.log("[displayCustomerInfoForm] Displaying customer-info-view."); 
        showView('customer-info-view');
        if (finalTotalPriceSpan) finalTotalPriceSpan.textContent = currentBookingDetails.totalPrice.toLocaleString('en-US');
        const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethodRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                currentBookingDetails.paymentMethod = this.value;
                updateDepositDisplay();
            });
        });
        const defaultPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (defaultPaymentMethod) currentBookingDetails.paymentMethod = defaultPaymentMethod.value;
        updateDepositDisplay();
    }
    function updateDepositDisplay() { 
        if (currentBookingDetails.paymentMethod === "Pay Later") {
            currentBookingDetails.depositAmount = currentBookingDetails.totalPrice * 0.30; 
        } else { currentBookingDetails.depositAmount = 0; }
        if(finalDepositPriceSpan) finalDepositPriceSpan.textContent = currentBookingDetails.depositAmount.toLocaleString('en-US');
    }

    if (customerBookingForm) { 
        customerBookingForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!customerFullnameInput.value || !customerPhoneInput.value || !customerEmailInput.value) {
                alert("Please fill in all required customer details (*)."); return;
            }
            currentBookingDetails.customerInfo = {
                name: customerFullnameInput.value, phone: customerPhoneInput.value,
                email: customerEmailInput.value, notes: customerNotesInput.value
            };
            const bookingPayload = {
                carId: currentBookingDetails.carId, customerName: currentBookingDetails.customerInfo.name,
                startDate: currentBookingDetails.pickupDateTime, endDate: currentBookingDetails.returnDateTime,
                totalPrice: currentBookingDetails.totalPrice, paymentMethod: currentBookingDetails.paymentMethod,
                notes: currentBookingDetails.customerInfo.notes,
                carMake: currentBookingDetails.carData.make, carModel: currentBookingDetails.carData.model
            };
            console.log("[customerBookingForm] Submitting booking:", bookingPayload); 
            try {
                if(completeBookingBtn) { completeBookingBtn.disabled = true; completeBookingBtn.textContent = "Processing...";}
                const response = await fetch('/api/bookings', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingPayload)
                });
                const result = await response.json();
                console.log("[customerBookingForm] Booking API response:", result); 
                if (response.ok) {
                    currentBookingDetails.bookingConfirmation = result.booking; 
                    displayBookingConfirmation();
                } else { alert(`Booking failed: ${result.message || 'Unknown server error'}`); }
            } catch (error) {
                console.error("[customerBookingForm] Error completing booking:", error);
                alert("An error occurred. Please try again.");
            } finally {
                if(completeBookingBtn) { completeBookingBtn.disabled = false; completeBookingBtn.textContent = "Complete Booking"; }
            }
        });
    }
    function displayBookingConfirmation() { 
        showView('booking-confirmation-view');
        const booking = currentBookingDetails.bookingConfirmation; if(!booking) return;
        console.log("[displayBookingConfirmation] Displaying confirmation for booking ID:", booking.id); 
        if(confBookingCode) confBookingCode.textContent = booking.id || 'N/A';
        if(confCustomerDetails) {
            confCustomerDetails.innerHTML = `<h4>Customer Details</h4><p><strong>Name:</strong> ${booking.customerName}</p><p><strong>Email:</strong> ${currentBookingDetails.customerInfo.email}</p><p><strong>Phone:</strong> ${currentBookingDetails.customerInfo.phone}</p>`;
        }
        if(confVehicleDetails) {
             confVehicleDetails.innerHTML = `<h4>Vehicle Details</h4><p><strong>Car:</strong> ${booking.carMake} ${booking.carModel} (ID: ${booking.carId})</p>`;
        }
        if(confRentalPeriod) {
            confRentalPeriod.innerHTML = `<h4>Rental Period</h4><p><strong>Pick-up:</strong> ${formatDateTimeForDisplay(booking.startDate)}</p><p><strong>Return:</strong> ${formatDateTimeForDisplay(booking.endDate)}</p>`;
        }
        if(confTotalPrice) confTotalPrice.innerHTML = `<h4>Total Amount: $${currentBookingDetails.totalPrice.toLocaleString('en-US')}</h4>`;
         if(confPaymentMethod) {
            confPaymentMethod.innerHTML = `<p><strong>Payment Method:</strong> ${currentBookingDetails.paymentMethod}</p>`;
            if (currentBookingDetails.paymentMethod === "Pay Later" && currentBookingDetails.depositAmount > 0) {
                confPaymentMethod.innerHTML += `<p><strong>Deposit Due:</strong> $${currentBookingDetails.depositAmount.toLocaleString('en-US')}</p>`;
            }
        }
    }

    const subscribeForm = document.forms['email-subscription-form'];
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', e => { 
            e.preventDefault();
            const emailInput = subscribeForm.querySelector('#subscriber-email');
            const submitButton = subscribeForm.querySelector('.subscribe-button');
            if (emailInput) {
                const email = emailInput.value.trim();
                if (validateEmail(email)) { 
                    if(submitButton) { submitButton.disabled = true; submitButton.textContent = "Subscribing..."; }
                    sendSubscriptionEmailToGoogleSheet(email, subscribeForm, submitButton);
                } else { alert('Please enter a valid email address (e.g., example@email.com).'); }
            }
        });
    }

    function sendSubscriptionEmailToGoogleSheet(email, form, button) { 
        const data = new FormData(); 
        data.append('timestamp', new Date().toISOString()); data.append('email', email); data.append('sheetName', 'Email'); 
        fetch(googleSheetScriptURL, { method: 'POST', body: data }) 
            .then(response => response.text()) 
            .then(textResponse => {
                console.log('Subscription API Response:', textResponse); alert('Thank you for subscribing!'); if(form) form.reset();
            })
            .catch(error => { console.error('Subscription Error!', error.message); alert('An error occurred. Please try again.'); })
            .finally(() => { if(button) { button.disabled = false; button.textContent = "Sign-up"; }});
    }
    function validateEmail(email) { const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return re.test(String(email).toLowerCase()); }
    
    const commonNavButtons = { 
        'nav-home-from-listing': 'home-view', 'nav-home-from-detail': 'home-view',
        'nav-listing-from-detail': 'car-listing-view', 'nav-home-from-customer': 'home-view',
        'nav-home-from-confirmation': 'home-view', 'back-to-home-from-listing': 'home-view',
        'back-to-listing-from-detail-page': 'car-listing-view',
        'back-to-car-detail-from-customer': 'car-detail-view',
        'back-to-home-from-confirmation-main': 'home-view'
    };

    for (const id in commonNavButtons) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault(); 
                const targetViewId = commonNavButtons[id];
                console.log(`[Navigation] Element ID '${id}' clicked, showing view '${targetViewId}'`); 
                if (targetViewId === 'home-view' && id.startsWith('back-to-home-from-confirmation')) {
                    currentBookingDetails = { 
                        pickupDateTime: null, returnDateTime: null, location: "Hanoi", carId: null, 
                        carData: null, totalPrice: 0, baseCost: 0, servicesCost: 0, rentalDurationDays: 0,
                        customerInfo: null, paymentMethod: 'Pay Now', depositAmount: 0
                    };
                    currentSelectedCarData = null;
                    if(homeBookingForm) homeBookingForm.reset();
                    if(customerBookingForm) customerBookingForm.reset();
                    setDefaultPickupReturnTimes();
                }
                showView(targetViewId);
            });
        } else {
            // console.warn(`[Navigation] Element with ID '${id}' not found.`);
        }
    }
    
    document.querySelectorAll('.page-header .logo-link, .main-header .logo-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("[Navigation] Logo link clicked, showing home-view"); 
            showView('home-view');
        });
    });

    const popupOverlayEl = document.getElementById('popup-overlay');
    const closePopupButton = document.getElementById('close-popup');
    if (popupOverlayEl && closePopupButton) {
        // setTimeout(() => { popupOverlayEl.classList.remove('hidden'); /* popupOverlayEl.classList.add('active'); */ }, 60000); // Bỏ active vì style.display đã dùng
        closePopupButton.addEventListener('click', () => {
            // popupOverlayEl.classList.remove('active'); 
            popupOverlayEl.classList.add('hidden');
        });
        popupOverlayEl.addEventListener('click', function(event) {
            if (event.target === popupOverlayEl) {
                // popupOverlayEl.classList.remove('active');
                popupOverlayEl.classList.add('hidden');
            }
        });
    }

    function initApp() {
        console.log("VShare App Initializing..."); 
        setDefaultPickupReturnTimes();
        fetchAndDisplayFeaturedCars();
        showView('home-view'); 
    }
    initApp(); 
});