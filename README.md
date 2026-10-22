# INNOVANTA

Static site for the INNOVANTA student-led innovation ecosystem. No build step — open `index.html` in a browser or host the folder as-is.

## Pages
| File | What it is |
|---|---|
| `index.html` | Home |
| `events.html` | Events — scroll-pinned reel (default) or normal grid via the Reel / Normal switch |
| `event-<name>.html` | One detail page per event (8 of them) |
| `gallery.html` | Event photo gallery |

## Assets
```
assets/
  css/base.css      fonts + shared base (every page)
  css/<page>.css    page styles (event.css is shared by all event-*.html)
  js/site.js        shared behaviour (nav, loader, reveals, toasts, cursor, filters)
  js/events.js      events reel + view switch
  js/gallery.js     gallery cards + lightbox
  fonts/            Space Grotesk, Inter (woff2)
  img/              logo files
```

## Adding gallery photos
In `gallery.html`, set `data-src="path/to/photo.jpg"` on a card's `.g-art` element; the gradient placeholder is replaced by the image.
