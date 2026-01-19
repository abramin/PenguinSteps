// progress.js - Logic for Progress/Achievements Page

// ============================================
// Data Layer (Duplicated/Shared from app.js)
// ============================================
// ============================================
// Data Layer (Duplicated/Shared from app.js)
// ============================================
const MOTIVATION_KEY = 'wolfwalkers_motivation_v1';
const STORAGE_NAMESPACE = 'wolfwalkers_';
const APP_STORAGE_KEYS = {
    state: STORAGE_NAMESPACE + 'state',
    completedSteps: STORAGE_NAMESPACE + 'completedSteps',
};

// Badge Definitions (Duplicate)
const BADGES = [
    { id: 'first_session', name: 'First Session', description: 'Complete your first session', icon: 'assets/badges/badge_first_session.png' },
    { id: 'hat_trick', name: '3 Sessions', description: 'Complete 3 sessions in a week', icon: 'assets/badges/badge_3_sessions.png' },
    { id: 'ten_strong', name: '10 Sessions', description: 'Complete 10 total sessions', icon: 'assets/badges/badge_10_sessions.png' },
    { id: 'quarter_century', name: '25 Sessions', description: 'Complete 25 total sessions', icon: 'assets/badges/badge_25_sessions.png' },
    { id: 'fifty_fine', name: '50 Sessions', description: 'Complete 50 total sessions', icon: 'assets/badges/badge_50_sessions.png' },
    { id: 'century_wolf', name: '100 Sessions', description: 'Complete 100 total sessions', icon: 'assets/badges/badge_100_sessions.png' },
    { id: 'stretch_star', name: 'Stretch Star', description: 'Complete all stretches in a session', icon: 'assets/badges/badge_stretch_star.png' },
    { id: 'strong_steps', name: 'Strong Steps', description: 'Complete all strength sets in a session', icon: 'assets/badges/badge_strong_steps.png' },
    { id: 'explorer', name: 'Explorer', description: 'Complete a session while offline', icon: 'assets/badges/badge_explorer.png' },
    { id: 'offline_badge', name: 'Offline Badge', description: 'Complete a session without internet', icon: 'assets/badges/badge_offline.png' }
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
    // Header Stats
    headerSessionCount: document.getElementById('headerSessionCount'),
    miniChapNum: document.getElementById('miniChapNum'),
    miniChapFill: document.getElementById('miniChapFill'),
    miniChapCurrent: document.getElementById('miniChapCurrent'),
    miniChapMax: document.getElementById('miniChapMax'),
    // Bottom Path
    levelPathContainer: document.getElementById('levelPathContainer'),

    streakCalendar: document.getElementById('streakCalendar'),
    currentStreakValue: document.getElementById('currentStreakValue'),
    graceDaysValue: document.getElementById('graceDaysValue'),
    journeyMap: document.getElementById('journeyMap'),
    xpDisplay: document.getElementById('xpDisplay'),
    stickersGrid: document.getElementById('stickersGrid'),
    // Parent Menu Elements
    parentMenuOverlay: document.getElementById('parentMenuOverlay'),
    closeParentMenu: document.getElementById('closeParentMenu'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFileInput: document.getElementById('importFileInput'),
    resetDataBtn: document.getElementById('resetDataBtn')
};

function init() {
    loadMotivationData();
    setupTabs();
    renderHeaderStats();
    renderBadges();
    renderLevelPath();
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

function renderHeaderStats() {
    if (elements.headerSessionCount) elements.headerSessionCount.textContent = motivationState.totalSessionsCompleted;

    // Mini Chapter Progress
    const currentChap = CHAPTERS.find(c => c.num === (motivationState.currentChapter || 1)) || CHAPTERS[0];
    if (elements.miniChapNum) elements.miniChapNum.textContent = currentChap.num;
    if (elements.miniChapCurrent) elements.miniChapCurrent.textContent = motivationState.chapterProgress || 0;
    if (elements.miniChapMax) elements.miniChapMax.textContent = currentChap.goal;

    const pct = Math.min(100, Math.max(0, ((motivationState.chapterProgress || 0) / currentChap.goal) * 100));
    if (elements.miniChapFill) elements.miniChapFill.style.width = `${pct}%`;
}

function renderBadges() {
    elements.badgeGrid.innerHTML = '';
    const unlockedIds = new Set(motivationState.badgesUnlocked.map(b => b.id));

    BADGES.forEach(badge => {
        const isUnlocked = unlockedIds.has(badge.id);
        const el = document.createElement('div');
        el.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;

        // Ensure we support the new PNG assets, fallback to generic locked if needed
        let imgSrc = badge.icon;

        // For locked badges, we might want a specific 'locked' version or just overlay a lock
        // simplified logic: if locked, use the generic locked icon or filter
        if (!isUnlocked) {
            // Use generic locked badge for now, or the specific one if we generated locked versions
            // Plan is to use a generic 'locked' frame or the icon with grayscale
            // Let's use the icon but rely on CSS to style it as locked + add a lock overlay
            imgSrc = 'assets/badges/badge_locked.png'; // Will need to generate this or use existing logic
        }

        // Actually, better logic: Always try to show the badge, but if locked show a "mystery" stone or the locked version
        if (!isUnlocked) {
            // Use a placeholder "Mystery Stone" image for locked badges
            imgSrc = 'assets/badges/badge_locked.png';
            // Or better, duplicate the 'badge_locked.svg' for now if png not ready
            // We will assume 'badge_locked.png' exists
        }

        // However, standard patterns often show the silhouette. 
        // Let's stick to the plan: use `badge.icon` but with a class.
        // Wait, current CSS sets `filter: none` for .locked img. 
        // The previous logic was: locked -> specific locked image.
        // Let's use a generic 'badge_locked.png' for all locked items to match the "Mystery Stone" look in the mockup

        const finalSrc = isUnlocked ? badge.icon : 'assets/badges/badge_locked.png';

        el.innerHTML = `
            <img src="${finalSrc}" alt="${badge.name}" onerror="this.src='assets/rune_stone.png'">
            <div class="badge-desc">${badge.description}</div>
        `;
        // Removed name label to match visual style (just icons)

        elements.badgeGrid.appendChild(el);
    });
}

function renderLevelPath() {
    if (!elements.levelPathContainer) return;
    elements.levelPathContainer.innerHTML = '';

    // Levels 1 to 9
    const totalLevels = 9;
    const currentLevel = motivationState.currentChapter || 1;

    for (let i = 1; i <= totalLevels; i++) {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'level-circle';
        levelDiv.textContent = i;

        if (i < currentLevel) {
            levelDiv.classList.add('completed');
        } else if (i === currentLevel) {
            levelDiv.classList.add('active');
            levelDiv.textContent = ''; // active usually has icon/glow without text or different text
        } else {
            levelDiv.classList.add('locked');
            levelDiv.innerHTML = `<img src="assets/lock_icon.png" style="width:16px; height:16px; opacity:0.5;">`;
            levelDiv.textContent = '';
        }

        // If active, maybe show the number or just the glow? 
        if (i === currentLevel) levelDiv.textContent = i;

        elements.levelPathContainer.appendChild(levelDiv);
    }
}

function renderJourney() {
    if (!elements.journeyMap) return;
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

    if (elements.xpDisplay) elements.xpDisplay.textContent = motivationState.xpTotal || 0;
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

        card.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-status">${statusEmoji}</div>
        `;
        elements.streakCalendar.appendChild(card);
    }

    elements.currentStreakValue.textContent = motivationState.currentStreak;
    // 2 grace days allowed per month
    const remainingGrace = 2 - (motivationState.graceDaysUsedThisMonth || 0);
    elements.graceDaysValue.textContent = Math.max(0, remainingGrace);
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

    // Parent Settings Menu
    elements.settingsBtn.addEventListener('click', () => {
        elements.parentMenuOverlay.classList.add('active');
    });

    elements.closeParentMenu.addEventListener('click', () => {
        elements.parentMenuOverlay.classList.remove('active');
    });

    // Close on click outside
    elements.parentMenuOverlay.addEventListener('click', (e) => {
        if (e.target === elements.parentMenuOverlay) {
            elements.parentMenuOverlay.classList.remove('active');
        }
    });

    // Reset Data
    elements.resetDataBtn.addEventListener('click', () => {
        if (confirm("WARNING: This will delete ALL progress, including stickers, badges, and streaks. This cannot be undone.\n\nAre you sure?")) {
            motivationState = { ...defaultMotivationState };
            saveMotivationData();
            // Also clear app state
            localStorage.removeItem(APP_STORAGE_KEYS.state);
            localStorage.removeItem(APP_STORAGE_KEYS.completedSteps);

            alert("All data has been reset.");
            window.location.reload();
        }
    });

    // Export
    elements.exportBtn.addEventListener('click', exportBackup);

    // Import
    elements.importBtn.addEventListener('click', () => {
        elements.importFileInput.click();
    });

    elements.importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importBackup(file);
        }
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    });
}

// ============================================
// Backup System
// ============================================

function exportBackup() {
    try {
        const backupData = {
            schemaVersion: 1,
            backupDate: new Date().toISOString(),
            data: {
                motivation: motivationState,
                appState: localStorage.getItem(APP_STORAGE_KEYS.state) ? JSON.parse(localStorage.getItem(APP_STORAGE_KEYS.state)) : null,
                completedSteps: localStorage.getItem(APP_STORAGE_KEYS.completedSteps) ? JSON.parse(localStorage.getItem(APP_STORAGE_KEYS.completedSteps)) : []
            }
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `penguin-steps-backup-${dateStr}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (e) {
        console.error("Export failed:", e);
        alert("Failed to create backup file found.");
    }
}

function importBackup(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const content = e.target.result;
            const backup = JSON.parse(content);

            // Basic Validation
            if (!backup.schemaVersion || !backup.data) {
                throw new Error("Invalid backup file format (missing schema version or data).");
            }

            if (backup.schemaVersion !== 1) {
                alert(`Warning: This backup version (${backup.schemaVersion}) might not be fully supported. Trying anyway...`);
            }

            const data = backup.data;
            const sessions = data.motivation?.totalSessionsCompleted || 0;
            const badges = data.motivation?.badgesUnlocked?.length || 0;
            const date = backup.backupDate ? new Date(backup.backupDate).toLocaleDateString() : "Unknown date";

            const msg = `Found backup from ${date}.\n\nContains:\n- ${sessions} Sessions\n- ${badges} Badges\n\nThis will OVERWRITE your current progress. Are you sure?`;

            if (confirm(msg)) {
                // Restore Motivation
                if (data.motivation) {
                    motivationState = { ...defaultMotivationState, ...data.motivation };
                    saveMotivationData();
                }

                // Restore App State
                if (data.appState) {
                    localStorage.setItem(APP_STORAGE_KEYS.state, JSON.stringify(data.appState));
                } else {
                    localStorage.removeItem(APP_STORAGE_KEYS.state);
                }

                if (data.completedSteps) {
                    localStorage.setItem(APP_STORAGE_KEYS.completedSteps, JSON.stringify(data.completedSteps));
                } else {
                    localStorage.removeItem(APP_STORAGE_KEYS.completedSteps);
                }

                alert("Backup restored successfully!");
                window.location.reload();
            }

        } catch (err) {
            console.error("Import error:", err);
            alert("Failed to import backup: " + err.message);
        }
    };

    reader.onerror = () => {
        alert("Error reading file.");
    };

    reader.readAsText(file);
}

// Initialization
init();
