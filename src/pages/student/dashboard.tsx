import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import DashboardBadge from "@/assets/svgs/dashboard_badge.svg";
import TeachBird from "@/assets/svgs/dashboardTeach.svg";
import DashboardProfile from "@/components/ui/DashboardProfile";
import PerformanceGraph from "@/components/ui/PerformanceGraph";
// import { BarChartComponent } from '@/components/ui/barChartComponent';
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchDashboardData } from "@/redux/slices/dashboardSlice";
import { Skeleton } from "@/components/ui/skeleton";
import InteractiveTour, { TourStep } from "@/components/ui/InteractiveTour";



import dashboardImg1 from "@/assets/user-guide/dashboard/1.png";
import dashboardImg2 from "@/assets/user-guide/dashboard/2.png";
import dashboardImg3 from "@/assets/user-guide/dashboard/3.png";
import dashboardImg4 from "@/assets/user-guide/dashboard/4.png";
import dashboardImg5 from "@/assets/user-guide/dashboard/5.png";

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-dashboard-main",
    title: "Welcome to your personal dashboard!",
    description:
      "This is your central hub for tracking your learning journey and progress.",
    position: "bottom",
    image: dashboardImg1,
  },
  {
    targetId: "tour-profile",
    title: "👤 Your Profile",
    description: "This is your profile! Your class, school live here.",
    position: "bottom",
  },
  {
    targetId: "tour-streak",
    title: "🔥 Streak",
    description: "Keep learning daily to build your streak. Don't break the chain!",
    position: "bottom",
    image: dashboardImg2,
  },
  {
    targetId: "tour-daily-usage",
    title: "⏱️ Daily Usage",
    description: "Track how much time you've spent learning today.",
    position: "bottom",
    image: dashboardImg3,
  },
  {
    targetId: "tour-longest-streak",
    title: "🏆 Longest Streak",
    description: "Here's the level of your progress. Aim higher every day!",
    position: "bottom",
    image: dashboardImg4,
  },
  {
    targetId: "tour-calendar",
    title: "📅 Calendar",
    description: "See your activity history at a glance. Blue dots = learning days",
    position: "top",
    image: dashboardImg5,
  },
  {
    targetId: "tour-completed-topics",
    title: "📚 Completed Topics",
    description: "Your progress across learning modules. Explore more topics to fill this up!",
    position: "top",
  },
  {
    targetId: "tour-performance",
    title: "📊 My Performance",
    description: "Monitor your Accuracy, Pronunciation, and Fluency over time.",
    position: "top",
  },
];

