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

    const detailAvailabilityStatus = document.getElementById('detail-availability-status'); // NEW
    const detailCarSpecsIcons = document.getElementById('detail-car-specs-icons'); // NEW
    const detailFeaturesList = document.getElementById('detail-features-list'); // NEW
    const detailCarLocation = document.getElementById('detail-car-location'); // NEW
    const detailUnitPriceDisplay = document.getElementById('detail-unit-price-display'); // NEW
 // new const variables for customer summary view
    const customerSummaryCarImage = document.getElementById('customer-summary-car-image'); // NEW
    const customerSummaryAvailabilityStatus = document.getElementById('customer-summary-availability-status'); // NEW
    const customerSummaryCarName = document.getElementById('customer-summary-car-name'); // NEW
    const customerSummaryCarSpecsIcons = document.getElementById('customer-summary-car-specs-icons'); // NEW
    const customerSummaryCarLocation = document.getElementById('customer-summary-car-location'); // NEW

    const customerSummaryPickupDateTime = document.getElementById('customer-summary-pickup-datetime'); // NEW
    const customerSummaryReturnDateTime = document.getElementById('customer-summary-return-datetime'); // NEW
    const customerSummaryUnitPrice = document.getElementById('customer-summary-unit-price'); // NEW
    const customerSummaryRentalDuration = document.getElementById('customer-summary-rental-duration'); // NEW
    const customerSummaryBaseCost = document.getElementById('customer-summary-base-cost'); // NEW
    const customerSummaryServicesCost = document.getElementById('customer-summary-services-cost'); // NEW
    const customerSummaryTotalPrice = document.getElementById('customer-summary-total-price'); // NEW
    const customerSummaryDepositPrice = document.getElementById('customer-summary-deposit-price'); // NEW


    // Slider variables
    let itemsPerSlide = 3; // Fixed to 3 items per slide
    let currentSlideStartIndex = 0;
    let allFeaturedCars = [];

    function updateItemsPerSlide() {
        itemsPerSlide = 3; // Force 3 items per slide
        console.log('[updateItemsPerSlide] Items per slide set to:', itemsPerSlide);
    }


// Optional improvement: limit max currentSlideStartIndex
function limitSlideIndex() {
    const maxStartIndex = Math.max(0, allFeaturedCars.length - itemsPerSlide);
    if (currentSlideStartIndex > maxStartIndex) {
        currentSlideStartIndex = maxStartIndex;
    }
}

// 🔴 [UPDATE START: displayInitialFeaturedCarItems function] 🔴
function displayInitialFeaturedCarItems(carsArray) {
    if (!featuredCarsListDiv) return;
    if (!carsArray || carsArray.length === 0) {
        featuredCarsListDiv.innerHTML = '<p>No featured vehicles available.</p>';
        if (prevFeaturedBtn) prevFeaturedBtn.style.display = 'none';
        if (nextFeaturedBtn) nextFeaturedBtn.style.display = 'none';
        return;
    }

    allFeaturedCars = carsArray;
    currentSlideStartIndex = 0;
    renderFeaturedCarSlide();

    if (prevFeaturedBtn) prevFeaturedBtn.style.display = 'block';
    if (nextFeaturedBtn) nextFeaturedBtn.style.display = allFeaturedCars.length > itemsPerSlide ? 'block' : 'none';
}
// 🔴 [UPDATE END: displayInitialFeaturedCarItems function] 🔴

// 🔴 [Add thêm START: renderFeaturedCarSlide ] 🔴
function renderFeaturedCarSlide() {
    if (!featuredCarsListDiv) return;
    const endIndex = currentSlideStartIndex + itemsPerSlide;
    const visibleCars = allFeaturedCars.slice(currentSlideStartIndex, endIndex);
    featuredCarsListDiv.innerHTML = '';
    displayCarItems(visibleCars, featuredCarsListDiv, true);

    if (prevFeaturedBtn) prevFeaturedBtn.disabled = currentSlideStartIndex === 0;
    if (nextFeaturedBtn) nextFeaturedBtn.disabled = (currentSlideStartIndex + itemsPerSlide) >= allFeaturedCars.length;
}
// 🔴 [UPDATE END: renderFeaturedCarSlide function] 🔴

