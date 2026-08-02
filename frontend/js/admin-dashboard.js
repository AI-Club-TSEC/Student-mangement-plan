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

if (!token || userRole !== 'admin') {
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
const studentCount = document.getElementById('studentCount');
const noteCount = document.getElementById('noteCount');
const announcementCount = document.getElementById('announcementCount');
const studentsTableBody = document.getElementById('studentsTableBody');
const allNotes = document.getElementById('allNotes');
const allAnnouncements = document.getElementById('allAnnouncements');

// Modal elements
const studentModal = document.getElementById('studentModal');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.getElementById('closeModal');
const addStudentBtn = document.getElementById('addStudentBtn');
const studentForm = document.getElementById('studentForm');
const editStudentId = document.getElementById('editStudentId');
const studentName = document.getElementById('studentName');
const studentEmail = document.getElementById('studentEmail');
const studentEnrollment = document.getElementById('studentEnrollment');
const studentPassword = document.getElementById('studentPassword');
const studentFormMessage = document.getElementById('studentFormMessage');
const saveStudentBtn = document.getElementById('saveStudentBtn');

// Upload form
const uploadNoteForm = document.getElementById('uploadNoteForm');
const uploadMessage = document.getElementById('uploadMessage');

// Announcement form
const announcementForm = document.getElementById('announcementForm');
const announcementMessage = document.getElementById('announcementMessage');

// ============================================
// API Helper Functions
// ============================================
async function fetchWithAuth(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'index.html';
            return null;
        }

        if (response.status === 204) {
            return { success: true };
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        throw error;
    }
}

// ============================================
// Date Formatting
// ============================================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ============================================
// Load Students
// ============================================
async function loadStudents() {
    try {
        const students = await fetchWithAuth('/api/admin/students');
        
        studentCount.textContent = students ? students.length : 0;

        if (!students || students.length === 0) {
            studentsTableBody.innerHTML = '<tr><td colspan="6" class="empty-table">No students found</td></tr>';
            return;
        }

        studentsTableBody.innerHTML = students.map(student => `
            <tr>
                <td>${student.id}</td>
                <td>${escapeHtml(student.full_name)}</td>
                <td>${escapeHtml(student.email)}</td>
                <td>${escapeHtml(student.enrollment_id || '-')}</td>
                <td>${formatDate(student.created_at)}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-edit" onclick="editStudent(${student.id}, '${escapeHtml(student.full_name)}', '${escapeHtml(student.email)}', '${escapeHtml(student.enrollment_id || '')}')">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="deleteStudent(${student.id})">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        studentsTableBody.innerHTML = '<tr><td colspan="6" class="empty-table">Error loading students</td></tr>';
    }
}

// ============================================
// Load Notes
// ============================================
async function loadNotes() {
    try {
        const notes = await fetchWithAuth('/api/student/notes');
        
        noteCount.textContent = notes ? notes.length : 0;

        if (!notes || notes.length === 0) {
            allNotes.innerHTML = '<div class="empty-state"><p>No notes uploaded yet</p></div>';
            return;
        }

        allNotes.innerHTML = notes.map(note => `
            <div class="note-card" onclick="window.open('${API_BASE_URL}${note.file_url}', '_blank')">
                <div class="note-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                </div>
                <div class="note-title">${escapeHtml(note.title)}</div>
                <div class="note-subject">${escapeHtml(note.subject)}</div>
                <div class="note-date">${formatDate(note.created_at)}</div>
            </div>
        `).join('');
    } catch (error) {
        allNotes.innerHTML = '<div class="empty-state"><p>Error loading notes</p></div>';
    }
}

// ============================================
// Load Announcements
// ============================================
async function loadAnnouncements() {
    try {
        const announcements = await fetchWithAuth('/api/student/announcements');
        
        announcementCount.textContent = announcements ? announcements.length : 0;

        if (!announcements || announcements.length === 0) {
            allAnnouncements.innerHTML = '<div class="empty-state"><p>No announcements yet</p></div>';
            return;
        }

        allAnnouncements.innerHTML = announcements.map(ann => `
            <div class="announcement-item">
                <div class="announcement-title">${escapeHtml(ann.title)}</div>
                <div class="announcement-content">${escapeHtml(ann.content)}</div>
                <div class="announcement-date">${formatDate(ann.created_at)}</div>
            </div>
        `).join('');
    } catch (error) {
        allAnnouncements.innerHTML = '<div class="empty-state"><p>Error loading announcements</p></div>';
    }
}

// ============================================
// Student CRUD Operations
// ============================================
function editStudent(id, name, email, enrollment) {
    modalTitle.textContent = 'Edit Student';
    editStudentId.value = id;
    studentName.value = name;
    studentEmail.value = email;
    studentEnrollment.value = enrollment;
    studentPassword.value = '';
    studentPassword.placeholder = 'Leave blank to keep current password';
    studentPassword.required = false;
    studentFormMessage.style.display = 'none';
    studentModal.style.display = 'flex';
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
        await fetchWithAuth(`/api/admin/students/${id}`, { method: 'DELETE' });
        loadStudents();
        loadDashboardStats();
    } catch (error) {
        alert('Failed to delete student');
    }
}

studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    studentFormMessage.style.display = 'none';
    saveStudentBtn.disabled = true;
    saveStudentBtn.textContent = 'Saving...';

    const body = {
        full_name: studentName.value,
        email: studentEmail.value,
        enrollment_id: studentEnrollment.value || null,
    };

    if (studentPassword.value) {
        body.password = studentPassword.value;
    }

    try {
        const id = editStudentId.value;
        if (id) {
            await fetchWithAuth(`/api/admin/students/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            if (!studentPassword.value) {
                throw new Error('Password is required for new students');
            }
            await fetchWithAuth('/api/admin/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }

        studentModal.style.display = 'none';
        studentForm.reset();
        editStudentId.value = '';
        studentPassword.required = true;
        studentPassword.placeholder = 'Enter password';
        loadStudents();
        loadDashboardStats();
    } catch (error) {
        studentFormMessage.textContent = error.message || 'Error saving student';
        studentFormMessage.className = 'form-message error';
        studentFormMessage.style.display = 'block';
    } finally {
        saveStudentBtn.disabled = false;
        saveStudentBtn.textContent = 'Save Student';
    }
});

// ============================================
// Upload Note
// ============================================
uploadNoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    uploadMessage.style.display = 'none';

    const formData = new FormData();
    formData.append('title', document.getElementById('noteTitle').value);
    formData.append('subject', document.getElementById('noteSubject').value);
    formData.append('file', document.getElementById('noteFile').files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/notes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Upload failed');
        }

        uploadMessage.textContent = 'Note uploaded successfully!';
        uploadMessage.className = 'form-message success';
        uploadMessage.style.display = 'block';
        uploadNoteForm.reset();
        loadNotes();
        loadDashboardStats();
    } catch (error) {
        uploadMessage.textContent = error.message || 'Upload failed';
        uploadMessage.className = 'form-message error';
        uploadMessage.style.display = 'block';
    }
});

