/**
 * Lightbox — Full-screen photo viewer for Shelter in Motion.
 *
 * Usage:
 *   import { openLightbox, closeLightbox } from './lightbox.js';
 *   openLightbox(photoUrls, startIndex, 'Bend, Oregon');
 *
 * Features:
 *   - Keyboard: Escape closes, ←/→ navigate
 *   - Touch: swipe left/right to navigate
 *   - Click overlay to close
 *   - Preloads adjacent images
 *   - Smooth crossfade transitions
 *   - Prevents body scroll while open
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let isOpen = false;
let currentIndex = 0;
let photos = [];
let stopTitle = '';
let isTransitioning = false;

// DOM references (created once, reused)
let lightboxEl = null;
let imageEl = null;
let spinnerEl = null;
let counterEl = null;
let captionEl = null;
let prevBtn = null;
let nextBtn = null;
let closeBtn = null;

// Touch tracking
let touchStartX = 0;
let touchStartY = 0;
let touchDeltaX = 0;
let isSwiping = false;

// Preload cache
const preloadCache = new Map();

// ---------------------------------------------------------------------------
// DOM Construction
// ---------------------------------------------------------------------------

function buildLightbox() {
  if (lightboxEl) return;

  lightboxEl = document.createElement('div');
  lightboxEl.className = 'lightbox';
  lightboxEl.setAttribute('role', 'dialog');
  lightboxEl.setAttribute('aria-modal', 'true');
  lightboxEl.setAttribute('aria-label', 'Photo viewer');

  lightboxEl.innerHTML = `
    <button class="lightbox-close" aria-label="Close lightbox"></button>
    <button class="lightbox-arrow lightbox-arrow-prev" aria-label="Previous photo"></button>
    <button class="lightbox-arrow lightbox-arrow-next" aria-label="Next photo"></button>
    <div class="lightbox-image-wrap">
      <div class="lightbox-spinner" aria-hidden="true"></div>
      <img class="lightbox-image" alt="" draggable="false" />
    </div>
    <div class="lightbox-info">
      <span class="lightbox-counter"></span>
      <span class="lightbox-caption"></span>
    </div>
  `;

  document.body.appendChild(lightboxEl);

  // Cache refs
  imageEl = lightboxEl.querySelector('.lightbox-image');
  spinnerEl = lightboxEl.querySelector('.lightbox-spinner');
  counterEl = lightboxEl.querySelector('.lightbox-counter');
  captionEl = lightboxEl.querySelector('.lightbox-caption');
  prevBtn = lightboxEl.querySelector('.lightbox-arrow-prev');
  nextBtn = lightboxEl.querySelector('.lightbox-arrow-next');
  closeBtn = lightboxEl.querySelector('.lightbox-close');

  // --- Event Listeners ---

  // Close button
  closeBtn.addEventListener('click', closeLightbox);

  // Navigation
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });

  // Click on overlay (outside image) to close
  lightboxEl.addEventListener('click', (e) => {
    if (e.target === lightboxEl) {
      closeLightbox();
    }
  });

  // Touch events for swipe
  lightboxEl.addEventListener('touchstart', onTouchStart, { passive: true });
  lightboxEl.addEventListener('touchmove', onTouchMove, { passive: false });
  lightboxEl.addEventListener('touchend', onTouchEnd, { passive: true });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Open the lightbox.
 * @param {string[]} photoSrcs - Array of full image src URLs
 * @param {number} startIndex - Index of the photo to display first
 * @param {string} title - Stop title for the caption
 */
export function openLightbox(photoSrcs, startIndex = 0, title = '') {
  if (!photoSrcs || photoSrcs.length === 0) return;

  buildLightbox();

  photos = photoSrcs;
  currentIndex = Math.max(0, Math.min(startIndex, photos.length - 1));
  stopTitle = title;
  isOpen = true;
  isTransitioning = false;

  // Lock body scroll
  document.body.classList.add('lightbox-no-scroll');

  // Bind keyboard
  document.addEventListener('keydown', onKeyDown);

  // Show the photo
  showPhoto(currentIndex, false);

  // Trigger open animation (two-step to ensure CSS transition fires)
  lightboxEl.classList.add('lightbox-open');
  // Force reflow before adding visible class
  lightboxEl.offsetHeight; // eslint-disable-line no-unused-expressions
  lightboxEl.classList.add('lightbox-visible');
}

/**
 * Close the lightbox.
 */
export function closeLightbox() {
  if (!isOpen) return;

  isOpen = false;

  // Start exit animation
  lightboxEl.classList.remove('lightbox-visible');

  // Unbind keyboard
  document.removeEventListener('keydown', onKeyDown);

  // After animation completes, fully hide
  const onTransitionEnd = () => {
    lightboxEl.classList.remove('lightbox-open');
    document.body.classList.remove('lightbox-no-scroll');
    // Clean up image src to free memory
    imageEl.src = '';
    lightboxEl.removeEventListener('transitionend', onTransitionEnd);
  };

  lightboxEl.addEventListener('transitionend', onTransitionEnd, { once: true });

  // Fallback: force cleanup if transitionend doesn't fire
  setTimeout(() => {
    if (!isOpen && lightboxEl.classList.contains('lightbox-open')) {
      lightboxEl.classList.remove('lightbox-open');
      document.body.classList.remove('lightbox-no-scroll');
      imageEl.src = '';
    }
  }, 600);
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

function navigate(direction) {
  if (isTransitioning) return;

  const newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex >= photos.length) return;

  currentIndex = newIndex;
  showPhoto(currentIndex, true);
}

