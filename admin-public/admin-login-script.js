// admin-public/admin-login-script.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    const messageDiv = document.getElementById('login-message');

    // Hardcoded credentials for demo purposes
    const ADMIN_EMAIL = 'admin@vshare.asia';
    const ADMIN_PASSWORD = 'vsh@re@123';

    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `form-message-placeholder ${type}`; // 'success' or 'error'
    }

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const enteredEmail = emailInput.value.trim();
        const enteredPassword = passwordInput.value.trim();

        if (enteredEmail === ADMIN_EMAIL && enteredPassword === ADMIN_PASSWORD) {
            showMessage('Login successful! Redirecting...', 'success');
            // Store a simple login flag in sessionStorage or localStorage
            sessionStorage.setItem('adminLoggedIn', 'true');
            // Redirect to the dashboard
            window.location.href = 'admin-dashboard.html';
        } else {
            showMessage('Email or password is incorrect.', 'error');
            emailInput.value = '';
            passwordInput.value = '';
            emailInput.focus();
        }
    });

    // Optional: Check if already logged in and redirect, or enforce login
    // This part is for basic authentication enforcement
    if (sessionStorage.getItem('adminLoggedIn') === 'true') { // Đã sửa lỗi logic: chỉ kiểm tra nếu cờ là 'true'
        if (window.location.pathname.includes('admin-login.html')) {
            window.location.href = 'admin-dashboard.html';
        }
    }
});