export default function LanguageLearningDashboard() {
  const myUser = localStorage.getItem("AiTutorUser");
  const parsedUser = JSON.parse(myUser || "{}");
  const currentUserId = parsedUser?.id;

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useAppSelector((state) => state.dashboard);
  // Start with the learner's complete performance history. Restricting the
  // initial request to the current week made established Saudi learners look
  // like they had no assessment data at all.
  const [timeFilter, setTimeFilter] = useState<"weekly" | "monthly" | "all">("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [tourActive, setTourActive] = useState(searchParams.get("tour") === "true");

  useEffect(() => {
    if (tourActive) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("tour");
      setSearchParams(newParams, { replace: true });
    }
  }, [tourActive, searchParams, setSearchParams]);

  useEffect(() => {
    // Only fetch if we have a valid user ID
    if (currentUserId) {
      dispatch(fetchDashboardData({ userId: currentUserId, timeFilter }));
    }
  }, [currentUserId, timeFilter, dispatch]);

  const user = data?.userInfo;
  const usageRecords = data?.usageRecords;
  const assessmentGraphData = data?.assessmentGraphData || [];
  const courseProgress = data?.courseProgress || [];
  const selectedCourse = courseProgress.find(
    (course) => course.id === selectedCourseId,
  );

  useEffect(() => {
    if (
      courseProgress.length > 0 &&
      !courseProgress.some((course) => course.id === selectedCourseId)
    ) {
      setSelectedCourseId(courseProgress[0].id);
    }
  }, [courseProgress, selectedCourseId]);

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex flex-col border border-[var(--border-light)] rounded-3xl p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={() =>
                currentUserId &&
                dispatch(
                  fetchDashboardData({ userId: currentUserId, timeFilter })
                )
              }
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no user ID
  if (!currentUserId) {
    return (
      <div className="flex flex-col border border-[var(--border-light)] rounded-3xl p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No User Found
            </h3>
            <p className="text-sm text-gray-500">
              Please log in to view your dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="tour-dashboard-main" className="flex flex-col border border-[var(--border-light)] rounded-3xl p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 md:gap-6 mb-6 w-full mx-auto items-start">
        {isLoading ? (
          // Profile Skeleton aligned with DashboardProfile layout
          <Card className="col-span-1 w-full my-10 md:my-0 bg-slate-50 pt-[7px] pb-[7px] shadow-sm border-none">
            <CardContent className="p-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div
                    className="w-32 h-32 rounded-full p-1"
                    style={{
                      background:
                        "linear-gradient(to bottom, #5DA0FE8C, #00FFF230)",
                    }}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                      <Skeleton className="w-full h-full rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mb-4">
                <Skeleton className="h-6 w-40 mx-auto" />
              </div>

              <div className="mb-3">
                <div className="bg-gray-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>

              <div>
                <div className="bg-gray-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div id="tour-profile">
            <DashboardProfile user={user} />
          </div>
        )}

        {/* Three Cards: Streak, Daily Usage, and Longest Streak */}
        {isLoading ? (
          // Cards Skeleton
          <div
            className="col-span-1 grid grid-cols-2 grid-rows-2 gap-5"
            style={{ gridTemplateRows: "auto auto" }}
          >
            <Card
              className="text-white shadow-sm rounded-2xl overflow-hidden border-0 self-start"
              style={{
                background: "linear-gradient(to bottom, #6EBDFB, #5C9DFF)",
              }}
            >
              <CardContent className="p-4 flex flex-col">
                <div className="flex items-start justify-between mb-auto">
                  <Skeleton className="h-4 w-16 bg-white/20" />
                  <Skeleton className="h-7 w-7 rounded-full bg-white/20" />
                </div>
                <div className="flex items-end justify-between mt-[1rem]">
                  <Skeleton className="h-10 w-20 bg-white/20" />
                  <Skeleton className="h-12 w-12 rounded-xl bg-white/20" />
                </div>
              </CardContent>
            </Card>
            <Card
              className="text-white shadow-sm rounded-2xl overflow-hidden border-0 self-start"
              style={{
                background: "linear-gradient(to bottom, #6EBDFB, #5C9DFF)",
              }}
            >
              <CardContent className="p-4 flex flex-col">
                <div className="flex items-start justify-between mb-auto">
                  <Skeleton className="h-4 w-20 bg-white/20" />
                  <Skeleton className="h-7 w-7 rounded-full bg-white/20" />
                </div>
                <div className="flex items-end justify-between mt-[1rem]">
                  <Skeleton className="h-10 w-20 bg-white/20" />
                  <Skeleton className="h-12 w-12 rounded-xl bg-white/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm col-span-2 rounded-2xl overflow-hidden border-0 relative bg-[#89CBFC2B]">
              <CardContent className="p-4 flex flex-row items-center gap-4 relative">
                <div className="flex flex-col items-start gap-2 flex-shrink-0">
                  <Skeleton className="w-20 h-20 rounded-lg" />
                  <div className="flex flex-col gap-0.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center relative mt-20 ms-4">
                  <Skeleton className="h-8 w-16" />
                </div>
                <div className="flex-shrink-0 flex items-end justify-end -mr-14">
                  <Skeleton className="h-[9.5rem] w-32" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div
            className="col-span-1 grid grid-cols-2 grid-rows-2 gap-5"
            style={{ gridTemplateRows: "auto auto" }}
          >
            <Card
              id="tour-streak"
              className="text-white shadow-sm rounded-2xl overflow-hidden border-0 self-start"
              style={{
                background: "linear-gradient(to bottom, #6EBDFB, #5C9DFF)",
              }}
            >
              <CardContent className="p-4 flex flex-col">
                {/* Top Row: Streak label and Arrow icon */}
                <div className="flex items-start justify-between mb-auto">
                  <h4 className="text-sm font-medium text-white">Streak</h4>
                  <div className="w-7 h-7 rounded-full bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Bottom Row: Number and Flame icon */}
                <div className="flex items-end justify-between mt-[1rem]">
                  <div className="text-4xl font-bold text-white leading-none">
                    {data?.streak ?? 0}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8"
                    >
                      <path
                        d="M19.9998 9.61542C20.769 12.6923 22.3075 15.1923 24.6152 17.1154C26.9228 19.0385 28.0767 21.1539 28.0767 23.4616C28.0767 25.6037 27.2257 27.6581 25.711 29.1728C24.1963 30.6875 22.1419 31.5385 19.9998 31.5385C17.8576 31.5385 15.8032 30.6875 14.2885 29.1728C12.7738 27.6581 11.9229 25.6037 11.9229 23.4616C11.9229 22.2133 12.3277 20.9987 13.0767 20C13.0767 20.7651 13.3806 21.4988 13.9216 22.0398C14.4626 22.5807 15.1963 22.8846 15.9613 22.8846C16.7264 22.8846 17.4601 22.5807 18.001 22.0398C18.542 21.4988 18.8459 20.7651 18.8459 20C18.8459 17.6923 17.1152 16.5385 17.1152 14.2308C17.1152 12.6923 18.0767 11.1539 19.9998 9.61542Z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              id="tour-daily-usage"
              className="text-white shadow-sm rounded-2xl overflow-hidden border-0 self-start"
              style={{
                background: "linear-gradient(to bottom, #6EBDFB, #5C9DFF)",
              }}
            >
              <CardContent className="p-4 flex flex-col">
                {/* Top Row: Daily Usage label and Arrow icon */}
                <div className="flex items-start justify-between mb-auto">
                  <h4 className="text-sm font-medium text-white whitespace-nowrap">
                    Daily Usage
                  </h4>
                  <div className="w-7 h-7 rounded-full bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Bottom Row: Number and Activity icon */}
                <div className="flex items-end justify-between mt-[1rem]">
                  <div className="text-4xl font-bold text-white leading-none">
                    {data?.dailyUsage ?? 0}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8"
                    >
                      <path
                        d="M31.5383 20H28.6768C28.1725 19.9989 27.6818 20.1631 27.2796 20.4673C26.8775 20.7715 26.586 21.1991 26.4499 21.6846L23.7383 31.3308C23.7209 31.3907 23.6844 31.4433 23.6345 31.4808C23.5846 31.5182 23.5238 31.5385 23.4614 31.5385C23.399 31.5385 23.3383 31.5182 23.2883 31.4808C23.2384 31.4433 23.202 31.3907 23.1845 31.3308L16.8153 8.66924C16.7978 8.60932 16.7614 8.55669 16.7114 8.51924C16.6615 8.48179 16.6008 8.46155 16.5383 8.46155C16.4759 8.46155 16.4152 8.48179 16.3653 8.51924C16.3153 8.55669 16.2789 8.60932 16.2614 8.66924L13.5499 18.3154C13.4143 18.799 13.1246 19.2252 12.7247 19.5293C12.3249 19.8333 11.8368 19.9986 11.3345 20H8.46143"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="tour-longest-streak" className="shadow-sm col-span-2 rounded-2xl overflow-hidden border-0 relative bg-[#89CBFC2B]">
              <style>{`
                @media (min-width: 545px) and (max-width: 1023px) {
                  .streak-badge-container {
                    flex-direction: row !important;
                    align-items: center !important;
                    gap: 1rem !important;
                  }
                  .streak-badge-wrapper {
                    width: 10rem !important;
                    height: 10rem !important;
                    flex-shrink: 0;
                  }
                  .streak-badge-img {
                    width: 100% !important;
                    height: 100% !important;
                  }
                  .streak-text-overlay {
                    display: none !important;
                  }
                  .streak-text-below {
                    display: flex !important;
                    flex-direction: column;
                    gap: 0.125rem;
                  }
                  .streak-text-title {
                    font-size: 2rem !important;
                    line-height: 2.75rem !important;
                  }
                  .streak-text-subtitle {
                    font-size: 1rem !important;
                    line-height: 1rem !important;
                  }
                  .streak-number-container {
                    margin-top: 0 !important;
                    margin-left: 0 !important;
                  }
                  .streak-number-value {
                    font-size: 3rem !important;
                    line-height: 1 !important;
                  }
                  .streak-bird-container {
                    margin-right: -5rem;
                    margin-bottom: -3rem;
                  }
                  .streak-bird-img {
                    height: 15rem !important;
                  }
                }
              `}</style>
              <CardContent className="p-4 flex flex-row items-center gap-4 relative">
                {/* Left Section: Badge and Text */}
                <div className="flex flex-col items-start gap-2 flex-shrink-0 streak-badge-container">
                  {/* Badge Icon - Made bigger */}
                  <div className="flex-shrink-0 streak-badge-wrapper">
                    <img
                      src={DashboardBadge}
                      alt="Badge"
                      className="w-20 h-20 streak-badge-img"
                    />
                    {/* Text overlapping the badge - Hidden in media query */}
                    <div className="hidden streak-text-overlay">
                      <h4
                        className="text-lg font-bold leading-tight"
                        style={{
                          background:
                            "linear-gradient(135deg, #6250E9, #69BDFF)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        Longest Streak
                      </h4>
                      <p className="text-[10px] text-gray-500 leading-tight">
                        here is the level of your progress
                      </p>
                    </div>
                  </div>

                  {/* Text Section - Shown to the right of badge in media query */}
                  <div className="flex flex-col gap-0.5 streak-text-below">
                    <h4
                      className="text-lg font-bold leading-tight streak-text-title"
                      style={{
                        background: "linear-gradient(135deg, #6250E9, #69BDFF)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      Longest Streak
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-tight streak-text-subtitle">
                      here is the level of your progress
                    </p>
                  </div>
                </div>

                {/* Center Section: Streak Number */}
                <div className="flex-1 flex items-center justify-center relative mt-20 ms-4 streak-number-container">
                  <div
                    className="absolute w-14 h-10 rounded-full opacity-10"
                    style={{ backgroundColor: "#9E9E9E" }}
                  />
                  <div
                    className="text-2xl font-bold leading-none relative z-10 streak-number-value"
                    style={{
                      background: "linear-gradient(135deg, #6250E9, #69BDFF)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {data?.longestStreak ?? 0}
                  </div>
                </div>

                {/* Right Section: Bird Illustration - Made bigger */}
                <div className="flex-shrink-0 flex items-end justify-end -mr-14 streak-bird-container">
                  <img
                    src={TeachBird}
                    alt="Bird"
                    className="h-[9.5rem] w-auto object-contain streak-bird-img"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          // Calendar Skeleton
          <div className="col-span-1 border rounded-lg shadow p-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-7 gap-2 mt-2">
                {Array.from({ length: 7 }).map((_, index) => (
                  <Skeleton key={index} className="h-4 w-8" />
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 mt-4">
                {Array.from({ length: 35 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-10 rounded-md" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div id="tour-calendar" className="mt-8 sm:mt-0 col-span-1 border rounded-lg shadow">
            <Calendar mode="single" usageRecords={usageRecords} />
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 items-stretch gap-6">
        {/* Completed Topics Section */}
        <Card id="tour-completed-topics" className="h-full shadow-md border-[#F4F4F4] bg-white rounded-[16.11px]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                ) : (
                  <>
                    <CardTitle className="font-['Outfit'] font-bold text-[20px] leading-[25px] text-[#0C0F16]">
                      Completed Units
                    </CardTitle>
                    <CardDescription className="font-['Outfit'] font-normal text-[10px] leading-[13px] text-[#6E7496]">
                      Your Progress accross learning modules
                    </CardDescription>
                  </>
                )}
              </div>

              {isLoading ? (
                <Skeleton className="h-9 w-28 rounded-full" />
              ) : (
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="flex items-center justify-between gap-1.5 px-4 py-2 h-auto rounded-[72px] bg-[#F8F8F8] border-0 hover:bg-[#F0F0F0] focus:ring-0 focus:outline-none font-['Outfit'] font-bold text-[12px] leading-[15px] text-[#065FF0] w-auto shadow-none cursor-pointer [&>svg.opacity-50]:hidden">
                    <SelectValue placeholder="Select Course" />
                    <ChevronDown className="w-4 h-4 text-[#065FF0] shrink-0" />
                  </SelectTrigger>
                  <SelectContent className="font-['Outfit'] rounded-xl">
                    {courseProgress.length > 0 ? courseProgress.map((course) => (
                      <SelectItem key={course.id} value={course.id} className="font-medium text-sm cursor-pointer">
                        {course.title || course.subject || 'Course'}
                      </SelectItem>
                    )) : (
                      <SelectItem value="no-courses" className="font-medium text-sm cursor-pointer" disabled>
                        No courses found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-2 pb-6">
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col justify-center p-[16.11px] px-[24.17px] gap-[8.06px] rounded-[16.11px] border border-[#F4F4F4] bg-[linear-gradient(96.71deg,rgba(137,203,252,0.17)_0.12%,rgba(255,255,255,0.17)_100.84%)]"
                  >
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-[8px] w-full rounded-[4px]" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-1">
                {(selectedCourse?.units || []).map((unit) => (
                  <div
                    key={unit.id}
                    className="flex flex-col justify-center p-[16.11px] px-[24.17px] gap-[8.06px] rounded-[16.11px] border border-[#F4F4F4] bg-[linear-gradient(96.71deg,rgba(137,203,252,0.17)_0.12%,rgba(255,255,255,0.17)_100.84%)]"
                  >
                    <h3 className="font-['Outfit'] font-bold text-[16px] leading-[20px] text-[#434343]">
                      {unit.title}
                    </h3>
                    <div className="flex flex-col items-start gap-[6px] w-full">
                      <div className="w-full h-[8px] bg-[#E5E7EB] rounded-[4px] overflow-hidden">
                        <div
                          className="h-[8px] bg-[#5C9DFF] rounded-[4px] transition-all duration-500"
                          style={{ width: `${unit.progressPct || 0}%` }}
                        />
                      </div>
                      <span className="font-['Outfit'] font-bold text-[12px] leading-[15px] text-[#6E7496]">
                        {Math.round(unit.progressPct || 0)}%
                      </span>
                    </div>
                  </div>
                ))}
                {selectedCourse && selectedCourse.units.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No units found for this course.</p>
                )}
                {!selectedCourse && courseProgress.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No courses are currently available.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Performance Section */}
        <div id="tour-performance" className="h-full">
          <PerformanceGraph
            assessmentGraphData={assessmentGraphData}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            isLoading={isLoading}
          />
        </div>
      </div>

      <InteractiveTour
        active={tourActive}
        steps={TOUR_STEPS}
        onComplete={() => {
          setTourActive(false);
          navigate("/student/achievements?tour=true");
        }}
        onSkip={() => setTourActive(false)}
      />
    </div>
  );
}