async function fetchAndDisplayFeaturedCars() {
    if (!featuredCarsListDiv) return;
    featuredCarsListDiv.innerHTML = '<p>Loading featured vehicles...</p>';
    try {
        const response = await fetch('/api/cars');
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const cars = await response.json();
        if (!Array.isArray(cars)) throw new Error('Invalid car data');

        const selectedLocation = locationSelect ? locationSelect.value : "Any Location";
        const featuredCars = cars.filter(car => car.available && car.isFeatured === true); // ✅ ignore location
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // ✅ Trên mobile: hiển thị tất cả và không phân trang
            allFeaturedCars = featuredCars;
            featuredCarsListDiv.innerHTML = '';
            displayCarItems(featuredCars, featuredCarsListDiv, true);
          } else {
            // ✅ Trên desktop: giữ logic slide
            displayInitialFeaturedCarItems(featuredCars);
          }
        } catch (err) {
          console.error("[fetchAndDisplayFeaturedCars] Error:", err);
          featuredCarsListDiv.innerHTML = '<p>Error loading featured cars.</p>';
        }
      }

// 🔴 [UPDATE START: Navigation Event Listeners] 🔴
if (prevFeaturedBtn) {
    prevFeaturedBtn.addEventListener('click', () => {
        if (currentSlideStartIndex > 0) {
            currentSlideStartIndex -= 1; // ✅ move back by 1
            if (currentSlideStartIndex < 0) currentSlideStartIndex = 0;
            renderFeaturedCarSlide();
        }
    });
}

if (nextFeaturedBtn) {
    nextFeaturedBtn.addEventListener('click', () => {
        const maxStartIndex = allFeaturedCars.length - itemsPerSlide;
        if (currentSlideStartIndex < maxStartIndex) {
            currentSlideStartIndex += 1; // ✅ move forward by 1
            if (currentSlideStartIndex > maxStartIndex) currentSlideStartIndex = maxStartIndex;
            renderFeaturedCarSlide();
        }
    });
}
// 🔴 [UPDATE END: Navigation Event Listeners] 🔴
    
