(() => {
  // ==========================================
  // CONFIG & CONSTANTS
  // ==========================================
  const ROLLER_ITEMS = [
    { name: 'Bleach', image: '2_Bleach.png', tts: 'Bleach' },
    { name: 'Coagulate', image: '1_Coagulate.png', tts: 'Coagulate' },
    { name: 'Bobberfish', image: '3_Bobberfish.webp', tts: 'Bobberfish' }
  ];

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

  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const alarmAudio = document.getElementById('alarm-audio');

  // ==========================================
  // DOM ELEMENTS - ROLLER
  // ==========================================
  const rollerStatus = document.getElementById('roller-status');
  const rollNumberDisplay = document.getElementById('roll-number-display');
  const rollerResultCard = document.getElementById('roller-result-card');
  const resultImage = document.getElementById('result-image');
  const resultName = document.getElementById('result-name');

  const speedSlider = document.getElementById('speed-slider');
  const speedDisplay = document.getElementById('speed-display');
  const pauseOnHitCheckbox = document.getElementById('pause-on-hit');

  const rollerStartBtn = document.getElementById('roller-start-btn');
  const rollerStopBtn = document.getElementById('roller-stop-btn');
  const rollerOnceBtn = document.getElementById('roller-once-btn');
  const rollerTestBtn = document.getElementById('roller-test-btn');

  const totalRollsCount = document.getElementById('total-rolls-count');
  const totalHitsCount = document.getElementById('total-hits-count');
  const latestHitName = document.getElementById('latest-hit-name');

  const rollerHistoryList = document.getElementById('roller-history-list');
  const clearRollerHistoryBtn = document.getElementById('clear-roller-history-btn');

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
  let totalHits = 0;

  // Shared Web Worker
  let worker = null;

  // ==========================================
  // HELPER FUNCTIONS
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

  function getRandomSeconds(min, max) {
    const lower = Math.min(min, max);
    const upper = Math.max(min, max);
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
  }

  // TTS Speech Synthesis
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
      console.warn('Speech synthesis not supported in this environment.');
    }
  }

  // Pre-prime audio and speech synthesis on user interaction
  function primeMedia() {
    try {
      alarmAudio.load();
      if ('speechSynthesis' in window) {
        // Silent or blank priming
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

    // 1. Tick Timer
    if (timerState === 'running') {
      const diff = targetEndTime - now;
      if (diff <= 0) {
        playAlarm();
        addHistoryEntry(currentCycle, currentCycleTotalSeconds);
        startNewTimerCycle();
      } else {
        remainingMs = diff;
        updateTimerDisplay();
      }
    }

    // 2. Tick Roller
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

  function addHistoryEntry(cycleNumber, durationSec) {
    if (historyList.querySelector('.history-empty')) {
      historyList.innerHTML = '';
    }
    const li = document.createElement('li');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    li.innerHTML = `<span>Cycle #${cycleNumber} (${formatSeconds(durationSec)})</span><span class="highlight">${timeStr}</span>`;
    historyList.prepend(li);
  }

  function startNewTimerCycle() {
    const minVal = parseInt(minSlider.value, 10);
    const maxVal = parseInt(maxSlider.value, 10);
    currentCycleTotalSeconds = getRandomSeconds(minVal, maxVal);
    remainingMs = currentCycleTotalSeconds * 1000;
    targetEndTime = Date.now() + remainingMs;
    currentCycle += 1;

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

    startBtn.disabled = false;
    startBtn.textContent = 'Start';
    pauseBtn.disabled = true;
    resetBtn.disabled = true;

    timerDisplay.textContent = '00:00';
    updateTimerDisplay();
  });

  testAudioBtn.addEventListener('click', () => {
    playAlarm();
  });

  clearHistoryBtn.addEventListener('click', () => {
    historyList.innerHTML = '<li class="history-empty">No completed timers yet</li>';
  });

  minSlider.addEventListener('input', handleMinChange);
  maxSlider.addEventListener('input', handleMaxChange);
  volumeSlider.addEventListener('input', handleVolumeChange);

  // ==========================================
  // ROLLER LOGIC
  // ==========================================
  function handleSpeedChange() {
    rollSpeedSec = parseFloat(speedSlider.value);
    speedDisplay.textContent = `${rollSpeedSec.toFixed(1)}s`;
  }

  function triggerHit(chosenItem) {
    totalHits += 1;
    totalHitsCount.textContent = totalHits;
    latestHitName.textContent = chosenItem.name;

    // Display image & details
    resultImage.src = chosenItem.image;
    resultImage.alt = chosenItem.name;
    resultName.textContent = chosenItem.name;
    rollerResultCard.classList.remove('hidden');

    rollerStatus.textContent = `Hit: ${chosenItem.name}`;
    rollerStatus.className = 'status-label hit';

    // Speak TTS
    speakTTS(chosenItem.tts);

    // Add to roller history
    addRollerHistoryEntry(chosenItem.name);

    // Check pause on hit
    if (pauseOnHitCheckbox.checked && rollerRunning) {
      stopRoller();
    }
  }

  function addRollerHistoryEntry(itemName) {
    if (rollerHistoryList.querySelector('.history-empty')) {
      rollerHistoryList.innerHTML = '';
    }
    const li = document.createElement('li');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    li.innerHTML = `<span><span class="hit-name">${itemName}</span> (100)</span><span class="highlight">${timeStr}</span>`;
    rollerHistoryList.prepend(li);
  }

  function executeRoll() {
    totalRolls += 1;
    totalRollsCount.textContent = totalRolls;

    // Roll 1 to 100
    const roll = Math.floor(Math.random() * 100) + 1;
    rollNumberDisplay.textContent = roll;

    if (roll === 100) {
      rollNumberDisplay.classList.add('hit-highlight');
      // Pick randomly among Bleach, Coagulate, Bobberfish
      const chosen = ROLLER_ITEMS[Math.floor(Math.random() * ROLLER_ITEMS.length)];
      triggerHit(chosen);
    } else {
      rollNumberDisplay.classList.remove('hit-highlight');
      if (rollerRunning) {
        rollerStatus.textContent = 'Rolling...';
        rollerStatus.className = 'status-label running';
      }
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
    updateWorkerState();
  }

  function stopRoller() {
    rollerRunning = false;
    rollerStartBtn.disabled = false;
    rollerStopBtn.disabled = true;
    rollerStatus.textContent = 'Stopped';
    rollerStatus.className = 'status-label';
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
    const chosen = ROLLER_ITEMS[Math.floor(Math.random() * ROLLER_ITEMS.length)];
    triggerHit(chosen);
  });

  clearRollerHistoryBtn.addEventListener('click', () => {
    rollerHistoryList.innerHTML = '<li class="history-empty">No 100 hits yet</li>';
  });

  speedSlider.addEventListener('input', handleSpeedChange);

  // ==========================================
  // INITIALIZATION
  // ==========================================
  handleMinChange();
  handleMaxChange();
  handleVolumeChange();
  handleSpeedChange();
  updateTimerDisplay();
})();
