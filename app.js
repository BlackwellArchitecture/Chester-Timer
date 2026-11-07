(() => {
  // ==========================================
  // CONFIG & CONSTANTS
  // ==========================================
  const JACKPOT_ITEMS = [
    {
      name: 'Sprint',
      chance: 30,
      chanceText: '30%',
      image: 'Jackpot/Sprint.png',
      tts: 'Sprint'
    },
    {
      name: 'CodeBreacher',
      chance: 30,
      chanceText: '30%',
      image: 'Jackpot/Code%20breacher.png',
      tts: 'Code Breacher'
    },
    {
      name: 'Medkit',
      chance: 20,
      chanceText: '20%',
      image: 'Jackpot/Medkit.webp',
      tts: 'Medkit'
    },
    {
      name: 'Peri',
      chance: 10,
      chanceText: '10%',
      image: 'Jackpot/Perithesene.png',
      tts: 'Peri'
    },
    {
      name: 'Dweller Chunk',
      chance: 5,
      chanceText: '5%',
      image: 'Jackpot/Dweller%20Chunk.webp',
      tts: 'Dweller Chunk'
    },
    {
      name: 'Red Remote',
      chance: 2.5,
      chanceText: '2.5%',
      image: 'Jackpot/Red%20remote.webp',
      tts: 'Red Remote'
    },
    {
      name: 'Blue Remote',
      chance: 2.5,
      chanceText: '2.5%',
      image: 'Jackpot/Blue_Remote.png',
      tts: 'Blue Remote'
    }
  ];

  // Pre-cache images
  JACKPOT_ITEMS.forEach((item) => {
    const img = new Image();
    img.src = item.image;
  });

  // ==========================================
  // DOM ELEMENTS - TIMER
  // ==========================================
  const minSlider = document.getElementById('min-slider');
  const maxSlider = document.getElementById('max-slider');
  const minDisplay = document.getElementById('min-display');
  const maxDisplay = document.getElementById('max-display');
  const volumeSlider = document.getElementById('volume-slider');
  const volumeDisplay = document.getElementById('volume-display');

  const timerDisplay = document.getElementById('timer-display');
  const statusLabel = document.getElementById('status-label');
  const cycleInfo = document.getElementById('cycle-info');

  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const testAudioBtn = document.getElementById('test-audio-btn');
  const alarmAudio = document.getElementById('alarm-audio');

  // ==========================================
  // DOM ELEMENTS - JACKPOT ROLLER
  // ==========================================
  const rollerStatus = document.getElementById('roller-status');
  const rollNumberDisplay = document.getElementById('roll-number-display');
  const rollerResultCard = document.getElementById('roller-result-card');
  const closeResultBtn = document.getElementById('close-result-btn');
  const resultImage = document.getElementById('result-image');
  const resultName = document.getElementById('result-name');
  const resultChance = document.getElementById('result-chance');
  const sacrificeRollBadge = document.getElementById('sacrifice-roll-badge');
  const sacrificeBanner = document.getElementById('sacrifice-banner');

  const speedSlider = document.getElementById('speed-slider');
  const speedDisplay = document.getElementById('speed-display');
  const pauseOnHitCheckbox = document.getElementById('pause-on-hit');

  const rollerStartBtn = document.getElementById('roller-start-btn');
  const rollerStopBtn = document.getElementById('roller-stop-btn');
  const rollerOnceBtn = document.getElementById('roller-once-btn');
  const rollerTestBtn = document.getElementById('roller-test-btn');
  const rollerTestSacrificeBtn = document.getElementById('roller-test-sacrifice-btn');

  const totalRollsCount = document.getElementById('total-rolls-count');
  const totalHitsCount = document.getElementById('total-hits-count');
  const totalSacrificesCount = document.getElementById('total-sacrifices-count');

  // ==========================================
  // DOM ELEMENTS - DICE ROLLER
  // ==========================================
  const diceStatus = document.getElementById('dice-status');
  const diceResultDisplay = document.getElementById('dice-result-display');
  const diceRangeInfo = document.getElementById('dice-range-info');
  const diceMinInput = document.getElementById('dice-min-input');
  const diceMaxInput = document.getElementById('dice-max-input');
  const rollDiceBtn = document.getElementById('roll-dice-btn');
  const resetDiceBtn = document.getElementById('reset-dice-btn');
  const dicePresetBtns = document.querySelectorAll('.dice-preset-btn');

  // ==========================================
  // DOM ELEMENTS - ACTIVITY LOGS
  // ==========================================
  const logsStream = document.getElementById('logs-stream');
  const logsCounter = document.getElementById('logs-counter');
  const clearAllLogsBtn = document.getElementById('clear-all-logs-btn');
  const logRollsToggle = document.getElementById('log-rolls-toggle');

  // ==========================================
  // STATE
  // ==========================================
  // Timer State
  let timerState = 'idle'; // 'idle' | 'running' | 'paused'
  let targetEndTime = 0;
  let remainingMs = 0;
  let currentCycle = 0;
  let currentCycleTotalSeconds = 0;

  // Roller State
  let rollerRunning = false;
  let rollSpeedSec = 1.0;
  let lastRollTimestamp = 0;
  let totalRolls = 0;
  let totalJackpots = 0;
  let totalSacrifices = 0;

  // Logs State
  let totalLogEvents = 0;
  const MAX_LOG_ENTRIES = 250;

  // Shared Web Worker
  let worker = null;

  // ==========================================
  // TIME & FORMATTING HELPERS
  // ==========================================
  function formatSeconds(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatMs(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    return formatSeconds(totalSec);
  }

  function getRandomInt(min, max) {
    const lower = Math.min(min, max);
    const upper = Math.max(min, max);
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
  }

  function formatDateTime(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }

  function timeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 1) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // ==========================================
  // ACTIVITY LOGS SYSTEM
  // ==========================================
  function addLog(category, message) {
    if (category === 'roll' && !logRollsToggle.checked) {
      return;
    }

    if (logsStream.querySelector('.log-empty')) {
      logsStream.innerHTML = '';
    }

    const now = new Date();
    const nowMs = now.getTime();
    const dateTimeStr = formatDateTime(now);
    const ageStr = 'just now';

    const entry = document.createElement('div');
    entry.className = `log-entry cat-${category}`;
    entry.dataset.time = nowMs;

    let tagLabel = category.toUpperCase();
    if (category === 'sacrifice') tagLabel = 'SACRIFICE';

    entry.innerHTML = `
      <div class="log-meta-row">
        <div class="log-tag-group">
          <span class="log-tag tag-${category}">${tagLabel}</span>
          <span class="log-timestamp">${dateTimeStr}</span>
        </div>
        <span class="log-age">${ageStr}</span>
      </div>
      <div class="log-msg">${message}</div>
    `;

    logsStream.prepend(entry);
    totalLogEvents += 1;
    logsCounter.textContent = `${totalLogEvents} events`;

    // Limit log length for DOM performance
    while (logsStream.children.length > MAX_LOG_ENTRIES) {
      logsStream.removeChild(logsStream.lastChild);
    }
  }

  function updateAllLogAges() {
    const entries = logsStream.querySelectorAll('.log-entry');
    entries.forEach((el) => {
      const timestamp = parseInt(el.dataset.time, 10);
      if (timestamp) {
        const ageEl = el.querySelector('.log-age');
        if (ageEl) {
          ageEl.textContent = timeAgo(new Date(timestamp));
        }
      }
    });
  }

  setInterval(updateAllLogAges, 2000);

  clearAllLogsBtn.addEventListener('click', () => {
    logsStream.innerHTML = '<div class="log-empty">No activity recorded yet</div>';
    totalLogEvents = 0;
    logsCounter.textContent = '0 events';
  });

  // ==========================================
  // TTS SPEECH SYNTHESIS
  // ==========================================
  function speakTTS(text) {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    } else {
      console.warn('Speech synthesis not supported in this browser.');
    }
  }

  function primeMedia() {
    try {
      alarmAudio.load();
      if ('speechSynthesis' in window) {
        const silentUtterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(silentUtterance);
      }
    } catch (e) {
      // Ignore initial silent priming errors
    }
  }

  // ==========================================
  // WEB WORKER FOR BACKGROUND EXECUTION
  // ==========================================
  function initWorker() {
    if (worker) return;
    const workerScript = `
      let timerId = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (!timerId) {
            timerId = setInterval(function() {
              self.postMessage('tick');
            }, 100);
          }
        } else if (e.data === 'stop') {
          if (timerId) {
            clearInterval(timerId);
            timerId = null;
          }
        }
      };
    `;
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = function(e) {
      if (e.data === 'tick') {
        onTick();
      }
    };
  }

  function updateWorkerState() {
    if (timerState === 'running' || rollerRunning) {
      initWorker();
      worker.postMessage('start');
    } else {
      if (worker) {
        worker.postMessage('stop');
      }
    }
  }

  function onTick() {
    const now = Date.now();

    // Tick Timer
    if (timerState === 'running') {
      const diff = targetEndTime - now;
      if (diff <= 0) {
        playAlarm();
        addLog('timer', `Timer cycle #${currentCycle} completed (${formatSeconds(currentCycleTotalSeconds)}) - Alarm played.`);
        startNewTimerCycle();
      } else {
        remainingMs = diff;
        updateTimerDisplay();
      }
    }

    // Tick Roller
    if (rollerRunning) {
      const intervalMs = rollSpeedSec * 1000;
      if (now - lastRollTimestamp >= intervalMs) {
        lastRollTimestamp = now;
        executeRoll();
      }
    }
  }

  // ==========================================
  // TIMER LOGIC
  // ==========================================
  function handleMinChange() {
    let minVal = parseInt(minSlider.value, 10);
    let maxVal = parseInt(maxSlider.value, 10);
    if (minVal > maxVal) {
      maxSlider.value = minVal;
      maxVal = minVal;
    }
    minDisplay.textContent = formatSeconds(minVal);
    maxDisplay.textContent = formatSeconds(maxVal);
    if (timerState === 'running') {
      cycleInfo.textContent = `Current cycle target: ${formatSeconds(currentCycleTotalSeconds)} | Range: ${minDisplay.textContent} - ${maxDisplay.textContent}`;
    }
  }

  function handleMaxChange() {
    let minVal = parseInt(minSlider.value, 10);
    let maxVal = parseInt(maxSlider.value, 10);
    if (maxVal < minVal) {
      minSlider.value = maxVal;
      minVal = maxVal;
    }
    minDisplay.textContent = formatSeconds(minVal);
    maxDisplay.textContent = formatSeconds(maxVal);
    if (timerState === 'running') {
      cycleInfo.textContent = `Current cycle target: ${formatSeconds(currentCycleTotalSeconds)} | Range: ${minDisplay.textContent} - ${maxDisplay.textContent}`;
    }
  }

  function handleVolumeChange() {
    const vol = parseInt(volumeSlider.value, 10);
    alarmAudio.volume = vol / 100;
    volumeDisplay.textContent = `${vol}%`;
  }

  function playAlarm() {
    try {
      alarmAudio.currentTime = 0;
      alarmAudio.loop = false;
      const playPromise = alarmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Alarm playback warning:', err);
        });
      }
    } catch (e) {
      console.warn('Alarm audio error:', e);
    }
  }

  function startNewTimerCycle() {
    const minVal = parseInt(minSlider.value, 10);
    const maxVal = parseInt(maxSlider.value, 10);
    currentCycleTotalSeconds = getRandomInt(minVal, maxVal);
    remainingMs = currentCycleTotalSeconds * 1000;
    targetEndTime = Date.now() + remainingMs;
    currentCycle += 1;

    addLog('timer', `Started cycle #${currentCycle} for ${formatSeconds(currentCycleTotalSeconds)} (Range: ${formatSeconds(minVal)} - ${formatSeconds(maxVal)})`);
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const timeStr = formatMs(remainingMs);
    timerDisplay.textContent = timeStr;

    if (timerState === 'running') {
      document.title = `${timeStr} - A60 Timer`;
      statusLabel.textContent = `Running (Cycle #${currentCycle})`;
      statusLabel.className = 'status-label running';
      cycleInfo.textContent = `Current cycle target: ${formatSeconds(currentCycleTotalSeconds)} | Range: ${minDisplay.textContent} - ${maxDisplay.textContent}`;
    } else if (timerState === 'paused') {
      document.title = `[Paused] ${timeStr} - A60 Timer`;
      statusLabel.textContent = `Paused (Cycle #${currentCycle})`;
      statusLabel.className = 'status-label paused';
    } else {
      document.title = 'A60 Timer';
      statusLabel.textContent = 'Ready';
      statusLabel.className = 'status-label';
      cycleInfo.textContent = 'Set range below and press Start';
    }
  }

  startBtn.addEventListener('click', () => {
    primeMedia();
    if (timerState === 'idle') {
      currentCycle = 0;
      startNewTimerCycle();
      timerState = 'running';
      updateWorkerState();
    } else if (timerState === 'paused') {
      targetEndTime = Date.now() + remainingMs;
      timerState = 'running';
      addLog('timer', `Timer resumed at ${formatMs(remainingMs)} remaining.`);
      updateWorkerState();
      updateTimerDisplay();
    }
    startBtn.disabled = true;
    startBtn.textContent = 'Start';
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
  });

  pauseBtn.addEventListener('click', () => {
    if (timerState === 'running') {
      remainingMs = Math.max(0, targetEndTime - Date.now());
      timerState = 'paused';
      addLog('timer', `Timer paused at ${formatMs(remainingMs)} remaining.`);
      updateWorkerState();
      updateTimerDisplay();
      startBtn.disabled = false;
      startBtn.textContent = 'Resume';
      pauseBtn.disabled = true;
    }
  });

  resetBtn.addEventListener('click', () => {
    timerState = 'idle';
    updateWorkerState();
    remainingMs = 0;
    currentCycle = 0;
    currentCycleTotalSeconds = 0;

    addLog('timer', 'Timer reset to 00:00.');
    startBtn.disabled = false;
    startBtn.textContent = 'Start';
    pauseBtn.disabled = true;
    resetBtn.disabled = true;

    timerDisplay.textContent = '00:00';
    updateTimerDisplay();
  });

  testAudioBtn.addEventListener('click', () => {
    primeMedia();
    playAlarm();
    addLog('timer', 'Test Alarm played manually.');
  });

  minSlider.addEventListener('input', handleMinChange);
  maxSlider.addEventListener('input', handleMaxChange);
  volumeSlider.addEventListener('input', handleVolumeChange);

  // ==========================================
  // JACKPOT & SACRIFICE LOGIC
  // ==========================================
  function pickJackpotItem() {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const item of JACKPOT_ITEMS) {
      cumulative += item.chance;
      if (rand < cumulative) {
        return item;
      }
    }
    return JACKPOT_ITEMS[JACKPOT_ITEMS.length - 1];
  }

  function handleSpeedChange() {
    rollSpeedSec = parseFloat(speedSlider.value);
    speedDisplay.textContent = `${rollSpeedSec.toFixed(1)}s`;
  }

  function triggerJackpotHit(chosenItem, forcedSacrificeRoll = null) {
    totalJackpots += 1;
    totalHitsCount.textContent = totalJackpots;

    // Roll 1 to 10 for Sacrifice check
    const sacrificeRoll = forcedSacrificeRoll !== null ? forcedSacrificeRoll : getRandomInt(1, 10);
    const isSacrifice = (sacrificeRoll === 10);

    // Update result card
    resultImage.src = chosenItem.image;
    resultImage.alt = chosenItem.name;
    resultName.textContent = chosenItem.name;
    resultChance.textContent = chosenItem.chanceText;
    sacrificeRollBadge.textContent = `Roll: ${sacrificeRoll}/10`;

    if (isSacrifice) {
      totalSacrifices += 1;
      totalSacrificesCount.textContent = totalSacrifices;

      // Show red flashing sacrifice banner
      sacrificeBanner.classList.remove('hidden');
      rollerStatus.textContent = `Sacrifice: ${chosenItem.name}! (10/10)`;
      rollerStatus.className = 'status-label sacrifice';

      // TTS says item name and Sacrifice
      speakTTS(`${chosenItem.tts}. Sacrifice!`);

      // Log sacrifice
      addLog('sacrifice', `Jackpot: ${chosenItem.name} (${chosenItem.chanceText}) | Sacrifice Roll: 10/10 - SACRIFICE TRIGGERED!`);
    } else {
      sacrificeBanner.classList.add('hidden');
      rollerStatus.textContent = `Jackpot: ${chosenItem.name} (${chosenItem.chanceText})`;
      rollerStatus.className = 'status-label hit';

      // TTS says item name
      speakTTS(chosenItem.tts);

      // Log jackpot
      addLog('jackpot', `Jackpot: ${chosenItem.name} (${chosenItem.chanceText}) | Sacrifice Roll: ${sacrificeRoll}/10 (Safe)`);
    }

    rollerResultCard.classList.remove('hidden');

    // Pause on hit if checkbox is checked
    if (pauseOnHitCheckbox.checked && rollerRunning) {
      stopRoller();
    }
  }

  // Close jackpot card button
  closeResultBtn.addEventListener('click', () => {
    rollerResultCard.classList.add('hidden');
    sacrificeBanner.classList.add('hidden');
    if (!rollerRunning) {
      rollerStatus.textContent = 'Inactive';
      rollerStatus.className = 'status-label';
    } else {
      rollerStatus.textContent = 'Rolling...';
      rollerStatus.className = 'status-label running';
    }
  });

  function executeRoll() {
    totalRolls += 1;
    totalRollsCount.textContent = totalRolls;

    // Roll 1 to 100
    const roll = getRandomInt(1, 100);
    rollNumberDisplay.textContent = roll;

    if (roll === 100) {
      rollNumberDisplay.classList.add('hit-highlight');
      const chosen = pickJackpotItem();
      triggerJackpotHit(chosen);
    } else {
      rollNumberDisplay.classList.remove('hit-highlight');
      if (rollerRunning) {
        rollerStatus.textContent = 'Rolling...';
        rollerStatus.className = 'status-label running';
      }
      addLog('roll', `Rolled ${roll} / 100 (Roll #${totalRolls})`);
    }
  }

  function startRoller() {
    primeMedia();
    rollerRunning = true;
    lastRollTimestamp = Date.now();
    rollerStartBtn.disabled = true;
    rollerStopBtn.disabled = false;
    rollerStatus.textContent = 'Rolling...';
    rollerStatus.className = 'status-label running';
    addLog('roll', `1-100 Roller started (Speed: ${rollSpeedSec.toFixed(1)}s)`);
    updateWorkerState();
  }

  function stopRoller() {
    rollerRunning = false;
    rollerStartBtn.disabled = false;
    rollerStopBtn.disabled = true;
    rollerStatus.textContent = 'Stopped';
    rollerStatus.className = 'status-label';
    addLog('roll', '1-100 Roller stopped.');
    updateWorkerState();
  }

  rollerStartBtn.addEventListener('click', startRoller);
  rollerStopBtn.addEventListener('click', stopRoller);

  rollerOnceBtn.addEventListener('click', () => {
    primeMedia();
    executeRoll();
  });

  rollerTestBtn.addEventListener('click', () => {
    primeMedia();
    totalRolls += 1;
    totalRollsCount.textContent = totalRolls;
    rollNumberDisplay.textContent = '100';
    rollNumberDisplay.classList.add('hit-highlight');
    const chosen = pickJackpotItem();
    triggerJackpotHit(chosen);
  });

  rollerTestSacrificeBtn.addEventListener('click', () => {
    primeMedia();
    totalRolls += 1;
    totalRollsCount.textContent = totalRolls;
    rollNumberDisplay.textContent = '100';
    rollNumberDisplay.classList.add('hit-highlight');
    const chosen = pickJackpotItem();
    triggerJackpotHit(chosen, 10);
  });

  speedSlider.addEventListener('input', handleSpeedChange);

  // ==========================================
  // CUSTOMIZABLE DICE ROLLER
  // ==========================================
  function getDiceRange() {
    let minVal = parseInt(diceMinInput.value, 10);
    let maxVal = parseInt(diceMaxInput.value, 10);
    if (isNaN(minVal)) minVal = 1;
    if (isNaN(maxVal)) maxVal = 20;
    if (minVal > maxVal) {
      const temp = minVal;
      minVal = maxVal;
      maxVal = temp;
    }
    return { min: minVal, max: maxVal };
  }

  function updateDiceRangeInfo() {
    const { min, max } = getDiceRange();
    diceRangeInfo.textContent = `Range: ${min} to ${max}`;
  }

  function rollDice() {
    primeMedia();
    const { min, max } = getDiceRange();
    diceStatus.textContent = 'Rolling...';
    diceStatus.className = 'status-label running';
    diceResultDisplay.classList.add('dice-rolling');

    // Quick rolling animation
    let count = 0;
    const animInterval = setInterval(() => {
      diceResultDisplay.textContent = getRandomInt(min, max);
      count += 1;
      if (count > 6) {
        clearInterval(animInterval);
        const finalRoll = getRandomInt(min, max);
        diceResultDisplay.textContent = finalRoll;
        diceResultDisplay.classList.remove('dice-rolling');
        diceStatus.textContent = `Rolled: ${finalRoll}`;
        diceStatus.className = 'status-label hit';
        addLog('dice', `Dice Rolled: ${finalRoll} (Range: ${min} to ${max})`);
      }
    }, 30);
  }

  rollDiceBtn.addEventListener('click', rollDice);

  resetDiceBtn.addEventListener('click', () => {
    diceMinInput.value = 1;
    diceMaxInput.value = 20;
    diceResultDisplay.textContent = '--';
    diceStatus.textContent = 'Ready';
    diceStatus.className = 'status-label';
    dicePresetBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.max === '20');
    });
    updateDiceRangeInfo();
    addLog('dice', 'Dice range reset to 1-20.');
  });

  diceMinInput.addEventListener('input', () => {
    updateDiceRangeInfo();
    dicePresetBtns.forEach((btn) => btn.classList.remove('active'));
  });

  diceMaxInput.addEventListener('input', () => {
    updateDiceRangeInfo();
    dicePresetBtns.forEach((btn) => btn.classList.remove('active'));
  });

  dicePresetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      dicePresetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      diceMinInput.value = btn.dataset.min;
      diceMaxInput.value = btn.dataset.max;
      updateDiceRangeInfo();
    });
  });

  // ==========================================
  // INITIALIZATION
  // ==========================================
  handleMinChange();
  handleMaxChange();
  handleVolumeChange();
  handleSpeedChange();
  updateDiceRangeInfo();
  updateTimerDisplay();
  addLog('timer', 'System initialized and ready.');
})();
