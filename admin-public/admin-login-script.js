// admin-public/admin-login-script.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    const messageDiv = document.getElementById('login-message');

    // Remove hardcoded credentials from client-side

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `form-message-placeholder ${type}`; // 'success' or 'error'
    }

    loginForm.addEventListener('submit', async (event) => { // Make the event listener async
        event.preventDefault(); // Prevent default form submission

        const enteredEmail = emailInput.value.trim();
        const enteredPassword = passwordInput.value.trim();

        if (!enteredEmail || !enteredPassword) {
            showMessage('Please enter both email and password.', 'error');
            return;
        }

        try {
            // Send login request to the new server-side API
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: enteredEmail, password: enteredPassword })
            });

            const result = await response.json();

            if (response.ok) { // Status 2xx (e.g., 200 OK)
                showMessage(result.message || 'Login successful! Redirecting...', 'success');
                sessionStorage.setItem('adminLoggedIn', 'true'); // Store login flag
                // Redirect to the dashboard as per server's response or default
                window.location.href = result.redirect || 'admin-dashboard.html';
            } else {
                // Handle errors, including 429 Too Many Requests
                if (response.status === 429) {
                    showMessage(result.message, 'error'); // Display rate limit message from server
                } else {
                    showMessage(result.message || 'Invalid email or password.', 'error'); // Display other error messages
                }
                emailInput.value = ''; // Clear inputs on failure
                passwordInput.value = '';
                emailInput.focus();
            }
        } catch (error) {
            console.error('Login request failed:', error);
            showMessage('An error occurred during login. Please try again.', 'error');
        }
    });

    // Optional: Check if already logged in and redirect, or enforce login
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        if (window.location.pathname.includes('admin-login.html')) {
            window.location.href = 'admin-dashboard.html';
        }
    }
});
