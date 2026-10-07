# Science Spark Phase 6

Implemented locally on `feat/sciencespark` on 2026-10-07. **Playable acceptance remains pending an owner-provided Kahoot assignment iframe src.**

Practice now opens a large separate modal, with fullscreen, close/Escape, Reload Practice, Open on Kahoot and Complete and return to Unit 1. It saves first-opened state through the dedicated Science API. Explicit completion saves before returning to the unit; failed saves stay in the modal with Retry completion. Closing, reloading or opening the external link never completes it. Quiz remains omitted and skipped lessons remain incomplete.

`SciencePracticeViewer` uses a native dialog portal to contain focus and background interaction and restores body scrolling/focus on cleanup. The provider frame is independent of the opaque local lesson viewer. It never reads game answers, scores or messages. The backend owns the URL and preview/assignment mode; the frontend validates HTTPS/provider hosts before opening. Existing Science session ownership/cancellation also removes the modal on logout/account changes.

The supplied Light embed is a preview whose Play opens a separate Kahoot host-mode tab. A clear warning remains visible. Per [Kahoot's official guide](https://support.kahoot.com/hc/en-us/articles/360018695193-How-to-embed-or-link-a-kahoot-onto-a-web-page), the owner must provide the iframe src from an assignment report's Embed option. Verify that it actually lets a learner play inside Zayd before declaring this phase complete. The external fallback is not a substitute for that acceptance check.

Verification: production frontend build/typecheck passed; `npm run qa:science-spark:practice` passed twenty pure URL checks; `npm run qa:science-spark:transport` passed eight auth/session transport checks. Browser checks covered American/Saudi completion, failure/retry, unchanged skipped lessons, close/reload, refresh persistence, one modal after full reload, fullscreen, cross-tab logout cleanup and 390×844 mobile layout without horizontal overflow. Backend evidence records 271 production QA-only rollback checks, zero committed writes, and 56 suites / 341 tests. See backend `docs/science-spark/PHASE6.md` and its screenshots/report for detailed evidence and safe reproduction.

No push, deployment, new schema change or production pilot enablement occurred. Phase 4's deployed-image check and Phase 6 embedded play remain pending; Phase 7/8 are separate requests.
