/**
 * Data loading and management for Shelter in Motion.
 *
 * All trip data lives in assets/data/ as static JSON/GeoJSON files.
 * This module handles loading and provides access to stops, route, and chapters.
 */

let stops = [];
let route = null;
let chapters = [];

/**
 * Load all trip data from static JSON files.
 * Call this once during app initialization.
 */
export async function loadAllData() {
  const [stopsData, routeData, chaptersData] = await Promise.all([
    fetch('assets/data/stops.json').then(r => r.json()),
    fetch('assets/data/route.geojson').then(r => r.json()),
    fetch('assets/data/chapters.json').then(r => r.json()),
  ]);

  stops = stopsData.stops;
  route = routeData;
  chapters = chaptersData.chapters;

  return { stops, route, chapters };
}

/** Get all stops, optionally filtered. */
export function getStops(filter = {}) {
  let result = [...stops];

  if (filter.chapter) {
    result = result.filter(s => s.chapter === filter.chapter);
  }
  if (filter.tier) {
    result = result.filter(s => s.tier === filter.tier);
  }
  if (filter.nationalPark) {
    result = result.filter(s => s.nationalPark);
  }

  return result;
}

/** Get a single stop by ID. */
export function getStop(id) {
  return stops.find(s => s.id === id);
}

/** Get stop by index in the ordered stops array. */
export function getStopByIndex(index) {
  return stops[index] || null;
}

/** Get the index of a stop by ID. */
export function getStopIndex(id) {
  return stops.findIndex(s => s.id === id);
}

/** Get the total number of stops. */
export function getStopCount() {
  return stops.length;
}

/** Get all chapters. */
export function getChapters() {
  return [...chapters];
}

/** Get chapter by ID. */
export function getChapter(id) {
  return chapters.find(c => c.id === id);
}

/** Get the route GeoJSON. */
export function getRoute() {
  return route;
}
