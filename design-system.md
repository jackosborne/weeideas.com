# Wee Ideas design system

A quiet interface around independent, playful artwork. Shared code owns the site structure, control surfaces, sizing and accessibility baseline. Each experiment owns its drawing, palette and behaviour. Keep Eleventy, native HTML and vanilla JavaScript.

## Page structure

`src/_includes/base.html` owns the document, metadata, header/footer and asset loading. `home.html` wraps the gallery; `post.html` assembles breadcrumbs, the artboard and project information. Reusable markup lives in `src/_includes/components/`.

The **artboard** is the grey presentation area containing artwork and controls. The **artwork frame** is the boundary that determines the piece's size and aspect ratio. Instructions and below-artwork controls sit outside that frame in `.artwork-stack`.

## Foundations

`src/_/css/tokens.css` owns site colours, typography, spacing and artwork sizes. Colours use `--bg`, `--emph`, `--text` and `--muted`, with system light/dark modes. Muted text is dark enough for small instructions on the grey artboard. Spacing tokens are 8, 12, 20, 32 and 60px. Maximum site width is 1440px.

`style.css` provides base, gallery and page styles and imports `tokens.css`, `artboard.css` and `buttons.css`. `controls.css` adds the Dialkit surface only on projects with `controls: true`. Optional `panel.css` provides native form fields and sliders; its buttons use the shared button definitions.

Project CSS uses `@scope ([data-project="slug"])`. Declare project variables on `:scope`, which targets the artboard root. Do not use global `:root` or overwrite shared UI tokens to change an artwork's palette. Use local artwork tokens instead.

## Artwork sizes and layouts

Artwork frames share a 4px corner radius through `--artwork-radius` in `tokens.css`. The shared `.artwork-frame` clips its contents to that radius, keeping canvas and other full-frame artwork consistent. This is a presentation treatment; exported artwork retains its original rectangular bounds.

Artwork frames use white (`#fff`) as the default paper background in both light and dark appearance. The surrounding artboard retains its shared grey surface. A different paper colour should be a deliberate part of the artwork rather than an incidental project default. Match canvas fills, frame CSS and gallery previews.

For typography and geometric studies, leave a generous internal margin: roughly 12–16% of the frame on each side is a useful starting point. Scale the drawing and type together as the margin changes, and check rotated forms and mobile layouts for crowding or clipping. Practice uses 12%; Untitled 1972 and Systematic Surface Design use approximately 16%.

Set these fields in project front matter:

```yaml
artworkSize: medium
artworkRatio: square
```

| Setting  | Maximum width | Aspect ratio        |
| -------- | ------------- | ------------------- |
| Small    | 320px         | Selected separately |
| Medium   | 560px         | Selected separately |
| Large    | 640px         | Selected separately |
| Square   | —             | 1:1                 |
| Portrait | —             | 8:11                |

All frames shrink proportionally when space is limited. Large portrait reaches 640 × 880px. Frame dimensions describe the presentation boundary, not export resolution.

In Bloom, Surface Design, Untitled 1972, Raspberry Ripple and Shiny use medium square frames. Shiny keeps its sticker proportions inside the boundary. Polyposter uses large portrait.

Artwork-only pieces use `.artwork-frame`, optionally inside `.artwork-stack`. The shared `.artwork-stack` centres itself with `justify-self: center` and automatic inline margins. Keep capped-width artwork wrappers centred in both desktop grids and stacked responsive layouts; centring the inner frame alone does not centre its wrapper. Check intermediate widths where the container is wider than the artwork’s maximum width. Pieces with a left control panel use `.shell`, containing the controls and a frame or stage. The shell stacks at 900px and below. Shared Dialkit controls move after the artwork in DOM order and appear inside a native “Adjust artwork” disclosure, collapsed initially on mobile. Desktop shells centre the complete panel/artwork group, with a 320px controls rail and 48px gap by default. The group is capped at the combined rail, gap and artwork widths, so unused column space cannot separate the controls from the artwork. `--artboard-panel-width` and `--artboard-gap` customise these defaults. Artwork and controls align at the top on desktop. In Bloom and Polyposter are the reference layouts.

## Dialkit controls

Dialkit is the visitor-facing panel on In Bloom and Polyposter. Surface Design retains its independent native shape picker. New projects include a working Dialkit panel.

1. Set `controls: true` in front matter. The base template loads vendor and shared control styles before project CSS.
2. Include `{% include "components/controls.html" %}` where the panel belongs, usually as the first child of `.shell`. Use one panel per page.
3. Import `createProjectControls` and subscribe to its values:

```js
import { createProjectControls } from '/_/js/lib/controls.js';

const kit = createProjectControls(
  'Artwork',
  {
    size: [50, 10, 100, 1],
    reset: { type: 'action', label: 'Reset' },
  },
  {
    onAction: (action) => {
      if (action === 'reset') kit.resetValues();
    },
  },
);
kit.subscribe((values) => render(values.size));
```

Nested objects create groups, select configs provide options, booleans become toggles, and action configs provide buttons. Sliders support dragging, keyboard adjustment and numeric entry. `kit.setValues()` updates dependent values together; avoid feedback loops when normalising them.

Reset restores the selected artwork preset, or initial values for a piece without presets. Randomise updates both settings and displayed values. Announce export progress/errors through `#project-status` and use `kit.setActionBusy(actionPath, true/false)` during asynchronous work.

The adapter provides inline mode, system theme, production visibility and page-exit cleanup. Its responsive disclosure preserves the mounted panel and settings, remembers the mobile open state across viewport changes, and stays open with its summary hidden on desktop. Versions/Copy is hidden by default; `{ versions: true }` opts in. Action identity comes from registered paths, so labels can change or repeat. `controls-bridge.js` isolates Dialkit's render-order/class contract and fixes its static inline heading semantics. Tests exercise that contract before library updates.

