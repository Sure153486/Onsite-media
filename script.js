/* ========================================
   ไฟล์ JavaScript สำหรับ RACKS Portfolio
   เชื่อมต่อกับ Supabase + ปฏิทินวันหยุด
   ======================================== */

// ⚙️ ตั้งค่า Supabase (ใส่ข้อมูลของคุณที่นี่)
const SUPABASE_URL = 'https://slejbpinrkbtkwfqzrbs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZWpicGlucmtidGt3ZnF6cmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzIxODUsImV4cCI6MjA3ODEwODE4NX0.NYeuGdkiej5g2b_0BKGvG9JVS03fh9uO2mdD2xMLAXo';
const LINE_CHANNEL_ACCESS_TOKEN = 'NA6cbvMSSdRzh8uXPn3xKcEXiu6mF9n9EvyMrBQIhfCXYOS5zmhlqSyZJtppfYP2RjIqWJBOHjeRoXFMY2SFwGMav7291f5kl1uxV7+5+1KN3boWgvsZ/X5TWrj6IyHzHKt7VzLVL6fx/EhkjAzDpgdB04t89/1O/w1cDnyilFU=';
const LINE_USER_ID = 'U05e988ee991017311410c6c49f125295'; // หรือใช้ Array สำหรับหลายคน ['U123...', 'U456...']
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzLTxcfJrZqPnSXZQimh8psaxdGHUn-5n1Z0e0S31tSAavfIB0FSqx7_NZbrQxcMDQn/exec';

// สร้าง Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ตัวแปรสำหรับปฏิทิน
let currentDate = new Date();
let holidays = [];

// ตัวแปรสำหรับ Typing Animation
const typingTexts = ['Ready to start Working.', 'พวกเราพร้อมแล้ว.', 'มาลุยกันเลย.'];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingSpeed = 150;

function typeText() {
    const typingElement = document.querySelector('.typing-text');
    const currentText = typingTexts[textIndex];
    
    if (isDeleting) {
        typingElement.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 50;
    } else {
        typingElement.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 150;
    }
    
    if (!isDeleting && charIndex === currentText.length) {
        // พิมพ์เสร็จแล้ว รอแล้วค่อยลบ
        typingSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        // ลบเสร็จแล้ว ไปข้อความถัดไป
        isDeleting = false;
        textIndex = (textIndex + 1) % typingTexts.length;
        typingSpeed = 500;
    }
    
    setTimeout(typeText, typingSpeed);
}

// ตรวจสอบสถานะการ Login เมื่อโหลดหน้า
window.addEventListener('DOMContentLoaded', async () => {
    // เริ่ม Typing Animation
    typeText();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        console.log('ผู้ใช้ล็อกอินแล้ว:', user.email);
        updateUIForLoggedInUser(user);
    }
    
    // โหลดวันหยุดและแสดงปฏิทิน
    await loadHolidays();
    renderCalendar();
    
    // Event Listeners สำหรับปุ่มเปลี่ยนเดือน
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
});

// โหลดวันหยุดจาก Supabase
async function loadHolidays() {
    try {
        const { data, error } = await supabase
            .from('holidays')
            .select('*')
            .order('date', { ascending: true });
        
        if (error) throw error;
        
        holidays = data || [];
        console.log('โหลดวันหยุดสำเร็จ:', holidays);
    } catch (error) {
        console.error('Error loading holidays:', error.message);
        // ถ้ายังไม่มีตาราง holidays ให้ใช้ค่าเริ่มต้น
        holidays = [];
    }
}

