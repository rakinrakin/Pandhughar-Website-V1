# Pandughar Group — website

Static site: `index.html`, `css/style.css`, `js/main.js`, `assets/`.
Libraries load from jsDelivr (GSAP 3.13 + ScrollTrigger, SplitText, DrawSVG; Lenis 1.1.13). No build step.

## Run locally

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:5173

## Sections

| # | Section | Owner |
|---|---------|-------|
| 1 | Hero (preloader + video) | — |
| 2 | Numbers | — |
| 3 | **Business (3D)** | teammate |
| 4 | Foundation | — |
| 5 | News | — |
| 6 | Awards | — |
| 7 | Contact | — |
| 8 | Footer | — |

## Business section — the 3D industries disc

The teammate's v3 build (`pandughar-industries.html`) is split into two files and restyled to the site:

- `assets/industries/assets.js` — the eight `.glb` models and the Draco decoder as `window.__ASSETS` (~2.6 MB)
- `assets/industries/industries.js` — three.js + the app (disc, industry card, autopilot tour, company logos) (~1.5 MB)

`main.js` → `business()` injects both only when the section comes near (lazy), and the app mounts itself into
`<div id="industries">`. The app's own card and controls are hidden; `industryCard()` in `main.js` shows the site's
card on the right (`.ind-card`: model render, name, one-line summary, logos) and draws the dotted `.leader` line.
The app exposes `document.getElementById("industries").industries.select(id | index)` and fires
`industry:select` / `industry:close` events.

Changes made to the teammate's `industries.js` (re-apply after re-extracting a new build):
- last line config: `distance:38,targetForward:6.6,targetY:0.6,elevation:20,focusDistance:32,focusTargetY:0.9,focusHorizontal:1,rotateSpeed:6.25` (smaller, centred disc)
- tour timing `rg=3600` (next industry every 3.6 s) and `ig=1200` (resume 1.2 s after a drag)
- `pointerover` handler replaced by `pointerdown` → `o=!0`: the tour pauses once you press or drag the disc and resumes when the pointer leaves
- the tour's IntersectionObserver (threshold `.35`) restarts the tour on every entry with an immediate first move (`h(0)` the first time, then `h(r+1)`)

- performance: the render loop skips frames while `stage.__paused` is true (main.js pauses it whenever the disc is off screen), the pixel ratio is capped at 1.5 and the sun's shadow map is 2048 (was 4096)
- after the industries are set up, the app stores its scene on the stage (`stage.scene3d = {s, d, f, m, p, l, u, o, n, h, Wu, Rr, xc, Sc, J, ms, c, data: tg}`, where `data` is the industry/company list used for the card's logos) and fires `industry:scene`; `businessScene()` in `main.js` uses this to restyle the platform (lower camera, soft sun, deep pearl disc with a green foot line, ring road, lawns, green glass) and to keep the SVG dome and rings attached to the disc

The card icons in `assets/industries/icons/*.webp` are renders of each 3D model; re-render them if the models change.

## Open items

- News: the three stories are placeholders from public 2026 coverage — swap in the group's own posts.
- Awards: certifications are from directory listings; confirm wording and add the 14 unnamed certificates when captioned.
- Foundation: the centre photo (`assets/foundation-school.jpg`) is the foundation's own drone shot of the Pandughar school from pandughar.com; the other photos are still free Unsplash placeholders (hotlinked from images.unsplash.com) — replace with the foundation's own photography in `assets/`.
- Contact form: layout only, not connected to a backend yet.
- Bangla: the বাংলা toggle shows a "coming soon" note.
