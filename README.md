# A60 Timer & Jackpot Roller

A minimalist web countdown timer with randomized intervals and a 1-in-100 jackpot roller.

## Features

### A60 Countdown Timer
- Configurable minimum and maximum countdown sliders (1s to 30m).
- Automatically selects a random duration between the minimum and maximum upon starting and after each cycle.
- Plays `Alarmm.m4a` audio exactly once when each countdown completes, then seamlessly starts the next random interval.
- Background execution support using an inline Web Worker and timestamp drift correction to ensure accurate counting even when the browser tab is inactive or hidden.
- Real-time tab title bar updates showing the remaining time and timer state.
- Pause, Resume, Reset controls and volume adjustment.

### 1-100 Jackpot Roller
- Sits right next to the timer in a responsive layout.
- Rolls random numbers from 1 to 100 at a configurable rolling speed (default: 1.0 second).
- When it reaches **100** (Jackpot), it selects one random item according to its drop chances:
  - **Sprint**: 30% (`Jackpot/Sprint.png`)
  - **CodeBreacher**: 30% (`Jackpot/Code breacher.png`)
  - **Medkit**: 20% (`Jackpot/Medkit.webp`)
  - **Peri**: 10% (`Jackpot/Perithesene.png`)
  - **Dweller Chunk**: 5% (`Jackpot/Dweller Chunk.webp`)
  - **Red Remote**: 2.5% (`Jackpot/Red remote.webp`)
  - **Blue Remote**: 2.5% (`Jackpot/Blue_Remote.png`)
- Displays the selected item's image, name, and chance percentage.
- Plays Text-to-Speech (TTS) via the Web Speech API speaking the name of the winning item.
- Interactive dropdown table showing all item drop probabilities.
- Optional "Pause rolling when Jackpot is reached" toggle.
- "Roll Once" and "Test Jackpot" buttons for manual rolling and preview testing.
- Tracks total rolls, jackpots hit, and recent jackpot history with timestamps.

### Design
- Simple, high-contrast dark layout with zero emojis.
- Background tab resilience.

## GitHub Pages Deployment

The tool is hosted directly on GitHub Pages from the `main` branch:
[https://blackwellarchitecture.github.io/Chester-Timer/](https://blackwellarchitecture.github.io/Chester-Timer/)
