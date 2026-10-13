import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { useAppSelector } from '@/redux/hooks';
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import dashboardIcon from "@/assets/sidebar/dashboard.svg";
import Logo from "@/assets/zayd-logo.png";
import { Menu, X, ChevronLeft } from "lucide-react";
// import { ThemeToggle } from '@/components/theme-toggle';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { toast } from "sonner";
import StudentReportModal from "../ui/StudentReportModal";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { useDispatch } from 'react-redux';
// import { logout } from '@/redux/slices/authSlice';

interface TeacherLayoutProps {
  children: ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: studentProfileData } = useAppSelector(
    (state) => state.studentProfile
  );

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] || "";

  // Capitalize each word
  // const formattedTitle = lastSegment
  //   .split("-")
  //   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  //   .join(" ");

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
  } else {
    formattedTitle = decodeAndFormatTitle(lastSegment).split(":")[0];
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role !== "teacher") {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleViewReport = () => {
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
  };

  const sidebarItems = [
    { path: "/teacher/dashboard", icon: dashboardIcon, label: "Dashboard" },
  ];

  return (
    <div className="flex min-h-screen bg-background ">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <nav
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out xl:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/teacher/dashboard"
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

      {/* Sidebar for desktop */}
      <nav className="hidden xl:flex xl:flex-col xl:w-64 xl:fixed xl:inset-y-0 my-6 rounded-3xl mr-2">
        <div className="p-6">
          <Link
            to="/teacher/dashboard"
            className="flex items-center justify-center gap-2 text-2xl font-bold text-black"
          >
            <img src={Logo} alt="Logo" className="w-[70px]" />
          </Link>
        </div>
        <ScrollArea className="flex-1 mt-16">
          <div className="space-y-8 flex flex-col items-center pl-8">
            {sidebarItems.map((item) => (
              <div key={item.path} className="flex items-center w-full">
                <Link
                  to={item.path}
                  className={`flex items-center justify-start gap-3 py-2 px-4 rounded-md font-medium transition-colors flex-1 ${
                    isActive(item.path)
                      ? "bg-[#CCEAFF] text-black font-bold"
                      : "text-black hover:bg-white/10 hover:text-black"
                  }`}
                >
                  <div className="w-6 h-5 flex-shrink-0">
                    <img src={item.icon} alt={item.label} className="h-5 w-5" />
                  </div>
                  <span className="text-xl">{item.label}</span>
                </Link>
              </div>
            ))}
          </div>
        </ScrollArea>
      </nav>

      {/* Main content */}
      <div className="xl:pl-64 flex flex-col flex-1">
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

          {location.pathname.startsWith("/teacher/student-profile") && (
            <Button onClick={handleViewReport}>View Report</Button>
          )}

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
            {/* <Button size="sm" variant="ghost" className="rounded-full bg-[#F8F9FD] h-10 w-10 p-0 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </Button> */}

            {/* User Info */}
            {/* <div className="flex items-center gap-2 bg-[#F8F9FD] px-3 py-1 rounded-full h-10">
              
              <img
                src="https://i.pravatar.cc/30"
                alt="user"
                className="w-7 h-7 rounded-full object-cover"
              />
              <div className="flex flex-col justify-center">
                <span className="text-xs font-semibold leading-tight">hanry</span>
                <span className="text-xs text-gray-500 leading-tight">hanry463@gmail.com</span>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full p-0 h-6 w-6 ml-1">
                <Settings className="w-4 h-4" />
              </Button>
            </div> */}

            {/* Language */}
            {/* <Button variant="ghost" className="rounded-full bg-[#F8F9FD] h-10 flex items-center px-3 py-0">
              <Languages className="w-5 h-5" />
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button> */}

            {location.pathname.startsWith("/teacher/student-profile") && (
              <Button onClick={handleViewReport}>View Report</Button>
            )}

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
        <main className="flex-1">
          <div className="p-4 xl:p-8">{children}</div>
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
