# SSB Soft website

Single-page marketing site for [ssbsoft.com](https://ssbsoft.com). Plain HTML, CSS and vanilla JavaScript — no build step.

```
index.html       page markup
404.html         "page not found" page (uses absolute /paths — serve it for missing URLs)
css/style.css    styles, light + dark theme tokens
css/print.css    print layout (a one-page company profile)
js/main.js       core behaviour: hero, nav, tabs, slider, form, theme switch
js/delight.js    micro-interactions (button light, card glow, ticks, copy email…)
js/flow.js       momentum scrolling, scroll-linked hero and logo strip, image fade-in
assets/vendor    Lenis smooth-scroll library (MIT), self-hosted
assets/fonts     self-hosted Inter, Plus Jakarta Sans and the signature font
assets/icons     isometric brand icons (also inlined in index.html)
assets/img       photos, brand logos, favicon, social share image
assets/logos     client logos
```

The hero logo is an inline SVG traced from the original SSB mark; each facet is a
`<polygon class="f">` so it can animate on its own.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Before going live

- The founder's note in the About section is draft copy — have Mali approve or rewrite it.

- The contact form opens the visitor's email app. To post to a backend instead, add `data-endpoint="https://…"` to the `<form>` in `index.html`.
- The social share tags point to `https://ssbsoft.com/assets/img/og-image.jpg`, so deploy the `assets` folder at the site root.
- Bump the `?v=` on the stylesheet and script links in `index.html` when you change them, so browsers fetch the new files.
