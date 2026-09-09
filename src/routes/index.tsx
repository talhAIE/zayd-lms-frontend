import { Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";

// Layouts
import { StudentLayout } from "@/components/layouts/student-layout";
import { TeacherLayout } from "@/components/layouts/teacher-layout";

// Public Pages
// import Main from "@/pages/public/Main";
import MainChinese from "@/pages/public/chinese/Main";
import ContactUs from "@/pages/public/contact-us";
import ChineseContactUs from "@/pages/public/chinese/ChineseContactUs";

// Student Pages
import StudentCourses from "@/pages/student/courses";
import CourseUnits from "@/pages/student/course-units";
import UnitLessons from "@/pages/student/unit-lessons";
import UnitOverview from "@/pages/student/unit-overview";
import Lesson from "@/pages/student/lesson";
import ComponentModePlay from "@/pages/student/ComponentModePlay";
import DirectActivityPlay from "@/pages/student/DirectActivityPlay";
import StudentDashboard from "@/pages/student/dashboard";
import DebateModeTopics from "@/pages/student/topics/DebateModeTopics";
import ReadingModeTopics from "@/pages/student/topics/ReadingModeTopics";
import RolePlayModeTopics from "@/pages/student/topics/RolePlayModeTopics";
import ListeningModeTopics from "@/pages/student/topics/ListeningModeTopics";
import Chat from "@/pages/student/ChatPage";

// Teacher Pages
import TeacherDashboard from "@/pages/teacher/dashboard";
import StudentProfile from "@/pages/teacher/student-profile";

// Auth Pages
// import { AuthLayout } from "@/components/layouts/auth-layout";
import LoginPage from "@/pages/auth/login";
import Leaderboard from "@/pages/student/Leaderboard";

import Rewards from "@/pages/student/Rewards";
import Support from "@/pages/student/support";

const AppRoutes = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const HomeRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return (
      <Navigate
        to={
          String(user?.role).toLowerCase() === "teacher"
            ? "/teacher/dashboard"
            : "/student/dashboard"
        }
        replace
      />
    );
  };

  // Protected route component for students
  const StudentRoute = ({ children }: { children: JSX.Element }) => {
    // if (!isAuthenticated) {
    //   return <Navigate to="/login" replace />;
    // }

    // if (user?.role !== 'student') {
    //   return <Navigate to="/" replace />;
    // }

    return children;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/chinese" element={<MainChinese />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/chinese/contact-us" element={<ChineseContactUs />} />
      <Route
        path="/teacher/dashboard"
        element={
          <TeacherLayout>
            <TeacherDashboard />
          </TeacherLayout>
        }
      />
      <Route
        path="/teacher/student-profile/:studentId"
        element={
          <TeacherLayout>
            <StudentProfile />
          </TeacherLayout>
        }
      />
      <Route
        path="/login"
        element={
          // <AuthLayout>
          <LoginPage />
          // </AuthLayout>
        }
      />
      {/* <Route
        path="/signup"
        element={
          <AuthLayout>
            <SignupPage />
          </AuthLayout>
        }
      /> */}

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <StudentRoute>
            <StudentLayout>
              <StudentDashboard />
            </StudentLayout>
          </StudentRoute>
        }
      />

      <Route
        path="/student/achievements"
        element={
          <StudentRoute>
            <StudentLayout>
              <Rewards />
            </StudentLayout>
          </StudentRoute>
        }
      />

      <Route
        path="/student/courses"
        element={
          <StudentRoute>
            <StudentLayout>
              <StudentCourses />
            </StudentLayout>
          </StudentRoute>
        }
      />
      <Route
        path="/student/courses/:courseId"
        element={
          <StudentRoute>
            <StudentLayout>
              <CourseUnits />
            </StudentLayout>
          </StudentRoute>
        }
      />
      <Route
        path="/student/courses/:courseId/units/:unitId"
        element={
          <StudentRoute>
            <StudentLayout>
              <UnitLessons />
            </StudentLayout>
          </StudentRoute>
        }
      />
      <Route
        path="/student/courses/:courseId/units/:unitId/overview"
        element={
          <StudentRoute>
            <StudentLayout>
              <UnitOverview />
            </StudentLayout>
          </StudentRoute>
        }
      />
      <Route
        path="/student/courses/:courseId/units/:unitId/lessons/:lessonId"
        element={
          <StudentRoute>
            <StudentLayout>
              <Lesson />
            </StudentLayout>
          </StudentRoute>
        }
      />
      <Route
        path="/student/courses/:courseId/units/:unitId/lessons/:lessonId/modes/:modeId/direct"
        element={
          <StudentRoute>
            <StudentLayout>
              <DirectActivityPlay />
            </StudentLayout>
          </StudentRoute>
        }
      />
      <Route
        path="/student/courses/:courseId/units/:unitId/lessons/:lessonId/modes/:modeId"
        element={
          <StudentRoute>
            <StudentLayout>
              <ComponentModePlay />
            </StudentLayout>
          </StudentRoute>
        }
      />

      {/* Learning Mode Topic Routes */}
      <Route
        path="/student/courses/reading-mode"
        element={
          <StudentRoute>
            <StudentLayout>
              <ReadingModeTopics />
            </StudentLayout>
          </StudentRoute>
        }
      />
      <Route
        path="/student/courses/roleplay-mode"
        element={
          <StudentRoute>
            <StudentLayout>
              <RolePlayModeTopics />
            </StudentLayout>
          </StudentRoute>
        }
      />
      <Route
        path="/student/courses/listening-mode"
        element={
          <StudentRoute>
            <StudentLayout>
              <ListeningModeTopics />
            </StudentLayout>
          </StudentRoute>
        }
      />
      <Route
        path="/student/courses/debate-mode"
        element={
          <StudentRoute>
            <StudentLayout>
              <DebateModeTopics />
            </StudentLayout>
          </StudentRoute>
        }
      />
      <Route
        path="/student/courses/chat/:topicId/:topicName"
        element={
          <StudentRoute>
            <StudentLayout>
              <Chat />
            </StudentLayout>
          </StudentRoute>
        }
      />

      <Route
        path="/student/leaderboard"
        element={
          <StudentRoute>
            <StudentLayout>
              <Leaderboard />
            </StudentLayout>
          </StudentRoute>
        }
      />
      <Route
        path="/student/support"
        element={
          <StudentRoute>
            <StudentLayout>
              <Support />
            </StudentLayout>
          </StudentRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
