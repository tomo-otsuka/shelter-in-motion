/**
 * Stop detail panel for Shelter in Motion.
 *
 * Handles the slide-in panel that shows stop details, photos,
 * and prev/next navigation. Integrates with the lightbox for
 * full-screen photo viewing.
 */

import { getStop, getStopIndex, getStopByIndex, getStopCount, getChapter } from './data.js';
import { setActiveMarker, flyToStop, dimMap } from './map.js';

let currentStopId = null;
let panelEl = null;

/** Will be set after lightbox module loads */
let lightboxModule = null;

/**
 * Initialize panel DOM references and event listeners.
 */
export function initPanel() {
  panelEl = document.getElementById('stop-panel');

  document.getElementById('panel-close').addEventListener('click', closePanel);
  document.getElementById('panel-prev').addEventListener('click', () => navigateStop(-1));
  document.getElementById('panel-next').addEventListener('click', () => navigateStop(1));

  document.addEventListener('keydown', (e) => {
    // Don't handle keyboard when lightbox is open — let lightbox handle it
    if (document.body.classList.contains('lightbox-no-scroll')) return;

    if (e.key === 'Escape') closePanel();
    if (e.key === 'ArrowLeft' && currentStopId) navigateStop(-1);
    if (e.key === 'ArrowRight' && currentStopId) navigateStop(1);
  });

  // Scroll tracking for bottom indicator fade
  panelEl.addEventListener('scroll', () => {
    const isAtBottom = panelEl.scrollHeight - panelEl.scrollTop - panelEl.clientHeight < 24;
    panelEl.classList.toggle('scrolled-bottom', isAtBottom);
  });

  // Dynamically import lightbox module
  import('./lightbox.js').then(mod => {
    lightboxModule = mod;
  }).catch(() => {
    console.warn('Lightbox module not available');
  });
}

/**
 * Open the panel for a given stop ID.
 */
export function openPanel(stopId) {
  const stop = getStop(stopId);
  if (!stop) return;

  currentStopId = stopId;

  // Scroll panel to top before populating
  panelEl.scrollTop = 0;

  populatePanel(stop);
  panelEl.classList.add('open');
  dimMap(true);
  setActiveMarker(stopId);
  flyToStop(stopId);
  updateNavState();

  // Trigger stagger animations after a frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panelEl.querySelectorAll('.stagger-in').forEach(el => {
        el.classList.add('visible');
      });
    });
  });
}

/**
 * Close the panel.
 */
