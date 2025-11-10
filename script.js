/* ========================================
   ไฟล์ JavaScript สำหรับ RACKS Portfolio
   เชื่อมต่อกับ Supabase + ปฏิทินวันหยุด
   ======================================== */

// ⚙️ ตั้งค่า Supabase
const SUPABASE_URL = 'https://slejbpinrkbtkwfqzrbs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZWpicGlucmtidGt3ZnF6cmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzIxODUsImV4cCI6MjA3ODEwODE4NX0.NYeuGdkiej5g2b_0BKGvG9JVS03fh9uO2mdD2xMLAXo';

// ⚙️ ตั้งค่า LINE Messaging API
const LINE_CHANNEL_ACCESS_TOKEN = 'NA6cbvMSSdRzh8uXPn3xKcEXiu6mF9n9EvyMrBQIhfCXYOS5zmhlqSyZJtppfYP2RjIqWJBOHjeRoXFMY2SFwGMav7291f5kl1uxV7+5+1KN3boWgvsZ/X5TWrj6IyHzHKt7VzLVL6fx/EhkjAzDpgdB04t89/1O/w1cDnyilFU=';

// 🎯 รายชื่อ User ID ที่ต้องการแจ้งเตือน (ส่งได้หลายคน)
const LINE_USER_IDS = [
    'U05e988ee991017311410c6c49f125295',
    'U91b1ef62be46477c06803071156346bf'
];

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
        typingSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % typingTexts.length;
        typingSpeed = 500;
    }
    
    setTimeout(typeText, typingSpeed);
}

// ตรวจสอบสถานะการ Login เมื่อโหลดหน้า
window.addEventListener('DOMContentLoaded', async () => {
    typeText();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        console.log('ผู้ใช้ล็อกอินแล้ว:', user.email);
        updateUIForLoggedInUser(user);
    }
    
    await loadHolidays();
    renderCalendar();
    
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
        holidays = [];
    }
}

// ฟังก์ชันแสดงปฏิทิน
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
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dayDiv = createDayElement(day, true);
        calendarDays.appendChild(dayDiv);
    }
    
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = createDayElement(day, false);
        
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayDiv.classList.add('today');
        }
        
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isHoliday = holidays.some(h => h.date === dateString);
        if (isHoliday) {
            dayDiv.classList.add('holiday');
            const holidayInfo = holidays.find(h => h.date === dateString);
            dayDiv.title = holidayInfo.name || 'วันหยุด';
        }
        
        calendarDays.appendChild(dayDiv);
    }
    
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = createDayElement(day, true);
        calendarDays.appendChild(dayDiv);
    }
}

function createDayElement(day, isOtherMonth) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = day;
    
    if (isOtherMonth) {
        dayDiv.classList.add('other-month');
    }
    
    return dayDiv;
}

function openLoginModal(event) {
    event.preventDefault();
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
    submitBtn.textContent = 'กำลังเข้าสู่ระบบ...';
    submitBtn.disabled = true;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) {
            throw error;
        }
        
        console.log('Login สำเร็จ:', data.user);
        alert('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ' + data.user.email);
        closeLoginModal();
        updateUIForLoggedInUser(data.user);
        
    } catch (error) {
        console.error('Login Error:', error.message);
        alert('เข้าสู่ระบบล้มเหลว: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.error('Logout Error:', error.message);
    } else {
        alert('ออกจากระบบสำเร็จ');
        location.reload();
    }
}

function updateUIForLoggedInUser(user) {
    const loginBtn = document.querySelector('.login-btn');
    
    if (loginBtn) {
        loginBtn.textContent = 'Logout';
        loginBtn.onclick = (e) => {
            e.preventDefault();
            handleLogout();
        };
    }
    
    const userNameDisplay = document.getElementById('userDisplayName');
    if (userNameDisplay) {
        userNameDisplay.textContent = user.email.split('@')[0];
    }
}

document.getElementById('loginModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeLoginModal();
    }
});

async function openWorkHandoverModal(event) {
    event.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert('กรุณาเข้าสู่ระบบก่อนส่งมอบงาน');
        openLoginModal(event);
        return;
    }
    
    document.getElementById('workHandoverModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const now = new Date();
    const dateTimeString = now.toISOString().slice(0, 16);
    document.getElementById('workDate').value = dateTimeString;
    document.getElementById('workDateTime').value = dateTimeString;
    
    if (user.user_metadata && user.user_metadata.full_name) {
        document.getElementById('senderName').value = user.user_metadata.full_name;
    } else {
        document.getElementById('senderName').value = user.email.split('@')[0];
    }
}

function closeWorkHandoverModal() {
    document.getElementById('workHandoverModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    
    document.querySelector('#workHandoverModal form').reset();
}

async function handleWorkHandoverSubmit(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'กำลังบันทึกข้อมูล...';
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
        
        // 1. บันทึกลงฐานข้อมูล Supabase
        const { data, error } = await supabase
            .from('work_handovers')
            .insert([workData]);
        
        if (error) throw error;
        
        // 2. ส่งข้อมูลไป Google Sheets
        await sendToGoogleSheets(workData);
        
        // 3. ส่งการแจ้งเตือนผ่าน LINE (หลายคน)
        await sendLineNotifications(workData);
        
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

async function sendToGoogleSheets(workData) {
    try {
        if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('ใส่')) {
            console.warn('ยังไม่ได้ตั้งค่า Google Sheets URL');
            return;
        }
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(workData)
        });
        
        console.log('✅ ส่งข้อมูลไป Google Sheets สำเร็จ');
    } catch (error) {
        console.error('❌ Error sending to Google Sheets:', error.message);
    }
}

// ⭐ ฟังก์ชันส่งการแจ้งเตือนผ่าน LINE (แก้ไขให้ส่งหลายคน)
async function sendLineNotifications(workData) {
    try {
        if (!LINE_CHANNEL_ACCESS_TOKEN || LINE_CHANNEL_ACCESS_TOKEN.includes('ใส่')) {
            console.warn('ยังไม่ได้ตั้งค่า LINE Channel Access Token');
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
        
        // 🔄 วนลูปส่งข้อความไปยังทุกคนใน Array
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < LINE_USER_IDS.length; i++) {
            const userId = LINE_USER_IDS[i];
            
            try {
                const payload = {
                    to: userId,
                    messages: [
                        {
                            type: 'text',
                            text: message
                        }
                    ]
                };
                
                const response = await fetch('https://api.line.me/v2/bot/message/push', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    console.log(`✅ ส่ง LINE ไปยัง User ${i + 1} สำเร็จ`);
                    successCount++;
                } else {
                    const errorText = await response.text();
                    console.error(`❌ ส่ง LINE ไปยัง User ${i + 1} ไม่สำเร็จ:`, errorText);
                    failCount++;
                }
                
                // หน่วงเวลา 500ms ระหว่างการส่ง
                if (i < LINE_USER_IDS.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
            } catch (error) {
                console.error(`❌ Error sending LINE to User ${i + 1}:`, error.message);
                failCount++;
            }
        }
        
        console.log(`📊 สรุปการส่ง LINE: สำเร็จ ${successCount} คน, ล้มเหลว ${failCount} คน`);
        
    } catch (error) {
        console.error('❌ Error sending LINE notifications:', error.message);
    }
}

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

document.getElementById('workHandoverModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeWorkHandoverModal();
    }
});
