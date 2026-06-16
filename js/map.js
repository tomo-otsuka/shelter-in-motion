/**
 * Map initialization and interaction for Shelter in Motion.
 *
 * Uses Leaflet.js with CSS-filtered CartoDB Positron tiles to create
 * a warm, vintage-looking map. Renders the route and stop markers.
 */

import { getStops, getRoute, getStop, getChapter } from './data.js';

/** @type {L.Map} */
let map = null;
let routeLayer = null;
let routeGlowLayer = null;
let markerElements = {};
let activeMarkerId = null;

/** Callback set by main.js for marker clicks */
let onMarkerClick = null;

const ORIGIN = [37.7749, -122.4194]; // San Francisco

/**
 * Initialize the Leaflet map.
 */
export function initMap() {
  map = L.map('map', {
    center: [39.0, -98.0],
    zoom: 5,
    zoomControl: false,
    attributionControl: true,
    maxBounds: [
      [14, -170],
      [72, -50],
    ],
    minZoom: 4,
    maxZoom: 13,
  });

  // CartoDB Positron — CSS filter in map.css transforms it to vintage/warm
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  return map;
}

/**
 * Register a callback for marker clicks.
 * @param {function(string)} callback - Called with stop ID when a marker is clicked.
 */
export function setMarkerClickHandler(callback) {
  onMarkerClick = callback;
}

/**
 * Add the route polyline to the map.
 * Returns the layers for animation.
 */
export function addRoute() {
  const routeData = getRoute();
  if (!routeData || !routeData.features || !routeData.features.length) return null;

  const coordinates = routeData.features[0].geometry.coordinates.map(
    coord => [coord[1], coord[0]] // GeoJSON [lng, lat] → Leaflet [lat, lng]
  );

  // Glow layer (wider, semi-transparent — rendered first, behind main line)
  routeGlowLayer = L.polyline(coordinates, {
    className: 'route-glow',
    interactive: false,
  }).addTo(map);

  // Main route line (dashed)
  routeLayer = L.polyline(coordinates, {
    className: 'route-line',
    interactive: false,
  }).addTo(map);

  return { routeLayer, routeGlowLayer };
}

/**
 * Add the origin marker (San Francisco).
 */
export function addOriginMarker() {
  const icon = L.divIcon({
    className: 'origin-marker',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  return L.marker(ORIGIN, { icon, interactive: false }).addTo(map);
}

/**
 * Add stop markers to the map.
 */
export function addMarkers() {
  const stops = getStops();

  stops.forEach((stop) => {
    const size = stop.tier === 'marquee' ? 14 : stop.tier === 'postcard' ? 8 : 11;

    const icon = L.divIcon({
      className: `stop-marker ${stop.tier || ''}`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    const marker = L.marker(stop.coordinates, { icon }).addTo(map);

    marker.on('click', () => {
      if (onMarkerClick) onMarkerClick(stop.id);
    });

    markerElements[stop.id] = marker;
  });

  return markerElements;
}

/**
 * Set the visually active marker.
 */
export function setActiveMarker(stopId) {
  // Remove previous active state
  if (activeMarkerId && markerElements[activeMarkerId]) {
    const el = markerElements[activeMarkerId].getElement();
    if (el) el.querySelector('.stop-marker')?.classList.remove('active');
  }

  // Set new active state
  if (stopId && markerElements[stopId]) {
    const el = markerElements[stopId].getElement();
    if (el) el.querySelector('.stop-marker')?.classList.add('active');
  }

  activeMarkerId = stopId;
}

/**
 * Fly the map to a stop's coordinates.
 */
export function flyToStop(stopId) {
  const stop = getStop(stopId);
  if (!stop || !map) return;
  map.flyTo(stop.coordinates, Math.max(map.getZoom(), 7), { duration: 1.2 });
}

/**
 * Toggle map dimming (used when panel opens/closes).
 */
export function dimMap(dim = true) {
  document.getElementById('map').classList.toggle('dimmed', dim);
}

/**
 * Make all markers visible at once (skip animation).
 */
export function showAllMarkers() {
  Object.values(markerElements).forEach(marker => {
    const el = marker.getElement();
    if (el) el.querySelector('.stop-marker')?.classList.add('visible');
  });
}

/**
 * Make a single marker visible by stop ID.
 */
export function showMarker(stopId) {
  const marker = markerElements[stopId];
  if (!marker) return;
  const el = marker.getElement();
  if (el) el.querySelector('.stop-marker')?.classList.add('visible');
}

/** Get the Leaflet map instance. */
export function getMap() {
  return map;
}
