// ============================================
// API Configuration
// ============================================
const API_BASE_URL = 'http://127.0.0.1:8000';

// ============================================
// Authentication Check
// ============================================
const token = localStorage.getItem('access_token');
const userRole = localStorage.getItem('user_role');
const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

if (!token) {
    window.location.href = 'index.html';
}

// ============================================
// DOM Elements
// ============================================
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const logoutButton = document.getElementById('logoutButton');
const sectionTitle = document.getElementById('sectionTitle');
const userName = document.getElementById('userName');
const userRoleDisplay = document.getElementById('userRole');
const announcementCount = document.getElementById('announcementCount');
const noteCount = document.getElementById('noteCount');
const recentAnnouncements = document.getElementById('recentAnnouncements');
const recentNotes = document.getElementById('recentNotes');
const allAnnouncements = document.getElementById('allAnnouncements');
const allNotes = document.getElementById('allNotes');

// ============================================
// API Helper Functions
// ============================================
async function fetchWithAuth(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.clear();
            window.location.href = 'index.html';
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}

// ============================================
// Date Formatting
// ============================================
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Full date
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ============================================
// Render Functions
// ============================================
function renderAnnouncements(announcements, container, limit = null) {
    if (!announcements || announcements.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                <p>No announcements yet</p>
            </div>
        `;
        return;
    }

    const itemsToShow = limit ? announcements.slice(0, limit) : announcements;
    
    container.innerHTML = itemsToShow.map(announcement => `
        <div class="announcement-item">
            <div class="announcement-title">${escapeHtml(announcement.title)}</div>
            <div class="announcement-content">${escapeHtml(announcement.content)}</div>
            <div class="announcement-date">${formatDate(announcement.created_at)}</div>
        </div>
    `).join('');
}

function renderNotes(notes, container, limit = null) {
    if (!notes || notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No notes available yet</p>
            </div>
        `;
        return;
    }

    const itemsToShow = limit ? notes.slice(0, limit) : notes;
    
    container.innerHTML = itemsToShow.map(note => `
        <div class="note-card" onclick="window.open('${API_BASE_URL}${note.file_url}', '_blank')">
            <div class="note-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
            </div>
            <div class="note-title">${escapeHtml(note.title)}</div>
            <div class="note-subject">${escapeHtml(note.subject)}</div>
            <div class="note-date">${formatDate(note.created_at)}</div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Load Dashboard Data
// ============================================
async function loadDashboard() {
    // Show loading states
    recentAnnouncements.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    recentNotes.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

    // Fetch data in parallel
    const [announcements, notes] = await Promise.all([
        fetchWithAuth('/api/student/announcements'),
        fetchWithAuth('/api/student/notes')
    ]);

    // Update counts
    const annCount = announcements ? announcements.length : 0;
    const noteCountVal = notes ? notes.length : 0;
    
    announcementCount.textContent = annCount;
    noteCount.textContent = noteCountVal;

    // Render recent items
    renderAnnouncements(announcements, recentAnnouncements, 3);
    renderNotes(notes, recentNotes, 6);
    
    // Store for section navigation
    window._announcements = announcements || [];
    window._notes = notes || [];
}

// ============================================
// Section Navigation
// ============================================
function navigateTo(section) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-section="${section}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // Update sections
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
    });

    const sectionMap = {
        'dashboard': 'dashboardSection',
        'announcements': 'announcementsSection',
        'notes': 'notesSection'
    };

    const targetSection = document.getElementById(sectionMap[section]);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update title
    const titles = {
        'dashboard': 'Dashboard',
        'announcements': 'Announcements',
        'notes': 'Available Notes'
    };
    sectionTitle.textContent = titles[section] || 'Dashboard';

    // Load data for the section
    if (section === 'announcements') {
        renderAnnouncements(window._announcements, allAnnouncements);
    } else if (section === 'notes') {
        renderNotes(window._notes, allNotes);
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('open');
    }
}

// ============================================
// Event Listeners
// ============================================
// Navigation clicks
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        navigateTo(section);
    });
});

// Card "View All" links
document.querySelectorAll('[data-navigate]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.navigate;
        navigateTo(section);
    });
});

// Mobile menu
mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
});

// Logout
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// ============================================
// User Info Display
// ============================================
if (userInfo.email) {
    userName.textContent = userInfo.email.split('@')[0];
}
if (userRole) {
    userRoleDisplay.textContent = userRole;
}

// ============================================
// Initialize Dashboard
// ============================================
loadDashboard();

// ============================================
// Handle browser back/forward
// ============================================
window.addEventListener('popstate', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'index.html';
    }
});