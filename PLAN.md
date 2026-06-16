# PLAN.md — Shelter in Motion

A living document capturing the vision, structure, and design decisions for the site.

---

## The Story

In August 2021, during the COVID-19 lockdown, I left San Francisco and drove across the country. What started as motion became a way of life — 168 days, 20+ states, 13 national parks, Burning Man, festivals, strangers' Airbnbs, friends old and new, and the strange quiet of a country mid-pandemic.

The trip ended in Arizona in January 2022, when a friend was diagnosed with stage 3b cancer and needed help. The motion stopped because something mattered more than the journey.

**The site captures the motion part.** The rest is private.

---

## Site Vision

### The Feeling
The world was frozen. I was moving. The site should feel like that — stillness and motion in tension. Empty highways, deserted landmarks, living in strangers' homes during a pandemic. Dark, cinematic, reflective. Not a cheerful vacation blog. Something quieter and more honest.

### Core Principles
- **Photography is the focal point.** UI frames the content, never competes with it.
- **The map is the primary interface.** The journey is always the context.
- **Three depths of content** — not everything gets the same weight. The site breathes.
- **Subtle, not flashy.** Animations and transitions for polish, not spectacle.
- **The in-between matters.** Gas stations, windshield views, the unglamorous connective tissue of a road trip.

---

## Landing Page — Option A

Full-screen interactive map. Dark background. The route glows like a thread drawn across the country.

```
┌──────────────────────────────────────────┐
│                                          │
│            [Full-screen map]             │
│      Route drawn SF → across the US      │
│      Markers pulsing softly at stops     │
│                                          │
│    "2021–2022. 168 days. 20+ states."    │
│                                          │
│           [ Explore the trip ]           │
│        or click any stop to begin        │
│                                          │
└──────────────────────────────────────────┘
```

### Route Animation
On first load (or on "Explore"):
- The route **draws itself** from SF outward over ~5 seconds
- Markers **pop in** as the line reaches each stop
- Everything settles into an interactive state

---

## Stop Interaction — Panel Approach

Clicking a marker opens a **slide-in panel** (right side on desktop, bottom on mobile):

- Hero photo, full bleed within the panel
- Location name, date, days on the road counter
- 2–5 photos (swipeable)
- Short text — a paragraph or two
- "Next stop →" / "← Previous" for sequential browsing

**The map stays visible behind the panel**, zoomed to the current area. You never fully leave the map. The journey is always the context.

**Marquee stops** can optionally expand into a **full entry page** (`entries/*.html`) with richer photo layouts and longer writing.

---

## Content Tiers

| Tier | Count | Treatment | Example |
|---|---|---|---|
| **Marquee** | ~12 | Full entry page option. Rich photo gallery, real writing. | Burning Man, Olympic NP, Charleston, Asheville |
| **Standard** | ~18 | Panel with 3–5 photos + a paragraph | Bend, Reno, Kansas City, Acadia |
| **Postcard** | ~10 | Single photo + one-line caption | Eugene, State College, Flagstaff |

This creates **rhythm**. Not everything is the same weight.

---

## Chapters

The trip organized into narrative arcs, not just chronology:

### 1. "Leaving" — SF → Lake Tahoe (Aug 6)
The departure. Why go. What was left behind.

### 2. "The Northwest" (Aug 6 – Aug 28)
| Stop | Days | Type | Notes |
|---|---|---|---|
| Lake Tahoe, CA/NV | 2 | Standard | Friend's birthday. Trip begins. |
| Bend, OR | 4 | Standard | Friends |
| Portland, OR | 3 | Standard | Friends |
| Seattle, WA | 7 | Marquee | Mt Rainier NP, Friends |
| Olympic NP / Port Angeles | 3 | Marquee | Olympic NP |
| Seaside, OR | 3 | Standard | Oregon Coast |
| Eugene, OR | 1 | Postcard | Passing through |

