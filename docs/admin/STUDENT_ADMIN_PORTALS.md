# Student admin dashboard

The owner requested a student-only administration view using the teacher dashboard UI. It is implemented locally; no GitHub push or hosted deployment is part of this change.

Routes: shared `/login`, `/admin/dashboard`, `/admin/students/:studentId`. The legacy `/admin/login` URL redirects to `/login`.

The dashboard reuses `TeacherLayout` with `portal="admin"`; existing teacher routes keep their default teacher behavior. Four distinct read-only roles are supported: `zayd_super_admin`, `zayd_school_admin`, `nafs_super_admin`, `nafs_school_admin`. The backend derives school/program scope from the current database account, not client selectors or username strings.

Super admins can filter all authorized schools. School-admin school selection is locked. Both views offer username/name search, grade, class, account status, sorting and pagination. Only student records are returned. Normal Zayd admins see learning statistics and recorded enrollments; NAFS admins see assigned Simulator Tests, Quizzes and final results. Admin role changes/logout clear displayed data and cancel in-flight requests.

Admin accounts use username-only login, just like normal Zayd. Admins use the same `/login` screen as students, teachers and testers, and go directly to their dashboard without a phone-number prompt. The updated backend is required.

Production account usernames are in the backend checkout's ignored `tmp/admin-production-accounts/` directory. Those private files must not be pushed. Two super admins, 21 normal school admins and seven NAFS school admins were created in the production database. The local code still needs deployment after the owner pushes both repositories.

Local verification: `node node_modules/@playwright/test/cli.js test --config dev/admin/playwright.config.ts`. These fixtures are entirely synthetic and never call production APIs. Desktop/mobile checks cover search, school/grade filtering, locked school scope, separate program results, username-only sign-in and legacy admin-login redirection, role denial, pagination, retries and cross-account response cancellation. TypeScript and the production frontend build pass.

The shared-login correction was not tested, as requested by the owner.


The NAFS directory now displays Simulator earned/possible marks and combined percentage per student, plus a subject filter (English, Mathematics, Science). Summary cards cover all matching students across every page: completed tests, students with results, combined marks and the mean of completed test percentages. Students with no completed tests show an explicit empty score. Practice scores are not mixed with Simulator scores. Changing a subject resets pagination and Clear filters restores all subjects.

Admin sign-in navigates directly after a successful username login, including accounts without phone numbers. Authenticated admins visiting the landing page are redirected to their dashboard. Student/teacher layouts send incompatible roles through `/home` for role-based routing. Browser coverage includes these redirects and subject-filtered summary totals across pages.
