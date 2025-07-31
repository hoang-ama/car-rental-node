// admin-public/admin-reports-script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Reports Script Initializing...");

    // --- DOM Elements ---
    const reportsMessage = document.getElementById('reports-message');
    const totalRevenueReport = document.getElementById('total-revenue-report');
    const totalBookingsReport = document.getElementById('total-bookings-report');
    const confirmedBookingsReport = document.getElementById('confirmed-bookings-report');
    const cancelledBookingsReport = document.getElementById('cancelled-bookings-report');

    const reportFilterButton = document.querySelector('#reports-overview .button.filter');
    const reportExportButton = document.querySelector('#reports-overview .button.export');

    // Filter elements (will need to add these to HTML later for full functionality)
    const periodSelect = document.getElementById('report-period-select'); // ADDED HTML element
    const locationSelect = document.getElementById('report-location-select'); // ADDED HTML element
    const carSelect = document.getElementById('report-car-select'); // ADDED HTML element

    const carExploitationTableBody = document.getElementById('car-exploitation-table-body'); // ADDED HTML element


    // --- APIs ---
    const ADMIN_REPORTS_BOOKINGS_API_URL = '/admin/reports/bookings-revenue';
    const ADMIN_REPORTS_CAR_EXPLOITATION_API_URL = '/admin/reports/car-exploitation';
    const ADMIN_CARS_API_URL = '/admin/cars'; // To populate car filter dropdown

    // --- Utility Function ---
    function showMessage(element, message, type = 'success') {
        if (!element) return;
        element.textContent = message;
        element.className = 'form-message-placeholder';
        element.classList.add(type);
        setTimeout(() => {
            element.textContent = '';
            element.className = '';
        }, 5000);
    }

    function formatCurrency(amount) {
        return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }

    // --- Load Filter Options ---
    async function loadFilterOptions() {
        try {
            // Load locations (from settings API if you're managing them there)
            // For now, hardcode or fetch from common cars/bookings if not in settings
            if (locationSelect) {
                const uniqueLocations = ['Hanoi', 'Da Nang', 'Ho Chi Minh City']; // Example hardcoded
                locationSelect.innerHTML = '<option value="All">All Locations</option>';
                uniqueLocations.forEach(loc => {
                    const option = document.createElement('option');
                    option.value = loc;
                    option.textContent = loc;
                    locationSelect.appendChild(option);
                });
            }

            // Load cars for car exploitation report filter
            if (carSelect) {
                const response = await fetch(ADMIN_CARS_API_URL);
                if (!response.ok) throw new Error('Failed to load cars for filter.');
                const cars = await response.json();
                carSelect.innerHTML = '<option value="All">All Cars</option>';
                cars.forEach(car => {
                    const option = document.createElement('option');
                    option.value = car.id;
                    option.textContent = `${car.make} ${car.model} (${car.id})`;
                    carSelect.appendChild(option);
                });
            }

        } catch (error) {
            console.error("Error loading filter options:", error);
            showMessage(reportsMessage, 'Error loading filter options: ' + error.message, 'error');
        }
    }


    // --- Fetch and Display Bookings & Revenue Report ---
    async function fetchAndDisplayBookingsRevenueReport() {
        try {
            const period = periodSelect ? periodSelect.value : 'all';
            const location = locationSelect ? locationSelect.value : 'All';

            const response = await fetch(`${ADMIN_REPORTS_BOOKINGS_API_URL}?period=${period}&location=${location}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            // Aggregate data if multiple periods/locations are returned
            let totalRevenue = 0;
            let totalBookings = 0;
            let confirmedBookings = 0;
            let cancelledBookings = 0;

            data.forEach(item => {
                totalRevenue += item.totalRevenue;
                totalBookings += item.totalBookings;
                confirmedBookings += item.confirmedBookings;
                cancelledBookings += item.cancelledBookings;
            });

            if (totalRevenueReport) totalRevenueReport.textContent = formatCurrency(totalRevenue);
            if (totalBookingsReport) totalBookingsReport.textContent = totalBookings;
            if (confirmedBookingsReport) confirmedBookingsReport.textContent = confirmedBookings;
            if (cancelledBookingsReport) cancelledBookingsReport.textContent = cancelledBookings;

            showMessage(reportsMessage, 'Bookings & Revenue report loaded.', 'success');

        } catch (error) {
            console.error("Error fetching bookings/revenue report:", error);
            showMessage(reportsMessage, 'Error loading Bookings & Revenue report: ' + error.message, 'error');
            if (totalRevenueReport) totalRevenueReport.textContent = '$N/A';
            if (totalBookingsReport) totalBookingsReport.textContent = 'N/A';
            if (confirmedBookingsReport) confirmedBookingsReport.textContent = 'N/A';
            if (cancelledBookingsReport) cancelledBookingsReport.textContent = 'N/A';
        }
    }

    // --- Fetch and Display Car Exploitation Report ---
    async function fetchAndDisplayCarExploitationReport() {
        if (!carExploitationTableBody) return;
        try {
            const period = periodSelect ? periodSelect.value : 'all';
            const carId = carSelect ? carSelect.value : 'All';

            const response = await fetch(`${ADMIN_REPORTS_CAR_EXPLOITATION_API_URL}?period=${period}&carId=${carId}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            carExploitationTableBody.innerHTML = ''; // Clear table body
            if (data.length === 0) {
                carExploitationTableBody.innerHTML = '<tr><td colspan="5">No exploitation data found.</td></tr>';
                return;
            }

            data.forEach(item => {
                const row = carExploitationTableBody.insertRow();
                const periodDisplay = item._id.period ? (item._id.period.month ? `Month ${item._id.period.month}/${item._id.period.year}` : `Week ${item._id.period.week}/${item._id.period.year}`) : 'Overall';
                row.innerHTML = `
                    <td data-label="Car">${item._id.carMake} ${item._id.carModel} (${item._id.carId})</td>
                    <td data-label="Period">${periodDisplay}</td>
                    <td data-label="Bookings">${item.totalBookings}</td>
                    <td data-label="Exploitation Days">${item.totalExploitationDays.toFixed(0)}</td>
                    <td data-label="Revenue">${formatCurrency(item.totalRevenue)}</td>
                `;
            });

            showMessage(reportsMessage, 'Car Exploitation report loaded.', 'success');

        } catch (error) {
            console.error("Error fetching car exploitation report:", error);
            showMessage(reportsMessage, 'Error loading Car Exploitation report: ' + error.message, 'error');
            carExploitationTableBody.innerHTML = '<tr><td colspan="5">Error loading exploitation data.</td></tr>';
        }
    }


    // --- Event Listeners for Filters/Actions ---
    if (reportFilterButton) {
        reportFilterButton.addEventListener('click', () => {
            fetchAndDisplayBookingsRevenueReport();
            fetchAndDisplayCarExploitationReport();
        });
    }

    // Initial Load
    async function initializePage() {
        console.log("Initializing Admin Reports Page...");
        // Ensure filter elements are present first
        // If you don't add them to HTML yet, these will be null
        // You can add simple selects in admin-reports.html
        /*
        <div class="action-buttons-group">
            <label for="report-period-select">Period:</label>
            <select id="report-period-select">
                <option value="all">Overall</option>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
            </select>

            <label for="report-location-select">Location:</label>
            <select id="report-location-select"></select> <label for="report-car-select">Car:</label>
            <select id="report-car-select"></select> <button class="button filter" id="apply-report-filter"><i class="fas fa-calendar-alt"></i> Apply Filters</button>
            <button class="button export"><i class="fas fa-file-export"></i> Export Report</button>
        </div>
        */

        // Update HTML to include filter elements within reports-overview section
        const reportsOverviewSection = document.getElementById('reports-overview');
        if(reportsOverviewSection && !document.getElementById('report-period-select')) {
            const filterControlsHtml = `
            <div class="action-buttons-group">
                <label for="report-period-select">Period:</label>
                <select id="report-period-select" class="button">
                    <option value="all">Overall</option>
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                </select>

                <label for="report-location-select">Location:</label>
                <select id="report-location-select" class="button"></select>

                <label for="report-car-select">Car:</label>
                <select id="report-car-select" class="button"></select>

                <button class="button filter" id="apply-report-filter"><i class="fas fa-filter"></i> Apply Filters</button>
                <button class="button export"><i class="fas fa-file-export"></i> Export Report</button>
            </div>
            `;
            reportsOverviewSection.insertAdjacentHTML('afterbegin', filterControlsHtml);
        }
        
        // Re-get DOM elements after they might have been inserted
        // (If you hardcode them in HTML from the start, this is not strictly needed)
        const newPeriodSelect = document.getElementById('report-period-select');
        const newLocationSelect = document.getElementById('report-location-select');
        const newCarSelect = document.getElementById('report-car-select');
        const newApplyFilterButton = document.getElementById('apply-report-filter');
        
        // Add event listener to the new apply filter button
        if (newApplyFilterButton) {
            newApplyFilterButton.addEventListener('click', () => {
                fetchAndDisplayBookingsRevenueReport();
                fetchAndDisplayCarExploitationReport();
            });
        }


        await loadFilterOptions(); // Load locations and cars for filters
        await fetchAndDisplayBookingsRevenueReport();
        await fetchAndDisplayCarExploitationReport();

        // Ensure car exploitation table is present for results
        const carExploitationCardBody = document.getElementById('car-exploitation-card-body'); // HTML needs this ID
        if (carExploitationCardBody && !document.getElementById('car-exploitation-table')) {
            carExploitationCardBody.innerHTML = `
                <div class="table-responsive">
                    <table id="car-exploitation-table">
                        <thead>
                            <tr>
                                <th>Car</th>
                                <th>Period</th>
                                <th>Bookings</th>
                                <th>Exploitation Days</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody id="car-exploitation-table-body">
                            <tr><td colspan="5">Loading exploitation data...</td></tr>
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    initializePage();
});