### 3. "The Burn" (Aug 29 – Sep 5)
| Stop | Days | Type | Notes |
|---|---|---|---|
| Reno, NV | 4 | Standard | Pre-burn staging |
| Black Rock City, NV | 4 | Marquee | Burning Man. Its own world. |

Unique visual treatment — different palette, different energy. Nothing else on the trip is like this.

### 4. "The LA Chapter" (Sep 6 – Oct 1)
| Stop | Days | Type | Notes |
|---|---|---|---|
| Los Angeles, CA | ~26 | Marquee | $75/night base camp. Recurring home. |
| San Diego, CA | 1 | Postcard | Day trip |
| Las Vegas, NV | 4 | Standard | Life is Beautiful festival |

LA is a recurring base, not a single stop. Side trips radiate out and return. The map should show this — a pulsing "home base" marker with spokes.

Notable events woven into the LA entry:
- Hollywood Bowl — James Blake (Sep 25)
- LA State Historic Park — Porter Robinson (Oct 1)

### 5. "The Southwest" (Oct 2 – Oct 16)
| Stop | Days | Type | Notes |
|---|---|---|---|
| Flagstaff, AZ | 1 | Postcard | Friends |
| Albuquerque / Petrified Forest NP | 3 | Standard | Petrified Forest NP |
| Santa Fe, NM | 3 | Marquee | Albuquerque Balloon Fiesta |
| Great Sand Dunes NP, CO | 1 | Standard | Great Sand Dunes NP |
| Denver, CO | 7 | Marquee | Rocky Mountain NP |

### 6. "The Middle" (Oct 17 – Oct 30)
| Stop | Days | Type | Notes |
|---|---|---|---|
| Kansas City, MO | 6 | Standard | |
| St. Louis, MO | 1 | Standard | Gateway Arch NP |
| Mammoth Cave, KY | 1 | Standard | Mammoth Cave NP |
| Columbus, OH | 5 | Standard | |
| Cleveland / Cuyahoga Valley | 1 | Standard | Cuyahoga Valley NP |

### 7. "The Northeast" (Oct 31 – Nov 14)
| Stop | Days | Type | Notes |
|---|---|---|---|
| Boston, MA | ~8 | Marquee | |
| Portland, ME | 1 | Postcard | |
| Bar Harbor / Acadia NP | 1 | Standard | Acadia NP, November in Maine |
| Niagara Falls, NY/ON | 3 | Standard | Crossed into Canada |
| Toronto, ON | 1 | Postcard | |
| State College, PA | 1 | Postcard | |

### 8. "The Capital & the South" (Nov 15 – Dec 7)
| Stop | Days | Type | Notes |
|---|---|---|---|
| Washington, DC | 9 | Marquee | Shenandoah NP |
| Virginia Beach, VA | 1 | Postcard | |
| Charlotte, NC | 1 | Postcard | Thanksgiving |
| Columbia / Congaree NP | 1 | Standard | Congaree NP |
| Charleston, SC | 8 | Marquee | |
| Atlanta, GA | 3 | Standard | |

### 9. "Mountain Rest" (Dec 8 – Dec 23)
| Stop | Days | Type | Notes |
|---|---|---|---|
| Asheville, NC | 16 | Marquee | Longest stay. Belo break. Mountains in winter. The trip's deep breath. |

### 10. "Christmas in Florida" (Dec 24 – Jan 3)
| Stop | Days | Type | Notes |
|---|---|---|---|
| Savannah, GA | 1 | Standard | Christmas Eve |
| Daytona → Ft Lauderdale → Miami | 3 | Standard | Christmas Day on the road, Everglades NP |
| Florida City / Key West | 3 | Marquee | Biscayne NP, Key West |
| Miami | 2 | Standard | NYE |
| Tampa → Tallahassee | 2 | Postcard | Gulf coast |