if (locationSelect) {
    locationSelect.addEventListener('change', () => {
        fetchAndDisplayFeaturedCars();
    });
}

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
            console.log('[setDefaultPickupReturnTimes] Default dates set. Pickup:', pickupDateInput.value, "Return:", returnDateInput.value);
        } else {
            console.error('[setDefaultPickupReturnTimes] Date input elements not all found.');
        }
    }

    function displayCarItems(carsArray, targetContainerElement, isFeatured = false) {
        if (!targetContainerElement) {
            console.error(`[displayCarItems] Target container element is null. isFeatured: ${isFeatured}`);
            return;
        }
        targetContainerElement.innerHTML = '';
      
        if (!carsArray || carsArray.length === 0) {
            targetContainerElement.innerHTML = isFeatured
                ? "<p>No featured vehicles currently available.</p>"
                : "<p>No cars found matching your criteria.</p>";
            if (isFeatured) {
                if (prevFeaturedBtn) prevFeaturedBtn.style.display = 'none';
                if (nextFeaturedBtn) nextFeaturedBtn.style.display = 'none';
            }
            return;
        }
      
        carsArray.forEach(car => {
            const carDiv = document.createElement('div');
            carDiv.classList.add('car-item');
            // Determine availability status and class
            const availabilityStatus = car.available ? 'Available' : 'Unavailable';
            const availabilityClass = car.available ? '' : 'unavailable';

            let specsHtml = '<div class="car-specs-listing">';
            if (car.specifications) {
                if (car.specifications.bodyType) specsHtml += `<span><i class="fas fa-car-side"></i> ${car.specifications.bodyType}</span>`;
                if (car.specifications.transmission) specsHtml += `<span><i class="fas fa-cogs"></i> ${car.specifications.transmission}</span>`;
                if (car.specifications.fuelType) {
                    let fuelIcon = car.specifications.fuelType.toLowerCase() === "electric" ? "fa-bolt" :
                                   car.specifications.fuelType.toLowerCase() === "diesel" ? "fa-tint" : "fa-gas-pump";
                    specsHtml += `<span><i class="fas ${fuelIcon}"></i> ${car.specifications.fuelType}</span>`;
                }
                if (car.specifications.seats) specsHtml += `<span><i class="fas fa-users"></i> ${car.specifications.seats} seats</span>`;
            }
            specsHtml += '</div>';
        
            let featuresHtml = ''; // Đảm bảo featuresHtml luôn là chuỗi rỗng trong hàm này.
            // Nó sẽ được xây dựng và hiển thị trong displayCarDetails.
      
            let locationHtmlCarItem = car.location
                ? `<p class="car-location-featured"><i class="fas fa-map-marker-alt"></i> ${car.location}</p>`
                : '';
      
            carDiv.innerHTML = `
                <img src="${car.imageUrl || 'assets/images/placeholder-car.png'}" alt="${car.make} ${car.model}">
                <span class="availability-status ${availabilityClass}">${availabilityStatus}</span>
                <div class="car-item-content">
                    <h4>${car.make} ${car.model} (${car.year})</h4>
                    ${specsHtml} <div class="car-item-location-price-group">
                        ${locationHtmlCarItem} <p class="price"><strong>${car.pricePerDay.toLocaleString('en-US')} USD/day</strong></p> </div>
                    <button class="view-detail-btn ${isFeatured ? '' : 'select-car-btn'}" data-car-id="${car.id}">
                    ${isFeatured ? 'View Details' : 'Select This Car'}
                </button>
            </div>
            `;
            carDiv.querySelector('.view-detail-btn').addEventListener('click', () => {
                console.log(`[displayCarItems] Button clicked for car ID: ${car.id}, isFeatured: ${isFeatured}`);
                if (isFeatured || !currentBookingDetails.pickupDateTime) {
                    if (!pickupDateInput.value || !pickupTimeInput.value || !returnDateInput.value || !returnTimeInput.value) {
                        alert("Please ensure dates and times are set in the search form.");
                        setDefaultPickupReturnTimes();
                        return;
                    }
                    currentBookingDetails.pickupDateTime = new Date(`${pickupDateInput.value}T${pickupTimeInput.value}:00Z`).toISOString();
                    currentBookingDetails.returnDateTime = new Date(`${returnDateInput.value}T${returnTimeInput.value}:00Z`).toISOString();
                    currentBookingDetails.location = locationSelect.value || "Any Location";
                }
                handleCarSelection(car.id);
            });
            targetContainerElement.appendChild(carDiv);
        });
    }

    async function handleHomeBookingFormSubmit(event) {
        if (event) event.preventDefault();
        console.log("[handleHomeBookingFormSubmit] Form submitted.");
        const pickupDateVal = pickupDateInput.value;
        const pickupTimeVal = pickupTimeInput.value;
        const returnDateVal = returnDateInput.value;
        const returnTimeVal = returnTimeInput.value;
        const locationVal = locationSelect.value;
      
        if (!pickupDateVal || !pickupTimeVal || !returnDateVal || !returnTimeVal) {
            alert("Please select pick-up and return dates/times.");
            return;
        }
      
        const pickupDateTime = new Date(`${pickupDateVal}T${pickupTimeVal}`);
        const returnDateTime = new Date(`${returnDateVal}T${returnTimeVal}`);
        if (isNaN(pickupDateTime.getTime()) || isNaN(returnDateTime.getTime())) {
            alert("Invalid date or time.");
            return;
        }
        if (returnDateTime <= pickupDateTime) {
            alert("Return date/time must be after pick-up date/time.");
            return;
        }
      
        currentBookingDetails.pickupDateTime = pickupDateTime.toISOString();
        currentBookingDetails.returnDateTime = returnDateTime.toISOString();
        currentBookingDetails.location = locationVal || "Any Location";
      
        console.log("[handleHomeBookingFormSubmit] Booking details:", currentBookingDetails);
      
        await fetchAndDisplayFeaturedCars();
        await displayCarListing();
    }
    
    if (homeBookingForm) homeBookingForm.addEventListener('submit', handleHomeBookingFormSubmit);

    async function displayCarListing() {
        console.log("[displayCarListing] Displaying cars for location:", currentBookingDetails.location);
        showView('car-listing-view');
        if (searchCriteriaSummary) {
            searchCriteriaSummary.innerHTML = `
                <p><strong>Location:</strong> ${currentBookingDetails.location || 'Any'}</p>
                <p><strong>Pick-up:</strong> ${formatDateTimeForDisplay(currentBookingDetails.pickupDateTime)}</p>
                <p><strong>Return:</strong> ${formatDateTimeForDisplay(currentBookingDetails.returnDateTime)}</p>
            `;
        }
        if (!carsListContainer) {
            console.error("[displayCarListing] carsListContainer not found");
            return;
        }
        carsListContainer.innerHTML = '<p>Loading available cars...</p>';
        try {
            const response = await fetch('/api/cars');
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const allCars = await response.json();
            if (!Array.isArray(allCars)) throw new Error('Invalid API response: Expected array');
      
            const carsToList = allCars.filter(car =>
                car.available &&
                (currentBookingDetails.location === "Any Location" || car.location === currentBookingDetails.location)
            );
            console.log(`[displayCarListing] Filtered cars for location '${currentBookingDetails.location}': ${carsToList.length}`);
      
            if (carsToList.length === 0) {
                carsListContainer.innerHTML = `<p>No cars found for location: ${currentBookingDetails.location || 'Any'}.</p>`;
            } else {
                displayCarItems(carsToList, carsListContainer, false);
            }
        } catch (error) {
            console.error('[displayCarListing] Error:', error);
            carsListContainer.innerHTML = `<p>Error loading cars: ${error.message}. Please try again.</p>`;
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
    
     // Cập nhật hàm displayCarDetails để hiển thị thông tin chi tiết xe

    async function displayCarDetails() { 
        if (!currentSelectedCarData) { alert("No car selected."); showView('car-listing-view'); return; }
        console.log("[displayCarDetails] Displaying car-detail-view for car ID:", currentSelectedCarData.id);
        showView('car-detail-view');

        // Cập nhật ảnh và trạng thái khả dụng
        if(detailCarImage) detailCarImage.src = currentSelectedCarData.imageUrl || 'assets/images/placeholder-car.png';
        if(detailAvailabilityStatus) {
            detailAvailabilityStatus.textContent = currentSelectedCarData.available ? 'Available' : 'Unavailable';
            detailAvailabilityStatus.classList.toggle('unavailable', !currentSelectedCarData.available);
        }

       if(detailCarName) detailCarName.textContent = `${currentSelectedCarData.make} ${currentSelectedCarData.model} (${currentSelectedCarData.year})`;
        
        // Hiển thị thông số kỹ thuật dạng icon
        if(detailCarSpecsIcons) {
            let specsHtml = '';
            if (currentSelectedCarData.specifications) {
                if (currentSelectedCarData.specifications.bodyType) specsHtml += `<span><i class="fas fa-car-side"></i> ${currentSelectedCarData.specifications.bodyType}</span>`;
                if (currentSelectedCarData.specifications.transmission) specsHtml += `<span><i class="fas fa-cogs"></i> ${currentSelectedCarData.specifications.transmission}</span>`;
                if (currentSelectedCarData.specifications.fuelType) {
                    let fuelIcon = currentSelectedCarData.specifications.fuelType.toLowerCase() === "electric" ? "fa-bolt" :
                                   currentSelectedCarData.specifications.fuelType.toLowerCase() === "diesel" ? "fa-tint" : "fa-gas-pump";
                    specsHtml += `<span><i class="fas ${fuelIcon}"></i> ${currentSelectedCarData.specifications.fuelType}</span>`;
                }
                if (currentSelectedCarData.specifications.seats) specsHtml += `<span><i class="fas fa-users"></i> ${currentSelectedCarData.specifications.seats} seats</span>`;
            }
            detailCarSpecsIcons.innerHTML = specsHtml;
        }

        // Hiển thị vị trí và giá/ngày
        if (detailCarLocation) {
            detailCarLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${currentSelectedCarData.location || 'N/A'}`;
        }
        if (detailUnitPriceDisplay) {
            detailUnitPriceDisplay.textContent = `${currentSelectedCarData.pricePerDay.toLocaleString('en-US')} USD/day`;
        }

        // Hiển thị Features
        if (detailFeaturesList) {
            detailFeaturesList.innerHTML = ''; // Clear previous features
            if (currentSelectedCarData.features && currentSelectedCarData.features.length > 0) {
                const featureIcons = {
                    "AC": "fa-snowflake", // Điều hòa
                    "Airbag": "fas fa-user-shield", // Túi khí an toàn (có thể dùng fa-airbag nếu có FA6 pro)
                    "ETC": "fa-money-check-alt", // ETC (thu phí không dừng)
                    "Bluetooth": "fa-blog", // dùng tạm 
                    "Reverse Camera": "fa-camera-retro", // camera lùi
                    "GPS": "fa-map-marker-alt", // định vị GPS
                    "USB Port": "fa-plug", // khe cắm USB <i class="fas fa-usb"></i> ko có trong FA5
                    "Screen Display": "fa-tv", // màn hình DVD
                    "Spare Tire": "fa-compact-disc", // lốp dự phòng (biểu tượng lốp dự phòng không có sẵn, dùng cái này tạm)
                    "Parking Sensors": "fa-parking", // cảm biến đỗ xe
                    "Navigation Map": "fa-map-marked-alt",
                    "Child Seat": "fa-baby", // Ghế trẻ em
                    "Sunroof": "fa-sun", // Cửa sổ trời
                    "Dashcam": "fa-video", // camera hành trình
                    "Tire Pressure Sensor": "fa-exclamation-triangle", // cảm biến lốp (Font Awesome 6)
                    "Speed Warning": "fa-tachometer-alt", // cảnh báo tốc độ
                    // Thêm các tính năng khác và icon tương ứng ở đây
                };

                currentSelectedCarData.features.forEach(feature => {
                    const li = document.createElement('li');
                    const iconClass = featureIcons[feature] || "fa-check-circle"; // Mặc định là check-circle nếu không tìm thấy icon cụ thể
                    li.innerHTML = `<i class="fas ${iconClass}"></i> ${feature}`;
                    detailFeaturesList.appendChild(li);
                });
            } else {
                // Tùy chọn: hiển thị thông báo nếu không có tính năng nào
                // const li = document.createElement('li');
                // li.textContent = "No special features listed.";
                // detailFeaturesList.appendChild(li);
            }
        }
        
        // Cập nhật thời gian thuê xe và giá cả
        if(detailPickupDateTime) detailPickupDateTime.textContent = formatDateTimeForDisplay(currentBookingDetails.pickupDateTime);
        if(detailReturnDateTime) detailReturnDateTime.textContent = formatDateTimeForDisplay(currentBookingDetails.returnDateTime);
        
        // Reset checkboxes và tính toán giá
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

    // Page 4_ Customer Info Form // 

    function displayCustomerInfoForm() { 
        console.log("[displayCustomerInfoForm] Displaying customer-info-view."); 
        showView('customer-info-view');
    
        // Điền thông tin tóm tắt xe vào cột trái
        if (currentSelectedCarData) {
            if (customerSummaryCarImage) customerSummaryCarImage.src = currentSelectedCarData.imageUrl || 'assets/images/placeholder-car.png';
            if (customerSummaryAvailabilityStatus) {
                customerSummaryAvailabilityStatus.textContent = currentSelectedCarData.available ? 'Available' : 'Unavailable';
                customerSummaryAvailabilityStatus.classList.toggle('unavailable', !currentSelectedCarData.available);
            }
           if (customerSummaryCarName) customerSummaryCarName.textContent = `${currentSelectedCarData.make} ${currentSelectedCarData.model} (${currentSelectedCarData.year})`; 
    
            // Thông số kỹ thuật dạng icon
            if (customerSummaryCarSpecsIcons) {
                let specsHtml = '';
                if (currentSelectedCarData.specifications) {
                    if (currentSelectedCarData.specifications.bodyType) specsHtml += `<span><i class="fas fa-car-side"></i> ${currentSelectedCarData.specifications.bodyType}</span>`;
                    if (currentSelectedCarData.specifications.transmission) specsHtml += `<span><i class="fas fa-cogs"></i> ${currentSelectedCarData.specifications.transmission}</span>`;
                    if (currentSelectedCarData.specifications.fuelType) {
                        let fuelIcon = currentSelectedCarData.specifications.fuelType.toLowerCase() === "electric" ? "fa-bolt" :
                                       currentSelectedCarData.specifications.fuelType.toLowerCase() === "diesel" ? "fa-tint" : "fa-gas-pump";
                        specsHtml += `<span><i class="fas ${fuelIcon}"></i> ${currentSelectedCarData.specifications.fuelType}</span>`;
                    }
                    if (currentSelectedCarData.specifications.seats) specsHtml += `<span><i class="fas fa-users"></i> ${currentSelectedCarData.specifications.seats} seats</span>`;
                }
                customerSummaryCarSpecsIcons.innerHTML = specsHtml;
            }
            if (customerSummaryCarLocation) customerSummaryCarLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${currentSelectedCarData.location || 'N/A'}`;
        }
    
        // Điền thông tin Rental Details
        if (customerSummaryPickupDateTime) customerSummaryPickupDateTime.textContent = formatDateTimeForDisplay(currentBookingDetails.pickupDateTime);
        if (customerSummaryReturnDateTime) customerSummaryReturnDateTime.textContent = formatDateTimeForDisplay(currentBookingDetails.returnDateTime);
    
        // Điền thông tin Price Summary
        if (customerSummaryUnitPrice) customerSummaryUnitPrice.textContent = currentSelectedCarData.pricePerDay.toLocaleString('en-US');
        if (customerSummaryRentalDuration) customerSummaryRentalDuration.textContent = currentBookingDetails.rentalDurationDays;
        if (customerSummaryBaseCost) customerSummaryBaseCost.textContent = currentBookingDetails.baseCost.toLocaleString('en-US');
        if (customerSummaryServicesCost) customerSummaryServicesCost.textContent = currentBookingDetails.servicesCost.toLocaleString('en-US');
        if (customerSummaryTotalPrice) customerSummaryTotalPrice.textContent = currentBookingDetails.totalPrice.toLocaleString('en-US');
        if (customerSummaryDepositPrice) customerSummaryDepositPrice.textContent = currentBookingDetails.depositAmount.toLocaleString('en-US'); // Sẽ được cập nhật lại bởi updateDepositDisplay()
    
        // Khôi phục trạng thái form nếu có
        if (currentBookingDetails.customerInfo) {
            customerFullnameInput.value = currentBookingDetails.customerInfo.name;
            customerPhoneInput.value = currentBookingDetails.customerInfo.phone;
            customerEmailInput.value = currentBookingDetails.customerInfo.email;
            customerNotesInput.value = currentBookingDetails.customerInfo.notes;
        } else {
            customerFullnameInput.value = '';
            customerPhoneInput.value = '';
            customerEmailInput.value = '';
            customerNotesInput.value = '';
        }
    
        // Cập nhật giá cuối cùng và deposit dựa trên lựa chọn thanh toán
        if (finalTotalPriceSpan) finalTotalPriceSpan.textContent = currentBookingDetails.totalPrice.toLocaleString('en-US');
        // Không cần finalDepositPriceSpan ở đây vì nó sẽ được updateDepositDisplay() xử lý.
    
        const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethodRadios.forEach(radio => {
            // Đặt lại checked status dựa trên currentBookingDetails.paymentMethod
            radio.checked = (radio.value === currentBookingDetails.paymentMethod);
            radio.onchange = function() { // Sử dụng onchange thay vì addEventListener mới mỗi lần
                currentBookingDetails.paymentMethod = this.value;
                updateDepositDisplay();
            };
        });
        // Gọi updateDepositDisplay để đảm bảo deposit hiển thị chính xác khi vào trang
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
        closePopupButton.addEventListener('click', () => {
            popupOverlayEl.classList.add('hidden');
        });
        popupOverlayEl.addEventListener('click', function(event) {
            if (event.target === popupOverlayEl) {
                popupOverlayEl.classList.add('hidden');
            }
        });
    }

    function initApp() {
        console.log("VShare App Initializing...");
        if (!homeView || !carListingView || !carDetailView || !customerInfoView || !bookingConfirmationView) {
            console.error("One or more main view elements are missing from the DOM!");
            return;
        }
        if (!featuredCarsListDiv || !carsListContainer) {
            console.warn("Car list containers (featured or listing) are missing!");
        }
      
        setDefaultPickupReturnTimes();
        currentBookingDetails.location = locationSelect ? locationSelect.value : "Any Location";
        fetchAndDisplayFeaturedCars();
        showView('home-view');
    }
    
    initApp(); 
});