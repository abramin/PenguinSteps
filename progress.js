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

// Badge Definitions (Synced with app.js - using SVG assets)
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
    collectedStickers: [],
    lastStickerDate: null // Synced with app.js
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
            // Use generic locked badge SVG
            imgSrc = 'assets/badges/badge_locked.svg';
        }

        // However, standard patterns often show the silhouette. 
        // Let's stick to the plan: use `badge.icon` but with a class.
        // Wait, current CSS sets `filter: none` for .locked img. 
        // The previous logic was: locked -> specific locked image.
        // Let's use a generic 'badge_locked.png' for all locked items to match the "Mystery Stone" look in the mockup

        const finalSrc = isUnlocked ? badge.icon : 'assets/badges/badge_locked.svg';

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
    elements.levelPathContainer.className = 'level-path-container';

    // Levels 1 to 9
    const totalLevels = 9;
    const currentLevel = motivationState.currentChapter || 1;

    for (let i = 1; i <= totalLevels; i++) {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'level-circle';

        // Map states to use the level_circle*.png assets
        if (i < currentLevel) {
            levelDiv.classList.add('completed');
            levelDiv.innerHTML = '✓';
        } else if (i === currentLevel) {
            levelDiv.classList.add('active');
            levelDiv.textContent = i;
        } else {
            levelDiv.classList.add('locked');
            levelDiv.textContent = i;
        }

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
        item.innerHTML = `<img src="assets/stickers/${stickerId}.png" alt="Sticker" onerror="this.style.display='none'">`;
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
        const content = e.target.result;

        // Small delay to let browser events settle after file picker closes
        setTimeout(() => {
            try {
                const backup = JSON.parse(content);

                // Basic Validation
                if (!backup.schemaVersion || !backup.data) {
                    throw new Error("Invalid backup file format (missing schema version or data).");
                }

                if (backup.schemaVersion !== 1) {
                    alert(`Warning: This backup version (${backup.schemaVersion}) might not be fully supported. Trying anyway...`);
                }

                const data = backup.data;

                // Restore Motivation
                if (data.motivation) {
                    const restoredMotivation = { ...defaultMotivationState, ...data.motivation };
                    localStorage.setItem(MOTIVATION_KEY, JSON.stringify(restoredMotivation));
                    motivationState = restoredMotivation;
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

                alert("Backup restored!");
                window.location.reload();

            } catch (err) {
                console.error("Import error:", err);
                alert("Failed to import backup: " + err.message);
            }
        }, 100);
    };

    reader.onerror = () => {
        alert("Error reading file.");
    };

    reader.readAsText(file);
}

// Initialization
init();
