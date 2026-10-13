import { createArtworkLifecycle } from '/_/js/lib/lifecycle.js';
const root = document.querySelector('[data-project="winamp"]');
const lifecycle = createArtworkLifecycle();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function ownedInterval(callback, delay) {
  const id = window.setInterval(callback, delay);
  lifecycle.cleanup(() => clearInterval(id));
  return id;
}

const tracks = [
  { title: 'Roxy Music - Love Is The Drug', length: 249, accent: '#43f723' },
  { title: 'Daft Punk - Around The World', length: 428, accent: '#47d8ff' },
  { title: 'New Order - Blue Monday', length: 452, accent: '#f7b733' },
  { title: 'The Prodigy - Firestarter', length: 281, accent: '#ff6b4a' },
];

const visualizerPattern = [
  [2, 11, 5, 9, 4, 12, 6, 10, 4, 8, 3, 12, 5, 9, 6, 10],
  [4, 9, 3, 12, 8, 6, 10, 4, 11, 5, 9, 4, 12, 7, 9, 3],
  [10, 3, 8, 4, 12, 6, 11, 3, 9, 5, 12, 4, 10, 5, 8, 4],
  [6, 12, 5, 9, 3, 11, 4, 10, 5, 12, 4, 9, 3, 10, 6, 11],
];

const state = {
  trackIndex: 0,
  isPlaying: true,
  playbackIndicator: 'play',
  elapsed: 0,
  kbps: 160,
  khz: 44,
  playlistOpen: false,
  shuffle: true,
  visualizerFrame: 0,
};

const initialState = { ...state };

const timerEl = root.querySelector('[data-timer]');
const playbackIndicatorEl = root.querySelector('[data-playback-indicator]');
const titleEls = root.querySelectorAll('[data-track-title], [data-track-title-clone]');
const visualizerEl = root.querySelector('[data-visualizer]');
const transportButtons = root.querySelectorAll('[data-transport]');
const sliderEls = root.querySelectorAll('[data-slider]');
const kbpsValueEl = root.querySelector('[data-kbps-value]');
const khzValueEl = root.querySelector('[data-khz-value]');
const playlistDrawerEl = root.querySelector('[data-playlist-drawer]');
const playlistToggleEl = root.querySelector('[data-playlist-toggle]');
const playlistLedEl = root.querySelector('[data-playlist-led]');
const playerStackEl = root.querySelector('.player-stack');
const ejectButtonEl = root.querySelector('.transport-button.eject');
const rebootButtonEl = root.querySelector('[data-reboot]');
const eqBarEls = root.querySelectorAll('.eq-bar');
const playbarRowEl = root.querySelector('.playbar-row');
const playbarScrubberEl = root.querySelector('.playbar-scrubber');
let isScrubbing = false;
let activeSlider = null;
let activeSliderPointerOffset = 0;
let equalizerIntervalId = null;

const sliderConfig = {
  kbps: { min: 96, max: 320, step: 1 },
  khz: { min: 22, max: 48, step: 1 },
};

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getTrack() {
  return tracks[state.trackIndex];
}

function renderVisualizer() {
  if (!visualizerEl) {
    return;
  }

  const row = visualizerPattern[state.visualizerFrame];
  visualizerEl.innerHTML = '';

  row.forEach((height, index) => {
    const bar = document.createElement('span');
    bar.className = 'bar';
    bar.style.height = `${height * 5}px`;

    if (index < 4) {
      bar.style.backgroundColor = '#2f4114';
    } else if (index < 10) {
      bar.style.backgroundColor = '#ffb83d';
    } else if (index < 13) {
      bar.style.backgroundColor = '#fe6b32';
    } else {
      bar.style.backgroundColor = '#52ff3c';
    }

    visualizerEl.appendChild(bar);
  });
}

function collapseEqualizer() {
  eqBarEls.forEach((eqBarEl) => {
    eqBarEl.style.height = '0px';
  });
}

