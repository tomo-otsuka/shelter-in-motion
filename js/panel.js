/**
 * Stop detail panel for Shelter in Motion.
 *
 * Handles the slide-in panel that shows stop details, photos,
 * and prev/next navigation.
 */

import { getStop, getStopIndex, getStopByIndex, getStopCount, getChapter } from './data.js';
import { setActiveMarker, flyToStop, dimMap } from './map.js';

let currentStopId = null;
let panelEl = null;

/**
 * Initialize panel DOM references and event listeners.
 */
export function initPanel() {
  panelEl = document.getElementById('stop-panel');

  document.getElementById('panel-close').addEventListener('click', closePanel);
  document.getElementById('panel-prev').addEventListener('click', () => navigateStop(-1));
  document.getElementById('panel-next').addEventListener('click', () => navigateStop(1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
    if (e.key === 'ArrowLeft' && currentStopId) navigateStop(-1);
    if (e.key === 'ArrowRight' && currentStopId) navigateStop(1);
  });
}

/**
 * Open the panel for a given stop ID.
 */
export function openPanel(stopId) {
  const stop = getStop(stopId);
  if (!stop) return;

  currentStopId = stopId;
  populatePanel(stop);
  panelEl.classList.add('open');
  dimMap(true);
  setActiveMarker(stopId);
  flyToStop(stopId);
  updateNavState();
}

/**
 * Close the panel.
 */
export function closePanel() {
  panelEl.classList.remove('open');
  currentStopId = null;
  setActiveMarker(null);
  dimMap(false);
}

/**
 * Navigate to the previous or next stop.
 * @param {number} direction - -1 for previous, +1 for next
 */
function navigateStop(direction) {
  if (!currentStopId) return;

  const currentIndex = getStopIndex(currentStopId);
  const newStop = getStopByIndex(currentIndex + direction);

  if (newStop) {
    openPanel(newStop.id);
  }
}

/**
 * Populate panel DOM elements with stop data.
 */
function populatePanel(stop) {
  const chapter = getChapter(stop.chapter);

  // Meta
  document.getElementById('panel-chapter').textContent =
    chapter ? `Ch. ${chapter.number} — ${chapter.title}` : '';
  document.getElementById('panel-dates').textContent = formatDateRange(stop.dateStart, stop.dateEnd);

  // Title & location
  document.getElementById('panel-title').textContent = stop.title;
  document.getElementById('panel-location').textContent = buildLocationLine(stop);

  // Highlights (national parks, events)
  const highlightsEl = document.getElementById('panel-highlights');
  highlightsEl.innerHTML = '';

  if (stop.nationalPark) {
    const tag = document.createElement('span');
    tag.className = 'highlight-tag park';
    tag.textContent = stop.nationalPark;
    highlightsEl.appendChild(tag);
  }

  if (stop.events && stop.events.length) {
    stop.events.forEach(event => {
      const tag = document.createElement('span');
      tag.className = 'highlight-tag event';
      tag.textContent = event;
      highlightsEl.appendChild(tag);
    });
  }

  // Notes
  document.getElementById('panel-notes').textContent = stop.notes || '';

  // Hero image
  const heroImg = document.getElementById('panel-hero-img');
  const heroContainer = document.querySelector('.panel-hero');

  if (stop.photos && stop.photos.length > 0) {
    heroImg.src = `assets/images/${stop.id}/${stop.photos[0]}`;
    heroImg.alt = stop.title;
    heroImg.classList.remove('loaded');
    heroImg.onload = () => heroImg.classList.add('loaded');
    heroContainer.classList.remove('empty');
    heroContainer.removeAttribute('data-empty');
  } else {
    heroImg.src = '';
    heroImg.alt = '';
    heroImg.classList.remove('loaded');
    heroContainer.classList.add('empty');
    heroContainer.setAttribute('data-empty', 'photos coming soon');
  }

  // Photo gallery (additional photos beyond the hero)
  const photosEl = document.getElementById('panel-photos');
  photosEl.innerHTML = '';

  if (stop.photos && stop.photos.length > 1) {
    stop.photos.slice(1).forEach((photo, i) => {
      const img = document.createElement('img');
      img.src = `assets/images/${stop.id}/${photo}`;
      img.alt = `${stop.title} — photo ${i + 2}`;
      img.className = 'photo';
      img.loading = 'lazy';
      img.style.animationDelay = `${(i + 1) * 100}ms`;
      photosEl.appendChild(img);
    });
  }
}

/**
 * Build the metadata line below the title.
 */
function buildLocationLine(stop) {
  const parts = [stop.state];

  parts.push(`Day ${stop.dayOfTrip}${stop.days > 1 ? '–' + (stop.dayOfTrip + stop.days - 1) : ''}`);
  parts.push(`${stop.days} ${stop.days === 1 ? 'night' : 'nights'}`);

  return parts.join(' · ');
}

/**
 * Update prev/next button states and the counter.
 */
function updateNavState() {
  const index = getStopIndex(currentStopId);
  const total = getStopCount();

  document.getElementById('panel-prev').disabled = index <= 0;
  document.getElementById('panel-next').disabled = index >= total - 1;
  document.getElementById('panel-counter').textContent = `${index + 1} / ${total}`;
}

/**
 * Format a date range from ISO date strings into a readable string.
 */
function formatDateRange(start, end) {
  if (!start) return '';

  const opts = { month: 'short', day: 'numeric' };
  const startDate = new Date(start + 'T12:00:00'); // Noon to avoid timezone edge cases
  const startStr = startDate.toLocaleDateString('en-US', opts);

  if (!end || start === end) {
    return `${startStr}, ${startDate.getFullYear()}`;
  }

  const endDate = new Date(end + 'T12:00:00');
  const endStr = endDate.toLocaleDateString('en-US', opts);

  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    return `${startDate.toLocaleDateString('en-US', { month: 'short' })} ${startDate.getDate()}–${endDate.getDate()}, ${endDate.getFullYear()}`;
  }

  return `${startStr} – ${endStr}, ${endDate.getFullYear()}`;
}
