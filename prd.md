# PRD: “Penguin Steps” Local Exercise Routine Web App (HTML + Vanilla JS)

## 1) Summary

A simple, colorful, kid-friendly web app that runs locally (open `index.html`) and guides a 10-year-old through a fixed exercise routine. It shows the current exercise, timer or reps, time left, sets left, and overall routine progress.

Key rule changes (per your preferences):

* “Per leg” timed items run as **Left then Right inside the same set** (e.g., Set 1: 30s Left, then 30s Right).
* **Rest pauses only apply to Strength exercises** (not Stretch or Balance). No set-by-set rest for stretches. Balance is treated like Stretch (no rest).

## 2) Goals

* Make it easy for a child to complete the routine with minimal adult involvement.
* Reduce friction: always show “what to do now” and “how much is left”.
* Keep motivation high with playful visuals and progress feedback.

## 3) Users

* Primary: 10-year-old child doing the routine.
* Secondary: Parent who starts the session and occasionally edits the routine configuration.

## 4) Core user stories

1. As a child, I can press Start and be guided through each exercise with a big timer or rep counter and clear “what’s next”.
2. As a child, after **Strength** work I can rest, and the app waits for me to press “Ready” to continue.
3. As a child, I can see progress in a fun way (stickers/stars/checkpoints).
4. As a parent, I can adjust sets, seconds, or reps in one place.

## 5) Routine definition (initial content)

Each routine “step” has:

* Name
* Type: Stretch | Strength | Gait | Balance | Fun
* Mode: timed or reps/steps
* Sets
* Per-set duration or target reps/steps
* Per-side handling when relevant
* Instructions and short purpose

Initial routine:

### Stretch (no rest pauses)

1. Wall Calf Stretch: **3 sets**; each set is **30s Left + 30s Right**
2. Seated Towel Stretch: **3 sets**; each set is **30s Left + 30s Right**

### Strength (rest pauses between sets and between strength exercises)

3. Heel Walking (forwards & backwards): **4 sets x 10 steps**
4. Resistance Band Dorsiflexion: **3 sets**; each set is **15 reps Left + 15 reps Right**
5. Mini Squats (heels flat): **3 sets x 10 reps**

### Gait (default: no required rest pauses)

6. Heel-Toe Walk on Tape Line: **4 sets x 10 steps**
7. Walk Uphill/Incline: **3 minutes** (single timed unit)

### Balance (treated like Stretch: no rest pauses)

8. One-Leg Stand (eyes open, heels down): **3 sets**; each set is **30s Left + 30s Right**

### Fun (no required rest pauses)

9. “Penguin Walk” Game: **3 minutes** (single timed unit)

Notes:

* “Steps” workouts behave like reps: child taps “Complete set” when finished.
* “Per leg” units show a sub-step: Left then Right within each set.

## 6) Scope

### In scope (MVP)

* Single-page app: `index.html`, `style.css`, `app.js` (no build tools).
* Full routine playback with:

  * Start, Pause, Resume, Restart
  * Next and Back
  * Skip
* Timed steps: countdown timer, optional beep in last 3 seconds
* Rep/step steps: big “Complete set” button (optional counters)
* Per-leg handling: Left then Right automatically within the same set
* Progress: percent complete plus a playful visual tracker
* Local persistence (resume after refresh)

### Nice-to-have (post-MVP)

* Stickers/confetti
* Optional voice prompts toggle
* Simple “streak” view (local)

### Out of scope

* Accounts, cloud sync, backend
* Medical advice beyond showing your provided routine text

## 7) UX and UI requirements

### Visual style

* Bright, playful palette; big buttons and text.
* Minimal reading. Short instructions and icons.

### Main screen (single view)

* Header: App name + progress (e.g., “Checkpoint 3 of 9”)
* Exercise card:

  * Exercise name (large)
  * Type badge (color-coded)
  * Short purpose line (optional)
  * Instructions (1–2 lines)
* Set status:

  * “Set 2 of 3”
  * If per-leg: “Left” then “Right” indicator inside the set
* Timer/reps area:

  * Timer: big countdown (mm:ss)
  * Reps/steps: optional big counter, always include “Complete set”
* Controls:

  * Pause/Resume
  * Back, Skip
  * Ready (only shown when a Strength rest pause is active)
* Fun progress element:

  * A “path/map” with 9 checkpoints, filled as exercises are completed

## 8) Rest and pause rules

### Strength-only rest overlay

