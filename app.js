// ============================================
// Routine Configuration
// Edit this array to customize the exercise routine
// ============================================

const routine = [
  {
    name: "Wall Calf Stretch",
    type: "Stretch",
    mode: "timed",
    sets: 3,
    perSide: true,
    secondsPerSide: 30,
    purpose: "Loosen calves and ankles.",
    instructions: "Hands on wall, heels down.",
    image: "assets/ex_wall_calf_stretch.png"
  },
  {
    name: "Seated Towel Stretch",
    type: "Stretch",
    mode: "timed",
    sets: 3,
    perSide: true,
    secondsPerSide: 30,
    purpose: "Stretch the back of the leg.",
    instructions: "Sit tall, towel around foot.",
    image: "assets/ex_seated_towel_stretch.png"
  },
  {
    name: "Heel Walking (forwards & backwards)",
    type: "Strength",
    mode: "steps",
    sets: 4,
    perSide: false,
    steps: 10,
    purpose: "Build shin strength.",
    instructions: "Walk on heels forward then back.",
    image: "assets/ex_heel_walking.png"
  },
  {
    name: "Resistance Band Dorsiflexion",
    type: "Strength",
    mode: "reps",
    sets: 3,
    perSide: true,
    repsPerSide: 15,
    purpose: "Strengthen the front of the ankle.",
    instructions: "Sit down, use the band to pull toes up.",
    image: "assets/ex_band_dorsiflexion.png"
  },
  {
    name: "Mini Squats (heels flat)",
    type: "Strength",
    mode: "reps",
    sets: 3,
    perSide: false,
    reps: 10,
    purpose: "Strengthen legs with control.",
    instructions: "Slow squat, keep heels down.",
    image: "assets/ex_mini_squats.png"
  },
  {
    name: "Heel-Toe Walk on Tape Line",
    type: "Gait",
    mode: "steps",
    sets: 4,
    perSide: false,
    steps: 10,
    purpose: "Practice steady walking.",
    instructions: "Heel to toe along the line.",
    image: "assets/ex_heel_toe_walk.png"
  },
  {
    name: "Walk Uphill/Incline",
    type: "Gait",
    mode: "timed",
    sets: 1,
    perSide: false,
    seconds: 180,
    purpose: "Build endurance.",
    instructions: "Walk uphill at a steady pace.",
    image: "assets/ex_walk_uphill.png"
  },
  {
    name: "One-Leg Stand (eyes open, heels down)",
    type: "Balance",
    mode: "timed",
    sets: 3,
    perSide: true,
    secondsPerSide: 30,
    purpose: "Improve balance.",
    instructions: "Stand tall, eyes forward.",
    image: "assets/ex_one_leg_stand.png"
  },
  {
    name: "Penguin Walk Game",
    type: "Fun",
    mode: "timed",
    sets: 1,
    perSide: false,
    seconds: 180,
    purpose: "Have fun while moving.",
    instructions: "Waddle like a penguin!",
    image: "assets/ex_penguin_walk.png"
  },
];

// ============================================
// State Management
// ============================================

const state = {
  currentStepIndex: 0,
  currentSetIndex: 0,
  currentSide: routine[0].perSide ? "Right" : null,
  started: false,
  currentRep: 0, // For rep counting display
  // Timer state
  timerRunning: false,
  timerPaused: false,
  secondsRemaining: 0,
  timerIntervalId: null,
  // Routine timing
  routineStartTime: null,
  routineEndTime: null,
};

const completedSteps = new Set();

// ============================================
// Session Persistence (localStorage)
// ============================================

const STORAGE_NAMESPACE = 'wolfwalkers_';
const STORAGE_KEYS = {
  state: STORAGE_NAMESPACE + 'state',
  completedSteps: STORAGE_NAMESPACE + 'completedSteps',
};

