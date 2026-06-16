/**
 * Route drawing animation for Shelter in Motion.
 *
 * Animates the route line drawing itself across the map using
 * SVG stroke-dashoffset. Markers bloom as the route reaches them.
 */

import { getStops } from './data.js';
import { showMarker, getMap } from './map.js';

/**
 * Animate the route drawing itself on the map.
 *
 * @param {L.Polyline} routeLayer - The main route polyline
 * @param {L.Polyline} glowLayer - The glow polyline
 * @param {Object} options
 * @param {number} options.duration - Total animation time in ms (default 6000)
 * @param {number} options.delay - Delay before starting in ms (default 800)
 * @returns {Promise} Resolves when animation completes
 */
export function animateRoute(routeLayer, glowLayer, options = {}) {
  const {
    duration = 6000,
    delay = 800,
  } = options;

  return new Promise((resolve) => {
    setTimeout(() => {
      const pathEl = routeLayer.getElement();
      const glowEl = glowLayer?.getElement();

      if (!pathEl) {
        // SVG renderer not available — show everything immediately
        showAllMarkersNow();
        resolve();
        return;
      }

      const totalLength = pathEl.getTotalLength();

      // Initial state: line fully hidden via dashoffset
      pathEl.style.strokeDasharray = totalLength;
      pathEl.style.strokeDashoffset = totalLength;
      pathEl.style.transition = 'none';

      if (glowEl) {
        glowEl.style.strokeDasharray = totalLength;
        glowEl.style.strokeDashoffset = totalLength;
        glowEl.style.transition = 'none';
      }

      // Force reflow so the initial state applies before transition
      pathEl.getBoundingClientRect();

      // Animate: transition dashoffset to 0
      pathEl.style.transition = `stroke-dashoffset ${duration}ms linear`;
      pathEl.style.strokeDashoffset = '0';

      if (glowEl) {
        glowEl.style.transition = `stroke-dashoffset ${duration}ms linear`;
        glowEl.style.strokeDashoffset = '0';
      }

      // Schedule marker reveals to sync with route progress
      scheduleMarkerReveals(routeLayer, duration);

      setTimeout(resolve, duration + 200);
    }, delay);
  });
}

/**
 * Schedule markers to bloom as the route animation reaches them.
 *
 * For each stop, we find the closest point on the SVG path by sampling,
 * then trigger the marker reveal at the proportional time.
 */
function scheduleMarkerReveals(routeLayer, duration) {
  const stops = getStops();
  const map = getMap();
  const pathEl = routeLayer.getElement();

  if (!pathEl || !map) {
    showAllMarkersNow();
    return;
  }

  const totalLength = pathEl.getTotalLength();
  const samples = 300; // Higher = more accurate timing

  stops.forEach((stop) => {
    const latLng = L.latLng(stop.coordinates);
    const point = map.latLngToLayerPoint(latLng);

    // Find closest point on path by sampling at regular intervals
    let minDistSq = Infinity;
    let minProgress = 0;

    for (let i = 0; i <= samples; i++) {
      const progress = i / samples;
      const pathPoint = pathEl.getPointAtLength(progress * totalLength);
      const dx = pathPoint.x - point.x;
      const dy = pathPoint.y - point.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        minProgress = progress;
      }
    }

    // Reveal the marker at the proportional time
    const revealTime = minProgress * duration;
    setTimeout(() => showMarker(stop.id), revealTime);
  });
}

/**
 * Fallback: reveal all markers immediately.
 */
function showAllMarkersNow() {
  getStops().forEach(stop => showMarker(stop.id));
}
