# Module 2 learner runtime

The mounted Science course uses `/student/science/spark-science/unit-2`. Its unit page lists Introduction, three lessons, Unit Kahoot, Unit Quiz and Module Review. Lessons 1/2 contain Interactive Lesson and Lesson Quiz; Lesson 3 additionally contains the supplied Kahoot and one PhET card with both supplied targets. Old unit-1 bookmarks redirect or mount the matching activity.

All course/catalog content and progress come from the authenticated backend. Quizzes use the server-owned immutable attempt, controlled question fields, account/region guards, serialized/coalesced autosave and per-attempt sessionStorage recovery. Revision conflicts require an explicit choice. Saves must be confirmed before final submission. A lost submit response reads the same attempt; unknown outcomes freeze editing until checked. Server grading resumes one written response at a time and does not invent zero marks when AI is unavailable. Submitted attempts show stored marks/feedback and remain read-only.

Figures are fetched through authenticated attempt-owned image endpoints and released on unmount. The HTML player retains the private signed viewer, confines cross-file navigation and completes through the server before returning to the lesson/unit page. External activities launch the exact approved URLs in new tabs and use explicit manual completion; no external score import is claimed.

Verification: `node node_modules/@playwright/test/cli.js test --config dev/motion-unit2/playwright.config.ts`. These tests use intercepted synthetic API responses and the committed learner quiz/figure content in the sibling step-backend checkout. They cover all four quizzes on desktop/mobile, lost-submit recovery, refresh/resume, failed saves, shared course discovery, conditional external-card placement and account replacement. They do not impersonate a production student or invoke live AI.

The separate backend production verification uses the expressly approved dedicated `qa.motion.unit2.verify` account; the main `qa.full.american.g9` account remains unconsumed. Local success does not establish a hosted deployment. Production release must use compatible frontend/backend builds and retain the existing deployment configuration.

Unit 3 is supported at /student/science/spark-science/unit-3, with a second chooser card and separate progress. Lesson 1 has Interactive Lesson, three-link PhET card and Quiz; Lesson 2 adds Kahoot before its single-link PhET card; Lesson 3 has Interactive Lesson, one PhET link and Quiz. Text fields use text keyboards and preserve the existing autosave/submit/grading recovery flow. Numeric Unit 2 inputs retain decimal keyboards.

The shared synthetic fixture is fixtures.ts; unit3.spec.ts adds Unit 3 journeys. All nine browser tests passed, including each unit's four quizzes at 1440px/390px. Live backend grading on the dedicated Science QA account passed 56/56 marks across Unit 3. Hosted deployment is verified separately.
