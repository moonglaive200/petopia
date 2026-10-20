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

- Rooms, the procedural fallback park and arcade illustrations are drawn in code. Current character/enemy images are documented in the v3 section below.
- Default lobby illustration: `assets/lobby.png`, extracted unchanged from the user-supplied archive `행복한 마을의 동물 친구들.zip`. This is the exact provided image, not a generated imitation.
- Settings → 로비 배경 선택 optionally overrides the shared default for this browser. Resetting the background returns to the provided village image.

## v3 character and monster art

- `assets/chunbae-base-preview.png`: approved Chunbae base design generated from the user's supplied cat photograph. The personal source photograph is not distributed in this repository.
- `assets/chunbae-emotions.png`: generated five-pose Chunbae sheet (default, sleeping, happy, surprised, sad), based on the approved design.
- `assets/romance-cats-preview.png` and `assets/romance-cats-emotions-preview.png`: generated cheese tabby, tuxedo and white companion designs, and their 5-expression sheet.
- `assets/monsters.png`: newly generated 12-enemy atlas for survival combat. No assets from the inspected external game repository were copied or distributed.
- Gameplay/Live/intro movement is animated in Canvas/CSS, with hit flashes, particles and transforms layered over these images.
- Camera shutter, impact, defeat and victory sounds are synthesized locally with Web Audio; the original licensed meow and supplied arcade music are retained.

- v0.4의 증강 SVG 아이콘, Canvas 아이템·무기 이펙트, 골목 배경 및 비 효과는 이 저장소의 코드로 직접 그립니다. 추가 외부 이미지·음원은 사용하지 않습니다.

## v0.5 movement and audio

- `assets/chunbae-walk.png`: generated specifically for this game using the already approved Chunbae character as reference. A transparent 4×4 sheet: down/left/right/up rows with four walk frames each. Original generated output retained outside the repository.
- `assets/shutter.mp3`: user-provided `998DE13C5FCA000E04.mp3`, copied unchanged (0.366 seconds); used for Petstar posting. This is a user-supplied asset, not claimed to be MIT.
- Four cat-voice renderings: happy/surprised/complaining use playback-rate and timing variations of the existing MIT cat clip; purring is synthesized. These are not four additional field recordings. No new external cat audio was added.
- Weapon, footstep, pickup, dodge, warning and ambient battle sounds are synthesized locally through one reusable Web Audio context. Muting stops the shutter, cat voices and context together; rate limiting prevents repeated hit/voice spam.
- Petstar celebrity names are fictional offline like events; they do not represent real interactions or endorsements.

## v0.6 user-supplied audio and sprite framing

The following files are copied unchanged from this conversation's uploads, and are user-supplied assets (no external license claim):

| Local asset                  | Uploaded name                 | Use                                           |
| ---------------------------- | ----------------------------- | --------------------------------------------- |
| `assets/rain.mp3`            | 비.mp3                        | Rainy forest intro loop                       |
| `assets/demon.mp3`           | 마왕소리.mp3                  | First demon appearance                        |
| `assets/memory.mp3`          | 기억잃는소리.mp3              | Memory-erasing curse                          |
| `assets/flight.mp3`          | 날아가는소리.mp3              | Cats scattered by final strike                |
| `assets/enhance-success.mp3` | 강화성공.mp3                  | Successful enhancement only                   |
| `assets/enhance-break.mp3`   | 강화파괴.mp3                  | Gear destruction only                         |
| `assets/stage-one.mp3`       | 1스테이지.mp3                 | Survival stage-one background music           |
| `assets/weapon-swing.mp3`    | 냥서바이벌 기본휘두루기.mp3   | Basic claw attack                             |
| `assets/purchase.mp3`        | 동전소리*구매하다*팔다\_1.mp3 | Successful paid purchases and stock/coin buys |

Other weapon effects remain synthesized, with their gain increased independently of UI/other effects. Native audio loops stop on scene cleanup and respect mute; stage music pauses during pause/upgrade selection. Default attack samples have bounded overlap. Per-direction atlas bounds fix uneven artwork spacing without editing the original image. Only the cheese row of the existing companion art is used. Slot crown jackpot and treat icons are locally authored inline SVG.

- `assets/enhance-charge.mp3`: user-supplied `강화소리 2번.mp3`, copied unchanged (1.069 seconds). Plays before revealing an enhancement result; the success/destruction sound follows its ended event. Muted or blocked playback uses a matching-duration fallback.