export function closePanel() {
  panelEl.classList.remove('open');

  // Reset stagger states for next open
  panelEl.querySelectorAll('.stagger-in').forEach(el => {
    el.classList.remove('visible');
  });

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

  // Meta (with stagger)
  const chapterEl = document.getElementById('panel-chapter');
  chapterEl.textContent = chapter ? `Ch. ${chapter.number} — ${chapter.title}` : '';
  chapterEl.className = 'panel-chapter stagger-in stagger-1';

  const datesEl = document.getElementById('panel-dates');
  datesEl.textContent = formatDateRange(stop.dateStart, stop.dateEnd);
  datesEl.className = 'panel-dates stagger-in stagger-1';

  // Title & location (with stagger)
  const titleEl = document.getElementById('panel-title');
  titleEl.textContent = stop.title;
  titleEl.className = 'panel-title stagger-in stagger-2';

  const locationEl = document.getElementById('panel-location');
  locationEl.textContent = buildLocationLine(stop);
  locationEl.className = 'panel-location stagger-in stagger-2';

  // Highlights (national parks, events) (with stagger)
  const highlightsEl = document.getElementById('panel-highlights');
  highlightsEl.innerHTML = '';
  highlightsEl.className = 'panel-highlights stagger-in stagger-3';

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

  // Notes (with stagger)
  const notesEl = document.getElementById('panel-notes');
  notesEl.textContent = stop.notes || '';
  notesEl.className = 'panel-notes stagger-in stagger-4';

  // Entry Link (with stagger)
  const entryLinkEl = document.getElementById('panel-entry-link');
  entryLinkEl.className = 'panel-entry-link stagger-in stagger-4';
  if (stop.hasEntry) {
    entryLinkEl.innerHTML = `<a href="entries/${stop.id}.html" class="read-more-link">Read the full entry &rarr;</a>`;
  } else {
    entryLinkEl.innerHTML = '';
  }

  // Linked Stops (with stagger)
  const linkedStopsEl = document.getElementById('panel-linked-stops');
  if (linkedStopsEl) {
    linkedStopsEl.className = 'panel-linked-stops stagger-in stagger-4';
    linkedStopsEl.innerHTML = '';
    
    if (stop.linkedStops && stop.linkedStops.length > 0) {
      const linkedLinks = stop.linkedStops.map(linkedId => {
        const linkedStop = getStop(linkedId);
        if (!linkedStop) return '';
        return `<span class="linked-stop-link" data-id="${linkedId}">Also visited: ${linkedStop.title} &rarr;</span>`;
      }).join('');
      linkedStopsEl.innerHTML = linkedLinks;
      
      linkedStopsEl.querySelectorAll('.linked-stop-link').forEach(link => {
        link.addEventListener('click', (e) => {
          openPanel(e.target.dataset.id);
        });
      });
    }
  }

  // Hero image
  const heroImg = document.getElementById('panel-hero-img');
  const heroContainer = document.querySelector('.panel-hero');
  const photoCountEl = document.getElementById('panel-photo-count');

  if (stop.photos && stop.photos.length > 0) {
    // Show loading shimmer
    heroContainer.classList.add('loading');
    heroContainer.classList.remove('empty');
    heroContainer.removeAttribute('data-empty');

    heroImg.src = `assets/images/${stop.id}/${stop.photos[0]}`;
    heroImg.alt = stop.title;
    heroImg.classList.remove('loaded');
    heroImg.onload = () => {
      heroImg.classList.add('loaded');
      heroContainer.classList.remove('loading');
    };
    heroImg.onerror = () => {
      heroContainer.classList.remove('loading');
    };

    // Photo count badge
    if (photoCountEl) {
      photoCountEl.textContent = `${stop.photos.length} photo${stop.photos.length !== 1 ? 's' : ''}`;
    }

    // Hero click → open lightbox at index 0
    heroContainer.onclick = () => {
      if (lightboxModule && stop.photos && stop.photos.length > 0) {
        const photoUrls = stop.photos.map(p => `assets/images/${stop.id}/${p}`);
        lightboxModule.openLightbox(photoUrls, 0, stop.title);
      }
    };
  } else {
    heroImg.removeAttribute('src');
    heroImg.alt = '';
    heroImg.classList.remove('loaded');
    heroContainer.classList.add('empty');
    heroContainer.classList.remove('loading');
    heroContainer.setAttribute('data-empty', 'photos coming soon');
    heroContainer.onclick = null;
    heroContainer.style.cursor = 'default';

    if (photoCountEl) {
      photoCountEl.textContent = '';
    }
  }

  // Photo gallery (additional photos beyond the hero) (with stagger)
  const photosEl = document.getElementById('panel-photos');
  photosEl.innerHTML = '';
  photosEl.className = 'panel-photos stagger-in stagger-5';

  if (stop.photos && stop.photos.length > 1) {
    stop.photos.slice(1).forEach((photo, i) => {
      const img = document.createElement('img');
      img.src = `assets/images/${stop.id}/${photo}`;
      img.alt = `${stop.title} — photo ${i + 2}`;
      img.className = 'photo';
      img.loading = 'lazy';
      img.style.animationDelay = `${(i + 1) * 100}ms`;

      // Gallery image click → open lightbox at this index
      img.addEventListener('click', () => {
        if (lightboxModule && stop.photos) {
          const photoUrls = stop.photos.map(p => `assets/images/${stop.id}/${p}`);
          lightboxModule.openLightbox(photoUrls, i + 1, stop.title);
        }
      });

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
