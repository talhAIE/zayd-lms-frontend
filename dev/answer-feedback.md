# Answer feedback

Correct graded answers use the supplied Mini Components template's 0.5-second green pop/glow and 15 emerald/blue/gold dots falling, shrinking and fading over one second. Wrong answers turn red and shake for 0.35 seconds. Transient particles are removed after 1.2 seconds. Reduced-motion CSS preserves result colors and suppresses movement/particles.

Shared controls cover MCQs, True/False, individually graded blanks/dropdowns, the overall matching result, and Reading/Listening quiz options, including avatar pages. Matching receives an overall server result, so it does not invent per-pair correctness. Writing/review/teaching completion does not trigger correctness animation. Saved results, ordinary rerenders and answer reveal do not replay celebrations; a new submission/check can animate again.

Listening now uses the existing `check_mcq_answer` server action before Next/Submit. Deploy the paired backend change with this frontend. That action accepts active Reading/Listening quizzes only, checks owned questions, returns no answer keys and does not complete the session. Final submission still determines completion.

Local verification on 29 October 2026:

- Backend: 70 suites / 573 tests passed, including Listening stage/ownership adapter coverage.
- Backend and frontend application TypeScript passed; Vite production build passed with existing PDF/bundle/browser-data warnings.
- `node dev/answer-feedback-check.cjs`, `node dev/mcq-feedback-check.cjs`, `node dev/grammar-completeness-check.cjs`, `node dev/writing-review-check.cjs`, and `node dev/avatar-listening-check.cjs` passed.
- Browser verified real controls with synthetic local fixtures: MCQ/True-False success and failure, blank/dropdown success, matching success/failure and saved-answer animation suppression. No real learner/account/provider/database calls.
- The standalone Playwright Listening replay script could not start because Playwright is not installed in this checkout's module resolution. Existing audio/transport checks and backend avatar Listening tests passed; live deployed media/provider behavior is outside this change's verification.

Run Vite and open `/answer-feedback-harness.html` on localhost for the local-only preview. The fixture is not a production build entry point and does not set authentication state.