// ============================================
// Create Announcement
// ============================================
announcementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    announcementMessage.style.display = 'none';

    const body = {
        title: document.getElementById('annTitle').value,
        content: document.getElementById('annContent').value
    };

    try {
        await fetchWithAuth('/api/admin/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        announcementMessage.textContent = 'Announcement posted successfully!';
        announcementMessage.className = 'form-message success';
        announcementMessage.style.display = 'block';
        announcementForm.reset();
        loadAnnouncements();
        loadDashboardStats();
    } catch (error) {
        announcementMessage.textContent = error.message || 'Failed to post announcement';
        announcementMessage.className = 'form-message error';
        announcementMessage.style.display = 'block';
    }
});

// ============================================
// Load Dashboard Stats
// ============================================
async function loadDashboardStats() {
    try {
        const [students, notes, announcements] = await Promise.all([
            fetchWithAuth('/api/admin/students'),
            fetchWithAuth('/api/student/notes'),
            fetchWithAuth('/api/student/announcements')
        ]);

        studentCount.textContent = students ? students.length : 0;
        noteCount.textContent = notes ? notes.length : 0;
        announcementCount.textContent = announcements ? announcements.length : 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ============================================
// Section Navigation
// ============================================
function navigateTo(section) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector(`[data-section="${section}"]`);
    if (activeNav) activeNav.classList.add('active');

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

    const sectionMap = {
        'dashboard': 'dashboardSection',
        'students': 'studentsSection',
        'notes': 'notesSection',
        'announcements': 'announcementsSection'
    };

    const target = document.getElementById(sectionMap[section]);
    if (target) target.classList.add('active');

    const titles = {
        'dashboard': 'Dashboard',
        'students': 'Students',
        'notes': 'Upload Notes',
        'announcements': 'Announcements'
    };
    sectionTitle.textContent = titles[section] || 'Dashboard';

    if (section === 'students') loadStudents();
    if (section === 'notes') loadNotes();
    if (section === 'announcements') loadAnnouncements();

    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('open');
    }
}

// ============================================
// Modal Controls
// ============================================
addStudentBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Add Student';
    editStudentId.value = '';
    studentForm.reset();
    studentPassword.required = true;
    studentPassword.placeholder = 'Enter password';
    studentFormMessage.style.display = 'none';
    studentModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
    studentModal.style.display = 'none';
});

studentModal.addEventListener('click', (e) => {
    if (e.target === studentModal) {
        studentModal.style.display = 'none';
    }
});

// ============================================
// Utility Functions
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Event Listeners
// ============================================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(item.dataset.section);
    });
});

mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
});

logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// ============================================
// User Info
// ============================================
if (userInfo.email) {
    userName.textContent = userInfo.email.split('@')[0];
}
if (userRole) {
    userRoleDisplay.textContent = userRole;
}

// ============================================
// Initialize
// ============================================
loadDashboardStats();