import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Crown, Clock } from "lucide-react";
import {
  fetchLeaderboard,
  formatTime,
  LeaderboardFilters,
  LeaderboardUser,
} from "@/redux/slices/leaderboardSlice";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { resolveLeaderboardLevel } from "@/utils/leaderboardLevel";
import InteractiveTour, { TourStep } from "@/components/ui/InteractiveTour";

import leaderboardImg1 from "@/assets/user-guide/leaderboard/1.png";
import leaderboardImg2 from "@/assets/user-guide/leaderboard/2.png";
import leaderboardImg3 from "@/assets/user-guide/leaderboard/3.png";
import leaderboardImg4 from "@/assets/user-guide/leaderboard/4.png";
import leaderboardImg5 from "@/assets/user-guide/leaderboard/5.png";
import leaderboardImg6 from "@/assets/user-guide/leaderboard/6.png";
import leaderboardImg7 from "@/assets/user-guide/leaderboard/7.png";
import leaderboardImg8 from "@/assets/user-guide/leaderboard/8.png";

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-leaderboard-main",
    title: "🏆 Compete with your fellows...",
    description: "...to claim the highest position in the leaderboard!\nStudy more, earn points, and climb the ranks.",
    position: "bottom",
    image: leaderboardImg1,
  },
  {
    targetId: "tour-top-3",
    title: "🏆 The Podium — Top 3 Learners",
    description: "The spotlight zone! The top 3 learners of the week stand here.\nGold = Rank 1, Silver = Rank 2, Bronze = Rank 3.\nEarn points to climb up here and see your own avatar!",
    position: "bottom",
    image: leaderboardImg2,
  },
  {
    targetId: "tour-rank-col",
    title: "🔢 Your Position",
    description: "This shows your position among all students in your school.\nLower number = higher rank! Rank 1 is the best.\nYour rank updates in real-time as you earn points.",
    position: "bottom",
    image: leaderboardImg3,
  },
  {
    targetId: "tour-student-col",
    title: "👤 Your Fellow Learners",
    description: "This column shows all the students competing on the leaderboard.\nEveryone starts somewhere — even the top-ranked students once began at the bottom!",
    position: "bottom",
    image: leaderboardImg4,
  },
  {
    targetId: "tour-school-col",
    title: "🏫 School Competition",
    description: "See which school your competitors belong to!\nThe leaderboard brings students together, so you can see how you stack up against others.",
    position: "bottom",
    image: leaderboardImg5,
  },
  {
    targetId: "tour-level-col",
    title: "🎯 English Proficiency Level",
    description: "Your English proficiency level — like B1, B2, A2, etc.\nHigher level = harder challenges and advanced content.\nComplete more topics to level up!",
    position: "bottom",
    image: leaderboardImg6,
  },
  {
    targetId: "tour-time-col",
    title: "⏱️ Learning Time",
    description: "Total time each student has spent learning this week.\nEvery minute counts! The more time you practice, the higher you climb.\nEven 10 mins a day makes a difference!",
    position: "bottom",
    image: leaderboardImg7,
  },
  {
    targetId: "tour-topics-col",
    title: "📚 Topics Completed",
    description: "This shows how many topics each student has finished.\nMore topics = more points = higher rank!\nComplete at least one topic daily to stay competitive.",
    position: "bottom",
    image: leaderboardImg8,
  },
];

