/* ========================================
   ไฟล์ JavaScript สำหรับ ONSITE MEDIA
   ======================================== */

// ⚙️ ตั้งค่า Supabase (ใช้ Config เดิมของคุณ)
const SUPABASE_URL = 'https://slejbpinrkbtkwfqzrbs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZWpicGlucmtidGt3ZnF6cmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzIxODUsImV4cCI6MjA3ODEwODE4NX0.NYeuGdkiej5g2b_0BKGvG9JVS03fh9uO2mdD2xMLAXo';

// ⚙️ ตั้งค่า LINE & Google Script (ใช้ Config เดิม)
const LINE_CHANNEL_ACCESS_TOKEN = 'NA6cbvMSSdRzh8uXPn3xKcEXiu6mF9n9EvyMrBQIhfCXYOS5zmhlqSyZJtppfYP2RjIqWJBOHjeRoXFMY2SFwGMav7291f5kl1uxV7+5+1KN3boWgvsZ/X5TWrj6IyHzHKt7VzLVL6fx/EhkjAzDpgdB04t89/1O/w1cDnyilFU=';
const LINE_USER_IDS = ['U05e988ee991017311410c6c49f125295', 'U91b1ef62be46477c06803071156346bf'];
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzLTxcfJrZqPnSXZQimh8psaxdGHUn-5n1Z0e0S31tSAavfIB0FSqx7_NZbrQxcMDQn/exec';

// สร้าง Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ตัวแปร Global
let currentDate = new Date();
let holidays = [];

// Typing Animation Variables
const typingTexts = ['Ready to Work.', 'พร้อมทำงาน.', 'ส่งมอบงานได้เลย.'];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingSpeed = 100;

// 📱 Mobile Menu Toggle Function
function toggleMenu() {
    const navContainer = document.getElementById('navContainer');
    const overlay = document.getElementById('mobileMenuOverlay');
    const hamburger = document.querySelector('.hamburger');
    
    navContainer.classList.toggle('active');
    overlay.classList.toggle('active');
    hamburger.classList.toggle('active');
    
    // Prevent scrolling when menu is open
    if (navContainer.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

// Typing Effect
function typeText() {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;

    const currentText = typingTexts[textIndex];
    
    if (isDeleting) {
        typingElement.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 50;
    } else {
        typingElement.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 100;
    }
    
    if (!isDeleting && charIndex === currentText.length) {
        typingSpeed = 2000; // Wait before deleting
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % typingTexts.length;
        typingSpeed = 500;
    }
    
    setTimeout(typeText, typingSpeed);
}

// Intro Animation Handling
function handleIntro() {
    const intro = document.getElementById('introOverlay');
    if (intro) {
        setTimeout(() => {
            intro.classList.add('hidden');
        }, 3000); // Reduced time slightly for better UX
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
    handleIntro();
    typeText();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        console.log('User logged in:', user.email);
        updateUIForLoggedInUser(user);
    }
    
    await loadHolidays();
    renderCalendar();
    
    // Calendar Navigation Listeners
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
});

// Load Holidays
async function loadHolidays() {
    try {
        const { data, error } = await supabase
            .from('holidays')
            .select('*')
            .order('date', { ascending: true });
        
        if (error) throw error;
        holidays = data || [];
    } catch (error) {
        console.error('Error loading holidays:', error.message);
        // Fallback or empty
        holidays = [];
    }
}

// Render Calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year + 543}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    // Previous Month Filler
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dayDiv = createDayElement(day, true);
        dayDiv.style.opacity = '0.3';
        calendarDays.appendChild(dayDiv);
    }
    
    const today = new Date();
    
    // Current Month Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = createDayElement(day, false);
        
        // Check Today
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayDiv.classList.add('today');
        }
        
        // Check Holiday
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const holiday = holidays.find(h => h.date === dateString);
        
        if (holiday) {
            dayDiv.classList.add('holiday');
            dayDiv.title = holiday.name || 'วันหยุด';
            
            // Optional: Add small dot or indicator if needed, currently using color
        }
        
        calendarDays.appendChild(dayDiv);
    }
    
    // Next Month Filler to fill grid (42 cells max)
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = createDayElement(day, true);
        dayDiv.style.opacity = '0.3';
        calendarDays.appendChild(dayDiv);
    }
}

