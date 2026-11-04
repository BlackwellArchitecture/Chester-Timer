# A60 Timer

A minimalist web countdown timer that runs repeating randomized timers within a configurable range.

## Features

- Configurable minimum and maximum countdown sliders (1s to 30m).
- Automatically selects a random duration between the minimum and maximum upon starting and after each cycle.
- Plays `Alarmm.m4a` audio exactly once when each countdown completes, then seamlessly starts the next random interval.
- Background execution support using an inline Web Worker and timestamp drift correction to ensure accurate counting even when the browser tab is inactive or hidden.
- Real-time tab title bar updates showing the remaining time and timer state.
- Pause, Resume, Reset controls and volume adjustment.
- Zero emojis, clean and responsive layout.

## Deployment to GitHub Pages

1. Go to repository Settings > Pages.
2. Under "Build and deployment", set Source to "Deploy from a branch".
3. Select the `main` branch and `/ (root)` folder, then save.
