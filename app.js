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
  },
  {
    name: "Resistance Band Dorsiflexion",
    type: "Strength",
    mode: "reps",
    sets: 3,
    perSide: true,
    repsPerSide: 15,
    purpose: "Strengthen the front of the ankle.",
    instructions: "Pull toes up against the band.",
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
};

const completedSteps = new Set();

// ============================================
// DOM Elements
// ============================================

const elements = {
  progressLabel: document.getElementById("progressLabel"),
  progressFill: document.getElementById("progressFill"),
  typeBadge: document.getElementById("typeBadge"),
  exerciseName: document.getElementById("exerciseName"),
  exercisePurpose: document.getElementById("exercisePurpose"),
  exerciseInstructions: document.getElementById("exerciseInstructions"),
  setStatus: document.getElementById("setStatus"),
  sideIndicator: document.getElementById("sideIndicator"),
  timerValue: document.getElementById("timerValue"),
  timerLabel: document.getElementById("timerLabel"),
  checkpointPath: document.getElementById("checkpointPath"),
  primaryAction: document.getElementById("primaryAction"),
  pauseButton: document.getElementById("pauseButton"),
  resumeButton: document.getElementById("resumeButton"),
  backButton: document.getElementById("backButton"),
  skipButton: document.getElementById("skipButton"),
  restartButton: document.getElementById("restartButton"),
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
    return { value: formatTime(seconds), label: "timer" };
  }

  if (step.mode === "reps") {
    const reps = step.perSide ? step.repsPerSide : step.reps;
    return { value: `${reps} reps`, label: "reps" };
  }

  if (step.mode === "steps") {
    return { value: `${step.steps} steps`, label: "steps" };
  }

  return { value: "--", label: "" };
}

// ============================================
// Rendering
// ============================================

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

  elements.progressLabel.textContent = `Checkpoint ${state.currentStepIndex + 1} of ${routine.length}`;
  const percent = (completedSteps.size / routine.length) * 100;
  elements.progressFill.style.width = `${percent}%`;

  elements.typeBadge.textContent = step.type;
  elements.typeBadge.className = `badge ${typeClassMap[step.type] || ""}`.trim();
  elements.exerciseName.textContent = step.name;
  elements.exercisePurpose.textContent = step.purpose || "";
  elements.exerciseInstructions.textContent = step.instructions || "";

  elements.setStatus.textContent = `Set ${state.currentSetIndex + 1} of ${step.sets}`;

  if (step.perSide) {
    elements.sideIndicator.hidden = false;
    elements.sideIndicator.textContent = state.currentSide || "Right";
  } else {
    elements.sideIndicator.hidden = true;
  }

  const metric = getMetricForStep(step);
  elements.timerValue.textContent = metric.value;
  elements.timerLabel.textContent = metric.label;

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
  elements.backButton.disabled = isAtBeginning();
  elements.skipButton.disabled = state.currentStepIndex === routine.length - 1;

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

// Advance to the next unit (side, set, or step)
function advanceUnit() {
  const step = getCurrentStep();

  // Per-leg: advance from Right to Left
  if (step.perSide && state.currentSide === "Right") {
    state.currentSide = "Left";
    render();
    return;
  }

  // End of set: advance to next set or next step
  if (state.currentSetIndex < step.sets - 1) {
    state.currentSetIndex++;
    state.currentSide = step.perSide ? "Right" : null;
    render();
    return;
  }

  // Completed all sets for this step
  completedSteps.add(state.currentStepIndex);

  // Move to next step if available
  if (state.currentStepIndex < routine.length - 1) {
    state.currentStepIndex++;
    state.currentSetIndex = 0;
    const nextStep = getCurrentStep();
    state.currentSide = nextStep.perSide ? "Right" : null;
    render();
    return;
  }

  // All done - routine complete
  render();
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

    // Also remove previous step from completed since we're re-entering it
    completedSteps.delete(state.currentStepIndex);

    render();
    return;
  }

  // Go to previous set
  state.currentSetIndex--;
  state.currentSide = step.perSide ? "Left" : null;
  render();
}

// Skip to next step (marks current step complete)
function skip() {
  // Mark current step as complete
  completedSteps.add(state.currentStepIndex);

  // Move to next step if available
  if (state.currentStepIndex < routine.length - 1) {
    state.currentStepIndex++;
    state.currentSetIndex = 0;
    const nextStep = getCurrentStep();
    state.currentSide = nextStep.perSide ? "Right" : null;
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
  completedSteps.clear();
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
elements.restartButton.addEventListener("click", restart);

// Initial render
render();