function saveSession() {
  try {
    // Save only the persistable parts of state (not timerIntervalId)
    const persistableState = {
      currentStepIndex: state.currentStepIndex,
      currentSetIndex: state.currentSetIndex,
      currentSide: state.currentSide,
      started: state.started,
      currentRep: state.currentRep,
      timerPaused: state.timerPaused || state.timerRunning, // Save as paused if was running
      secondsRemaining: state.secondsRemaining,
      routineStartTime: state.routineStartTime,
    };
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(persistableState));
    localStorage.setItem(STORAGE_KEYS.completedSteps, JSON.stringify([...completedSteps]));
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

function loadSession() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEYS.state);
    const savedSteps = localStorage.getItem(STORAGE_KEYS.completedSteps);

    if (!savedState) return null;

    const parsed = JSON.parse(savedState);
    const steps = savedSteps ? JSON.parse(savedSteps) : [];

    return { state: parsed, completedSteps: steps };
  } catch (e) {
    console.warn('Failed to load session:', e);
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.state);
    localStorage.removeItem(STORAGE_KEYS.completedSteps);
  } catch (e) {
    console.warn('Failed to clear session:', e);
  }
}

function hasSavedSession() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.state);
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    // Only prompt if actually started
    return parsed.started === true;
  } catch (e) {
    return false;
  }
}

function restoreSession(savedData) {
  if (!savedData) return;

  // Restore state
  state.currentStepIndex = savedData.state.currentStepIndex;
  state.currentSetIndex = savedData.state.currentSetIndex;
  state.currentSide = savedData.state.currentSide;
  state.started = savedData.state.started;
  state.currentRep = savedData.state.currentRep;
  state.timerPaused = savedData.state.timerPaused;
  state.timerRunning = false; // Always start paused on resume
  state.secondsRemaining = savedData.state.secondsRemaining;
  state.routineStartTime = savedData.state.routineStartTime;

  // Restore completed steps
  completedSteps.clear();
  savedData.completedSteps.forEach(step => completedSteps.add(step));
}

// ============================================
// DOM Elements
// ============================================

const elements = {
  progressLabel: document.getElementById("progressLabel"),
  progressFill: document.getElementById("progressFill"),
  checkpointRow: document.getElementById("checkpointRow"),
  typeBadge: document.getElementById("typeBadge"),
  exerciseName: document.getElementById("exerciseName"),
  exercisePurpose: document.getElementById("exercisePurpose"),
  exerciseInstructions: document.getElementById("exerciseInstructions"),
  exerciseImage: document.getElementById("exerciseImage"),
  sideVisuals: document.getElementById("sideVisuals"),
  runeLeft: document.getElementById("runeLeft"),
  runeRight: document.getElementById("runeRight"),
  setStatus: document.getElementById("setStatus"),
  setBadge: document.getElementById("setBadge"),
  sideIndicator: document.getElementById("sideIndicator"),
  timerValue: document.getElementById("timerValue"),
  timerLabel: document.getElementById("timerLabel"),
  checkpointPath: document.getElementById("checkpointPath"),
  primaryAction: document.getElementById("primaryAction"),
  pauseButton: document.getElementById("pauseButton"),
  resumeButton: document.getElementById("resumeButton"),
  backButton: document.getElementById("backButton"),
  skipButton: document.getElementById("skipButton"),
  backButtonNav: document.getElementById("backButtonNav"),
  skipButtonNav: document.getElementById("skipButtonNav"),
  restartButton: document.getElementById("restartButton"),
  restOverlay: document.getElementById("restOverlay"),
  restNext: document.getElementById("restNext"),
  readyButton: document.getElementById("readyButton"),
  // End screen elements
  endOverlay: document.getElementById("endOverlay"),
  totalTimeValue: document.getElementById("totalTimeValue"),
  exercisesCompleted: document.getElementById("exercisesCompleted"),
  restartFromEnd: document.getElementById("restartFromEnd"),
  rewardContainer: document.getElementById("rewardContainer"),
  // Resume session elements
  resumeOverlay: document.getElementById("resumeOverlay"),
  resumeSessionBtn: document.getElementById("resumeSessionBtn"),
  startFreshBtn: document.getElementById("startFreshBtn"),
};

const typeClassMap = {
  Stretch: "type-stretch",
  Strength: "type-strength",
  Gait: "type-gait",
  Balance: "type-balance",
  Fun: "type-fun",
};