function pulseEqualizer() {
  if (document.hidden || !root.isConnected) return;
  const scale = Number.parseFloat(getComputedStyle(root).getPropertyValue('--ui-scale')) || 1;
  const blockHeight = 6 * scale;

  eqBarEls.forEach((eqBarEl, index) => {
    const totalBlocks = eqBarEl.children.length;
    const minBlocks = Math.min(totalBlocks, index % 5 === 0 ? 2 : 0);
    const activeBlocks = Math.floor(Math.random() * (totalBlocks - minBlocks + 1)) + minBlocks;
    eqBarEl.style.height = `${activeBlocks * blockHeight}px`;
  });
}

function syncEqualizerPlayback() {
  if (equalizerIntervalId) {
    window.clearInterval(equalizerIntervalId);
    equalizerIntervalId = null;
  }

  if (!state.isPlaying || document.hidden || !root.isConnected) {
    collapseEqualizer();
    return;
  }

  if (reducedMotion.matches) {
    collapseEqualizer();
    return;
  }
  pulseEqualizer();
  equalizerIntervalId = ownedInterval(pulseEqualizer, 180);
}

function getSliderProgress(sliderName) {
  const config = sliderConfig[sliderName];
  return (state[sliderName] - config.min) / (config.max - config.min);
}

function setSliderValueFromProgress(sliderName, progress) {
  const config = sliderConfig[sliderName];
  const rawValue = config.min + progress * (config.max - config.min);
  const steppedValue = Math.round(rawValue / config.step) * config.step;
  state[sliderName] = Math.max(config.min, Math.min(config.max, steppedValue));
}

function renderSliders() {
  sliderEls.forEach((sliderEl) => {
    const sliderName = sliderEl.dataset.slider;
    const trackEl = sliderEl.querySelector('.track-slider-track');
    const thumbEl = sliderEl.querySelector('.track-slider-thumb');
    const usableWidth = trackEl.clientWidth - thumbEl.offsetWidth;
    const progress = getSliderProgress(sliderName);
    sliderEl.setAttribute('aria-valuemin', sliderConfig[sliderName].min);
    sliderEl.setAttribute('aria-valuemax', sliderConfig[sliderName].max);
    sliderEl.setAttribute('aria-valuenow', state[sliderName]);
    sliderEl.setAttribute(
      'aria-valuetext',
      `${state[sliderName]} ${sliderName === 'kbps' ? 'kilobits per second' : 'kilohertz'}`,
    );
    thumbEl.style.left = `${Math.max(0, usableWidth * progress)}px`;
  });

  kbpsValueEl.textContent = String(state.kbps);
  khzValueEl.textContent = String(state.khz);
}

function renderScrubber() {
  const track = getTrack();
  const usableWidth = playbarRowEl.clientWidth - playbarScrubberEl.offsetWidth;
  const progress = track.length === 0 ? 0 : state.elapsed / track.length;
  const left = Math.max(0, usableWidth * progress);
  playbarRowEl.setAttribute('aria-valuemax', track.length);
  playbarRowEl.setAttribute('aria-valuenow', state.elapsed);
  playbarRowEl.setAttribute('aria-valuetext', formatTime(state.elapsed));
  playbarScrubberEl.style.left = `${left}px`;
}

function seekFromClientX(clientX) {
  const track = getTrack();
  const rect = playbarRowEl.getBoundingClientRect();
  const scrubberWidth = playbarScrubberEl.offsetWidth;
  const usableWidth = rect.width - scrubberWidth;
  const relativeX = clientX - rect.left - scrubberWidth / 2;
  const clampedX = Math.max(0, Math.min(usableWidth, relativeX));
  const progress = usableWidth <= 0 ? 0 : clampedX / usableWidth;

  state.elapsed = Math.round(progress * track.length);
  renderTrack();
}

