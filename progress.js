// progress.js - Logic for Progress/Achievements Page

// ============================================
// Data Layer (Duplicated/Shared from app.js)
// ============================================
const MOTIVATION_KEY = 'wolfwalkers_motivation_v1';

// Badge Definitions (Duplicate)
const BADGES = [
    { id: 'first_session', name: 'First Steps', description: 'Complete your first session', icon: 'assets/badges/badge_first_steps.svg' },
    { id: 'hat_trick', name: 'Hat Trick', description: 'Complete 3 sessions in a week', icon: 'assets/badges/badge_hat_trick.svg' },
    { id: 'ten_strong', name: 'Ten Strong', description: 'Complete 10 total sessions', icon: 'assets/badges/badge_ten_strong.svg' },
    { id: 'quarter_century', name: 'Quarter Century', description: 'Complete 25 total sessions', icon: 'assets/badges/badge_quarter_century.svg' },
    { id: 'fifty_fine', name: 'Fifty Fine', description: 'Complete 50 total sessions', icon: 'assets/badges/badge_fifty_fine.svg' },
    { id: 'century_wolf', name: 'Century Wolf', description: 'Complete 100 total sessions', icon: 'assets/badges/badge_century_wolf.svg' },
    { id: 'stretch_star', name: 'Stretch Star', description: 'Complete all stretches in a session', icon: 'assets/badges/badge_stretch_star.svg' },
    { id: 'strong_steps', name: 'Strong Steps', description: 'Complete all strength sets in a session', icon: 'assets/badges/badge_strong_steps.svg' },
    { id: 'explorer', name: 'Explorer', description: 'Complete a session while offline', icon: 'assets/badges/badge_explorer.svg' }
];

const CHAPTERS = [
    { num: 1, title: "Learning the Steps", goal: 20 },
    { num: 2, title: "Steady Feet", goal: 20 },
    { num: 3, title: "Strong Ankles", goal: 20 },
    { num: 4, title: "Balanced Explorer", goal: 20 },
    { num: 5, title: "Smooth Walker", goal: 20 },
    { num: 6, title: "Penguin Pro", goal: 20 },
];

const defaultMotivationState = {
    totalSessionsCompleted: 0,
    sessionsByDate: {},
    currentStreak: 0,
    lastSessionDate: null,
    graceDaysUsedThisMonth: 0,
    lastGraceMonth: null,
    badgesUnlocked: [], // { id, timestamp }
    xpTotal: 0,
    currentChapter: 1,
    chapterProgress: 0,
    collectedStickers: []
};

let motivationState = { ...defaultMotivationState };