Dialkit and PIXI are pinned dependencies. `scripts/prepare-vendor.mjs` copies browser files and licenses into ignored `src/_/vendor/` before builds. Assets are served locally; do not edit generated vendor files.

## Buttons

Dialkit is the reference for secondary buttons: translucent fills, softer text, no resting border, 8px corners, 10px/16px padding and medium-weight 13px type. `buttons.css` shares this through `.action-button` and legacy `.btn`, with matching light/dark tokens. Their hover, active, focus and disabled treatments are shared.

Primary actions use a solid contrasting fill. Native markup adds `.action-button--primary`; Dialkit passes `primaryAction: 'actionPath'` to the helper. Nested actions use dotted paths. In Bloom's Export PNG, Polyposter's Download PNG and Surface Design's Randomise are primary. Reset and other actions remain secondary.

Layout decides width: Dialkit actions fill their panel; native action rows can remain side by side. Homepage pills share the secondary palette while retaining compact geometry and selected states. Shape-picker buttons retain their specialised square layout.

## Artwork notes

Use `<p class="artwork-note">…</p>` beneath a frame, or after its below-artwork controls, inside `.artwork-stack`. Notes share a 16px gap, centred 13px type, 1.5 line height, regular weight, muted colour and 52-character maximum line width. `strong`/`b` uses weight 600.

Surface Design and Untitled use this for instructions. Shiny's `.motion-hint` shares the style while controlling its own visibility and live announcements. Keep notes outside the frame, and avoid local typography/spacing overrides.

## Motion, resizing and lifecycle

Use `createArtworkLifecycle()` from `/_/js/lib/lifecycle.js` to own event listeners, ResizeObservers, animation frames, timeouts and cleanup callbacks. Its AbortSignal ends work when the page exits; back-forward cached pages retain their state.

Use `animate(draw, target, { signal: lifecycle.signal })` for canvas loops. It pauses in hidden tabs, draws once for reduced motion and redraws on interaction. Observe the artwork frame for size changes; retain window resize handling when device pixel ratio matters. PIXI uses its own ticker with the same visibility/preference/lifecycle policy. Shiny's pointer and sensor paths ignore hidden pages and reduced motion.

## Accessibility

Use native controls and visible focus. Every input needs an accessible label. Canvas needs a description or fallback; interactive canvas also needs keyboard alternatives. Untitled supports arrow-key interaction and ignores B/I shortcuts while typing. Surface Design's SVG uses a group role with labelled, focusable tile buttons. Do not put interactive descendants under an image role.

Respect reduced motion, do not announce animation frames, and use a polite status region for asynchronous actions. Automated tests cover core interaction and serious/critical accessibility findings; they are not a full accessibility certification or a device-sensor test.

## Content and new projects

Published projects need a title, unique permalink, real YYYY-MM-DD date, teaser, description, thumbnail `bg`, and supported facet tags: childhood, generative, interactive, motion, study. `draft` and `controls` are booleans; `css`/`js` are lists of local asset paths. Trusted editorial descriptions may contain HTML; titles and metadata summaries are escaped.

`draft: true` is visible in development but excluded from production. Relative assets resolve beneath the project URL; root-relative assets remain global. Preserve published URLs.

Set `hideFromHomepage: true` to omit a project from the gallery in development and production while retaining its direct page (subject to draft exclusion).

Run `npm run new -- project-slug "Project title"`. The starter includes a draft, medium square frame, Dialkit controls and canvas. Replace the drawing and editorial copy, then set `draft: false` and run checks. See CONTRIBUTING.md for commands and verification.

Use `interactive` when visitor interaction is central to the piece, rather than simply because it offers settings. Practice, Systematic Surface Design and Polyposter use this tag.

## Gallery preview assets

For SVG-backed previews, keep an editable `preview.svg` in the project folder and set `preview: preview.svg` in front matter. The gallery resolves it beneath the project's URL and applies it as the tile background image. Keep the small `bg` field for presentation settings such as background colour, size, repeat and position. Gradient-only previews can continue using `bg` without a preview asset.

Systematic Surface Design uses a centred three-shape SVG; Untitled 1972 repeats its single-dash SVG on a 20 × 21px grid. The build validates referenced preview files, and browser checks verify that the SVGs load and contain the expected artwork. Avoid SVG data URLs in front matter.

## Mobile tweaking

When shared controls open on mobile, canvas-based pieces switch to a compact editing view. A sticky live preview sits above the panel with a “Back to artwork” action. The original canvas remains at its full dimensions off-screen so drawing and PNG export resolution are preserved. The preview has the artwork's aspect ratio, is capped at 200px wide and 30% of viewport height, and has an opaque backing so controls cannot show through it. Closing restores the full-size artwork and keeps settings.

Preview copying stops on hidden pages and uses a single update per interaction for reduced motion. The helper applies to canvas-backed projects automatically; other renderers keep the ordinary disclosure until they have a suitable preview adapter. The preview is descriptive rather than a duplicate interactive artwork.

## Screen-reader values and feedback

Pass `valueText: { 'control.path': value => 'meaningful value and units' }` to the shared controls helper for slider units or quantities that need context. Dialkit's displayed number remains unchanged; its aria-valuetext uses this formatter. The bridge maps registered slider paths rather than labels and reapplies formatting on updates.

Busy action buttons use aria-disabled and a guarded click handler so focus stays in place. Pair this with the polite, atomic project status region. Surface Design has a separate hidden status region for concise tile/action feedback. Do not attach live announcements to every animation frame or to all sixteen tiles at once. See SCREEN-READER-CHECK.md for the current verification boundary and pending VoiceOver checks.
