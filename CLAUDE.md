# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Penguin Steps is a kid-friendly exercise routine web app that guides a child through a fixed workout routine. It's a pure client-side application with no build tools or backend.

## Running the App

Open `index.html` directly in a browser. No server or build step required.

## Architecture

Three files with no dependencies:
- `index.html` - Layout and structure
- `style.css` - Bright, playful styling with big buttons/text for kids
- `app.js` - Routine configuration and exercise engine

**Routine configuration** lives at the top of `app.js` as a JavaScript object so parents can easily edit exercises.

## Key Domain Concepts

**Exercise Types**: Stretch, Strength, Gait, Balance, Fun - each with different behaviors

**Rest Overlay Rules**: The "Ready" rest prompt appears ONLY for Strength exercises:
- Between Strength sets
- After completing a Strength exercise before the next exercise
- Never for Stretch, Balance, Gait, or Fun

**Per-leg Exercise Order**: Always **Right then Left** within each set:
- Timed: 30s Right → 30s Left (auto-transitions)
- Reps: "Done: Right" button → "Done: Left" button

## State Management

Uses `localStorage` for persistence:
- Current position (step/set/side)
- Timer remaining for timed exercises
- Completion status

App offers "Resume session" on page load if a session is in progress.

## UI Patterns

- Progress shown as "Checkpoint X of 9" with visual path
- Countdown timers for timed exercises
- "Complete set" buttons for rep-based exercises
- Controls: Pause/Resume, Back, Skip, Restart