function createDayElement(day, isOtherMonth) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = day;
    if (isOtherMonth) dayDiv.classList.add('other-month');
    return dayDiv;
}

// Modal Functions
function openLoginModal(event) {
    if(event) event.preventDefault();
    document.getElementById('loginModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = event.target.querySelector('.submit-btn');
    
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'กำลังตรวจสอบ...';
    submitBtn.disabled = true;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        alert(`ยินดีต้อนรับ ${data.user.email}`);
        closeLoginModal();
        updateUIForLoggedInUser(data.user);
        
    } catch (error) {
        alert('เข้าสู่ระบบไม่สำเร็จ: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    location.reload();
}

function updateUIForLoggedInUser(user) {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.textContent = 'ออกจากระบบ';
        loginBtn.onclick = (e) => {
            e.preventDefault();
            if(confirm('ต้องการออกจากระบบใช่หรือไม่?')) handleLogout();
        };
        // Reset style for logout state if needed
        loginBtn.style.background = 'rgba(239, 68, 68, 0.2)';
        loginBtn.style.borderColor = '#ef4444';
    }
    
    const userNameDisplay = document.getElementById('userDisplayName');
    if (userNameDisplay) {
        userNameDisplay.textContent = user.email.split('@')[0];
    }
    
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    if (userRoleDisplay) userRoleDisplay.textContent = 'Staff Member';
}

// Work Handover Modal
async function openWorkHandoverModal(event) {
    event.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert('กรุณาเข้าสู่ระบบก่อนส่งมอบงาน');
        openLoginModal();
        return;
    }
    
    const modal = document.getElementById('workHandoverModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Set default times
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
    
    document.getElementById('workDate').value = localISOTime;
    document.getElementById('workDateTime').value = localISOTime;
    
    // Auto-fill name if metadata exists
    if (user.user_metadata?.full_name) {
        document.getElementById('senderName').value = user.user_metadata.full_name;
    }
}

function closeWorkHandoverModal() {
    document.getElementById('workHandoverModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.querySelector('#workHandoverModal form').reset();
}

// Handle Form Submission
async function handleWorkHandoverSubmit(event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = '⏳ กำลังบันทึก...';
    submitBtn.disabled = true;
    
    try {
        const workData = {
            work_date: document.getElementById('workDate').value,
            sender_name: document.getElementById('senderName').value,
            sender_department: document.getElementById('senderDepartment').value,
            priority: document.getElementById('priority').value,
            store_name: document.getElementById('storeName').value,
            location: document.getElementById('location').value,
            work_details: document.getElementById('workDetails').value,
            work_datetime: document.getElementById('workDateTime').value,
            created_at: new Date().toISOString()
        };
        
        // 1. Supabase Insert
        const { error } = await supabase.from('work_handovers').insert([workData]);
        if (error) throw error;
        
        // 2. Google Sheets
        await sendToGoogleSheets(workData);
        
        // 3. LINE Notify
        await sendLineNotifications(workData);
        
        alert('✅ ส่งมอบงานสำเร็จเรียบร้อย');
        closeWorkHandoverModal();
        
    } catch (error) {
        console.error(error);
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function sendToGoogleSheets(data) {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) {
        console.warn('Google Sheet Error', e);
    }
}

async function sendLineNotifications(workData) {
    // Reusing your logic
    const priorityEmoji = {
        'urgent': '🔴', 'high': '🟠', 'medium': '🟡', 'low': '🟢'
    };
    
    const message = `
🔔 *แจ้งเตือนงานใหม่*

${priorityEmoji[workData.priority] || '⚪'} ความสำคัญ: ${workData.priority}
👤 ผู้ส่ง: ${workData.sender_name}
🏢 แผนก: ${workData.sender_department}
🏪 ร้าน: ${workData.store_name}
📍 สถานที่: ${workData.location}
📝 รายละเอียด: ${workData.work_details}
⏰ เวลางาน: ${formatDateTime(workData.work_datetime)}
    `.trim();

    // Loop sending
    for (const userId of LINE_USER_IDS) {
        try {
            await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
                },
                body: JSON.stringify({
                    to: userId,
                    messages: [{ type: 'text', text: message }]
                })
            });
            await new Promise(r => setTimeout(r, 300)); // Delay prevents rate limit
        } catch (e) {
            console.error('Line send error', e);
        }
    }
}

function formatDateTime(str) {
    const d = new Date(str);
    return d.toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}
