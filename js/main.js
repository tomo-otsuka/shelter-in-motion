/**
 * Shelter in Motion — Main entry point.
 *
 * Orchestrates initialization: loads data, sets up the map,
 * wires the panel, and runs the opening animation.
 *
 * Landing experience: the overlay auto-dissolves after a brief hold,
 * or the user can click/tap anywhere (or press Enter/Space) to begin
 * immediately.
 */

import { loadAllData } from './data.js';
import { initMap, addRoute, addOriginMarker, addMarkers, showAllMarkers, setMarkerClickHandler, setMapClickHandler } from './map.js';
import { initPanel, openPanel, closePanel } from './panel.js';
import { animateRoute } from './animation.js';

/** How long (ms) the landing title holds before auto-dissolving */
const AUTO_DISSOLVE_DELAY = 2500;

async function init() {
  // 1. Initialize the map immediately (visible while data loads)
  initMap();

  // 2. Set up the panel
  initPanel();

  // 3. Load trip data
  try {
    await loadAllData();
  } catch (err) {
    console.error('Failed to load trip data:', err);
    document.querySelector('.landing-subtitle').textContent = 'Failed to load trip data. Try a local server.';
    return;
  }

  // 4. Add route and markers to the map (markers start hidden)
  const layers = addRoute();
  const originMarker = addOriginMarker();
  addMarkers();

  // 5. Wire marker clicks to open the panel
  setMarkerClickHandler((stopId) => {
    openPanel(stopId);
  });

  // 6. Wire map background clicks to close the panel
  setMapClickHandler(() => {
    closePanel();
  });

  // 7. Landing dissolve — auto-trigger or click-to-skip
  const landingOverlay = document.getElementById('landing-overlay');
  let dissolved = false;

  /**
   * Begin the cinematic dissolve and route animation.
   * @param {boolean} instant - If true, skip dissolve animation (instant hide)
   */
  async function beginJourney(instant = false) {
    if (dissolved) return;
    dissolved = true;

    // Clear the auto-dissolve timer if it's still pending
    clearTimeout(autoTimer);

    // Dissolve the overlay
    if (instant) {
      landingOverlay.classList.add('hidden');
    } else {
      landingOverlay.classList.add('fading');
    }

    // Show origin marker with pulse
    const originEl = originMarker.getElement();
    if (originEl) originEl.classList.add('visible');

    // Animate the route drawing (or show all markers instantly if skipping)
    if (instant) {
      showAllMarkers();
    } else if (layers) {
      await animateRoute(layers.routeLayer, layers.routeGlowLayer);
    } else {
      showAllMarkers();
    }
  }

  // Click anywhere on overlay → begin immediately
  landingOverlay.addEventListener('click', () => beginJourney(false));

  // Keyboard: Enter or Space → begin immediately
  landingOverlay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      beginJourney(false);
    }
  });

  // Double-click → instant skip (returning visitors)
  landingOverlay.addEventListener('dblclick', (e) => {
    e.stopPropagation(); // Don't also fire the click handler twice
    beginJourney(true);
  });

  // Auto-dissolve after the hold period
  const autoTimer = setTimeout(() => beginJourney(false), AUTO_DISSOLVE_DELAY);

  console.log('Shelter in Motion — loaded.');
}

init();