// ============================================
// Utility Functions
// ============================================

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function getMetricForStep(step) {
  if (step.mode === "timed") {
    const seconds = step.perSide ? step.secondsPerSide : step.seconds;
    return { value: formatTime(seconds), label: "timer", type: "timer" };
  }

  if (step.mode === "reps") {
    const reps = step.perSide ? step.repsPerSide : step.reps;
    return { value: reps, label: "reps", type: "reps" };
  }

  if (step.mode === "steps") {
    return { value: step.steps, label: "steps", type: "steps" };
  }

  return { value: "--", label: "", type: "unknown" };
}

// ============================================
// Audio System
// ============================================

let audioContext = null;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playBeep() {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 440; // A4 note
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

function playCompletionBeep() {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 880; // A5 note (higher)
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
}

// ============================================
// Timer System
// ============================================

function initializeTimer() {
  const step = getCurrentStep();
  if (step.mode !== "timed") return;

  const seconds = step.perSide ? step.secondsPerSide : step.seconds;
  state.secondsRemaining = seconds;
  state.timerRunning = false;
  state.timerPaused = false;
  updateTimerDisplay();
}

function startTimer() {
  const step = getCurrentStep();
  if (step.mode !== "timed") return;

  // Clear any existing interval
  if (state.timerIntervalId) {
    clearInterval(state.timerIntervalId);
  }

  state.timerRunning = true;
  state.timerPaused = false;

  let lastTickTime = Date.now();
  let fractionalSeconds = 0;

  state.timerIntervalId = setInterval(() => {
    const now = Date.now();
    const elapsed = (now - lastTickTime) / 1000;
    lastTickTime = now;

    fractionalSeconds += elapsed;

    if (fractionalSeconds >= 1) {
      state.secondsRemaining -= Math.floor(fractionalSeconds);
      fractionalSeconds = fractionalSeconds % 1;

      // Play beep in last 3 seconds
      if (state.secondsRemaining <= 3 && state.secondsRemaining > 0) {
        playBeep();
      }

      updateTimerDisplay();

      if (state.secondsRemaining <= 0) {
        onTimerComplete();
      }
    }
  }, 250);

  updatePauseButtonState();
}

function pauseTimer() {
  if (!state.timerRunning || state.timerPaused) return;

  if (state.timerIntervalId) {
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
  }

  state.timerPaused = true;
  state.timerRunning = false;
  updatePauseButtonState();
  render();
}

function resumeTimer() {
  if (!state.timerPaused) return;

  state.timerPaused = false;
  startTimer();
  render();
}

function stopTimer() {
  if (state.timerIntervalId) {
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
  }
  state.timerRunning = false;
  state.timerPaused = false;
}

function onTimerComplete() {
  stopTimer();
  playCompletionBeep();

  const step = getCurrentStep();

  // Per-leg: auto-transition Right -> Left
  if (step.perSide && state.currentSide === "Right") {
    state.currentSide = "Left";
    initializeTimer();
    render();

    // Auto-start after brief visual pause
    setTimeout(() => {
      startTimer();
    }, 500);
    return;
  }

  // Left completed or non-per-side: advance to next set/step
  advanceUnit();
}

function updateTimerDisplay() {
  elements.timerValue.textContent = formatTime(state.secondsRemaining);

  // Visual warning state for last 3 seconds
  if (state.secondsRemaining <= 3 && state.secondsRemaining > 0) {
    elements.timerValue.classList.add("timer-warning");
    elements.timerValue.classList.remove("timer-running");
  } else if (state.timerRunning) {
    elements.timerValue.classList.add("timer-running");
    elements.timerValue.classList.remove("timer-warning");
  } else {
    elements.timerValue.classList.remove("timer-running", "timer-warning");
  }
}

// ============================================
// Pause/Resume UI
// ============================================

function togglePause() {
  const step = getCurrentStep();
  if (step.mode !== "timed" || !state.started) return;

  if (state.timerRunning) {
    pauseTimer();
  } else if (state.timerPaused) {
    resumeTimer();
  }
}

function updatePauseButtonState() {
  const step = getCurrentStep();
  const pauseSymbol = elements.pauseButton.querySelector(".rune-symbol");
  const pauseLabel = elements.pauseButton.parentElement.querySelector(".rune-label");

  if (state.timerPaused) {
    pauseSymbol.textContent = "▶";
    pauseLabel.textContent = "Resume";
    elements.pauseButton.classList.remove("rune-red");
    elements.pauseButton.classList.add("rune-green");
  } else {
    pauseSymbol.textContent = "⏸";
    pauseLabel.textContent = "Pause";
    elements.pauseButton.classList.remove("rune-green");
    elements.pauseButton.classList.add("rune-red");
  }

  // Disable pause button when timer not applicable
  elements.pauseButton.disabled = step.mode !== "timed" || !state.started || (!state.timerRunning && !state.timerPaused);
}

// ============================================
// Rendering
// ============================================

function renderCheckpointRow() {
  elements.checkpointRow.innerHTML = "";

  routine.forEach((_, index) => {
    // Add connector before each checkpoint (except first)
    if (index > 0) {
      const connector = document.createElement("div");
      connector.className = "checkpoint-connector";
      if (completedSteps.has(index - 1)) {
        connector.classList.add("is-done");
      }
      elements.checkpointRow.appendChild(connector);
    }

    const circle = document.createElement("div");
    circle.className = "checkpoint-circle";

    if (completedSteps.has(index)) {
      circle.classList.add("is-done");
    }

    if (index === state.currentStepIndex) {
      circle.classList.add("is-current");
    }

    const span = document.createElement("span");
    span.textContent = String(index + 1);
    circle.appendChild(span);

    elements.checkpointRow.appendChild(circle);
  });
}

function renderPath() {
  elements.checkpointPath.innerHTML = "";

  routine.forEach((_, index) => {
    const checkpoint = document.createElement("li");
    checkpoint.className = "checkpoint";
    checkpoint.textContent = String(index + 1);

    if (completedSteps.has(index)) {
      checkpoint.classList.add("is-done");
    }

    if (index === state.currentStepIndex) {
      checkpoint.classList.add("is-current");
    }

    elements.checkpointPath.appendChild(checkpoint);
  });
}

function render() {
  const step = routine[state.currentStepIndex];

  // Update progress label
  elements.progressLabel.textContent = `Checkpoint ${state.currentStepIndex + 1} of ${routine.length}`;
  const percent = Math.round((completedSteps.size / routine.length) * 100);
  elements.progressLabel.textContent += ` (${percent}%)`;
  elements.progressFill.style.width = `${percent}%`;

  // Update exercise info
  elements.typeBadge.textContent = step.type;
  elements.typeBadge.className = `badge ${typeClassMap[step.type] || ""}`.trim();
  elements.exerciseName.textContent = step.name;
  elements.exercisePurpose.textContent = step.purpose || "";
  elements.exerciseInstructions.textContent = step.instructions || "";
  if (step.image) {
    elements.exerciseImage.src = step.image;
    elements.exerciseImage.alt = step.name;
  }

  // Update set status (hidden but kept for compatibility)
  elements.setStatus.textContent = `Set ${state.currentSetIndex + 1} of ${step.sets}`;

  // Update set badge with side info
  let setBadgeText = `Set ${state.currentSetIndex + 1} of ${step.sets}`;
  if (step.perSide) {
    setBadgeText += ` - ${state.currentSide} Leg`;
  }
  elements.setBadge.textContent = setBadgeText;

  // Update side indicator
  if (step.perSide) {
    elements.sideVisuals.hidden = false;
    elements.sideIndicator.hidden = false;
    elements.sideIndicator.textContent = state.currentSide || "Right";

    // Update visual runes
    if (state.currentSide === "Right") {
      elements.runeRight.classList.add("active-side");
      elements.runeLeft.classList.remove("active-side");
    } else {
      elements.runeLeft.classList.add("active-side");
      elements.runeRight.classList.remove("active-side");
    }
  } else {
    elements.sideVisuals.hidden = true;
    elements.sideIndicator.hidden = true;
    elements.runeLeft.classList.remove("active-side");
    elements.runeRight.classList.remove("active-side");
  }

  // Update timer/reps display
  const metric = getMetricForStep(step);

  if (metric.type === "reps" || metric.type === "steps") {
    // Show rep/step counter format: "15" (just the total)
    elements.timerValue.textContent = metric.value;
    elements.timerLabel.textContent = metric.label;
  } else if (step.mode === "timed" && state.started && state.secondsRemaining > 0) {
    // Show live countdown for timed exercises
    elements.timerValue.textContent = formatTime(state.secondsRemaining);
    elements.timerLabel.textContent = metric.label;
  } else {
    elements.timerValue.textContent = metric.value;
    elements.timerLabel.textContent = metric.label;
  }

  // Update primary action button text based on mode and state
  if (!state.started) {
    elements.primaryAction.textContent = "Start";
    elements.primaryAction.disabled = false;
  } else if (step.mode === "timed") {
    if (state.timerRunning) {
      elements.primaryAction.textContent = "Pause Timer";
      elements.primaryAction.disabled = false;
    } else if (state.timerPaused) {
      elements.primaryAction.textContent = "Resume Timer";
      elements.primaryAction.disabled = false;
    } else {
      elements.primaryAction.textContent = "Start Timer";
      elements.primaryAction.disabled = false;
    }
  } else if (step.perSide) {
    elements.primaryAction.textContent = `Done: ${state.currentSide}`;
    elements.primaryAction.disabled = false;
  } else {
    elements.primaryAction.textContent = "Complete Set";
    elements.primaryAction.disabled = false;
  }

  // Update navigation button states
  const atBeginning = isAtBeginning();
  const atEnd = state.currentStepIndex === routine.length - 1;

  elements.backButton.disabled = atBeginning;
  elements.skipButton.disabled = atEnd;
  elements.backButtonNav.disabled = atBeginning;
  elements.skipButtonNav.disabled = atEnd;

  // Update pause button state
  updatePauseButtonState();

  // Render checkpoint visualizations
  renderCheckpointRow();
  renderPath();

  // Auto-save session after each render
  saveSession();
}

// ============================================
// Navigation Logic
// ============================================

function isAtBeginning() {
  return (
    state.currentStepIndex === 0 &&
    state.currentSetIndex === 0 &&
    (!routine[0].perSide || state.currentSide === "Right")
  );
}

function isAtEnd() {
  const lastStep = routine[routine.length - 1];
  return (
    state.currentStepIndex === routine.length - 1 &&
    state.currentSetIndex === lastStep.sets - 1 &&
    (!lastStep.perSide || state.currentSide === "Left")
  );
}

function getCurrentStep() {
  return routine[state.currentStepIndex];
}

// Check if rest overlay should show (Strength exercises only)
function shouldShowRestOverlay(step, isEndOfSet, isEndOfExercise) {
  if (step.type !== "Strength") {
    return false;
  }
  return isEndOfSet || isEndOfExercise;
}

// Show rest overlay with appropriate message
function showRestOverlay(nextMessage) {
  elements.restNext.textContent = nextMessage;
  elements.restOverlay.classList.remove("hidden");
  elements.restOverlay.setAttribute("aria-hidden", "false");
}

// Hide rest overlay
function hideRestOverlay() {
  elements.restOverlay.classList.add("hidden");
  elements.restOverlay.setAttribute("aria-hidden", "true");
}

// ============================================
// End Screen
// ============================================

function playCelebrationSound() {
  if (!audioContext) return;

  // Play a rising arpeggio for celebration
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = freq;
    oscillator.type = "sine";

    const startTime = audioContext.currentTime + (i * 0.15);
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.3);
  });
}

