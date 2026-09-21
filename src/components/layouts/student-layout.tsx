import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { useAppSelector } from '@/redux/hooks';
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import dashboardIcon from "@/assets/sidebar/dashboard.svg";
import achievementsIcon from "@/assets/sidebar/achievements.svg";
import leaderboardIcon from "@/assets/sidebar/leaderboard.svg";
import learningModeIcon from "@/assets/sidebar/learningMode.svg";
import supporticon from "@/assets/sidebar/support.svg";
import Logo from "@/assets/sidebar/Logo.png";

import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
// import { ThemeToggle } from '@/components/theme-toggle';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import apiClient from "@/config/ApiConfig";
import { toast } from "sonner";
import StudentReportModal from "../ui/StudentReportModal";

interface StudentLayoutProps {
  children: ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: studentProfileData } = useAppSelector(
    (state) => state.studentProfile,
  );

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] || "";

  const decodeAndFormatTitle = (text: string) => {
    return decodeURIComponent(text) // Decode %20 etc.
      .replace(/[-_]+/g, " ") // Replace dashes and underscores with space
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
      .join(" ");
  };

  let formattedTitle;
  if (location.pathname.startsWith("/teacher/student-profile/")) {
    formattedTitle = "Student Profile";
  } else if (location.pathname.includes("/lessons/")) {
    formattedTitle = "Lessons";
  } else if (location.pathname.includes("/units/") || location.pathname.match(/\/courses\/[^/]+$/)) {
    formattedTitle = "Units";
  } else if (location.pathname.endsWith("/courses")) {
    formattedTitle = "Courses";
  } else if (location.pathname.includes("/chapter/")) {
    const segments = location.pathname.split("/");
    const chapterIndex = segments.indexOf("chapter");
    if (chapterIndex > 0) {
      formattedTitle = decodeAndFormatTitle(segments[chapterIndex - 1]);
    } else {
      formattedTitle = decodeAndFormatTitle(lastSegment).split(":")[0];
    }
  } else {
    formattedTitle = decodeAndFormatTitle(lastSegment).split(":")[0];
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role !== "student") {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (user?.role !== "student") return;

    let intervalId: number | undefined;
    let sessionBootstrapAttempted = false;

    const sendHeartbeat = async () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;

      let sessionId = localStorage.getItem("engagementSessionId");
      if (!sessionId) {
        if (sessionBootstrapAttempted) return;
        sessionBootstrapAttempted = true;
        try {
          const response = await apiClient.post("/engagement/session");
          sessionId = response.data?.data?.sessionId;
          if (typeof sessionId === "string") {
            localStorage.setItem("engagementSessionId", sessionId);
          }
        } catch {
          return;
        }
      }
      if (!sessionId) return;

      const bucketStartedAt = new Date(
        Math.floor(Date.now() / 60_000) * 60_000,
      ).toISOString();

      try {
        await apiClient.post("/engagement/heartbeat", {
          sessionId,
          bucketStartedAt,
          source: "learning",
        });
      } catch {
        // Engagement analytics must never interrupt a learner's lesson. The
        // backend deduplicates minute buckets, so the next scheduled attempt
        // can safely retry after a transient network failure.
      }
    };

    const stop = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const start = () => {
      stop();
      // Wait a full active minute before accounting for it. This prevents a
      // page that is opened and immediately closed from being credited.
      intervalId = window.setInterval(() => void sendHeartbeat(), 60_000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id, user?.role]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // const handleViewReport = () => {
  //   setIsReportModalOpen(true);
  // };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
  };

  const sidebarItems = [
    { path: "/student/dashboard", icon: dashboardIcon, label: "Dashboard" },
    {
      path: "/student/courses",
      icon: learningModeIcon,
      label: "Courses",
    },
    {
      path: "/student/achievements",
      icon: achievementsIcon,
      label: "Achievements",
    },
    {
      path: "/student/leaderboard",
      icon: leaderboardIcon,
      label: "Leaderboard",
    },
    { path: "/student/support", icon: supporticon, label: "Support" },
  ];

  return (
    <div className="flex min-h-screen bg-background ">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Sidebar */}
      <nav
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out xl:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/student/dashboard"
              className="flex items-center justify-center flex-1"
            >
              <img
                src={Logo}
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-black hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {sidebarItems.map((item) => (
                <Link
                  key={item.path}
                  id={`mobile-sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  to={item.path}
                  className={`flex items-center gap-3 py-3 px-4 rounded-lg font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-[#CCEAFF] text-black font-bold"
                      : "text-black hover:bg-gray-50"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="w-6 h-5 flex-shrink-0">
                    <img src={item.icon} alt={item.label} className="h-5 w-5" />
                  </div>
                  <span className="text-lg">{item.label}</span>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </div>
      </nav>
      {/* )} */}

      {/* Sidebar for desktop */}
      <nav className={`hidden xl:flex xl:flex-col xl:w-64 xl:fixed xl:inset-y-0 my-6 rounded-3xl mr-2 transition-all duration-300 z-30 bg-white shadow-sm ${isDesktopCollapsed ? 'xl:-translate-x-full' : 'xl:translate-x-0'}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          className={`absolute top-20 bg-white border border-gray-200 shadow-md rounded-full w-8 h-8 z-50 hidden xl:flex items-center justify-center hover:bg-gray-50 transition-all duration-300 ${isDesktopCollapsed ? '-right-8' : '-right-4'}`}
        >
          {isDesktopCollapsed ? <ChevronRight className="w-5 h-5 text-gray-600" /> : <ChevronLeft className="w-5 h-5 text-gray-600" />}
        </Button>
        <div className="p-6">
          <Link
            to="/student/dashboard"
            className="flex items-center justify-center gap-2 text-2xl font-bold text-black h-12"
          >
            <img src={Logo} alt="Logo" className={`transition-all duration-300 object-contain ${isDesktopCollapsed ? 'w-[45px]' : 'w-[70px]'}`} />
          </Link>
        </div>
        <ScrollArea className="flex-1 mt-16 overflow-hidden">
          <div className={`space-y-6 flex flex-col items-center transition-all duration-300 ${isDesktopCollapsed ? 'px-4' : 'pl-8 pr-4'}`}>
            {sidebarItems.map((item) => (
              <div key={item.path} className="flex items-center w-full">
                <Link
                  id={`sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  to={item.path}
                  title={isDesktopCollapsed ? item.label : undefined}
                  className={`flex items-center ${isDesktopCollapsed ? 'justify-center p-3' : 'justify-start gap-3 py-3 px-4'} rounded-xl font-medium transition-colors w-full ${
                    isActive(item.path)
                      ? "bg-[#CCEAFF] text-black font-bold"
                      : "text-black hover:bg-gray-100/50 hover:text-black"
                  }`}
                >
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    <img src={item.icon} alt={item.label} className="h-5 w-5" />
                  </div>
                  {!isDesktopCollapsed && <span className="text-xl whitespace-nowrap">{item.label}</span>}
                </Link>
              </div>
            ))}
          </div>
        </ScrollArea>
      </nav>

      {/* Main content */}
      <div className={`flex flex-col flex-1 w-full max-w-full overflow-x-hidden transition-all duration-300 ${isDesktopCollapsed ? 'xl:pl-0' : 'xl:pl-64'}`}>
        {/* Top header */}
        <header className="sticky top-0 z-40 flex xl:hidden items-center justify-between h-16 px-4 bg-background xl:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-md font-medium tracking-tight">
            {formattedTitle}
          </h1>

          <Button
            onClick={handleLogout}
            size="sm"
            variant="ghost"
            className="group h-10 w-10 p-0 flex items-center justify-center border-0 outline-none focus:outline-none focus:ring-0 hover:border-0 active:border-0 bg-transparent hover:bg-transparent overflow-hidden"
            style={{ border: "none", boxShadow: "none" }}
          >
            <svg
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="38"
                height="38"
                rx="10.2"
                fill="#FFE3E3"
                className="group-hover:fill-[#ffb3b3] transition-colors duration-200"
              />
              <path
                d="M20.3573 16.1959C20.1589 13.8912 18.9745 12.9501 16.3817 12.9501H16.2985C13.4368 12.9501 12.2908 14.096 12.2908 16.9577V21.1318C12.2908 23.9935 13.4368 25.1394 16.2985 25.1394H16.3817C18.9553 25.1394 20.1397 24.2112 20.3509 21.9449M16.4521 19.0384H23.7376M22.3099 16.8937L24.4546 19.0384L22.3099 21.183"
                stroke="#D70004"
                strokeWidth="0.960297"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:stroke-[#a00003] transition-colors duration-200"
              />
            </svg>
          </Button>
        </header>
        <header className="sticky top-0 z-40 hidden xl:flex items-center justify-between h-16 bg-background py-10 px-8 ">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{formattedTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Logout */}
            <Button
              onClick={handleLogout}
              size="sm"
              variant="ghost"
              className="group h-10 w-10 p-0 flex items-center justify-center border-0 outline-none focus:outline-none focus:ring-0 hover:border-0 active:border-0 bg-transparent hover:bg-transparent overflow-hidden"
              style={{ border: "none", boxShadow: "none" }}
            >
              <svg
                width="38"
                height="38"
                viewBox="0 0 38 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  width="37.4098"
                  height="37.4098"
                  rx="10.0205"
                  fill="#FFE3E3"
                  className="group-hover:fill-[#ffb3b3] transition-colors duration-200"
                />
                <path
                  d="M20.3573 16.1959C20.1589 13.8912 18.9745 12.9501 16.3817 12.9501H16.2985C13.4368 12.9501 12.2908 14.096 12.2908 16.9577V21.1318C12.2908 23.9935 13.4368 25.1394 16.2985 25.1394H16.3817C18.9553 25.1394 20.1397 24.2112 20.3509 21.9449M16.4521 19.0384H23.7376M22.3099 16.8937L24.4546 19.0384L22.3099 21.183"
                  stroke="#D70004"
                  strokeWidth="0.960297"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:stroke-[#a00003] transition-colors duration-200"
                />
              </svg>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          <div className="p-4 w-full max-w-full overflow-x-hidden">{children}</div>
        </main>
      </div>

      <StudentReportModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
        studentData={studentProfileData}
      />
    </div>
  );
}