function loadMotivationData() {
    try {
        const saved = localStorage.getItem(MOTIVATION_KEY);
        if (saved) {
            motivationState = { ...defaultMotivationState, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.warn('Failed to load motivation data', e);
    }
}

function saveMotivationData() {
    try {
        localStorage.setItem(MOTIVATION_KEY, JSON.stringify(motivationState));
    } catch (e) {
        console.warn('Failed to save motivation data', e);
    }
}

// ============================================
// UI Rendering
// ============================================

const elements = {
    backBtn: document.getElementById('backToApp'),
    settingsBtn: document.getElementById('parentSettings'),
    tabs: document.querySelectorAll('.tab'),
    panes: document.querySelectorAll('.tab-pane'),
    badgeGrid: document.getElementById('badgeGrid'),
    totalSessionsBadgeLabel: document.getElementById('totalSessionsBadgeLabel'),
    streakCalendar: document.getElementById('streakCalendar'),
    currentStreakValue: document.getElementById('currentStreakValue'),
    graceDaysValue: document.getElementById('graceDaysValue'),
    journeyMap: document.getElementById('journeyMap'),
    xpDisplay: document.getElementById('xpDisplay'),
    stickersGrid: document.getElementById('stickersGrid')
};

function init() {
    loadMotivationData();
    setupTabs();
    renderBadges();
    renderStreak();
    renderJourney();
    renderStickers();
    setupNavigation();
}

function setupTabs() {
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            elements.tabs.forEach(t => t.classList.remove('active'));
            elements.panes.forEach(p => p.classList.remove('active'));

            // Activate clicked
            tab.classList.add('active');
            const targetId = tab.dataset.tab;
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function renderBadges() {
    elements.badgeGrid.innerHTML = '';
    const unlockedIds = new Set(motivationState.badgesUnlocked.map(b => b.id));

    BADGES.forEach(badge => {
        const isUnlocked = unlockedIds.has(badge.id);
        const el = document.createElement('div');
        el.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;

        const imgSrc = isUnlocked ? badge.icon : 'assets/badges/badge_locked.svg';

        el.innerHTML = `
            <img src="${imgSrc}" alt="${badge.name}" onerror="this.src='assets/rune_stone.png'">
            <div class="badge-name">${badge.name}</div>
            <div class="badge-desc">${badge.description}</div>
        `;

        elements.badgeGrid.appendChild(el);
    });

    elements.totalSessionsBadgeLabel.textContent = `Total Sessions: ${motivationState.totalSessionsCompleted}`;
}

function renderStreak() {
    // Render last 7 days from today
    elements.streakCalendar.innerHTML = '';

    const today = new Date();
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Create array of last 7 days (including today)
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = days[d.getDay()];

        const card = document.createElement('div');
        card.className = 'day-card';

        // Status logic
        let statusEmoji = '';
        if (motivationState.sessionsByDate[dateStr]) {
            statusEmoji = '🐾'; // Completed
            card.classList.add('completed');
        } else if (i === 0) {
            statusEmoji = 'Today'; // Today, not done yet
            card.classList.add('current');
        } else {
            statusEmoji = '•'; // Missed
        }

        // If it was a grace day logic? We don't track which specific day used grace in `sessionsByDate` directly with the current simple schema. 
        // We track `graceDaysUsedThisMonth`. 
        // We'll stick to simple Completed vs Not Completed.

        card.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-status">${statusEmoji}</div>
        `;
        elements.streakCalendar.appendChild(card);
    }

    elements.currentStreakValue.textContent = motivationState.currentStreak;
    // 2 grace days allowed per month, calculation:
    const remainingGrace = 2 - (motivationState.graceDaysUsedThisMonth || 0);
    elements.graceDaysValue.textContent = Math.max(0, remainingGrace);
}

function renderJourney() {
    elements.journeyMap.innerHTML = '';

    const currentChapNum = motivationState.currentChapter || 1;
    const progressInChap = motivationState.chapterProgress || 0;

    CHAPTERS.forEach(chap => {
        const isActive = chap.num === currentChapNum;
        const isPast = chap.num < currentChapNum;

        const row = document.createElement('div');
        row.className = `chapter-row ${isActive ? 'active' : ''}`;

        let percentage = 0;
        if (isPast) percentage = 100;
        else if (isActive) {
            // Cap at 100
            percentage = Math.min(100, (progressInChap / chap.goal) * 100);
        }

        let icon = isPast ? '✅' : (isActive ? '🏃' : '🔒');

        row.innerHTML = `
            <div class="chapter-icon">${icon}</div>
            <div class="chapter-info">
                <div class="chapter-title">Chapter ${chap.num}: ${chap.title}</div>
                <div class="chapter-progress-bar">
                    <div class="chapter-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        elements.journeyMap.appendChild(row);
    });

    elements.xpDisplay.textContent = motivationState.xpTotal || 0;
}

function renderStickers() {
    elements.stickersGrid.innerHTML = '';

    const stickers = motivationState.collectedStickers || [];

    if (stickers.length === 0) {
        elements.stickersGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">Complete sessions to earn stickers!</p>';
        return;
    }

    // Reverse to show newest first
    [...stickers].reverse().forEach(stickerId => {
        const item = document.createElement('div');
        item.className = 'sticker-item';
        item.innerHTML = `<img src="assets/stickers/${stickerId}.svg" alt="Sticker" onerror="this.style.display='none'">`;
        elements.stickersGrid.appendChild(item);
    });
}

function setupNavigation() {
    elements.backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    elements.settingsBtn.addEventListener('click', () => {
        if (confirm("Reset all motivation data (Badges, Streaks, etc.)? This cannot be undone.")) {
            motivationState = { ...defaultMotivationState };
            saveMotivationData();
            window.location.reload();
        }
    });
}

// Initialization
init();