function showEndScreen() {
  state.routineEndTime = Date.now();

  // Calculate total time
  const totalSeconds = Math.floor((state.routineEndTime - state.routineStartTime) / 1000);
  elements.totalTimeValue.textContent = formatTime(totalSeconds);
  elements.exercisesCompleted.textContent = routine.length;

  // Show the overlay
  elements.endOverlay.classList.remove("hidden");
  elements.endOverlay.setAttribute("aria-hidden", "false");

  // Play celebration sound
  playCelebrationSound();
}

function hideEndScreen() {
  elements.endOverlay.classList.add("hidden");
  elements.endOverlay.setAttribute("aria-hidden", "true");
}

// Advance to the next unit (side, set, or step)
function advanceUnit() {
  const step = getCurrentStep();

  // Per-leg: advance from Right to Left
  if (step.perSide && state.currentSide === "Right") {
    state.currentSide = "Left";
    state.currentRep = 0;
    render();
    return;
  }

  // Determine if this is end of set or end of exercise
  const isEndOfSet = state.currentSetIndex < step.sets - 1;
  const isEndOfExercise = state.currentSetIndex === step.sets - 1;

  // End of set: advance to next set or next step
  if (isEndOfSet) {
    // Check for rest overlay (Strength only)
    if (shouldShowRestOverlay(step, true, false)) {
      showRestOverlay(`Up next: Set ${state.currentSetIndex + 2}`);
      return;
    }

    state.currentSetIndex++;
    state.currentSide = step.perSide ? "Right" : null;
    state.currentRep = 0;
    render();

    // Start timer for next set (non-Strength timed exercises)
    if (step.mode === "timed") {
      initializeTimer();
      startTimer();
    }
    return;
  }

  // Completed all sets for this step
  completedSteps.add(state.currentStepIndex);

  // Move to next step if available
  if (state.currentStepIndex < routine.length - 1) {
    // Check for rest overlay before moving to next exercise (Strength only)
    if (shouldShowRestOverlay(step, false, true)) {
      const nextStep = routine[state.currentStepIndex + 1];
      showRestOverlay(`Up next: ${nextStep.name}`);
      return;
    }

    state.currentStepIndex++;
    state.currentSetIndex = 0;
    const nextStep = getCurrentStep();
    state.currentSide = nextStep.perSide ? "Right" : null;
    state.currentRep = 0;
    render();

    // Start timer for next exercise if timed
    if (nextStep.mode === "timed") {
      initializeTimer();
      startTimer();
    }
    return;
  }

  // All done - routine complete
  showEndScreen();
}

