# Asset sources

All game assets are served locally; normal play does not request third-party CDNs.

## Cat meow

- File: `assets/meow.mp3` (original filename `cat-meow-1-fx-323465.mp3`)
- Source: `cat-ccnotify-hook` npm package **0.2.0**, published under MIT, including its `sounds/` directory.
- Package: https://www.npmjs.com/package/cat-ccnotify-hook
- Source repository: https://github.com/cat-ccnotify/cat-ccnotify-hook
- License notice preserved at `licenses/cat-ccnotify-hook-MIT.txt`.
- The downloaded package archive was checked against the npm registry's published SHA-1 before extracting assets. No package scripts were run.
- File SHA-256: `3f5c96633770a1b8f7fc0cc9382c89e59ab32b0ec58026812f11814597d3a83d`
- Used for character selection, feeding, recovery and activity results, with volume limiting and a minimum 1.8-second gap. Click sounds are synthesized in Web Audio.

## Korean pixel font

- Font: **Neo둥근모 / NeoDunggeunmo**, Eunbin Jeong (Dalgona.)
- Source: https://github.com/neodgm/neodgm-webfont (`neodgm/neodgm.woff2`)
- License: SIL Open Font License 1.1; full notice preserved at `licenses/NeoDunggeunmo-OFL.txt`.
- SHA-256 matches the upstream `neodgm/sha256sums`: `0c0ca9cd73f692a5da5d7fb39737902aa9ea312537237779972a9d81ef0a33bf`.
- This is a freely distributed Korean pixel font, not Stardew Valley's original game font. Wooden title/button styling is custom CSS.

## User-provided arcade game and music

- Source archive supplied in this conversation: `AFTERGLOW_ARCADE_LOBBY.zip`.
- Original entry: `AFTERGLOW_ARCADE/games/AFTERGLOW_HEX_FINALE.html`.
- Adapted entry: `games/hex.html`; the provided embedded MPEG audio is extracted unchanged into `assets/afterglow.mp3` and shared by the 4-key rhythm game.
- Adaptations: cat-shaped center/player, Petopia navigation, one-time rewards, mute synchronization, removal of the unrelated arcade gold balance.
- The supplied archive did not include an independent music license; these remain user-provided assets, not assets claimed to be MIT or public domain.

## Background and pixel sprites

- Cat sprites, dungeon enemies, rooms, procedural park background and arcade illustrations are drawn in code for this game.
- Default lobby illustration: `assets/lobby.png`, extracted unchanged from the user-supplied archive `행복한 마을의 동물 친구들.zip`. This is the exact provided image, not a generated imitation.
- Settings → 로비 배경 선택 optionally overrides the shared default for this browser. Resetting the background returns to the provided village image.
