# Sunfield Farm

A Filipino farm-life game that runs in the browser (Three.js, one `index.html`). Plant crops, raise chickens, ducks, pigs, goats, cows and tilapia, deliver to the palengke, the barangay and the city, hire trabahador, and grow from a bahay kubo to a two-storey house.

Live: https://sunfield-farm.wil-soriano-jr.workers.dev

## Files

| File | What it is |
|---|---|
| `public/index.html` | The whole game: 3D world, gameplay, UI and styles |
| `public/manifest.webmanifest` | Lets phones install it to the Home Screen (landscape, fullscreen) |
| `public/icon-*.png`, `public/apple-touch-icon.png` | App icons |
| `wrangler.jsonc` | Cloudflare Workers settings: deploys the `public` folder |

## Run it on your computer

Any static file server works, for example:

```bash
npx serve public
```

Then open the address it prints. Saves are kept in the browser's localStorage (key `sunfield-farm-v1`).

## Deploy to Cloudflare

Log in once with `npx wrangler login`, then from this folder:

```bash
npx wrangler@4 deploy
```