// Continue after rest overlay
function continueAfterRest() {
  hideRestOverlay();

  const step = getCurrentStep();

  // If we haven't completed all sets, go to next set
  if (state.currentSetIndex < step.sets - 1) {
    state.currentSetIndex++;
    state.currentSide = step.perSide ? "Right" : null;
    state.currentRep = 0;
    render();

    // Start timer if timed exercise
    if (step.mode === "timed") {
      initializeTimer();
      startTimer();
    }
    return;
  }

  // Otherwise, move to next step
  if (state.currentStepIndex < routine.length - 1) {
    state.currentStepIndex++;
    state.currentSetIndex = 0;
    const nextStep = getCurrentStep();
    state.currentSide = nextStep.perSide ? "Right" : null;
    state.currentRep = 0;
    render();

    // Start timer if next exercise is timed
    if (nextStep.mode === "timed") {
      initializeTimer();
      startTimer();
    }
  }
}

// Go back to the previous unit (side, set, or step)
function goBack() {
  if (isAtBeginning()) {
    return;
  }

  stopTimer();
  const step = getCurrentStep();

  // Per-leg: go from Left back to Right
  if (step.perSide && state.currentSide === "Left") {
    state.currentSide = "Right";
    state.currentRep = 0;
    render();
    return;
  }

  // Beginning of step: go to previous step's last set/side
  if (state.currentSetIndex === 0) {
    // Remove current step from completed if we're going back
    completedSteps.delete(state.currentStepIndex);

    state.currentStepIndex--;
    const prevStep = getCurrentStep();
    state.currentSetIndex = prevStep.sets - 1;
    state.currentSide = prevStep.perSide ? "Left" : null;
    state.currentRep = 0;

    // Also remove previous step from completed since we're re-entering it
    completedSteps.delete(state.currentStepIndex);

    render();
    return;
  }

  // Go to previous set
  state.currentSetIndex--;
  state.currentSide = step.perSide ? "Left" : null;
  state.currentRep = 0;
  render();
}

