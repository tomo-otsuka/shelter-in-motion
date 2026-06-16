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

## AI Image Curation Process

When an agent is tasked with sorting through a bulk folder of uncurated, user-provided photos, it should follow this systematic approach:

1. **Initial Grouping via Metadata (Staging):** The raw photo batch will generally be in chronological order. Use the `scripts/batch-match.py` script to automatically parse EXIF data and timestamps, bucketing the raw photos into stop-specific folders within the `staging/` directory based on the `assets/data/stops.json` itinerary. This avoids needing to guess locations visually. Do NOT commit the `staging/` directory.
2. **Visual Assessment:** You **MUST** use the `view_file` tool to visually inspect the image content within the `staging/<stop-id>/` folders. **DO NOT** curate blindly based on filenames, timestamps, or metadata. Evaluate based on:
   - **Aesthetic & Subject:** Does it capture the highlights and unique vibe of the specific location? While the overall project has a cinematic and reflective tone, **do not overly focus on darkness or moodiness**. Prioritize images that best represent the location's highlights (e.g., epic landscapes, interesting landmarks, empty highways).
   - **People:** Include good quality group photos or photos of the author with Points of Interest (POIs) if they are strong images. Only avoid random indoor snapshots or excessive party photos that don't capture the essence of the trip.
   - **Quality:** Is the subject clear and the composition engaging?
   - **De-duplication:** For bursts or sequential shots of the same subject, pick only the single strongest frame and aggressively discard the near-duplicates to avoid repetition.
3. **Selection & Role Assignment:** For each stop in the itinerary, select photos based on the stop's tier (defined in `stops.json`):
   - **For all stops:** Select **1 Hero Image** (a strong establishing wide-shot that represents the mood).
   - **For "Marquee" stops (e.g., Burning Man, LA, National Parks):** Select **10-20 Gallery Images** to populate a rich, full-page entry.
   - **For "Standard" & "Postcard" stops:** Select **2-5 Gallery Images** to support the slide-in panel.
   - *Discard the rest.*
4. **Processing & Pipeline Setup:** For the selected photos, prepare them for the repository:
   - Rename the files to descriptive, URL-safe names (e.g., `bend-oregon-highway.webp`).
   - Run the mandatory optimization and **CRITICAL EXIF stripping** step. You can use the provided `scripts/process-image.py` script (e.g., `python scripts/process-image.py --input <src> --output <dest.webp> --size 1600`) which uses Python's `Pillow` (PIL) library to safely convert to WebP, scale down (aim for < 500KB), and automatically strip EXIF. This is highly recommended as native OS tools like macOS `sips` may fail to write WebP formats.
   - Verify that all EXIF data (especially GPS coordinates) has been stripped by using a tool like `exiftool assets/images/<stop-id>/*.webp`.
   - Move the final optimized files into the appropriate `assets/images/<stop-id>/` directory and delete the original unprocessed files from the working directory.
   - Update `assets/data/stops.json` with the assigned filenames for each stop.

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
