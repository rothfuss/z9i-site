# z9i-site

The Z9 Innovation web page at https://z9i.com: a business card that is also a playable missile-defense game.

It is a static site served by GitHub Pages from the `main` branch. There is no build step.

## Files

| File | What it is |
|---|---|
| `index.html` | Page markup and styles, the theme menu, and the footer with the company line and email |
| `js/game.js` | The game engine: rules, input, sound, HUD and drawing loop. The list of themes is at the top |
| `js/core.js` | Shared helpers: screen geometry, drawing, clouds, birds, particles |
| `js/themes/*.js` | One file per theme. All artwork lives here |
| `logo.png` | The Z9 mark (transparent background; tinted per theme) |
| `preview.png` | The image shown when the link is shared |
| `CNAME` | Tells GitHub Pages the site is served at z9i.com |

## Common changes

- **Company line or email:** edit the `<footer>` in `index.html`.
- **Default theme:** in `js/game.js`, change `let start = 'daybreak';` near the bottom.
- **Link straight to a theme:** add `?theme=` and one of `daybreak`, `laramie`, `monument`, `steam`, `water`, `atlantis`, `orbit`.
- **Add a theme:** copy a file in `js/themes/`, then add an entry to the `THEMES` list at the top of `js/game.js`.

## Running it locally

The page uses JavaScript modules, so open it through a local web server rather than as a file:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
