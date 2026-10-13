# Release check — 12 October 2026

The release-readiness pass covers Chrome, Firefox and Playwright WebKit, plus iPhone 13 WebKit emulation. The final combined suite passed all 61 checks. The final gallery/Untitled fixes and export comparisons were rechecked across all three desktop engines. Production parsing/content checks, five unit tests, formatting and git whitespace checks also pass.

## Exports

In Bloom and Polyposter were compared with the on-screen canvas at matching pixel dimensions in each desktop browser. Export alpha is checked separately, and the white-background visual comparison allows at most one channel step for browser PNG rounding. In Bloom retains transparent output; its white paper background is CSS. Polyposter retains opaque white output. Both PNGs were also inspected visually.

## iPhone emulation

Touch layouts, permission granted/denied/retry, sensor-event handling, recalibration and reduced-motion behaviour pass with mocked orientation events. This is not physical-device or Safari-permission-UI verification. The user selected emulation for this pass; real hardware remains a future follow-up.

## Diff review fixes

- Shiny separates touch from mouse pointer activity and avoids concurrent permission requests.
- Untitled maps pointer coordinates through its actual displayed canvas dimensions.
- Download links are briefly attached to the document for consistent browser behaviour.
- Gallery titles, teasers and CSS attribute values are escaped; dead card markup was removed.
- Surface Design's thumbnail front matter no longer contains a stray block-scalar marker.
- CI installs and runs Chromium, Firefox and WebKit, including iPhone emulation.
- The grouped desktop layout, mobile disclosure/live preview, file-based gallery previews, value units, focus retention and tile feedback are covered by the final combined suite.

Existing upstream build-tool dependency advisories remain documented in CONTRIBUTING.md. This verification checkpoint does not deploy the site. Actual VoiceOver testing remains pending native-control permission; physical iPhone testing remains pending available hardware.
