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

const state = {
  currentStepIndex: 0,
  currentSetIndex: 0,
  currentSide: routine[0].perSide ? "Right" : null,
};

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
};

const typeClassMap = {
  Stretch: "type-stretch",
  Strength: "type-strength",
  Gait: "type-gait",
  Balance: "type-balance",
  Fun: "type-fun",
};

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

function renderPath() {
  elements.checkpointPath.innerHTML = "";

  routine.forEach((_, index) => {
    const checkpoint = document.createElement("li");
    checkpoint.className = "checkpoint";
    checkpoint.textContent = String(index + 1);

    if (index < state.currentStepIndex) {
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
  const percent = (state.currentStepIndex / routine.length) * 100;
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

  renderPath();
}

render();
