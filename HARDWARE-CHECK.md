# Physical iPhone check — pending

No iPhone was available on 12 October 2026. No physical sensor, touch, or Safari permission-UI results have been verified. Existing iPhone WebKit tests use mocked events and do not satisfy this check.

## Setup

Use Safari on a real iPhone and an HTTPS preview containing the current local changes. Do not assume the live site contains this revision. Record the phone model, iOS version, test URL and date. Avoid insecure HTTP/LAN previews for motion testing: WebKit requires a secure context for device orientation/motion APIs and permission must be requested from a user interaction.

Sources: [WebKit secure-context restriction](https://bugs.webkit.org/show_bug.cgi?id=192595), [WebKit permission/user-interaction guidance](https://bugs.webkit.org/show_bug.cgi?id=201676).

## Shiny

| Check                                   | Expected result                                                                                                                             | Actual result |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Initial view                            | Sticker and instructions are readable; no permission request before interaction.                                                            | Pending       |
| Tap and Allow                           | Safari offers motion permission when required. The hint changes to “Motion on — tap card to recalibrate”.                                   | Pending       |
| Tilt left/right and forward/back        | Foil/tilt respond smoothly without the touch gesture suppressing sensor updates.                                                            | Pending       |
| Tap to recalibrate                      | Current holding position becomes the reference without another permission request.                                                          | Pending       |
| Rapid taps during the permission prompt | No duplicate requests or duplicated sensor listeners.                                                                                       | Pending       |
| Deny permission                         | The artwork stays usable, does not claim motion is active, and offers clear recovery guidance. Record whether retry actually prompts again. | Pending       |
| No orientation data                     | After permission succeeds, absent sensor readings produce a useful explanation rather than a false success.                                 | Pending       |
| Portrait/landscape                      | Artwork fits, page scrolling works, and recalibration produces sensible tilt in either orientation.                                         | Pending       |
| Switch apps and return                  | Hidden-page sensor handling stops; returning retains a usable artwork without duplicate listeners.                                          | Pending       |
| Enable Reduce Motion and reload         | No sensor permission request or tilt animation; the sticker remains fully visible.                                                          | Pending       |

## Touch controls

On In Bloom and Polyposter, open Adjust artwork, drag a lower slider, enter a numeric value, and use Back to artwork. Check that the live preview stays visible, touch scrolling is comfortable, the software keyboard does not trap controls, and closing preserves settings. Export a PNG and inspect it in the phone's actual download/share flow. Record any issue with tap targets or accidental slider changes while scrolling.

## Completion

Only mark this pass complete after recording physical-device results. Add screenshots/video for any failures and fix/retest the affected behaviour. The current status is pending due to unavailable hardware, not passed through emulation.
