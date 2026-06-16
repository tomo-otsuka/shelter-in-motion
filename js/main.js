/**
 * Shelter in Motion — Main entry point.
 *
 * Orchestrates initialization: loads data, sets up the map,
 * wires the panel, and runs the opening animation.
 */

import { loadAllData } from './data.js';
import { initMap, addRoute, addOriginMarker, addMarkers, showAllMarkers, setMarkerClickHandler } from './map.js';
import { initPanel, openPanel } from './panel.js';
import { animateRoute } from './animation.js';

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

  // 6. Wire the Explore button
  const exploreBtn = document.getElementById('explore-btn');
  const landingOverlay = document.getElementById('landing-overlay');

  exploreBtn.addEventListener('click', async () => {
    landingOverlay.classList.add('hidden');

    // Show origin marker with pulse
    const originEl = originMarker.getElement();
    if (originEl) originEl.classList.add('visible');

    // Animate the route drawing
    if (layers) {
      await animateRoute(layers.routeLayer, layers.routeGlowLayer);
    } else {
      showAllMarkers();
    }
  });

  // Double-click overlay to skip animation (returning visitors)
  landingOverlay.addEventListener('dblclick', () => {
    landingOverlay.classList.add('hidden');
    const originEl = originMarker.getElement();
    if (originEl) originEl.classList.add('visible');
    showAllMarkers();
  });

  console.log('Shelter in Motion — loaded.');
}

init();