// Skip to next step (marks current step complete)
function skip() {
  stopTimer();
  const step = getCurrentStep();

  // Mark current step as complete
  completedSteps.add(state.currentStepIndex);

  // Check for rest overlay (Strength exercises only)
  if (step.type === "Strength" && state.currentStepIndex < routine.length - 1) {
    const nextStep = routine[state.currentStepIndex + 1];
    showRestOverlay(`Up next: ${nextStep.name}`);
    // State will be updated when ready button is clicked
    state.currentSetIndex = step.sets - 1; // Mark as if at end of exercise
    return;
  }

  // Move to next step if available
  if (state.currentStepIndex < routine.length - 1) {
    state.currentStepIndex++;
    state.currentSetIndex = 0;
    const nextStep = getCurrentStep();
    state.currentSide = nextStep.perSide ? "Right" : null;
    state.currentRep = 0;
  }

  render();
}

// Restart the entire routine
function restart() {
  stopTimer();
  hideEndScreen();

  if (!confirm("Restart the entire routine? All progress will be lost.")) {
    return;
  }

  resetRoutine();
}

// Reset routine state (shared by restart and restartFromEndScreen)
function resetRoutine() {
  state.currentStepIndex = 0;
  state.currentSetIndex = 0;
  state.currentSide = routine[0].perSide ? "Right" : null;
  state.started = false;
  state.currentRep = 0;
  state.routineStartTime = null;
  state.routineEndTime = null;
  completedSteps.clear();
  clearSession(); // Clear saved session data
  hideRestOverlay();
  render();
}