The app must show a rest overlay that requires a “Ready” click:

* After completing each **Strength** set (between sets), and
* After completing a **Strength** exercise (before moving to the next exercise)

The app must NOT show this rest overlay:

* Between sets for Stretch steps
* Between sets for Balance steps
* For Gait or Fun steps (unless you later decide otherwise)

Rest overlay content:

* “Nice work! Rest if you want.” + “Ready” button
* Shows what’s next: next set number (if within the same Strength exercise) or next exercise name

## 9) Functional requirements

### Routine engine

* Represent routine as ordered steps.
* Expand each step into work “units” (the atomic thing the UI runs):

  * Timed: each set is a unit; if per-leg, each unit internally runs Left then Right.
  * Reps/steps: each set is a unit; if per-leg, each unit requires Left reps then Right reps (or just “Complete Left”, “Complete Right”).
* Track:

  * currentStepIndex, currentSetIndex
  * within-set side state: left/right when applicable
  * total steps and completion status per step

### Timer logic (timed units)

* Countdown tick updates at 250–1000ms.
* Per-leg timed set:

  * Run Left countdown, then automatically switch to Right countdown.
  * When Right finishes, the set completes.
* On completion:

  * If the step type is Strength, trigger rest overlay.
  * Otherwise advance immediately.

### Reps/steps logic

* Default MVP:

  * “Complete Left” then “Complete Right” for per-leg reps sets.
  * “Complete set” for non-per-leg.
* Optional:

  * Tap-to-count reps/steps display (not required to finish).

### Navigation

* Back: goes to previous unit/set (confirm if it would undo completion).
* Skip: marks current unit complete (still triggers Strength rest overlay if skipping a Strength set/exercise).
* Restart: resets all state.

### Persistence (local)

* Use `localStorage` for:

  * step completion
  * current position (step/set/side)
  * timer remaining (for timed)
* On load: show “Resume session” if in progress.

## 10) Progress and “fun”

MVP:

* 9 checkpoint path (one per exercise).
* Each completed exercise fills its checkpoint and adds a sticker/star.
* End screen:

  * “All done!” badge
  * Total time
  * “See you next time”

## 11) Acceptance criteria (MVP)

* Opening `index.html` locally runs fully offline.
* “Per leg” timed sets run **Left then Right inside each set** (no separate sets per leg).
* Rest overlay appears only for **Strength**:

  * Between strength sets
  * Between strength exercises
* No rest overlay for Stretch or Balance.
* Overall progress remains visible and updates correctly.
* Refresh allows resuming.

## 12) Risks and mitigations

* Confusion on Left vs Right: use big footprint icons and clear labels.
* Too many interruptions: restrict rest overlay to Strength only (as specified).
* Parent edits: keep routine config in one clear JS object at top of `app.js`.

## 13) Build plan (implementation outline)

* Files:

  * `index.html` (layout)
  * `style.css` (colors, big typography, cards)
  * `app.js` (routine config + engine + rendering)
* Milestones:

  1. Routine config + step/set/side engine
  2. Timers + per-leg timed within a set
  3. Strength-only rest overlay logic
  4. Progress map + persistence
  5. Polish (animations/sounds toggle)

# PRD Addendum: Per-leg order is Right then Left

## Update to per-leg handling (applies across all step types)

For any “per leg / per side” exercise (timed or reps/steps), the within-set sequence must be:

1. **Right side**
2. **Left side**

### Timed per-leg sets

Example: “3 sets; 30s per leg”

* Set 1:

  * 30s **Right**
  * 30s **Left**
* Set 2: same
* Set 3: same

UI requirements:

* Show “Set X of Y”
* Show sub-step label prominently: “Right” then “Left”
* Auto-transition from Right to Left inside the set

### Reps per-leg sets

Example: “3 sets; 15 reps per leg”

* Set 1:

  * Complete **Right** (optionally count reps)
  * Complete **Left**
* Then set completes.

UI requirements (MVP):

* Two big buttons shown in sequence:

  * “Done: Right” then “Done: Left”
* Only after Left is confirmed does the set complete.

## Rest overlay (unchanged)

* Rest overlay requiring “Ready” still appears **only for Strength**:

  * Between strength sets
  * Between strength exercises
* No rest overlay for Stretch or Balance, even though they are per-leg.

## Acceptance criteria additions

* For every per-leg exercise, the app runs **Right then Left** within each set.
* This order is consistent across timed stretches and per-leg strength reps.
