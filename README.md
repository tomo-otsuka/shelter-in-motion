# Shelter in Motion

A static website chronicling a cross-country road trip taken during the COVID-19 lockdown of 2021–2022. While the world sheltered in place, this journey found shelter *in motion* — traveling by car across the United States, visiting cities, landmarks, and national parks along the way.

**Live site:** _Coming soon via GitHub Pages_

---

## What This Is

A visual travel log combining:

- **Interactive map** — An explorable map tracing the route with stops and highlights
- **Photography** — Photos from the road, the parks, the cities, and everything in between
- **Written reflections** — Blog-style entries with personal remarks, stories, and observations from each stop

## Tech Stack

- **Static site** hosted on [GitHub Pages](https://pages.github.com/)
- Vanilla HTML, CSS, and JavaScript (no heavy frameworks)
- Map powered by [Leaflet.js](https://leafletjs.com/) (or similar lightweight mapping library)
- Responsive design for desktop and mobile

## Project Structure

```
shelter-in-motion/
├── index.html          # Landing page with hero + map
├── css/                # Stylesheets
├── js/                 # JavaScript (map logic, interactions)
├── assets/
│   ├── images/         # Trip photos
│   └── data/           # GeoJSON / route data, stop metadata
├── entries/            # Individual blog-style travel entries
├── README.md
└── AGENTS.md
```

## Development

### Local Preview

Open `index.html` directly in a browser, or use a simple local server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

### Deployment

The site deploys automatically to GitHub Pages from the `main` branch. No build step required — it's plain static files.

## License

Content and photos © Tomo Otsuka. Code is MIT licensed.
