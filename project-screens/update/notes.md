# Notes for the write-up

Anything on the site that's out of date for this project: features that changed, new wording, things to leave out.

## Captured October 19, 2026

- Ten real 1080 × 2400 screenshots from Android 15 on the isolated `KnoPlus_Capture_API35` emulator. Built successfully from the current local `G:\Code\DateSafe` working tree (base commit `c378891`, with the owner's existing uncommitted development work). No app source was changed for this capture.
- `first-run-setup.png` is the first onboarding page. For the remaining screens, the emulator-only onboarding flag was marked complete so the walkthrough did not need personal setup or a test SMS.
- The current Plan a Date flow is Who, Where, When, How, Check-ins, Confirm. Added `plan-a-date-how.png` and `plan-a-date-check-ins.png` alongside the existing shot list. Forms are empty examples; no actual person's details, address, or plan were entered.
- `home.png` and `get-me-out.png` accurately show incomplete setup and no assigned contacts on this fresh install.
- `emergency-active.png` and `emergency-active.mp4` use the debug app's `VIEW_EMERGENCY_FIXTURE`. The visible design-preview label remains in the captures. No emergency session, recording, safety message, or call was triggered. The clip decodes successfully and is about 4.8 seconds long.
- No full device safety suite was run: this was a screenshot capture session.
- Still uncaptured: home widgets, lock-screen quick access, saved date timelines, trusted-contact examples, and the private-screen unlock. These are optional follow-up captures, not represented as complete.
- Published derivatives are WebP files under `public/revamp/apps/update/`; original PNGs remain in this screenshot inbox.

