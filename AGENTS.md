# AGENTS.md

Guidance for AI agents working on this repository.

## Project Overview

**Shelter in Motion** is a static travel-log website deployed to GitHub Pages. It documents a 2021–2022 cross-country road trip (by car) across the United States during the COVID-19 lockdown. The site features an interactive map, photography, and blog-style written entries.

## Architecture

- **Pure static site** — no build step, no bundler, no framework. HTML + CSS + JS served directly.
- **GitHub Pages** deploys from the `main` branch root.
- **Leaflet.js** (via CDN) powers the interactive map.
- All data (routes, stops, metadata) lives in static JSON/GeoJSON files under `assets/data/`.

## Key Conventions

### File Organization

| Path | Purpose |
|---|---|
| `index.html` | Main landing page with map and entry points |
| `css/` | All stylesheets; use vanilla CSS (no Tailwind, no preprocessors) |
| `js/` | JavaScript modules for map, interactions, navigation |
| `assets/images/` | Trip photographs, organized by stop or region |
| `assets/data/` | GeoJSON route data, stop metadata JSON |
| `entries/` | Individual HTML pages for each blog-style travel entry |

### Code Style

- **No build tools.** Do not introduce webpack, Vite, or similar. This ships as raw static files.
- **No CSS frameworks.** Use vanilla CSS. Prefer CSS custom properties for theming.
- **Vanilla JS only.** No React, Vue, etc. ES modules (`type="module"`) are fine.
- **Semantic HTML.** Use `<article>`, `<section>`, `<nav>`, `<figure>`, etc.
- **Mobile-first responsive design.** All layouts must work well on phones and desktops.

### Design Direction

- Dark, cinematic aesthetic — the trip happened during an unusual, reflective time.
- Rich photography should be the focal point; UI should frame the content, not compete with it.
- Subtle animations and transitions for polish, not flash.
- The map is a central interactive element — it should feel alive and inviting to explore.
- Typography: use a clean, modern font (e.g., Inter, Source Sans, or similar from Google Fonts).

### Map & Data

- Route data is stored as GeoJSON in `assets/data/`.
- Each stop/entry has metadata (coordinates, date, title, summary, photo thumbnail) in a central JSON manifest.
- The map should display the full route path and clickable markers for each stop.
- Clicking a marker should show a popup or navigate to the corresponding entry.

### Content & Entries

- Each travel entry is its own HTML file in `entries/`.
- Entries should follow a consistent template with: title, date, location, photos, and written text.
- Photos referenced in entries should use relative paths to `assets/images/`.

## Testing & Validation

- Open `index.html` in a browser to preview — no server required (though a local server avoids CORS issues with fetch).
- Validate that all links, images, and map interactions work.
- Test responsive behavior at mobile (375px), tablet (768px), and desktop (1280px+) widths.
- Ensure the site loads without errors when served from a static file server (simulating GitHub Pages).

## Things to Avoid

- Do **not** add a build step or compile process.
- Do **not** add server-side code or APIs.
- Do **not** introduce heavy dependencies — keep the CDN footprint minimal (Leaflet + fonts).
- Do **not** commit very large image files without optimizing them first (aim for < 500KB per photo; use WebP where possible).
- **CRITICAL:** You MUST strip all EXIF data (especially GPS coordinates) from images before committing them to protect privacy.
- Do **not** hardcode absolute URLs — use relative paths so the site works both locally and on GitHub Pages.