// ฟังก์ชันแสดงปฏิทิน
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // แสดงเดือนและปี
    const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                       'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year + 543}`;
    
    // หาวันแรกและวันสุดท้ายของเดือน
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // วันที่ของเดือนก่อนหน้าที่ต้องแสดง
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // สร้างอาร์เรย์ของวันทั้งหมดที่จะแสดง
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    // วันของเดือนก่อนหน้า
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dayDiv = createDayElement(day, true);
        calendarDays.appendChild(dayDiv);
    }
    
    // วันของเดือนปัจจุบัน
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = createDayElement(day, false);
        
        // ตรวจสอบว่าเป็นวันนี้หรือไม่
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayDiv.classList.add('today');
        }
        
        // ตรวจสอบว่าเป็นวันหยุดหรือไม่
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isHoliday = holidays.some(h => h.date === dateString);
        if (isHoliday) {
            dayDiv.classList.add('holiday');
            const holidayInfo = holidays.find(h => h.date === dateString);
            dayDiv.title = holidayInfo.name || 'วันหยุด';
        }
        
        calendarDays.appendChild(dayDiv);
    }
    
    // วันของเดือนถัดไป
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 แถว x 7 วัน = 42
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = createDayElement(day, true);
        calendarDays.appendChild(dayDiv);
    }
}

// สร้าง element สำหรับวันในปฏิทิน
function createDayElement(day, isOtherMonth) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = day;
    
    if (isOtherMonth) {
        dayDiv.classList.add('other-month');
    }
    
    return dayDiv;
}

// ฟังก์ชันเปิด Login Modal
function openLoginModal(event) {
    event.preventDefault();
    document.getElementById('loginModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ฟังก์ชันปิด Login Modal
function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ฟังก์ชันจัดการการ Login ด้วย Supabase
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // แสดง Loading
    const submitBtn = event.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'กำลังเข้าสู่ระบบ...';
    submitBtn.disabled = true;
    
    try {
        // เข้าสู่ระบบด้วย Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) {
            throw error;
        }
        
        // Login สำเร็จ
        console.log('Login สำเร็จ:', data.user);
        alert('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ' + data.user.email);
        closeLoginModal();
        updateUIForLoggedInUser(data.user);
        
    } catch (error) {
        // Login ล้มเหลว
        console.error('Login Error:', error.message);
        alert('เข้าสู่ระบบล้มเหลว: ' + error.message);
    } finally {
        // คืนค่าปุ่มเดิม
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ฟังก์ชัน Logout
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.error('Logout Error:', error.message);
    } else {
        alert('ออกจากระบบสำเร็จ');
        location.reload(); // รีโหลดหน้าเพื่ออัพเดท UI
    }
}

// อัพเดท UI เมื่อ Login สำเร็จ
function updateUIForLoggedInUser(user) {
    const loginBtn = document.querySelector('.login-btn');
    
    if (loginBtn) {
        loginBtn.textContent = 'Logout';
        loginBtn.onclick = (e) => {
            e.preventDefault();
            handleLogout();
        };
    }
    
    // อัพเดทชื่อผู้ใช้ใน Dashboard
    const userNameDisplay = document.getElementById('userDisplayName');
    if (userNameDisplay) {
        userNameDisplay.textContent = user.email.split('@')[0];
    }
}

// ปิด modal เมื่อคลิกข้างนอก
document.getElementById('loginModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeLoginModal();
    }
});

// ฟังก์ชันเปิด Work Handover Modal
async function openWorkHandoverModal(event) {
    event.preventDefault();
    
    // ตรวจสอบว่าผู้ใช้ล็อกอินหรือยัง
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        // ถ้ายังไม่ได้ล็อกอิน ให้เปิด Login Modal แทน
        alert('กรุณาเข้าสู่ระบบก่อนส่งมอบงาน');
        openLoginModal(event);
        return;
    }
    
    // ถ้าล็อกอินแล้ว ให้เปิดฟอร์มส่งมอบงาน
    document.getElementById('workHandoverModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // ตั้งค่าวันที่-เวลาเริ่มต้นเป็นปัจจุบัน
    const now = new Date();
    const dateTimeString = now.toISOString().slice(0, 16);
    document.getElementById('workDate').value = dateTimeString;
    document.getElementById('workDateTime').value = dateTimeString;
    
    // ตั้งชื่อผู้ส่งจากข้อมูลผู้ใช้ที่ล็อกอิน
    if (user.user_metadata && user.user_metadata.full_name) {
        document.getElementById('senderName').value = user.user_metadata.full_name;
    } else {
        document.getElementById('senderName').value = user.email.split('@')[0];
    }
}