### 11. "The Gulf & The End" (Jan 4 – Jan 20)
| Stop | Days | Type | Notes |
|---|---|---|---|
| Mobile, AL | 4 | Standard | |
| Baton Rouge → Houston | 2 | Postcard | Passing through |
| Austin, TX | 7 | Marquee | |
| Carlsbad, NM | 2 | Standard | Carlsbad Caverns? |
| Tucson → Phoenix, AZ | 2 | Standard | The motion stops. |

---

## Stats Bar

Subtle, persistent element (maybe in the landing hero, maybe in a footer strip):

| Stat | Value |
|---|---|
| Days on the road | 168 |
| States | 20+ |
| Countries | 2 |
| National Parks | 13 |
| Miles driven | TBD (can estimate ~15,000+) |

---

## National Parks — A Through-Line

The parks are a thread running through the entire journey. Could be a toggleable **filter on the map** — show only parks, like a sub-journey.

1. Mt Rainier NP (WA)
2. Olympic NP (WA)
3. Petrified Forest NP (AZ)
4. Great Sand Dunes NP (CO)
5. Rocky Mountain NP (CO)
6. Gateway Arch NP (MO)
7. Mammoth Cave NP (KY)
8. Cuyahoga Valley NP (OH)
9. Acadia NP (ME)
10. Shenandoah NP (VA)
11. Congaree NP (SC)
12. Everglades NP (FL)
13. Biscayne NP (FL)
14. Carlsbad Caverns NP? (NM) — TBD

---

## People Along the Way

The trip wasn't solo isolation — it was finding community in motion. Friends at various stops made the journey what it was. Details kept offline.

---

## Design & Aesthetic

### The Concept: "Road Film Journal"

This site should feel like paging through a filmmaker's production journal from a road movie that was never finished. Documentary, not editorial. Warm, not slick. The aesthetic sits at the intersection of:

- **Vintage cartography** — the map should feel discovered, not generated
- **Film photography** — photos treated as stills from a 16mm road documentary
- **Travel ephemera** — the textures of motel receipts, gas station maps, worn paper

**The ONE unforgettable thing:** The route draws itself across a map that looks hand-drawn, while the entire page has the grain and warmth of a film print. It should feel like an artifact from the trip, not a website about the trip.

### Tone

Cinematic. Reflective. Warm despite the dark palette. Think Wim Wenders' road movies, the color grading of *Nomadland*, the quiet observation of *Paterson*. Not Instagram wanderlust — something more honest.

### Color Palette

Not the usual dark-mode-with-accent-color. This is **warm dark** — charcoal that leans brown, not blue.

```
--bg-deep:        #0d0b09;     /* near-black, warm undertone */
--bg-surface:     #1a1714;     /* card/panel backgrounds */
--bg-elevated:    #252019;     /* hover states, raised elements */
--border:         #332d24;     /* subtle warm borders */

--text-primary:   #e8dfd3;     /* warm cream, not clinical white */
--text-secondary: #9b8e7e;     /* muted, like faded ink */
--text-caption:   #6b5f52;     /* dates, metadata — barely there */

--route-line:     #c4956a;     /* amber/terracotta — the thread */
--route-glow:     #c4956a33;   /* soft glow behind the route */
--accent:         #d4a574;     /* warm gold for interactive moments */
--accent-hover:   #e8c49a;     /* brighter on hover */

--park-green:     #7a9a6b;     /* national parks — muted sage */
--film-grain:     rgba(200, 180, 160, 0.03);  /* overlay texture */
```

No teal. No blue. The entire palette lives in the warm spectrum: charcoal → umber → amber → cream. This is desert sunsets and campfire light, not a SaaS dashboard.

### Typography

**No Inter. No Roboto. No system fonts.**

