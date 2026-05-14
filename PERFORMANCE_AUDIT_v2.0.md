# Performance & Cloudinary Quota Audit — v2.0

**Goal:** Cut Cloudinary bandwidth without paying for the £99/mo plan, and identify quick performance wins.

## TL;DR

- **What's good:** PWA service worker already does `CacheFirst` on Cloudinary with a 30-day TTL ([`vite.config.ts:66`](vite.config.ts#L66-L80)). Returning users with the SW installed don't hit Cloudinary at all.
- **What burned quota:** Ralph-loop runs, Playwright sessions, dev cache clears, and first-visit users — every one of those re-downloads the **full-resolution originals** because the Cloudinary URLs in the codebase have **no transformation parameters**. Image previews come back as multi-MB PNGs when 60–120 KB thumbnails would do.
- **Biggest wins:** add `f_auto,q_auto,w_<size>` to every Cloudinary URL; switch the intro video `preload="auto"` to `preload="metadata"`; consider self-hosting the 12 preview thumbnails.

---

## Where Cloudinary is used

| Location | What it loads | Size driver |
|---|---|---|
| [`src/components/ui/IntroOverlay.tsx`](src/components/ui/IntroOverlay.tsx#L8-L9) | 1× intro logo MP4 | Full video preloads on every cold visit |
| [`src/data/gameRegistry.ts`](src/data/gameRegistry.ts) | 9× game preview PNGs | Full-resolution originals, no `w_` / `f_auto` / `q_auto` |
| [`src/components/GamePortal.tsx`](src/components/GamePortal.tsx) | idle-prefetches all preview images | Burns bandwidth even for previews the user never clicks |

## Quick wins (ranked by quota saved per effort)

### 1. Add Cloudinary transformations to every URL — *biggest single win*

Every URL currently looks like:

```
https://res.cloudinary.com/depqttzlt/image/upload/v1776588235/Tom_the_most_epic_logo..._db4csn.png
```

Insert `f_auto,q_auto,w_640/` between `/upload/` and the version:

```
https://res.cloudinary.com/depqttzlt/image/upload/f_auto,q_auto,w_640/v1776588235/Tom_the_most_epic_logo..._db4csn.png
```

- `f_auto` — Cloudinary serves WebP / AVIF to browsers that support it (typically **60–80% smaller** than PNG).
- `q_auto` — automatic quality optimisation, near-imperceptible at default settings.
- `w_640` — resize to ~640 px wide (game cards aren't displayed larger). Pick the size that matches your card width; can also use `w_auto,dpr_auto` with responsive markup.

**Expected impact:** preview images go from ~1–3 MB each to ~80–200 KB. With 9 previews idle-prefetched per first visit, that's saving ~10–25 MB per first visit. Multiplied across Ralph-loop test runs, that's the quota.

**Files to edit:** [`src/data/gameRegistry.ts`](src/data/gameRegistry.ts) (9 URLs).

### 2. Intro video — `preload="metadata"` instead of `preload="auto"`

[`IntroOverlay.tsx:46`](src/components/ui/IntroOverlay.tsx#L46) currently has `preload="auto"`, which downloads the entire video before the user even decides to enter. Many users hit "TAKE THE RED PILL" before the video has even rendered visually.

Change to `preload="metadata"` (just enough to know dimensions/duration). Playback still starts when `autoPlay` fires — there's a brief buffering moment that nobody will notice because the buttons are already interactive.

Also add a transformation to the video URL:
```
.../video/upload/f_auto,q_auto/v1776588213/Tom_Minimalist_3D_logo...mp4
```

**Expected impact:** intro video is currently 5–15 MB depending on source. `f_auto,q_auto` typically cuts ~50%. Combined with `preload="metadata"`, users who click immediately download almost nothing.

### 3. Lazy-prefetch only the *next* preview, not all 12

[`GamePortal.tsx`](src/components/GamePortal.tsx) idle-prefetches every preview to avoid a flash on arrow-key navigation. Reasonable, but with optimised URLs (win #1) the flash window shrinks. Consider prefetching only **±2 games either side of the current selection** — covers the common arrow-key case without warming the cache for the 6+ games the user may never reach.

Lower priority than #1 — do this only if quota is still a concern after the URL transformations land.

### 4. Self-host the preview thumbnails

If quota is still tight, the 9 preview images aren't really CDN-worthy — they're small static assets. Moving them to `public/assets/previews/` (with appropriate naming) routes the bandwidth through Vercel instead of Cloudinary. Vercel's free tier is generous.

Cost: ~1–2 MB of static assets added to the repo if you keep WebP, ~10 MB if PNG. The repo is already 129 MB so it's not a meaningful bump. Trade-off: you give up Cloudinary's responsive `w_auto,dpr_auto` magic, so pre-export at 2–3 sizes (`-640.webp`, `-1280.webp`) and use `srcset`.

Only worth doing if you intend to keep Cloudinary at zero spend long-term.

---

## Local asset / repo hygiene

These don't affect Cloudinary but matter for perf:

- **`public/assets/audio/music/thelastmystery.wav` — 44 MB.** Re-encode to MP3 / OGG; will save ~40 MB per first visit. See [`futurepr13plan.md`](futurepr13plan.md) note from PR #12 review.
- **`public` is 129 MB total, 299 binary files.** The audio CacheFirst rule in `vite.config.ts:82` covers most of this for return visits, but first-visit cost is real. Consider audio-on-demand: only load the track when its game scene mounts, not on app boot.

## Lighthouse / Core Web Vitals — recommended next step

Run a Lighthouse audit on the deployed Vercel site (incognito to get cold-cache numbers):

```
npx lighthouse https://thematrixarcade.com --view --preset=desktop
```

Look at LCP and Total Blocking Time. The `chrome-devtools-mcp:debug-optimize-lcp` skill can walk through the trace if needed.

---

## Suggested order

1. **Today, 5 min:** Add `f_auto,q_auto,w_640/` to all 9 image URLs + `f_auto,q_auto/` to the video URL in `gameRegistry.ts` + `IntroOverlay.tsx`. Commit. This alone should fix the quota.
2. **Today, 1 min:** Flip `preload="auto"` → `preload="metadata"` on the intro video.
3. **Optional:** Run Lighthouse and decide if further work is needed.
4. **Later:** Re-encode the 44 MB WAV. Consider lazy audio loading.

That's it. Should give you the site back without paying.
