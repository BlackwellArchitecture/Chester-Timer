(() => {
  // Elements
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

  // State
  let state = 'idle'; // 'idle' | 'running' | 'paused'
  let targetEndTime = 0;
  let remainingMs = 0;
  let currentCycle = 0;
  let currentCycleTotalSeconds = 0;
  let worker = null;

  // Format seconds to M:SS or MM:SS
  function formatSeconds(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Format milliseconds to M:SS (display ceiling so 1.2s shows as 0:02 until it hits 0)
  function formatMs(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    return formatSeconds(totalSec);
  }

  // Pick random integer between min and max (inclusive)
  function getRandomSeconds(min, max) {
    const lower = Math.min(min, max);
    const upper = Math.max(min, max);
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
  }

  // Update slider badge labels & ensure min <= max
  function handleMinChange() {
    let minVal = parseInt(minSlider.value, 10);
    let maxVal = parseInt(maxSlider.value, 10);
    if (minVal > maxVal) {
      maxSlider.value = minVal;
      maxVal = minVal;
    }
    minDisplay.textContent = formatSeconds(minVal);
    maxDisplay.textContent = formatSeconds(maxVal);
    if (state === 'running') {
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
    if (state === 'running') {
      cycleInfo.textContent = `Current cycle target: ${formatSeconds(currentCycleTotalSeconds)} | Range: ${minDisplay.textContent} - ${maxDisplay.textContent}`;
    }
  }

  function handleVolumeChange() {
    const vol = parseInt(volumeSlider.value, 10);
    alarmAudio.volume = vol / 100;
    volumeDisplay.textContent = `${vol}%`;
  }

  // Audio Playback (plays once per trigger)
  function playAlarm() {
    try {
      alarmAudio.currentTime = 0;
      alarmAudio.loop = false;
      const playPromise = alarmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Playback error or tab policy restriction:', err);
        });
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // History log
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

  // Web Worker setup for background tab execution
  function initWorker() {
    if (worker) return;
    const workerScript = `
      let timerId = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (!timerId) {
            timerId = setInterval(function() {
              self.postMessage('tick');
            }, 200);
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

  function stopWorker() {
    if (worker) {
      worker.postMessage('stop');
    }
  }

  function startWorker() {
    initWorker();
    worker.postMessage('start');
  }

  // Main countdown tick
  function onTick() {
    if (state !== 'running') return;

    const now = Date.now();
    const diff = targetEndTime - now;

    if (diff <= 0) {
      // Completed current cycle
      playAlarm();
      addHistoryEntry(currentCycle, currentCycleTotalSeconds);

      // Start next random cycle immediately
      startNewCycle();
    } else {
      remainingMs = diff;
      updateDisplay();
    }
  }

  function startNewCycle() {
    const minVal = parseInt(minSlider.value, 10);
    const maxVal = parseInt(maxSlider.value, 10);
    currentCycleTotalSeconds = getRandomSeconds(minVal, maxVal);
    remainingMs = currentCycleTotalSeconds * 1000;
    targetEndTime = Date.now() + remainingMs;
    currentCycle += 1;

    updateDisplay();
  }

  function updateDisplay() {
    const timeStr = formatMs(remainingMs);
    timerDisplay.textContent = timeStr;

    if (state === 'running') {
      document.title = `${timeStr} - A60 Timer`;
      statusLabel.textContent = `Running (Cycle #${currentCycle})`;
      statusLabel.className = 'status-label running';
      cycleInfo.textContent = `Current cycle target: ${formatSeconds(currentCycleTotalSeconds)} | Range: ${minDisplay.textContent} - ${maxDisplay.textContent}`;
    } else if (state === 'paused') {
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

  // Button actions
  startBtn.addEventListener('click', () => {
    // Unlock audio context on user gesture
    alarmAudio.load();

    if (state === 'idle') {
      currentCycle = 0;
      startNewCycle();
      state = 'running';
      startWorker();
    } else if (state === 'paused') {
      targetEndTime = Date.now() + remainingMs;
      state = 'running';
      startWorker();
      updateDisplay();
    }

    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
  });

  pauseBtn.addEventListener('click', () => {
    if (state === 'running') {
      remainingMs = Math.max(0, targetEndTime - Date.now());
      state = 'paused';
      stopWorker();
      updateDisplay();
      startBtn.disabled = false;
      startBtn.textContent = 'Resume';
      pauseBtn.disabled = true;
    }
  });

  resetBtn.addEventListener('click', () => {
    state = 'idle';
    stopWorker();
    remainingMs = 0;
    currentCycle = 0;
    currentCycleTotalSeconds = 0;

    startBtn.disabled = false;
    startBtn.textContent = 'Start';
    pauseBtn.disabled = true;
    resetBtn.disabled = true;

    timerDisplay.textContent = '00:00';
    updateDisplay();
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

  // Initialize display
  handleMinChange();
  handleMaxChange();
  handleVolumeChange();
  updateDisplay();
})();
