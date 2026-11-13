# English / Tagalog language setting

How it works:
- `public/i18n.js` (loaded before `startup.js`) holds the engine and the table. Every text on the page (text, `title`, `aria-label`,
  `placeholder`) is swapped as it appears, so game code keeps writing its one source wording. Table lines at the end:
  `"source text":{"en":"clean English, only if different","tl":"Tagalog"}`. `{0}`, `{1}`… stand for numbers and names filled in by the game.
- Lookup also works without emojis (the game swaps emojis for drawn icons), for icon-split pieces of a line, from Tagalog back to
  English, and for lines joined with ` · `. Mark an element `translate="no"` to leave it alone.
- Canvas text goes through `SFI18N.t()` (status boards in `drawLabel`, NPC bubbles, kubo chatter).
- Settings has English / Tagalog buttons (`#langEn`, `#langTl`). The choice is in localStorage (`sunfield-lang`) and in the farm save
  (`S.lang`), so it follows the account.
- Crop, item, building, people, vehicle and dish names stay the same in both languages. Shop signs painted in the 3D world are not translated.
- `scripts/check-i18n.cjs` checks every entry keeps its placeholders and that switching works both ways.

Finding missing text: open `/?debug`, switch to Tagalog, open panels, then run `[...SFI18N.miss]` in the console. Add lines for real misses.

Still to do (as of Nov 14, 2026):
1. Play through in Tagalog again and add the remaining misses; check English mode the same way.
2. Show both directions in the browser, then deploy (`npx -y wrangler@4 deploy`). Not deployed yet.