// ฟังก์ชันปิด Work Handover Modal
function closeWorkHandoverModal() {
    document.getElementById('workHandoverModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // รีเซ็ตฟอร์ม
    document.querySelector('#workHandoverModal form').reset();
}

// ฟังก์ชันส่งข้อมูลแบบฟอร์มส่งมอบงาน
async function handleWorkHandoverSubmit(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'กำลังบันทึกข้อมูล...';
    submitBtn.disabled = true;
    
    try {
        // รับค่าจากฟอร์ม
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
        
        // 1. บันทึกลงฐานข้อมูล Supabase
        const { data, error } = await supabase
            .from('work_handovers')
            .insert([workData]);
        
        if (error) throw error;
        
        // 2. ส่งข้อมูลไป Google Sheets
        await sendToGoogleSheets(workData);
        
        // 3. ส่งการแจ้งเตือนผ่าน LINE
        await sendLineNotification(workData);
        
        alert('✅ ส่งมอบงานสำเร็จ!\n- บันทึกลง Database\n- บันทึกลง Google Sheets\n- แจ้งเตือนผ่าน LINE แล้ว');
        closeWorkHandoverModal();
        
    } catch (error) {
        console.error('Error submitting work handover:', error.message);
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ฟังก์ชันส่งข้อมูลไป Google Sheets
async function sendToGoogleSheets(workData) {
    try {
        if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('ใส่')) {
            console.warn('ยังไม่ได้ตั้งค่า Google Sheets URL');
            return;
        }
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // สำคัญ! เพราะ Google Apps Script ไม่รองรับ CORS
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(workData)
        });
        
        console.log('✅ ส่งข้อมูลไป Google Sheets สำเร็จ');
    } catch (error) {
        console.error('❌ Error sending to Google Sheets:', error.message);
        // ไม่ throw error เพื่อไม่ให้กระทบกับการทำงานอื่น
    }
}

// ฟังก์ชันส่งการแจ้งเตือนผ่าน LINE Notify
async function sendLineNotification(workData) {
    try {
        if (!LINE_NOTIFY_TOKEN || LINE_NOTIFY_TOKEN.includes('ใส่')) {
            console.warn('ยังไม่ได้ตั้งค่า LINE Notify Token');
            return;
        }
        
        // จัดรูปแบบข้อความ
        const priorityEmoji = {
            'urgent': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🟢'
        };
        
        const departmentName = {
            'sales': 'ฝ่ายขาย',
            'marketing': 'ฝ่ายการตลาด',
            'it': 'ฝ่าย IT',
            'hr': 'ฝ่ายบุคคล',
            'finance': 'ฝ่ายบัญชี',
            'production': 'ฝ่ายผลิต',
            'maintenance': 'ฝ่ายซ่อมบำรุง'
        };
        
        const message = `
🔔 มีงานใหม่เข้ามาแล้ว!

${priorityEmoji[workData.priority] || '⚪'} ความสำคัญ: ${workData.priority}
👤 ผู้ส่ง: ${workData.sender_name}
🏢 แผนก: ${departmentName[workData.sender_department] || workData.sender_department}
🏪 ร้าน: ${workData.store_name}
📍 สถานที่: ${workData.location}
📝 รายละเอียด: ${workData.work_details}
⏰ วันที่-เวลางาน: ${formatDateTime(workData.work_datetime)}
        `.trim();
        
        // ส่งข้อความผ่าน LINE Notify
        const formData = new FormData();
        formData.append('message', message);
        
        const response = await fetch('https://notify-api.line.me/api/notify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LINE_NOTIFY_TOKEN}`
            },
            body: formData
        });
        
        if (response.ok) {
            console.log('✅ ส่งการแจ้งเตือนผ่าน LINE สำเร็จ');
        } else {
            throw new Error('LINE Notify failed');
        }
    } catch (error) {
        console.error('❌ Error sending LINE notification:', error.message);
        // ไม่ throw error เพื่อไม่ให้กระทบกับการทำงานอื่น
    }
}

// ฟังก์ชันจัดรูปแบบวันที่-เวลา
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok'
    };
    return date.toLocaleDateString('th-TH', options);
}

// ปิด Work Handover Modal เมื่อคลิกข้างนอก
document.getElementById('workHandoverModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeWorkHandoverModal();
    }
});