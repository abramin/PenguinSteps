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
};

const completedSteps = new Set();

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
  const percent = (completedSteps.size / routine.length) * 100;
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

  // Update side indicator (hidden but kept for compatibility)
  if (step.perSide) {
    elements.sideIndicator.hidden = false;
    elements.sideIndicator.textContent = state.currentSide || "Right";
  } else {
    elements.sideIndicator.hidden = true;
  }

  // Update timer/reps display
  const metric = getMetricForStep(step);

  if (metric.type === "reps" || metric.type === "steps") {
    // Show rep/step counter format: "0 / 15 reps"
    elements.timerValue.innerHTML = `<span class="current-rep">${state.currentRep}</span> / <span class="total-rep">${metric.value}</span>`;
    elements.timerLabel.textContent = metric.label;
  } else {
    elements.timerValue.textContent = metric.value;
    elements.timerLabel.textContent = metric.label;
  }

  // Update primary action button text based on mode and state
  if (!state.started) {
    elements.primaryAction.textContent = "Start";
  } else if (step.mode === "timed") {
    elements.primaryAction.textContent = "Next";
  } else if (step.perSide) {
    elements.primaryAction.textContent = `Done: ${state.currentSide}`;
  } else {
    elements.primaryAction.textContent = "Complete Set";
  }

  // Update navigation button states
  const atBeginning = isAtBeginning();
  const atEnd = state.currentStepIndex === routine.length - 1;

  elements.backButton.disabled = atBeginning;
  elements.skipButton.disabled = atEnd;
  elements.backButtonNav.disabled = atBeginning;
  elements.skipButtonNav.disabled = atEnd;

  // Render checkpoint visualizations
  renderCheckpointRow();
  renderPath();
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
    return;
  }

  // All done - routine complete
  render();
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
  }
}

// Go back to the previous unit (side, set, or step)
function goBack() {
  if (isAtBeginning()) {
    return;
  }

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
  if (!confirm("Restart the entire routine? All progress will be lost.")) {
    return;
  }

  state.currentStepIndex = 0;
  state.currentSetIndex = 0;
  state.currentSide = routine[0].perSide ? "Right" : null;
  state.started = false;
  state.currentRep = 0;
  completedSteps.clear();
  hideRestOverlay();
  render();
}

// Handle primary action button click
function handlePrimaryAction() {
  if (!state.started) {
    state.started = true;
    render();
    return;
  }

  // For timed exercises, this advances (timers will handle actual countdown later)
  // For reps/steps, this completes the current side or set
  advanceUnit();
}

// ============================================
// Event Listeners
// ============================================

elements.primaryAction.addEventListener("click", handlePrimaryAction);
elements.backButton.addEventListener("click", goBack);
elements.skipButton.addEventListener("click", skip);
elements.backButtonNav.addEventListener("click", goBack);
elements.skipButtonNav.addEventListener("click", skip);
elements.restartButton.addEventListener("click", restart);
elements.readyButton.addEventListener("click", continueAfterRest);

// Initial render
render();