function updateSliderFromClientX(sliderEl, clientX, pointerOffsetX) {
  const sliderName = sliderEl.dataset.slider;
  const trackEl = sliderEl.querySelector('.track-slider-track');
  const thumbEl = sliderEl.querySelector('.track-slider-thumb');
  const rect = trackEl.getBoundingClientRect();
  const usableWidth = rect.width - thumbEl.offsetWidth;
  const relativeX = clientX - rect.left - pointerOffsetX;
  const clampedX = Math.max(0, Math.min(usableWidth, relativeX));
  const progress = usableWidth <= 0 ? 0 : clampedX / usableWidth;

  setSliderValueFromProgress(sliderName, progress);
  renderSliders();
}

function renderTrack() {
  const track = getTrack();
  titleEls.forEach((titleEl) => {
    titleEl.textContent = track.title;
    titleEl.style.color = track.accent;
  });
  timerEl.textContent = formatTime(state.elapsed);
  playbackIndicatorEl.dataset.state = state.playbackIndicator;
  playlistDrawerEl.classList.toggle('is-open', state.playlistOpen);
  playlistToggleEl.setAttribute('aria-expanded', String(state.playlistOpen));
  playlistLedEl.classList.toggle('on', state.playlistOpen);
  renderSliders();
  renderScrubber();
  renderVisualizer();
  syncEqualizerPlayback();
}

function setTrack(index) {
  state.trackIndex = (index + tracks.length) % tracks.length;
  state.elapsed = 0;
  state.visualizerFrame = (state.visualizerFrame + 1) % visualizerPattern.length;
  renderTrack();
}

transportButtons.forEach((button) => {
  lifecycle.listen(button, 'click', () => {
    const { transport } = button.dataset;
    const track = getTrack();

    if (transport === 'rewind') {
      state.elapsed = 0;
      state.isPlaying = false;
      state.playbackIndicator = 'stop';
      renderTrack();
      return;
    }

    if (transport === 'play') {
      if (state.elapsed >= track.length) {
        state.elapsed = 0;
      }
      state.isPlaying = true;
      state.playbackIndicator = 'play';
      renderTrack();
      return;
    }

    if (transport === 'pause') {
      state.isPlaying = false;
      state.playbackIndicator = 'pause';
      renderTrack();
      return;
    }

    if (transport === 'stop') {
      state.isPlaying = false;
      state.elapsed = 0;
      state.playbackIndicator = 'stop';
      renderTrack();
      return;
    }

    if (transport === 'forward') {
      state.elapsed = track.length;
      state.isPlaying = false;
      state.playbackIndicator = 'stop';
      renderTrack();
    }
  });
});

lifecycle.listen(playlistToggleEl, 'click', () => {
  state.playlistOpen = !state.playlistOpen;
  renderTrack();
});

lifecycle.listen(ejectButtonEl, 'click', () => {
  if (
    playerStackEl.classList.contains('is-ejecting') ||
    playerStackEl.classList.contains('is-ejected')
  ) {
    return;
  }

  state.isPlaying = false;
  state.playbackIndicator = 'stop';
  syncEqualizerPlayback();
  const restoreFocus = playerStackEl.contains(document.activeElement);
  playerStackEl.inert = true;
  playerStackEl.classList.add('is-ejecting');

  lifecycle.timeout(() => {
    playerStackEl.classList.remove('is-ejecting');
    playerStackEl.classList.add('is-ejected');
    rebootButtonEl.classList.add('is-visible');
    if (restoreFocus && root.isConnected && document.activeElement === document.body) {
      rebootButtonEl.focus({ preventScroll: true });
    }
  }, 1800);
});

lifecycle.listen(rebootButtonEl, 'click', () => {
  Object.assign(state, initialState);
  playerStackEl.inert = false;
  playerStackEl.classList.remove('is-ejecting', 'is-ejected');
  rebootButtonEl.classList.remove('is-visible');
  renderTrack();
  root.querySelector('[data-transport="play"]').focus({ preventScroll: true });
});

