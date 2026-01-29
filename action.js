const STORAGE_KEY = 'clockworks-data';
const toast = document.getElementById('toast');

const loginForm = document.getElementById('loginForm');
const adminInitForm = document.getElementById('adminInitForm');
const accountForm = document.getElementById('accountForm');
const checkInBtn = document.getElementById('checkInBtn');
const checkOutBtn = document.getElementById('checkOutBtn');
const leaveForm = document.getElementById('leaveForm');
const supplementForm = document.getElementById('supplementForm');
const reportForm = document.getElementById('reportForm');
const logoutBtn = document.getElementById('logoutBtn');

const loginIdInput = document.getElementById('loginId');
const loginPasswordInput = document.getElementById('loginPassword');
const adminIdInput = document.getElementById('adminId');
const adminPasswordInput = document.getElementById('adminPassword');
const accountIdInput = document.getElementById('accountId');
const accountPasswordInput = document.getElementById('accountPassword');
const accountRoleInput = document.getElementById('accountRole');
const leaveDateInput = document.getElementById('leaveDate');
const leaveHoursInput = document.getElementById('leaveHours');
const leaveReasonInput = document.getElementById('leaveReason');
const supplementDateInput = document.getElementById('supplementDate');
const supplementReasonInput = document.getElementById('supplementReason');
const reportYearInput = document.getElementById('reportYear');
const reportMonthInput = document.getElementById('reportMonth');

const adminAccountCard = document.getElementById('adminAccountCard');
const accountList = document.getElementById('accountList');
const checkInStatus = document.getElementById('checkInStatus');
const checkOutStatus = document.getElementById('checkOutStatus');
const attendanceList = document.getElementById('attendanceList');
const leaveList = document.getElementById('leaveList');
const reportPreview = document.getElementById('reportPreview');
const loginHint = document.getElementById('loginHint');

let currentUser = null;

const defaultData = {
    users: [],
    logs: {
        checkIns: {},
        checkOuts: {},
        leaves: [],
        supplements: []
    }
};

const formatDate = (date) => date.toISOString().split('T')[0];

const todayString = () => formatDate(new Date());

const pad = (value, length) => String(value).padStart(length, '0');

const isValidId = (value) => /^\d{3}$/.test(value);

const isValidPassword = (value) => /^\d{4}$/.test(value);

const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
};

const loadData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
        return structuredClone(defaultData);
    }
    try {
        return JSON.parse(saved);
    } catch (error) {
        return structuredClone(defaultData);
    }
};

const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const getData = () => {
    const data = loadData();
    data.logs.checkIns ??= {};
    data.logs.checkOuts ??= {};
    return data;
};

const updateAdminInitAvailability = () => {
    const data = getData();
    const hasAdmin = data.users.some((user) => user.role === 'admin');
    adminInitForm.querySelector('button').disabled = hasAdmin;
    loginHint.textContent = hasAdmin
        ? '已有管理者，可直接登入。'
        : '尚未建立管理者？請先初始化。';
};

const setCurrentUser = (user) => {
    currentUser = user;
    sessionStorage.setItem('clockworks-user', JSON.stringify(user));
    refreshUI();
};

const loadCurrentUser = () => {
    const saved = sessionStorage.getItem('clockworks-user');
    if (saved) {
        currentUser = JSON.parse(saved);
    }
};

const refreshAccountList = () => {
    const data = getData();
    const items = data.users.map((user) => {
        const roleLabel = user.role === 'admin' ? '管理者' : '一般員工';
        return `<div class="item">${user.id}｜${roleLabel}</div>`;
    });
    accountList.innerHTML = items.join('') || '<div class="item">尚無帳號</div>';
};

const getUserDailyLog = (logs, userId, date) => logs?.[userId]?.[date];

const updateDailyStatus = () => {
    if (!currentUser) {
        checkInStatus.textContent = '尚未打卡';
        checkOutStatus.textContent = '尚未打卡';
        return;
    }
    const data = getData();
    const date = todayString();
    const checkIn = getUserDailyLog(data.logs.checkIns, currentUser.id, date);
    const checkOut = getUserDailyLog(data.logs.checkOuts, currentUser.id, date);
    checkInStatus.textContent = checkIn || '尚未打卡';
    checkOutStatus.textContent = checkOut || '尚未打卡';
};

