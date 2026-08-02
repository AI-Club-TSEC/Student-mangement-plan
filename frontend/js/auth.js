// ============================================
// API Configuration
// ============================================
const API_BASE_URL = 'http://127.0.0.1:8000';

// ============================================
// DOM Elements
// ============================================
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const buttonText = document.querySelector('.btn-text');
const buttonSpinner = document.querySelector('.btn-spinner');
const formError = document.getElementById('formError');
const errorMessage = document.getElementById('errorMessage');
const togglePasswordBtn = document.getElementById('togglePassword');

// ============================================
// Password Toggle Visibility
// ============================================
togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    
    // Update icon
    const eyeIcon = togglePasswordBtn.querySelector('svg');
    if (type === 'text') {
        eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
    } else {
        eyeIcon.innerHTML = `
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        `;
    }
});

// ============================================
// Helper Functions
// ============================================
function showError(message) {
    errorMessage.textContent = message;
    formError.style.display = 'flex';
}

function hideError() {
    formError.style.display = 'none';
}

function setLoading(isLoading) {
    if (isLoading) {
        loginButton.disabled = true;
        buttonText.style.display = 'none';
        buttonSpinner.style.display = 'inline-flex';
    } else {
        loginButton.disabled = false;
        buttonText.style.display = 'inline';
        buttonSpinner.style.display = 'none';
    }
}

// ============================================
// Login Form Handler
// ============================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
        showError('Please fill in all fields.');
        return;
    }

    if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed. Please try again.');
        }

        // Store authentication data
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_role', data.role);
        
        // Store user info for display
        const userInfo = {
            email: email,
            role: data.role
        };
        localStorage.setItem('user_info', JSON.stringify(userInfo));

        // Redirect based on role
        if (data.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'student-dashboard.html';
        }

    } catch (error) {
        console.error('Login error:', error);
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showError('Unable to connect to server. Please check if the backend is running.');
        } else {
            showError(error.message || 'An unexpected error occurred. Please try again.');
        }
        
        setLoading(false);
    }
});

// ============================================
// Email Validation
// ============================================
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ============================================
// Check if already logged in
// ============================================
(function checkAuth() {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    
    if (token && role) {
        // Verify token is still valid by making a test request
        fetch(`${API_BASE_URL}/api/student/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).then(response => {
            if (response.ok) {
                // Token is valid, redirect to dashboard
                if (role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'student-dashboard.html';
                }
            } else {
                // Token expired or invalid, clear storage
                localStorage.clear();
            }
        }).catch(() => {
            // Server might be down, let user log in again
        });
    }
})();

// ============================================
// Prevent back button after logout
// ============================================
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.reload();
        }
    }
});