sliderEls.forEach((sliderEl) => {
  const trackEl = sliderEl.querySelector('.track-slider-track');
  const thumbEl = sliderEl.querySelector('.track-slider-thumb');

  lifecycle.listen(thumbEl, 'pointerdown', (event) => {
    event.stopPropagation();
    activeSlider = sliderEl;
    const thumbRect = thumbEl.getBoundingClientRect();
    activeSliderPointerOffset = Math.max(
      0,
      Math.min(thumbRect.width, event.clientX - thumbRect.left),
    );
    thumbEl.style.cursor = 'grabbing';
    thumbEl.setPointerCapture?.(event.pointerId);
    updateSliderFromClientX(sliderEl, event.clientX, activeSliderPointerOffset);
  });

  lifecycle.listen(trackEl, 'pointerdown', (event) => {
    updateSliderFromClientX(sliderEl, event.clientX, thumbEl.offsetWidth / 2);
  });
});

lifecycle.listen(playbarRowEl, 'pointerdown', (event) => {
  isScrubbing = true;
  playbarScrubberEl.style.cursor = 'grabbing';
  seekFromClientX(event.clientX);
});

lifecycle.listen(window, 'pointermove', (event) => {
  if (!root.isConnected) return;
  if (activeSlider) {
    updateSliderFromClientX(activeSlider, event.clientX, activeSliderPointerOffset);
  }

  if (!isScrubbing) {
    return;
  }

  seekFromClientX(event.clientX);
});

function endDrag() {
  if (activeSlider) {
    const thumbEl = activeSlider.querySelector('.track-slider-thumb');
    thumbEl.style.cursor = 'grab';
    activeSlider = null;
    activeSliderPointerOffset = 0;
  }

  if (!isScrubbing) {
    return;
  }

  isScrubbing = false;
  playbarScrubberEl.style.cursor = 'grab';
}
lifecycle.listen(window, 'pointerup', endDrag);
lifecycle.listen(window, 'pointercancel', endDrag);

ownedInterval(() => {
  if (!state.isPlaying || document.hidden || !root.isConnected) {
    return;
  }

  const track = getTrack();
  if (state.elapsed >= track.length) {
    state.elapsed = track.length;
    state.isPlaying = false;
    state.playbackIndicator = 'stop';
    renderTrack();
    return;
  }

  state.elapsed += 1;
  state.visualizerFrame = (state.visualizerFrame + 1) % visualizerPattern.length;
  renderTrack();
}, 1000);

lifecycle.listen(window, 'resize', renderScrubber);
lifecycle.listen(window, 'resize', renderSliders);

renderTrack();

function prepareSlider(element, label) {
  element.tabIndex = 0;
  element.setAttribute('role', 'slider');
  element.setAttribute('aria-label', label);
  element.setAttribute('aria-valuemin', '0');
}
sliderEls.forEach((element) => {
  const name = element.dataset.slider;
  prepareSlider(element, name === 'kbps' ? 'Bit rate' : 'Sample rate');
  lifecycle.listen(element, 'keydown', (event) => {
    const config = sliderConfig[name];
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key))
      return;
    event.preventDefault();
    state[name] =
      event.key === 'Home'
        ? config.min
        : event.key === 'End'
          ? config.max
          : Math.max(
              config.min,
              Math.min(
                config.max,
                state[name] + (['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : -1),
              ),
            );
    renderSliders();
  });
});
prepareSlider(playbarRowEl, 'Track position');
lifecycle.listen(playbarRowEl, 'keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  state.elapsed =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? getTrack().length
        : Math.max(
            0,
            Math.min(getTrack().length, state.elapsed + (event.key === 'ArrowRight' ? 5 : -5)),
          );
  renderTrack();
});
lifecycle.listen(document, 'visibilitychange', syncEqualizerPlayback);
lifecycle.listen(reducedMotion, 'change', syncEqualizerPlayback);
lifecycle.observeResize(root.querySelector('.artwork-frame'), (entries) => {
  if (!root.isConnected || entries[0].contentRect.width <= 0) return;
  root.style.setProperty('--ui-scale', Math.min(0.8, (entries[0].contentRect.width - 16) / 548));
  renderScrubber();
  renderSliders();
});
renderTrack();