/**
 * Display a photo by index with an optional crossfade transition.
 * @param {number} index
 * @param {boolean} animate - Whether to animate the transition
 */
function showPhoto(index, animate) {
  updateControls();

  const src = photos[index];

  if (animate) {
    isTransitioning = true;

    // Phase 1: Fade out current image
    imageEl.classList.add('lightbox-photo-leaving');
    imageEl.classList.remove('lightbox-photo-entered');

    const afterFadeOut = () => {
      imageEl.classList.remove('lightbox-photo-leaving');
      loadAndShow(src);
    };

    // Wait for fade-out transition
    setTimeout(afterFadeOut, 200);
  } else {
    loadAndShow(src);
  }

  // Preload neighbors
  preloadAdjacent(index);
}

/**
 * Load an image src and fade it in once ready.
 */
function loadAndShow(src) {
  // Check if already cached in browser
  const cached = preloadCache.get(src);
  const alreadyLoaded = cached && cached.complete && cached.naturalWidth > 0;

  if (alreadyLoaded) {
    // Instant display — already in memory
    imageEl.classList.add('lightbox-photo-entering');
    imageEl.src = src;
    imageEl.alt = stopTitle || 'Photo';
    spinnerEl.classList.remove('loading');
    // Force reflow for transition
    imageEl.offsetHeight; // eslint-disable-line no-unused-expressions
    imageEl.classList.remove('lightbox-photo-entering');
    imageEl.classList.add('lightbox-photo-entered');
    isTransitioning = false;
  } else {
    // Need to load — show spinner after delay
    imageEl.classList.add('lightbox-photo-entering');
    spinnerEl.classList.add('loading');

    const tempImg = new Image();
    tempImg.onload = () => {
      // Don't update if user has navigated away
      if (photos[currentIndex] !== src) return;

      spinnerEl.classList.remove('loading');
      imageEl.src = src;
      imageEl.alt = stopTitle || 'Photo';
      // Force reflow
      imageEl.offsetHeight; // eslint-disable-line no-unused-expressions
      imageEl.classList.remove('lightbox-photo-entering');
      imageEl.classList.add('lightbox-photo-entered');
      isTransitioning = false;
    };
    tempImg.onerror = () => {
      spinnerEl.classList.remove('loading');
      isTransitioning = false;
    };
    tempImg.src = src;
    preloadCache.set(src, tempImg);
  }
}

/**
 * Preload adjacent images for snappy navigation.
 */
function preloadAdjacent(index) {
  const toPreload = [index - 1, index + 1];
  for (const i of toPreload) {
    if (i >= 0 && i < photos.length && !preloadCache.has(photos[i])) {
      const img = new Image();
      img.src = photos[i];
      preloadCache.set(photos[i], img);
    }
  }
}

/**
 * Update button states, counter, and caption.
 */
function updateControls() {
  // Counter
  counterEl.textContent = `${currentIndex + 1} / ${photos.length}`;

  // Caption
  captionEl.textContent = stopTitle;

  // Arrow states
  prevBtn.disabled = currentIndex <= 0;
  nextBtn.disabled = currentIndex >= photos.length - 1;

  // Hide arrows if only one photo
  const singlePhoto = photos.length <= 1;
  prevBtn.style.display = singlePhoto ? 'none' : '';
  nextBtn.style.display = singlePhoto ? 'none' : '';
}

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------

function onKeyDown(e) {
  if (!isOpen) return;

  switch (e.key) {
    case 'Escape':
      closeLightbox();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      navigate(-1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      navigate(1);
      break;
  }
}

// ---------------------------------------------------------------------------
// Touch / Swipe
// ---------------------------------------------------------------------------

function onTouchStart(e) {
  if (!isOpen || e.touches.length !== 1) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchDeltaX = 0;
  isSwiping = false;
}

function onTouchMove(e) {
  if (!isOpen || e.touches.length !== 1) return;

  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;

  // Determine if horizontal swipe (vs vertical scroll)
  if (!isSwiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    isSwiping = true;
  }

  if (isSwiping) {
    e.preventDefault(); // Prevent page scroll during horizontal swipe
    touchDeltaX = dx;
  }
}

function onTouchEnd() {
  if (!isOpen || !isSwiping) return;

  const threshold = 50; // Minimum swipe distance in px

  if (touchDeltaX > threshold) {
    navigate(-1); // Swipe right → previous
  } else if (touchDeltaX < -threshold) {
    navigate(1);  // Swipe left → next
  }

  touchDeltaX = 0;
  isSwiping = false;
}
