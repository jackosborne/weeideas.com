# Screen-reader check — 12 October 2026

## Verification boundary

Native VoiceOver could not be operated: Computer Use returned “Computer Use permissions are not granted.” No spoken output was heard or verified. The pass below inspects browser accessibility trees, keyboard behaviour, accessible values and live-region markup. It does not replace testing actual VoiceOver navigation and announcements.

## Changes and browser checks

- The native Adjust artwork disclosure exposes collapsed/expanded state and hides closed controls. Mobile order is artwork first; editing exposes the live preview and excludes the off-screen source from accessibility navigation. Back to artwork closes the editor and restores focus to its summary.
- In Bloom's Speed exposes seconds per cycle; grid size exposes rows/columns and geometric controls expose pixels. Polyposter's export dimensions expose pixels and polygon count exposes sides. These use aria-valuetext, without changing visible labels or continuously announcing animation.
- Export buttons keep keyboard focus while aria-disabled indicates busy state. A capture handler prevents repeated busy actions. The polite, atomic status region reports preparation, download initiation or an error.
- Surface Design tiles expose their row, column, shape and lock state, with descriptions of the next activation. The selected tool updates those descriptions. Placement, locking, randomisation and reset provide one concise polite status message; sixteen simultaneous tile announcements are avoided.
- Shape-picker SVGs and focus markers are decorative and excluded from the accessibility tree.

## Remaining VoiceOver procedure

Once native app control is available, test in Safari with VoiceOver:

1. Navigate to Adjust artwork at a narrow viewport. Confirm collapsed state, expand it, and verify the panel becomes reachable in reading order.
2. Navigate and adjust Speed, Size and export dimensions. Confirm units/value text are spoken once per change, and numeric entry is labelled.
3. Use Surface Design's shape picker and tile buttons. Confirm coordinates, shape/state, next action and operation feedback are understandable without seeing the grid.
4. Activate PNG export from the keyboard. Confirm focus remains on the action and the download/error message is announced without navigating to the status region.
5. In mobile editing, return to the artwork. Confirm focus and reading order are restored and there is only one accessible artwork representation.

Keep the result pending until real VoiceOver output and navigation have been observed.