const refreshAttendance = () => {
    if (!currentUser) {
        attendanceList.innerHTML = '<div class="item">請先登入。</div>';
        return;
    }
    const data = getData();
    const userCheckIns = data.logs.checkIns[currentUser.id] || {};
    const userCheckOuts = data.logs.checkOuts[currentUser.id] || {};
    const dates = Array.from(
        new Set([...Object.keys(userCheckIns), ...Object.keys(userCheckOuts)])
    ).sort().reverse();
    if (dates.length === 0) {
        attendanceList.innerHTML = '<div class="item">目前沒有打卡紀錄。</div>';
        return;
    }
    attendanceList.innerHTML = dates
        .slice(0, 6)
        .map((date) => {
            const inTime = userCheckIns[date] || '--';
            const outTime = userCheckOuts[date] || '--';
            return `<div class="item">${date}｜上班 ${inTime}｜下班 ${outTime}</div>`;
        })
        .join('');
};

const refreshLeaveList = () => {
    if (!currentUser) {
        leaveList.innerHTML = '<div class="item">請先登入。</div>';
        return;
    }
    const data = getData();
    const items = [
        ...data.logs.leaves
            .filter((entry) => entry.userId === currentUser.id)
            .map((entry) => ({
                date: entry.date,
                label: `請假 ${entry.hours} 小時｜${entry.reason}`
            })),
        ...data.logs.supplements
            .filter((entry) => entry.userId === currentUser.id)
            .map((entry) => ({
                date: entry.date,
                label: `補打卡｜${entry.reason}`
            }))
    ]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6);

    leaveList.innerHTML =
        items.map((entry) => `<div class="item">${entry.date}｜${entry.label}</div>`).join('') ||
        '<div class="item">目前沒有請假或補打卡紀錄。</div>';
};

const refreshUI = () => {
    updateAdminInitAvailability();
    refreshAccountList();
    updateDailyStatus();
    refreshAttendance();
    refreshLeaveList();
    reportPreview.innerHTML = currentUser
        ? '<div class="item">請選擇年月後下載報表。</div>'
        : '<div class="item">請先登入。</div>';
    adminAccountCard.style.display = currentUser?.role === 'admin' ? 'block' : 'none';
};

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = loginIdInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if (!isValidId(id) || !isValidPassword(password)) {
        showToast('帳號或密碼格式錯誤。');
        return;
    }
    const data = getData();
    const user = data.users.find((item) => item.id === id && item.password === password);
    if (!user) {
        showToast('帳號或密碼不正確。');
        return;
    }
    setCurrentUser(user);
    showToast(`歡迎回來，${user.role === 'admin' ? '管理者' : '員工'} ${user.id}`);
    loginForm.reset();
});

adminInitForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = adminIdInput.value.trim();
    const password = adminPasswordInput.value.trim();
    if (!isValidId(id) || !isValidPassword(password)) {
        showToast('帳號或密碼格式錯誤。');
        return;
    }
    const data = getData();
    const hasAdmin = data.users.some((user) => user.role === 'admin');
    if (hasAdmin) {
        showToast('已有管理者，無法再次初始化。');
        return;
    }
    data.users.push({ id, password, role: 'admin' });
    saveData(data);
    updateAdminInitAvailability();
    refreshAccountList();
    showToast('管理者建立完成，請登入。');
    adminInitForm.reset();
});

accountForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('只有管理者可新增帳號。');
        return;
    }
    const id = accountIdInput.value.trim();
    const password = accountPasswordInput.value.trim();
    const role = accountRoleInput.value;
    if (!isValidId(id) || !isValidPassword(password)) {
        showToast('帳號或密碼格式錯誤。');
        return;
    }
    const data = getData();
    if (data.users.some((user) => user.id === id)) {
        showToast('帳號已存在。');
        return;
    }
    data.users.push({ id, password, role });
    saveData(data);
    refreshAccountList();
    accountForm.reset();
    showToast('帳號已新增。');
});

checkInBtn.addEventListener('click', () => {
    if (!currentUser) {
        showToast('請先登入。');
        return;
    }
    const data = getData();
    const date = todayString();
    data.logs.checkIns[currentUser.id] ??= {};
    if (data.logs.checkIns[currentUser.id][date]) {
        showToast('今日已完成上班打卡。');
        return;
    }
    const time = new Date().toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit'
    });
    data.logs.checkIns[currentUser.id][date] = time;
    saveData(data);
    updateDailyStatus();
    refreshAttendance();
    showToast('上班打卡完成。');
});

checkOutBtn.addEventListener('click', () => {
    if (!currentUser) {
        showToast('請先登入。');
        return;
    }
    const data = getData();
    const date = todayString();
    data.logs.checkOuts[currentUser.id] ??= {};
    const time = new Date().toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit'
    });
    data.logs.checkOuts[currentUser.id][date] = time;
    saveData(data);
    updateDailyStatus();
    refreshAttendance();
    showToast('下班打卡完成，已保留最新時間。');
});

leaveForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!currentUser) {
        showToast('請先登入。');
        return;
    }
    const date = leaveDateInput.value;
    const hours = parseFloat(leaveHoursInput.value);
    const reason = leaveReasonInput.value.trim();
    if (!date || Number.isNaN(hours) || hours < 0.5) {
        showToast('請填寫正確的日期與時數。');
        return;
    }
    if (reason.length === 0 || reason.length > 20) {
        showToast('事由需在 1~20 字內。');
        return;
    }
    const data = getData();
    data.logs.leaves.push({
        userId: currentUser.id,
        date,
        hours,
        reason
    });
    saveData(data);
    leaveForm.reset();
    refreshLeaveList();
    showToast('請假已送出。');
});

supplementForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!currentUser) {
        showToast('請先登入。');
        return;
    }
    const date = supplementDateInput.value;
    const reason = supplementReasonInput.value.trim();
    if (!date) {
        showToast('請選擇日期。');
        return;
    }
    if (reason.length === 0 || reason.length > 20) {
        showToast('事由需在 1~20 字內。');
        return;
    }
    const data = getData();
    data.logs.supplements.push({
        userId: currentUser.id,
        date,
        reason
    });
    saveData(data);
    supplementForm.reset();
    refreshLeaveList();
    showToast('補打卡已送出。');
});

const buildReportLines = (data, year, month, userId) => {
    const monthKey = `${year}-${pad(month, 2)}`;
    const checkIns = data.logs.checkIns[userId] || {};
    const checkOuts = data.logs.checkOuts[userId] || {};
    const dailyDates = Array.from(
        new Set([...Object.keys(checkIns), ...Object.keys(checkOuts)])
    )
        .filter((date) => date.startsWith(monthKey))
        .sort();

    const lines = ['ClockWorks Monthly Report', `Employee: ${userId}`, `Month: ${monthKey}`];
    lines.push('----------------------------------------');
    if (dailyDates.length === 0) {
        lines.push('No attendance records in selected month.');
    } else {
        dailyDates.forEach((date) => {
            lines.push(`Date ${date} | In ${checkIns[date] || '--'} | Out ${checkOuts[date] || '--'}`);
        });
    }

    const leaves = data.logs.leaves.filter(
        (entry) => entry.userId === userId && entry.date.startsWith(monthKey)
    );
    const supplements = data.logs.supplements.filter(
        (entry) => entry.userId === userId && entry.date.startsWith(monthKey)
    );

    lines.push('----------------------------------------');
    lines.push(`Leaves: ${leaves.length}`);
    leaves.forEach((entry) => {
        lines.push(`Leave ${entry.date} | ${entry.hours} hrs | ${entry.reason}`);
    });
    lines.push(`Supplements: ${supplements.length}`);
    supplements.forEach((entry) => {
        lines.push(`Supplement ${entry.date} | ${entry.reason}`);
    });

    return lines;
};

const generatePdf = (lines, filename) => {
    const text = lines.map((line) => line.replace(/[()]/g, '')).join('\n');
    const contentStream = [
        'BT',
        '/F1 12 Tf',
        '50 770 Td',
        ...text.split('\n').flatMap((line, index) => [
            index === 0 ? `(${line}) Tj` : `T* (${line}) Tj`
        ]),
        'ET'
    ].join('\n');

    const pdfParts = [];
    const offsets = [];

    const addObject = (obj) => {
        offsets.push(pdfParts.join('').length);
        pdfParts.push(obj);
    };

    pdfParts.push('%PDF-1.4\n');
    addObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    addObject('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    addObject(
        `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`
    );
    addObject(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);
    addObject('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

    const xrefStart = pdfParts.join('').length;
    pdfParts.push('xref\n0 6\n0000000000 65535 f \n');
    offsets.forEach((offset) => {
        pdfParts.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
    });
    pdfParts.push(
        `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
    );

    const blob = new Blob(pdfParts, { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
};

reportForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!currentUser) {
        showToast('請先登入。');
        return;
    }
    if (currentUser.role !== 'employee') {
        showToast('請使用員工帳號下載報表。');
        return;
    }
    const year = parseInt(reportYearInput.value, 10);
    const month = parseInt(reportMonthInput.value, 10);
    if (!year || !month) {
        showToast('請選擇年份與月份。');
        return;
    }
    const data = getData();
    const lines = buildReportLines(data, year, month, currentUser.id);
    reportPreview.innerHTML = lines.map((line) => `<div class="item">${line}</div>`).join('');
    generatePdf(lines, `clockworks-${currentUser.id}-${year}-${pad(month, 2)}.pdf`);
    showToast('報表下載完成。');
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('clockworks-user');
    currentUser = null;
    refreshUI();
    showToast('已登出。');
});

reportYearInput.value = new Date().getFullYear();
reportMonthInput.value = String(new Date().getMonth() + 1);

loadCurrentUser();
refreshUI();
