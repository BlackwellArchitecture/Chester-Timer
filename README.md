# A60 Timer, Jackpot Roller & Dice Roller

A modular web tool featuring randomized countdown intervals, a 1-in-100 jackpot roller with sacrifice mechanics, a customizable range dice roller, and a real-time activity log stream.

## Features

### 1. A60 Countdown Timer
- Configurable minimum and maximum countdown sliders (1s to 30m).
- Automatically selects a random duration between minimum and maximum on start and upon each cycle completion.
- Plays `Alarmm.m4a` audio exactly once when countdown hits 0:00, then starts the next interval.
- Background execution resilience using an inline Web Worker and timestamp difference calculations.
- Live tab title bar countdown (`02:12 - A60 Timer`).
- Pause, Resume, Reset controls, and volume adjustment.

### 2. 1-100 Jackpot Roller with Sacrifice Check
- Continuously rolls from 1 to 100 at an adjustable speed (default: 1.0 second).
- **Jackpot (Roll 100)**: Picks an item according to weighted drop rates:
  - **Sprint**: 30% (`Jackpot/Sprint.png`)
  - **CodeBreacher**: 30% (`Jackpot/Code breacher.png`)
  - **Medkit**: 20% (`Jackpot/Medkit.webp`)
  - **Peri**: 10% (`Jackpot/Perithesene.png`)
  - **Dweller Chunk**: 5% (`Jackpot/Dweller Chunk.webp`)
  - **Red Remote**: 2.5% (`Jackpot/Red remote.webp`)
  - **Blue Remote**: 2.5% (`Jackpot/Blue_Remote.png`)
- **Secondary Sacrifice Roll (1 to 10)**:
  - Once an item is chosen, rolls a separate 1 to 10 roller.
  - If it hits **10**, a pulsing red flashing text saying **"SACRIFICE"** appears on the module and is pronounced via Text-to-Speech (TTS).
- **Dismissible Result Card**: Includes a dedicated "Close" button to dismiss the jackpot/sacrifice display anytime.
- **Testing Controls**:
  - "Test Jackpot": Tests a natural 100 roll with standard 1-10 sacrifice roll.
  - "Test Sacrifice (10)": Forces a 100 roll with a guaranteed sacrifice roll of 10 to preview the flashing text and audio.

### 3. Customizable Dice Roller
- Set any custom minimum and maximum integer values.
- Fast presets for standard tabletop dice: D4, D6, D8, D10, D12, D20, D100.
- Quick animated rolling effect and tactile results display.

### 4. Real-Time Activity Logs Sidebar
- Positioned on the right side of the screen.
- Compact, color-coded stream tracking:
  - Timer cycles, pauses, and alarms.
  - 1-100 roll ticks (with toggle to silence or include individual rolls).
  - Jackpot triggers, item drop rates, and sacrifice rolls.
  - Dice roll results and ranges.
- Full date and time timestamp (`YYYY-MM-DD HH:MM:SS`) for every action.
- Live dynamic "X ago" age indicator (`just now`, `5s ago`, `2m ago`, etc.) updating in real-time.
- Quick "Clear" action and buffer management.

### Design
- Simple, high-contrast dark layout with zero emojis.
- Fully responsive across desktop, tablet, and mobile.

## GitHub Pages Deployment

Live site: [https://blackwellarchitecture.github.io/Chester-Timer/](https://blackwellarchitecture.github.io/Chester-Timer/)
