# A60 Timer & Item Roller

A minimalist web countdown timer with randomized intervals and a probability-based item roller.

## Features

### A60 Countdown Timer
- Configurable minimum and maximum countdown sliders (1s to 30m).
- Automatically selects a random duration between the minimum and maximum upon starting and after each cycle.
- Plays `Alarmm.m4a` audio exactly once when each countdown completes, then seamlessly starts the next random interval.
- Background execution support using an inline Web Worker and timestamp drift correction to ensure accurate counting even when the browser tab is inactive or hidden.
- Real-time tab title bar updates showing the remaining time and timer state.
- Pause, Resume, Reset controls and volume adjustment.

### 1-100 Item Roller
- Sits right next to the timer in a responsive layout.
- Rolls random numbers from 1 to 100 at a configurable rolling speed (default: 1.0 second).
- When it reaches 100, randomly picks one of three items:
  - **Bleach** (`2_Bleach.png`)
  - **Coagulate** (`1_Coagulate.png`)
  - **Bobberfish** (`3_Bobberfish.webp`)
- Triggers text-to-speech (TTS) via the Web Speech API speaking the name of the chosen item ("Bleach", "Coagulate", or "Bobberfish").
- Displays the winning item's image and name.
- Optional "Pause rolling when 100 is reached" setting.
- "Roll Once" and "Test 100 Hit" buttons for manual rolling and preview testing.
- Tracks total rolls, 100 hits, and recent hit history.

### Design
- Simple, high-contrast dark interface with zero emojis.
- Operates reliably in background tabs.

## GitHub Pages Deployment

The project is hosted directly on GitHub Pages from the `main` branch.