| Role | Font | Why |
|---|---|---|
| **Display / Titles** | [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) | Elegant but not precious. Has the character of a film title card — slightly warm, slightly imperfect. Beautiful at large sizes. |
| **Body / Prose** | [Spectral](https://fonts.google.com/specimen/Spectral) | A serif designed for long-form reading on screen. Warm, literary, slightly old-world. The text should feel *written*, not typed. |
| **Metadata / Captions** | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | Dates, distances, coordinates, stats. The utilitarian counterpoint to the warm serifs. Creates a documentary/archival feel — like data stamps on a film negative. |

The contrast between the warm serifs and the cold mono is the typographic tension that mirrors the whole project: the personal (writing, photos, feelings) vs. the mechanical (driving, miles, dates).

### Photo Treatment

Photos should feel like **film stills**, not phone snapshots:

- Subtle CSS `filter` on all photos: slight desaturation, warmth shift, soft contrast
- A **film grain overlay** (CSS noise texture or SVG filter) over the photo containers
- Photos presented in **cinematic aspect ratios** — some letterboxed 2.35:1, some 4:3, varying by content
- On hover/focus: the grain lifts and saturation returns slightly — the image "comes alive"
- Consider a subtle **vignette** (CSS radial-gradient overlay) on hero images

```css
.photo {
  filter: saturate(0.85) contrast(1.05) sepia(0.08);
  transition: filter 0.6s ease;
}
.photo:hover {
  filter: saturate(1) contrast(1) sepia(0);
}
```

### Map Style

**Not a standard dark tile layer.** The map should feel like a found artifact:

- **Tile layer:** [Stamen Watercolor](http://maps.stamen.com/watercolor) (painterly, textured) with a dark CSS blend mode over it, OR a muted vintage-style tile like [Stamen Toner Lite](http://maps.stamen.com/toner-lite) inverted and sepia-toned via CSS filters
- **Alternative:** CartoDB Positron with heavy CSS filtering: `filter: invert(1) sepia(0.3) saturate(0.4) brightness(0.5)` — creates a warm, aged map feel from a clean base
- Route line: **not a simple polyline**. Use a dashed/dotted line style with a soft glow — like a path traced with a pen on a paper map
- Markers: **small circles with a warm fill**, not pins. Maybe a subtle ring animation (CSS keyframes) on the active/hovered marker. Different size for marquee vs. postcard stops.
- **No standard Leaflet controls.** Custom-styled zoom buttons, or remove them entirely (scroll to zoom is enough)
- Chapter labels directly on the map as subtle text overlays at the right zoom level

### Textures & Atmosphere

The site needs **physical texture** — it should not feel like flat vectors on a screen:

- **Film grain overlay:** A subtle noise texture (`<svg>` filter or CSS background with a tiny repeating noise pattern) over the entire page. Barely visible — 2-3% opacity. Adds warmth and physical presence.
- **Paper texture** on panel/card backgrounds — very subtle, like aged vellum
- **Topographic contour lines** as a decorative background element on certain sections (SVG pattern, very low opacity)
- **Vignette** on the edges of the viewport — darker at the edges, draws focus inward
- **Subtle parallax on grain/texture layers** — they move at a different rate than content, creating depth

### Motion & Animation

**One hero moment, not a thousand micro-interactions.**

The site's signature animation is the **route drawing itself on landing**. This should be *the* moment:

1. Page loads dark. A beat of silence (800ms).
2. The SF marker fades in — a warm point of light.
3. The route begins to draw itself westward, then north. The line has a slight glow, like a lit fuse.
4. As the line reaches each stop, the marker blooms softly — not a bounce, a *bloom*. Like a light turning on.
5. The stats counter ticks up: days, miles, states — in JetBrains Mono, bottom of screen.
6. The animation takes ~6-8 seconds. Not rushed.
7. When complete, everything settles. The map becomes interactive. A single line of text fades in.

Beyond the hero animation:
- **Panel transitions:** Slide-in with a slight fade, 400ms cubic-bezier — not linear, not bouncy. Measured.
- **Map fly-to:** When navigating between stops, the map eases smoothly (Leaflet's `flyTo` with custom duration).
- **Photo reveals:** When a panel opens, photos fade in with a staggered delay (100ms between each). Not slide-up. Just... appear. Like photos being laid on a table.
- **Scroll-triggered chapter titles:** As you scroll through a full entry page, the chapter title fades in at the top — then fades out. Ephemeral.
- **NO:** bouncing, spinning, wiggling, pulsing badges, confetti, or particle effects. This is a quiet film, not a carnival.

### Layout Principles

- **Generous negative space.** Let the photos breathe. The emptiness echoes the empty highways.
- **Asymmetric photo layouts** in full entries — not a grid. One large image, one small. Overlap occasionally. A photo bleeding off the edge of its container.
- **The panel doesn't center itself.** It slides in from the right and takes ~40% of the viewport. The map behind it shifts slightly left and dims. The asymmetry is intentional.
- **Stats and metadata** are always understated — small, monospace, low contrast. They're there if you look, but they don't shout.
- **On mobile:** Full-screen simplicity. The panel becomes a bottom sheet. Photos go full-width. The map hides behind a toggle. Don't try to cram the desktop experience — distill it.

### The Ending

After the last stop (Phoenix), the route line fades to a dotted trail heading vaguely south. No marker. No entry. Maybe a single line in Instrument Serif, centered on a dark screen:

> *"The motion stopped. Something else began."*

Or nothing at all. Just the map, with the line ending mid-desert. The user decides if they want to know why.

---

## Technical Architecture

```
shelter-in-motion/
├── index.html              # Landing — map + hero
├── css/
│   ├── main.css            # Design tokens, base styles
│   ├── map.css             # Map-specific styles
│   ├── panel.css           # Stop detail panel
│   └── entry.css           # Full entry pages
├── js/
│   ├── main.js             # App initialization
│   ├── map.js              # Leaflet setup, route drawing, markers
│   ├── panel.js            # Panel open/close, content loading
│   ├── animation.js        # Route draw animation, transitions
│   └── data.js             # Data loading and management
├── assets/
│   ├── images/             # Photos organized by stop
│   │   ├── lake-tahoe/
│   │   ├── bend/
│   │   ├── seattle/
│   │   └── ...
│   └── data/
│       ├── stops.json      # Stop manifest (coords, metadata, photos)
│       ├── route.geojson    # Full route path
│       └── chapters.json   # Chapter groupings
├── entries/                # Full entry pages for marquee stops
│   ├── burning-man.html
│   ├── olympic-np.html
│   └── ...
├── PLAN.md
├── README.md
└── AGENTS.md
```

### Data: `stops.json` (shape)
```json
{
  "stops": [
    {
      "id": "lake-tahoe",
      "title": "Lake Tahoe",
      "chapter": "the-northwest",
      "tier": "standard",
      "coordinates": [39.0968, -120.0324],
      "dateStart": "2021-08-06",
      "dateEnd": "2021-08-07",
      "days": 2,
      "dayOfTrip": 1,
      "state": "CA/NV",
      "notes": "Vince's birthday. The trip begins.",
      "photos": ["tahoe-01.webp", "tahoe-02.webp"],
      "nationalPark": null,
      "hasEntry": false
    }
  ]
}
```

### Dependencies (CDN only)
- **Leaflet.js** — map rendering
- **Google Fonts** — typography (Inter or similar)
- Nothing else. No build step. No framework.

---

## What's Needed to Start Building

1. ✅ Spreadsheet data (received — will convert to `stops.json`)
2. ⬜ Photos — rough folders by location
3. ⬜ Pick 3–5 marquee stops to design first
4. ⬜ Confirm chapter names (or provide your own)
5. ⬜ Approximate mileage (or we estimate from driving times)

---

## Open Questions

- **Carlsbad** — was this Carlsbad Caverns NP? (would make 14 parks)
- **Ending** — how to handle the final frame after Phoenix. Options range from nothing (trip just ends) to a brief, quiet text-only coda. Decide later.
- **Chapter names** — current proposals are working titles. Your own names welcome.
- **People** — include friend names in entries, or keep it vague ("a friend in Portland")?
- **Driving stats** — do you know total mileage? Or should we estimate from the drive times in the spreadsheet?