interface LeaderboardProps {
  userId?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  userId: _initialUserId,
}) => {
  const user = localStorage.getItem("AiTutorUser");
  const parsedUser = JSON.parse(user || "{}");
  const currentUserId = parsedUser?.id;

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { leaderboard, currentUser, isLoading, error } = useAppSelector(
    (state) => state.leaderboard
  );
  const currentUserLevel = resolveLeaderboardLevel(currentUser, parsedUser);

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [showFixedUserBar, setShowFixedUserBar] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [tourActive, setTourActive] = useState(searchParams.get("tour") === "true");

  useEffect(() => {
    if (tourActive) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("tour");
      setSearchParams(newParams, { replace: true });
    }
  }, [tourActive, searchParams, setSearchParams]);

  const currentUserInTableRef = useRef<HTMLTableRowElement>(null);
  const currentUserNotInTableRef = useRef<HTMLTableRowElement>(null);

  const topUsers = filteredUsers
    .filter((user) => user.rank !== null && user.rank <= 3)
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));

  const tableUsers = filteredUsers
    .filter((user) => user.rank !== null && user.rank > 3 && user.rank <= 20)
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));

  useEffect(() => {
    const filters: LeaderboardFilters = {
      userId: currentUserId || "",
    };
    dispatch(fetchLeaderboard(filters));
  }, [dispatch, currentUserId]);

  useEffect(() => {
    if (leaderboard) {
      setFilteredUsers([...leaderboard]);
    }
  }, [leaderboard]);

  useEffect(() => {
    const handleScroll = () => {
      if (!currentUser) {
        setShowFixedUserBar(false);
        return;
      }

      const isCurrentUserInDisplayedList =
        currentUser &&
        (topUsers.some((u) => u.username === currentUser.username) ||
          tableUsers.some((u) => u.username === currentUser.username));

      let userElement: HTMLElement | null = null;

      if (tableUsers.some((u) => u.username === currentUser.username)) {
        userElement = currentUserInTableRef.current;
      } else if (!isCurrentUserInDisplayedList) {
        userElement = currentUserNotInTableRef.current;
      }

      if (userElement) {
        const rect = userElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setShowFixedUserBar(true);
        } else {
          setShowFixedUserBar(false);
        }
      } else {
        setShowFixedUserBar(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [currentUser, filteredUsers]);

  if (isLoading) {
    return (
      <div className="mx-auto">
        {/* <h1 className="text-2xl font-bold mb-8 text-center md:text-left">Leaderboard</h1> */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm md:col-span-1 order-2 md:order-1">
            <Skeleton className="h-6 w-24 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-sm order-1 md:order-2">
            <div className="flex justify-center mb-10 gap-4 md:gap-6 flex-wrap">
              <Skeleton className="h-32 w-24" />
              <Skeleton className="h-40 w-24" />
              <Skeleton className="h-32 w-24" />
            </div>
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto">
        {/* <h1 className="text-2xl font-bold mb-8 text-center">Leaderboard</h1> */}
        <div className="bg-red-100 p-4 rounded-lg text-red-700 border border-red-300">
          Failed to load leaderboard: {error}
        </div>
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="mx-auto p-6 text-center">
        {/* <h1 className="text-3xl font-bold mb-8 text-center text-gray-700">Leaderboard</h1> */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl text-gray-500 py-10">
          {currentUser && !currentUserLevel
            ? 'Your language level has not been assessed yet. Complete a speaking activity to receive an assessment and join your level’s leaderboard.'
            : 'No rankings are available for your level this week. Keep learning and check back soon.'}
        </div>
      </div>
    );
  }

  const isCurrentUserInDisplayedList =
    currentUser &&
    (topUsers.some((u) => u.username === currentUser.username) ||
      tableUsers.some((u) => u.username === currentUser.username));

  const getOrderedTopUsers = () => {
    if (topUsers.length === 0) return [];
    if (topUsers.length < 3) {
      const podium: (LeaderboardUser | null)[] = [null, null, null];
      const first = topUsers.find((user) => user.rank === 1);
      const second = topUsers.find((user) => user.rank === 2);
      const third = topUsers.find((user) => user.rank === 3);

      if (first) podium[1] = first;
      if (second) podium[0] = second;
      if (third) podium[2] = third;

      if (topUsers.length === 1 && first) return [first];
      if (topUsers.length === 2) {
        if (first && second) return [second, first];
        if (first && !second)
          return [topUsers.find((u) => u.rank !== 1), first];
        if (second && !first)
          return [second, topUsers.find((u) => u.rank !== 2)];
      }
      return podium.filter(Boolean) as LeaderboardUser[];
    }

    const first = topUsers.find((user) => user.rank === 1);
    const second = topUsers.find((user) => user.rank === 2);
    const third = topUsers.find((user) => user.rank === 3);

    return [second, first, third].filter(Boolean) as LeaderboardUser[];
  };

  const orderedPodiumUsers = getOrderedTopUsers();

  const getCircleColor = (rank: number | null) => {
    if (rank === 1) return "bg-yellow-100 border-yellow-400";
    if (rank === 2) return "bg-gray-100 border-gray-400";
    if (rank === 3) return "bg-amber-100 border-amber-600";
    return "bg-gray-100 border-gray-300";
  };

  const getLevelBadgeColor = (level?: string | null) => {
    if (!level) return "bg-gray-100 text-gray-800";
    const levels: Record<string, string> = {
      A1: "bg-green-100 text-green-800",
      A2: "bg-blue-100 text-blue-800",
      B1: "bg-purple-100 text-purple-800",
      B2: "bg-pink-100 text-pink-800",
      C1: "bg-yellow-100 text-yellow-800",
      C2: "bg-red-100 text-red-800",
    };
    return levels[level] || "bg-gray-100 text-gray-800";
  };

  const isUserCurrent = (username?: string) => {
    return currentUser?.username === username;
  };

  const shouldDisplayCurrentUserSeparately =
    currentUser && !isCurrentUserInDisplayedList;

  return (
    <div className="mx-auto pb-20">
      {/* <h1 className="relative text-3xl font-bold mb-8 text-center text-gray-700">Leaderboard</h1> */}

      <div id="tour-leaderboard-main" className="bg-white p-4 md:p-6 rounded-xl shadow-xl">
        {orderedPodiumUsers.length > 0 && (
          <div id="tour-top-3" className="flex flex-wrap justify-center items-end mb-10 gap-2 md:gap-4">
            {orderedPodiumUsers.map((user, _index) => {
              let crownSize = "w-10 h-10";
              let avatarSize = "w-24 h-24";
              let marginTop = "mt-8";
              const rankTextBg =
                user?.rank === 1
                  ? "bg-yellow-400"
                  : user?.rank === 2
                  ? "bg-slate-400"
                  : "bg-amber-600";

              if (user?.rank === 1) {
                avatarSize = "w-28 h-28 md:w-32 md:h-32";
                marginTop = "mt-0";
                crownSize = "w-12 h-12 md:w-14 md:h-14";
              } else if (user?.rank === 2) {
                avatarSize = "w-20 h-20 md:w-24 md:h-24";
                marginTop = "mt-6 md:mt-8";
              } else {
                avatarSize = "w-20 h-20 md:w-24 md:h-24";
                marginTop = "mt-6 md:mt-8";
              }

              return (
                <div
                  key={user?.username}
                  className={`flex flex-col items-center px-1 ${marginTop} relative`}
                  style={{
                    order: user?.rank === 1 ? 1 : user?.rank === 2 ? 0 : 2,
                  }}
                >
                  <div className="relative">
                    {user?.rank === 1 && (
                      <div
                        className={`absolute -top-6 md:-top-14 left-1/2 transform -translate-x-1/2 z-10`}
                      >
                        <Crown
                          className={`${crownSize} text-yellow-400`}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                    <div
                      className={`relative ${avatarSize} rounded-full border-4 overflow-hidden ${getCircleColor(
                        user?.rank || 0
                      )} ${
                        isUserCurrent(user?.username)
                          ? "ring-4 ring-blue-500 ring-offset-2"
                          : ""
                      }`}
                    >
                      <Avatar className="w-full h-full">
                        <AvatarFallback className="text-lg md:text-xl font-semibold">
                          {user?.firstName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute bottom-0 right-1 w-8 h-8 md:w-9 md:h-9 rounded-full ${rankTextBg} border-2 border-white flex items-center justify-center font-bold text-white text-sm md:text-base`}
                      >
                        {user?.rank}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <h3
                      className={`font-semibold text-sm md:text-base ${
                        isUserCurrent(user?.username)
                          ? "text-blue-600"
                          : "text-gray-800"
                      }`}
                    >
                      {user?.firstName} {user?.lastName?.charAt(0) || ""}.
                      {isUserCurrent(user?.username) && (
                        <span className="block text-xs text-blue-500 font-bold">
                          (You)
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center justify-center text-xs md:text-sm text-gray-500 mt-1">
                      <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1 text-gray-400" />
                      {formatTime(user?.totalSeconds || 0)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {orderedPodiumUsers.length === 0 &&
          tableUsers.length === 0 &&
          !shouldDisplayCurrentUserSeparately && (
            <div className="text-center py-10 text-gray-500">
              No users on the leaderboard yet.
            </div>
          )}

        {tableUsers.length > 0 && (
          <div className="w-full overflow-hidden">
            {/* Mobile Card Layout */}
            <div className="block md:hidden space-y-3">
              {tableUsers.map((user, index) => (
                <div
                  key={user.username}
                  ref={
                    isUserCurrent(user.username) ? currentUserInTableRef : null
                  }
                  className={`border rounded-lg p-4 ${
                    isUserCurrent(user.username)
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                    <div className="flex items-center justify-between mb-3">
                      <div id={index === 0 && isMobile ? "tour-student-col" : undefined} className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ${
                            isUserCurrent(user.username)
                              ? "ring-2 ring-blue-400 ring-offset-1"
                              : ""
                          }`}
                      >
                        <Avatar className="w-full h-full">
                          <AvatarFallback className="text-sm font-semibold">
                            {user.firstName?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <div
                          className={`font-medium ${
                            isUserCurrent(user.username)
                              ? "text-blue-600"
                              : "text-gray-800"
                          }`}
                        >
                          {user.firstName} {user.lastName?.charAt(0) || ""}.
                          {isUserCurrent(user.username) && (
                            <span className="ml-1 text-xs text-blue-500 font-semibold">
                              (You)
                            </span>
                          )}
                        </div>
                        <div id={index === 0 && isMobile ? "tour-school-col" : undefined} className="text-sm text-gray-500">
                          {user.schoolName || "No school"}
                        </div>
                      </div>
                    </div>
                    <div
                      id={index === 0 && isMobile ? "tour-rank-col" : undefined}
                      className={`text-2xl font-bold ${
                        isUserCurrent(user.username)
                          ? "text-blue-600"
                          : "text-gray-700"
                      }`}
                    >
                      #{user.rank}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div id={index === 0 && isMobile ? "tour-level-col" : undefined}>
                      <div className="text-xs text-gray-500 mb-1">Level</div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(
                          user.aiCefrLevel
                        )}`}
                      >
                        {user.aiCefrLevel || "N/A"}
                      </span>
                    </div>
                    <div id={index === 0 && isMobile ? "tour-time-col" : undefined}>
                      <div className="text-xs text-gray-500 mb-1">Time</div>
                      <div
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          isUserCurrent(user.username)
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {formatTime(user.totalSeconds)}
                      </div>
                    </div>
                    <div id={index === 0 && isMobile ? "tour-topics-col" : undefined}>
                      <div className="text-xs text-gray-500 mb-1">Topics</div>
                      <div
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          isUserCurrent(user.username)
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {user.completedTopics || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                    <th id={!isMobile ? "tour-rank-col" : undefined} className="py-3 px-3">Rank</th>
                    <th id={!isMobile ? "tour-student-col" : undefined} className="py-3 px-3">Student</th>
                    <th id={!isMobile ? "tour-school-col" : undefined} className="py-3 px-3">School</th>
                    <th id={!isMobile ? "tour-level-col" : undefined} className="py-3 px-3">Level</th>
                    <th id={!isMobile ? "tour-time-col" : undefined} className="py-3 px-3">Time</th>
                    <th id={!isMobile ? "tour-topics-col" : undefined} className="py-3 px-3">Completed Topics</th>
                  </tr>
                </thead>
                <tbody>
                  {tableUsers.map((user) => (
                    <tr
                      key={user.username}
                      ref={
                        isUserCurrent(user.username)
                          ? currentUserInTableRef
                          : null
                      }
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        isUserCurrent(user.username)
                          ? "bg-blue-50 font-medium"
                          : ""
                      }`}
                    >
                      <td
                        className={`py-4 px-3 font-medium ${
                          isUserCurrent(user.username)
                            ? "text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        {user.rank}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center">
                          <div
                            className={`w-9 h-9 rounded-full mr-3 overflow-hidden flex-shrink-0 ${
                              isUserCurrent(user.username)
                                ? "ring-2 ring-blue-400 ring-offset-1"
                                : ""
                            }`}
                          >
                            <Avatar className="w-full h-full">
                              <AvatarFallback className="text-sm font-semibold">
                                {user.firstName?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <div
                              className={`${
                                isUserCurrent(user.username)
                                  ? "text-blue-600"
                                  : "text-gray-800"
                              }`}
                            >
                              {user.firstName} {user.lastName?.charAt(0) || ""}.
                              {isUserCurrent(user.username) && (
                                <span className="ml-1 text-xs text-blue-500 font-semibold">
                                  (You)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-sm text-gray-600">
                        {user.schoolName || "-"}
                      </td>
                      <td className="py-4 px-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(
                            user.aiCefrLevel
                          )}`}
                        >
                          {user.aiCefrLevel || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="inline-block bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-sm font-medium">
                          {formatTime(user.totalSeconds)}
                        </div>
                      </td>
                      <td className="py-4 px-3 md:w-[150px]">
                        <div className="inline-block bg-slate-100 md:w-[150px] text-slate-700 px-2.5 py-1 rounded-full text-sm font-medium">
                          {user.completedTopics || 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {shouldDisplayCurrentUserSeparately && currentUser && (
          <>
            {tableUsers.length > 0 && (
              <div className="flex items-center justify-center my-4">
                <div className="border-t border-gray-200 flex-grow"></div>
                <span className="mx-4 text-gray-400 text-xs uppercase font-semibold">
                  Your Position
                </span>
                <div className="border-t border-gray-200 flex-grow"></div>
              </div>
            )}

            {/* Mobile Current User Card */}
            <div className="block md:hidden">
              <div
                ref={currentUserNotInTableRef}
                className="border rounded-lg p-4 bg-blue-50 border-blue-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-blue-500 ring-offset-1 flex-shrink-0">
                      <Avatar className="w-full h-full">
                        <AvatarFallback className="text-sm font-semibold">
                          {currentUser.firstName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <div className="font-medium text-blue-600">
                        {currentUser.firstName}{" "}
                        {currentUser.lastName?.charAt(0) || ""}.
                        <span className="ml-1 text-xs text-blue-500 font-semibold">
                          (You)
                        </span>
                      </div>
                      <div className="text-sm text-blue-500">
                        {currentUser.schoolName || "No school"}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    #{currentUser.rank !== null ? currentUser.rank : "-"}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Level</div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(
                        currentUserLevel
                      )} border border-blue-300`}
                    >
                      {currentUserLevel || "N/A"}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Time</div>
                    <div className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      {formatTime(currentUser.totalSeconds)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Topics</div>
                    <div className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      {currentUser.completedTopics || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Current User Table */}
            <div className="hidden md:block">
              <table className="w-full mt-2">
                <tbody>
                  <tr
                    ref={currentUserNotInTableRef}
                    className="bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                  >
                    <td className="py-4 px-3 font-medium text-blue-700 w-[60px]">
                      {currentUser.rank !== null ? currentUser.rank : "-"}
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full mr-3 overflow-hidden ring-2 ring-blue-500 ring-offset-1 flex-shrink-0">
                          <Avatar className="w-full h-full">
                            <AvatarFallback className="text-sm font-semibold">
                              {currentUser.firstName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <div className="font-semibold text-blue-700">
                            {currentUser.firstName}{" "}
                            {currentUser.lastName?.charAt(0) || ""}.
                            <span className="ml-1 text-xs text-blue-600 font-bold">
                              (You)
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-sm text-blue-600">
                      {currentUser.schoolName || "-"}
                    </td>
                    <td className="py-4 px-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(
                          currentUserLevel
                        )} border border-blue-300`}
                      >
                        {currentUserLevel || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <div className="inline-block bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-sm font-medium">
                        {formatTime(currentUser.totalSeconds)}
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <div className="inline-block bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-sm font-medium">
                        {currentUser.completedTopics || 0}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {tableUsers.length === 0 &&
          !shouldDisplayCurrentUserSeparately &&
          orderedPodiumUsers.length > 0 && (
            <div className="text-center py-6 text-gray-500">
              No other users in ranks 4-20.
            </div>
          )}
      </div>

      {showFixedUserBar && currentUser && (
        <div className="fixed bottom-0 left-0 right-0 shadow-lg p-3 z-50">
          {/* Mobile Fixed Bar */}
          <div className="block md:hidden">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500 ring-offset-1 flex-shrink-0">
                  <Avatar className="w-full h-full">
                    <AvatarFallback className="text-sm font-semibold">
                      {currentUser.firstName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <div className="font-medium text-blue-600 text-sm">
                    {currentUser.firstName}{" "}
                    {currentUser.lastName?.charAt(0) || ""}. (You)
                  </div>
                  <div className="text-xs text-gray-500">
                    Rank #{currentUser.rank !== null ? currentUser.rank : "-"}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 text-xs">
                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  {formatTime(currentUser.totalSeconds)}
                </div>
                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  {currentUser.completedTopics || 0} topics
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Fixed Bar */}
          {/* <div className="hidden md:block container mx-auto px-4">
            <table className="w-full">
              <tbody>
                <tr className="bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                  <td className="py-3 px-3 font-medium text-blue-700 w-[160px]">{currentUser.rank !== null ? currentUser.rank : '-'}</td>
                  <td className="py-3 px-3 max-w-[200px]">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-gray-200 mr-3 overflow-hidden ring-2 ring-blue-500 ring-offset-1 flex-shrink-0">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                          alt={currentUser.firstName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-blue-700">
                          {currentUser.firstName} {currentUser.lastName?.charAt(0) || ''}.
                          <span className="ml-1 text-xs text-blue-600 font-bold">(You)</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-sm text-blue-600 max-w-[120px]">{currentUser.schoolName || '-'}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(currentUserLevel)} border border-blue-300`}>
                      {currentUserLevel || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="inline-block bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-sm font-medium">
                      {formatTime(currentUser.totalSeconds)}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="inline-block bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-sm font-medium">
                      {currentUser.completedTopics || 0}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div> */}

          {/* Desktop Fixed Bar */}
          <div className="hidden md:block container mx-auto px-4 max-w-[1024px] float-end">
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  <tr className="bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                    <td
                      className="py-3 px-3 font-medium text-blue-700"
                      style={{ width: "60px" }}
                    >
                      {currentUser.rank !== null ? currentUser.rank : "-"}
                    </td>
                    <td className="py-3 px-3" style={{ width: "200px" }}>
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full mr-3 overflow-hidden ring-2 ring-blue-500 ring-offset-1 flex-shrink-0">
                          <Avatar className="w-full h-full">
                            <AvatarFallback className="text-sm font-semibold">
                              {currentUser.firstName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <div className="font-semibold text-blue-700">
                            {currentUser.firstName}{" "}
                            {currentUser.lastName?.charAt(0) || ""}.
                            <span className="ml-1 text-xs text-blue-600 font-bold">
                              (You)
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className="py-3 px-3 text-sm text-blue-600"
                      style={{ width: "150px" }}
                    >
                      {currentUser.schoolName || "-"}
                    </td>
                    <td className="py-3 px-3" style={{ width: "120px" }}>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(
                          currentUserLevel
                        )} border border-blue-300`}
                      >
                        {currentUserLevel || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-3" style={{ width: "120px" }}>
                      <div className="inline-block bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-sm font-medium">
                        {formatTime(currentUser.totalSeconds)}
                      </div>
                    </td>
                    <td className="py-3 px-3" style={{ width: "150px" }}>
                      <div className="inline-block bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-sm font-medium">
                        {currentUser.completedTopics || 0}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <InteractiveTour
        active={tourActive}
        steps={TOUR_STEPS}
        onComplete={() => {
          setTourActive(false);
          navigate("/student/courses?tour=true");
        }}
        onSkip={() => setTourActive(false)}
      />
    </div>
  );
};

export default Leaderboard;
