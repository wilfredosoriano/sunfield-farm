# Cloudflare accounts and saves

Sunfield uses a Cloudflare Worker, D1 database `sunfield-farm-db`, and the existing static assets. Firebase is not needed.

## Enable Google sign-in

1. Open https://console.cloud.google.com/ and create/select a project.
2. In Google Auth Platform, configure Branding, Audience and Data Access. Use basic OpenID/profile access only. While in Testing, add your Google account as a test user.
3. Create a **Web application** OAuth client in Clients.
4. Add this exact **Authorized redirect URI**:
   `https://sunfield-farm.wil-soriano-jr.workers.dev/auth/callback`
5. From this repository run the following commands. Paste each value into Wrangler's hidden interactive prompt, not into chat, source code, or a shell command argument:
   ```sh
   npx wrangler@4 secret put GOOGLE_CLIENT_ID
   npx wrangler@4 secret put GOOGLE_CLIENT_SECRET
   ```
6. Reload the website. Continue with Google becomes available automatically. Test signing in, importing a guest farm, reloading, and using a second device. Before opening access to everyone, configure Google's production audience and any requirements shown in its console.

Google documentation: https://developers.google.com/identity/protocols/oauth2/web-server
Cloudflare asset routing: https://developers.cloudflare.com/workers/static-assets/binding/

## Save behavior

- Guest save stays at `sunfield-farm-v1` in localStorage. Each account has its own local key, `sunfield-farm-v1-account-<id>`, plus a `-sync` record of the cloud revision it came from and a fingerprint of the last copy sent.
- The copy to play is chosen **before** the game starts, and only asked about when it is genuinely unclear:
  - this device's copy is the cloud's (maybe with newer play) → it is used, and uploaded if it has unsynced play;
  - another device moved the cloud ahead and nothing here is unsynced → the cloud copy is used automatically;
  - both have progress the other lacks → the player chooses, with level, coins, planted plots and "last played" for each, and the newer one marked.
  The farmer's hunger/energy and the save timestamp are ignored when comparing, since they drift on their own.
- Whichever copy replaces this device's account copy, the old one is kept as `<key>-backup`. Importing a guest farm copies it; the guest original is never removed.
- Cloud writes are batched (8 s after a change, retried every 30 s and when back online) and sent once more when the app is hidden or closed (`keepalive`). Local saving continues normally.
- Revision checks reject stale writes (HTTP 409); the game shows this in Settings and the next launch resolves it as above. D1 also retains the five previous revisions per user in `save_backups`.
- Sessions last 30 days and are renewed to a fresh 30 days whenever they are used with under 15 days left. If a session does run out, the welcome screen says "Welcome back" and offers the account's farm on this device offline; it syncs after signing in again.
- Saves are accepted with negative coins (unpaid bills can cause them), so such farms keep syncing.
- Sign-out revokes the session. Sessions use secure HttpOnly cookies and hashed tokens in D1; Google tokens are not stored. OAuth uses a one-time state, a browser-bound cookie and PKCE. Only same-origin writes are accepted; user IDs come from the session, never the save request.
- The account, sync status, "Sync now" and "Sign out" are in the game's Settings menu.
- This is client-authored single-player progress, not an anti-cheat or authoritative multiplayer economy.

## Development and deployment

```sh
npx wrangler@4 d1 migrations apply sunfield-farm-db --local
npx wrangler@4 dev
npx wrangler@4 d1 migrations apply sunfield-farm-db --remote
npx wrangler@4 deploy
```

Static-only previews cannot provide authentication; the welcome screen still allows guest play. Keep Google secrets out of source control. To change the production domain, also update the Google redirect URI.
