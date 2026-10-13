import { createArtworkLifecycle } from '/_/js/lib/lifecycle.js';
const lifecycle = createArtworkLifecycle();
const root = document.querySelector('[data-project="ipod"]');

const TRACK_DURATION_SECONDS = 4 * 60 + 9;
let isPlaying = true;
let isSeeking = false;
let currentTimeSeconds = 0;
let playbackTimer = null;

const ipod = root.querySelector('.ipod-body');
const screenHeader = root.querySelector('.screen-header');
const screenContent = root.querySelector('.screen-content');
const elapsedTime = document.getElementById('elapsed-time');
const remainingTime = document.getElementById('remaining-time');
const progressCurrent = document.getElementById('progress-current');

const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const playButton = document.getElementById('play-button');
const menuButton = document.getElementById('menu-button');
const centerButton = document.getElementById('center-button');

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function renderPlayback() {
  const progressPercent = (currentTimeSeconds / TRACK_DURATION_SECONDS) * 100;
  elapsedTime.textContent = formatTime(currentTimeSeconds);
  remainingTime.textContent = `-${formatTime(TRACK_DURATION_SECONDS - currentTimeSeconds)}`;
  progressCurrent.style.width = `${progressPercent}%`;
}

function seekBy(deltaSeconds) {
  currentTimeSeconds = Math.min(
    TRACK_DURATION_SECONDS,
    Math.max(0, currentTimeSeconds + deltaSeconds),
  );
  renderPlayback();
}

function stopPlaybackTimer() {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
}

function startPlaybackTimer() {
  stopPlaybackTimer();
  playbackTimer = setInterval(() => {
    if (document.hidden || !root.isConnected) return;
    if (currentTimeSeconds >= TRACK_DURATION_SECONDS) {
      currentTimeSeconds = TRACK_DURATION_SECONDS;
      setPlayingState(false);
      renderPlayback();
      return;
    }

    currentTimeSeconds += 1;
    renderPlayback();
  }, 1000);
}

function setPlayingState(nextState) {
  isPlaying = nextState;
  ipod.classList.toggle('is-paused', !isPlaying);
  screenHeader.classList.toggle('is-playing', isPlaying);
  screenHeader.classList.toggle('is-paused', !isPlaying);
  playButton.setAttribute('aria-pressed', String(isPlaying));
  playButton.setAttribute('aria-label', isPlaying ? 'Pause playback' : 'Play playback');

  if (isPlaying) {
    if (currentTimeSeconds >= TRACK_DURATION_SECONDS) {
      currentTimeSeconds = 0;
      renderPlayback();
    }
    startPlaybackTimer();
  } else {
    stopPlaybackTimer();
  }
}

function setSeekingState(nextState) {
  isSeeking = nextState;
  screenContent.classList.toggle('is-seeking', isSeeking);
  centerButton.setAttribute('aria-label', isSeeking ? 'Exit seeking mode' : 'Enter seeking mode');
}

lifecycle.listen(prevButton, 'click', () => {
  seekBy(-5);
});

lifecycle.listen(nextButton, 'click', () => {
  seekBy(5);
});

lifecycle.listen(playButton, 'click', () => {
  setPlayingState(!isPlaying);
});

lifecycle.listen(centerButton, 'click', () => {
  setSeekingState(!isSeeking);
});

function setCenterPressed(isPressed) {
  centerButton.classList.toggle('is-pressed', isPressed);
}

lifecycle.listen(centerButton, 'pointerdown', () => {
  setCenterPressed(true);
});

lifecycle.listen(centerButton, 'pointerup', () => {
  setCenterPressed(false);
});

lifecycle.listen(centerButton, 'pointerleave', () => {
  setCenterPressed(false);
});

lifecycle.listen(centerButton, 'pointercancel', () => {
  setCenterPressed(false);
});

lifecycle.listen(menuButton, 'click', () => {
  // Menu is intentionally inert in this prototype.
});

renderPlayback();
setSeekingState(false);
setPlayingState(true);

lifecycle.cleanup(stopPlaybackTimer);
lifecycle.observeResize(root.querySelector('.artwork-frame'), (entries) => {
  if (!root.isConnected || entries[0].contentRect.width <= 0) return;
  root.style.setProperty(
    '--device-scale',
    Math.min(0.8, (entries[0].contentRect.width - 24) / 377),
  );
});
