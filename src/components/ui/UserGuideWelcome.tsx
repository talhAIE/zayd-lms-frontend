import { ChevronRight, Play } from "lucide-react";
import Logo from "@/assets/zayd-logo.png";
import DashboardBadge from "@/assets/svgs/dashboard_badge.svg";
import TeachBird from "@/assets/svgs/dashboardTeach.svg";
import dashboardIcon from "@/assets/sidebar/dashboard.svg";
import achievementsIcon from "@/assets/sidebar/achievements.svg";
import leaderboardIcon from "@/assets/sidebar/leaderboard.svg";
import learningModeIcon from "@/assets/sidebar/learningMode.svg";

interface UserGuideWelcomeProps {
  onLaunchTour: () => void;
  onSkipTour: () => void;
}

export default function UserGuideWelcome({
  onLaunchTour,
  onSkipTour,
}: UserGuideWelcomeProps) {
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 py-8 md:py-12 select-none font-['Outfit']">
      {/* Title Header */}
      <div className="mb-8 md:mb-12 text-left">
        <h1 className="text-4xl md:text-[56px] md:line-height-[71px] font-semibold text-black tracking-tight mb-4">
          How can we <span className="text-[#047EE9]">help</span> you today?
        </h1>
        <p className="text-md md:text-lg text-[#949494] max-w-3xl leading-relaxed">
          Everything you need to get the most out of your AI English learning
          journey — guides, support, and answers at your fingertips.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="bg-[#F3F4F6] rounded-[24px] p-6 md:p-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center overflow-hidden min-h-[410px]">
        {/* Left Content Side */}
        <div className="flex-1 flex flex-col items-start text-left w-full">
          {/* Interactive Experience Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F0F9FF] border border-[#CCEAFF] rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-[#047EE9]"></span>
            <span className="text-xs font-semibold text-[#047EE9] tracking-wider uppercase">
              Interactive Experience
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-[32px] font-black text-[#333333] leading-none mb-3">
            Start User Guide
          </h2>

          {/* Description */}
          <p className="text-[#434343] text-sm md:text-[15px] leading-relaxed max-w-md mb-8">
            New to Zayd AI? Take a quick interactive tour and discover
            everything the platform has to offer.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={onLaunchTour}
              className="flex items-center justify-center gap-2 px-6 py-3 w-full sm:w-auto font-bold text-sm text-white rounded-[16px] transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0px_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0px_6px_16px_rgba(0,0,0,0.18)]"
              style={{
                background: "linear-gradient(180deg, #6EBDFB 0%, #5C9DFF 100%)",
              }}
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Launch Tour</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={onSkipTour}
              className="flex items-center justify-center px-6 py-3 w-full sm:w-auto font-semibold text-sm text-gray-500 hover:text-gray-800 bg-white/50 hover:bg-white/80 rounded-[16px] border border-gray-300/40 transition-all duration-200"
            >
              Skip and view Dashboard
            </button>
          </div>
        </div>

        {/* Right Preview Side (Miniature Mockup of Dashboard) */}
        <div className="w-full lg:w-[48%] flex justify-center items-center relative overflow-hidden self-stretch mt-6 lg:mt-0">
          <div className="bg-white rounded-2xl shadow-xl w-full border border-gray-200/50 flex overflow-hidden aspect-[1.5/1] max-w-[500px]">
            {/* Mini Sidebar */}
            <div className="w-[28%] border-r border-gray-100 flex flex-col p-2 bg-white flex-shrink-0">
              <div className="flex justify-center mb-3">
                <img src={Logo} alt="Logo" className="h-6 object-contain" />
              </div>
              <div className="space-y-1">
                {[
                  { label: "Dashboard", active: true, icon: dashboardIcon },
                  { label: "Achievements", active: false, icon: achievementsIcon },
                  { label: "Learning Modes", active: false, icon: learningModeIcon },
                  { label: "Leader Board", active: false, icon: leaderboardIcon },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 p-1 rounded-md text-[8px] font-semibold ${
                      item.active
                        ? "bg-[#CCEAFF] text-black"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <img src={item.icon} alt="" className="w-2.5 h-2.5 opacity-80" />
                    <span className="truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini Dashboard Content */}
            <div className="flex-1 bg-[#F8F9FD] p-3 overflow-y-auto scrollbar-hide text-left">
              <h3 className="text-xs font-bold text-gray-800 mb-2">Dashboard</h3>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Streak Card */}
                <div
                  className="rounded-lg p-1.5 text-white flex flex-col justify-between"
                  style={{
                    background: "linear-gradient(to bottom, #6EBDFB, #5C9DFF)",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[6px] opacity-90">Streak</span>
                    <svg className="w-2 h-2 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xs font-extrabold mt-1">12</span>
                </div>

                {/* Daily Usage */}
                <div
                  className="rounded-lg p-1.5 text-white flex flex-col justify-between"
                  style={{
                    background: "linear-gradient(to bottom, #6EBDFB, #5C9DFF)",
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[6px] opacity-90">Daily Usage</span>
                    <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <span className="text-xs font-extrabold mt-1">12</span>
                </div>
              </div>

              {/* Longest Streak Card */}
              <div className="bg-[#89CBFC2B] rounded-lg p-2 flex items-center justify-between mb-2 relative overflow-hidden">
                <div className="flex items-center gap-1">
                  <img src={DashboardBadge} alt="" className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span className="text-[7px] font-bold text-indigo-900 leading-none">
                      Longest Streak
                    </span>
                    <span className="text-[4px] text-gray-500 leading-none">
                      here is the level of your progress
                    </span>
                  </div>
                </div>
                <div className="text-[10px] font-extrabold text-indigo-700 bg-white/50 px-1 rounded mr-3">
                  20
                </div>
                <img
                  src={TeachBird}
                  alt=""
                  className="absolute right-0 bottom-0 h-6 object-contain"
                />
              </div>

              {/* Completed Topics Card */}
              <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-1.5">
                  <div>
                    <span className="text-[7px] font-extrabold text-gray-800 leading-none block">
                      Completed Topics
                    </span>
                    <span className="text-[4px] text-gray-500 leading-none block">
                      Your Progress across learning modules
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-blue-50/50 p-1 rounded border border-blue-100/50">
                  <div className="flex items-center gap-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-1.5 h-1.5 text-blue-600 fill-current" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[5px] font-bold text-gray-800 leading-none">
                        Chat Mode
                      </span>
                      <span className="text-[3px] text-gray-500 leading-none">
                        4 completed items
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