// Restart from end screen (no confirmation needed)
function restartFromEndScreen() {
  stopTimer();
  hideEndScreen();
  resetRoutine();
}

// Handle primary action button click
function handlePrimaryAction() {
  const step = getCurrentStep();

  if (!state.started) {
    state.started = true;
    state.routineStartTime = Date.now(); // Track when routine started
    initAudio(); // Initialize audio on first user interaction

    if (step.mode === "timed") {
      initializeTimer();
      startTimer();
    }
    render();
    return;
  }

  // For timed exercises
  if (step.mode === "timed") {
    // Timer is running or paused - skip to completion
    // Timer is running or paused - toggle pause
    if (state.timerRunning || state.timerPaused) {
      togglePause();
      return;
    }
    // Timer not started (e.g., after going back) - start it
    initializeTimer();
    startTimer();
    render();
    return;
  }

  // For reps/steps, this completes the current side or set
  advanceUnit();
}

// ============================================
// Event Listeners
// ============================================

elements.primaryAction.addEventListener("click", handlePrimaryAction);
elements.pauseButton.addEventListener("click", togglePause);
elements.backButton.addEventListener("click", goBack);
elements.skipButton.addEventListener("click", skip);
elements.backButtonNav.addEventListener("click", goBack);
elements.skipButtonNav.addEventListener("click", skip);
elements.restartButton.addEventListener("click", restart);
elements.restartFromEnd.addEventListener("click", restart);
elements.readyButton.addEventListener("click", continueAfterRest);

// Resume session overlay handlers
function showResumeOverlay() {
  elements.resumeOverlay.classList.remove("hidden");
  elements.resumeOverlay.setAttribute("aria-hidden", "false");
}

function hideResumeOverlay() {
  elements.resumeOverlay.classList.add("hidden");
  elements.resumeOverlay.setAttribute("aria-hidden", "true");
}

elements.resumeSessionBtn.addEventListener("click", () => {
  const savedData = loadSession();
  if (savedData) {
    restoreSession(savedData);
    initAudio(); // Initialize audio context
  }
  hideResumeOverlay();
  render();
});

elements.startFreshBtn.addEventListener("click", () => {
  clearSession();
  hideResumeOverlay();
  render();
});

// ============================================
// Initialization
// ============================================

// Check for saved session on load
if (hasSavedSession()) {
  showResumeOverlay();
} else {
  render();
}
