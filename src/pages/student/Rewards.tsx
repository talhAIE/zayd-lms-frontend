import { useState, useEffect, useRef, useCallback } from "react";
import { useAppSelector } from "@/redux/hooks";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Trophy, Star, Calendar, Clock, BookOpen, Lock } from "lucide-react";
import apiClient from "@/config/ApiConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PDFDocument, rgb } from "pdf-lib";
import {
  DownloadIcon,
  // ShareIcon,
} from "@/components/Icons";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import fontkit from "@pdf-lib/fontkit";
import certTemplateUrl from "/src/assets/Certificate_Template.pdf?url";
import markerFontUrl from "/src/assets/fonts/lumiosbrush-regular.otf?url";
import rewardBadgeBgUrl from "/src/assets/svgs/rewards.svg?url";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import InteractiveTour, { TourStep } from "@/components/ui/InteractiveTour";

import achievementsImg1 from "@/assets/user-guide/achievements/1.png";
import achievementsImg2 from "@/assets/user-guide/achievements/2.png";

// Describes a single achievement from your API
interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  pointValue: number;
  rewardClaimed: boolean;
  awardedAt?: string; // ISO date string
  iconUrl?: string; // The URL for the achievement's icon
  threshold?: number;
}

// Describes the categorized data structure from the achievements API
interface AchievementCategory {
  category: string;
  earned: Achievement[];
  available: Achievement[];
}

interface UserStats {
  userId: string;
  totalLoginDays: number;
  currentStreak: number;
  lastLoginDate: string;
  totalUsageSec: number;
  totalLessonsDone: number;
  totalLessonModesDone: number;
  totalPoints: number;
  updatedAt: string;
}

// Describes a single certification from your API
interface Certification {
  id: string;
  key: string;
  name: string;
  description: string;
  pointValue: number;
  rewardClaimed: boolean;
  awardedAt?: string; // ISO date string
  iconUrl?: string; // The URL for the certification's icon
  issueDate: string;
  title: string;
  studentName: string;
  pdfUrl?: string | null;
}

// --- Component Props ---

interface AchievementCardProps {
  achievement: Achievement;
  isEarned: boolean;
  userStats: UserStats | null;
}

// --- Main Rewards Component ---

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-certifications-tab",
    title: "🏅 Zayd AI appreciates your learning efforts…",
    description: "…by awarding you certificates! Collect them all as you grow.",
    position: "bottom",
    image: achievementsImg1,
  },
  {
    targetId: "tour-rewards-tab",
    title: "🎯 Complete the challenge…",
    description: "…and unlock new rewards every day!\nDon't forget to claim your rewards.",
    position: "bottom",
    image: achievementsImg2,
  },
];

const Rewards = (): JSX.Element => {
  const [achievements, setAchievements] = useState<AchievementCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [certificatesError, setCertificatesError] = useState<string | null>(null);
  const [_totalPoints, _setTotalPoints] = useState<number>(0);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  const [tab, setTab] = useState<"rewards" | "certifications">(
    () => new URLSearchParams(window.location.search).get('tab') === 'certifications' ? 'certifications' : 'rewards',
  );
  const userId = useAppSelector(state => state.auth.user?.id);
  const owner = useRef(userId);
  owner.current = userId;

  const [certificates, setCertificates] = useState<Certification[]>([]);
  const [certificatesLoading, setCertificatesLoading] = useState<boolean>(true);
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certification | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState<boolean>(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tourActive, setTourActive] = useState(searchParams.get("tour") === "true");

  useEffect(() => {
    if (tourActive) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("tour");
      setSearchParams(newParams, { replace: true });
    }
  }, [tourActive, searchParams, setSearchParams]);

  const fetchAchievements = useCallback(async () => {
    try {
      setError(null);
      if (!userId) {
        setError("User not found. Please log in again.");
        setLoading(false);
        return;
      }
      const response = await apiClient.get<{
        status: string;
        data: { achievements: AchievementCategory[]; userStats: UserStats };
      }>(`/users/${userId}/achievements`);

      if (owner.current !== userId) return;

      if (response.data.status === "success") {
        const { achievements, userStats } = response.data.data;
        setAchievements(achievements);
        setUserStats(userStats);
      } else {
        setError("Failed to load achievements");
      }
    } catch (err: any) {
      if (owner.current !== userId) return;
      setError(
        err.response?.data?.message ||
          "Failed to load achievements. Please try again."
      );
      console.error("Error fetching achievements:", err);
    } finally {
      if (owner.current === userId) setLoading(false);
    }
  }, [userId]);

  const fetchCertificates = useCallback(async () => {
    try {
      setCertificatesError(null);
      if (!userId) {
        setCertificatesError("User not found. Please log in again.");
        setCertificatesLoading(false);
        return;
      }
      await apiClient.post('/courses/certificates/sync', {});
      if (owner.current !== userId) return;
      const response = await apiClient.get<{
        status: string;
        data: {
          certificates: { earned: Certification[]; locked: Certification[] };
          user: { firstName: string; lastName: string };
          userStats: UserStats;
        };
      }>(`/users/${userId}/achievements/certificates`);

      if (owner.current !== userId) return;

      if (response.data.status === "success") {
        const { certificates, user } = response.data.data;

        // Transform certifications data to include required fields
        const transformedCertifications: Certification[] = [
          ...certificates.earned,
          ...certificates.locked,
        ].map((certification) => ({
          ...certification,
          issueDate: certification.awardedAt
            ? new Date(certification.awardedAt).toLocaleDateString()
            : "Not issued yet",
          title: `${certification.name} Certificate`,
          studentName: `${user.firstName} ${user.lastName}`,
          pdfUrl: undefined,
        }));

        setCertificates(transformedCertifications);
      } else {
        setCertificatesError("Failed to load certifications");
      }
    } catch (err: any) {
      if (owner.current !== userId) return;
      setCertificatesError(
        err.response?.data?.message ||
          "Failed to load certifications. Please try again."
      );
      console.error("Error fetching certifications:", err);
    } finally {
      if (owner.current === userId) setCertificatesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setCertificatesLoading(true);
    setAchievements([]);
    setCertificates([]);
    setUserStats(null);
    setSelectedCertificate(null);
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      void fetchAchievements();
      void fetchCertificates();
    };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.clearInterval(interval);
    };
  }, [fetchAchievements, fetchCertificates]);

  const claimReward = async (achievementKey: string) => {
    try {
      setClaimingReward(achievementKey);
      setError(null);
      if (!userId) {
        setError("Cannot claim reward: User not found.");
        return;
      }
      await apiClient.post(
        `/users/${userId}/achievements/${achievementKey}/claim`,
        {
          achievementKey: achievementKey,
          claimedAt: new Date().toISOString(),
        }
      );
      if (owner.current !== userId) return;
      await fetchAchievements();
      await fetchCertificates();
    } catch (err: any) {
      if (owner.current !== userId) return;
      const errorMessage =
        err.response?.data?.message ||
        "Failed to claim reward. Please try again.";
      setError(errorMessage);
      console.error("Error claiming reward:", err);
    } finally {
      if (owner.current === userId) setClaimingReward(null);
    }
  };

  const modifyPDF = async (cert: Certification) => {
    try {
      const pdfRes = await fetch(certTemplateUrl);
      if (!pdfRes.ok) {
        console.error(
          "Failed to fetch PDF template:",
          pdfRes.status,
          pdfRes.statusText
        );
        return null;
      }

      const pdfBytes = await pdfRes.arrayBuffer();

      const pdfDoc = await PDFDocument.load(pdfBytes);

      pdfDoc.registerFontkit(fontkit);

      const [firstPage] = pdfDoc.getPages();
      const { width } = firstPage.getSize();

      const fontRes = await fetch(markerFontUrl);
      if (!fontRes.ok) {
        console.error(
          "Failed to fetch font:",
          fontRes.status,
          fontRes.statusText
        );
        return null;
      }

      const fontBytes = await fontRes.arrayBuffer();
      const customFont = await pdfDoc.embedFont(fontBytes);
      const helvetica = await pdfDoc.embedFont("Helvetica");
      const helveticabold = await pdfDoc.embedFont("Helvetica-Bold");

      // Name
      const nameFontSize = 80;
      const nameTextWidth = customFont.widthOfTextAtSize(
        cert.studentName,
        nameFontSize
      );
      const nameX = (width - nameTextWidth) / 2;

      firstPage.drawText(cert.studentName, {
        x: nameX,
        y: 250,
        size: nameFontSize,
        font: customFont,
        color: rgb(1, 0.69, 0.17),
      });

      // Description
      const descFontSize = 16;
      const maxWidth = width * 0.6;
      const words = cert.description.split(" ");
      const lines: string[] = [];
      let line = "";

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const testWidth = helvetica.widthOfTextAtSize(testLine, descFontSize);
        if (testWidth < maxWidth) {
          line = testLine;
        } else {
          lines.push(line);
          line = word;
        }
      }
      if (line) lines.push(line);

      let y = 200;
      const lineHeight = descFontSize + 6;

      for (const descLine of lines) {
        const lineWidth = helvetica.widthOfTextAtSize(descLine, descFontSize);
        const x = (width - lineWidth) / 2;
        firstPage.drawText(descLine, {
          x,
          y,
          size: descFontSize,
          font: helvetica,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
      }

      // Issue Date
      const issueFontSize = 16;
      const issueText = `Issued on ${cert.issueDate}`;
      const issueWidth = helvetica.widthOfTextAtSize(issueText, issueFontSize);
      const issueX = (width - issueWidth) / 2;

      firstPage.drawText(issueText, {
        x: issueX,
        y: y - 20,
        size: issueFontSize,
        font: helveticabold,
      });

      // Finalize PDF
      const modifiedPdfBytes = await pdfDoc.save();

      const arrayBuffer = modifiedPdfBytes.buffer.slice(
        modifiedPdfBytes.byteOffset,
        modifiedPdfBytes.byteOffset + modifiedPdfBytes.byteLength
      );
      // Ensure we have an ArrayBuffer, not SharedArrayBuffer
      const safeArrayBuffer =
        arrayBuffer instanceof ArrayBuffer
          ? arrayBuffer
          : new Uint8Array(arrayBuffer).slice().buffer;
      const blob = new Blob([safeArrayBuffer], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);

      return url;
    } catch (error) {
      console.error("Error modifying PDF:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  };

  // Function to handle certificate click and generate PDF on-demand
  const handleCertificateClick = async (cert: Certification) => {
    setSelectedCertificate(cert);
    setGeneratingPDF(true);

    try {
      const pdfUrl = await modifyPDF(cert);

      if (pdfUrl) {
        setSelectedCertificate({ ...cert, pdfUrl });
      } else {
        setSelectedCertificate({ ...cert, pdfUrl: null });
      }
    } catch (error) {
      console.error("Error in handleCertificateClick:", error);
      setSelectedCertificate({ ...cert, pdfUrl: null });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const AchievementCard = ({
    achievement,
    isEarned,
  }: AchievementCardProps): JSX.Element => {
    const canClaim = isEarned && !achievement.rewardClaimed;
    const nameRef = useRef<HTMLHeadingElement>(null);
    const descRef = useRef<HTMLParagraphElement>(null);

    const getProgressValue = (): number | null => {
      if (!userStats || achievement.threshold == null) return null;

      if (achievement.key.startsWith("usage_")) {
        return userStats.totalUsageSec;
      }
      if (achievement.key.startsWith("topics_")) {
        return userStats.totalLessonModesDone;
      }
      if (achievement.key.startsWith("lesson_modes_")) {
        return userStats.totalLessonModesDone;
      }
      if (achievement.key.startsWith("lessons_")) {
        return userStats.totalLessonsDone;
      }
      if (achievement.key.startsWith("streak_")) {
        return userStats.currentStreak;
      }
      return null;
    };

    const rawValue = getProgressValue();
    const percent =
      rawValue != null
        ? Math.min(Math.round((rawValue / achievement.threshold!) * 100), 100)
        : 0;

    return (
      <div
        className={`relative p-4 rounded-xl border transition-all duration-300 ${
          isEarned
            ? canClaim
              ? "border-blue-300 bg-blue-200 shadow-md"
              : "border-gray-200 bg-gray-50"
            : "border-gray-200 bg-white hover:border-blue-500"
        }`}
      >
        <div
          className={`relative flex flex-col items-center transition-all duration-300 ${
            !isEarned ? "grayscale" : ""
          }`}
        >
          <div className="relative w-full max-w-[160px] aspect-[173/184] flex items-center justify-center">
            <img
              src={rewardBadgeBgUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 z-0 w-full h-full object-contain select-none pointer-events-none"
            />
            {achievement.iconUrl ? (
              <img
                src={achievement.iconUrl}
                alt={achievement.name}
                className="relative z-10 w-[58%] h-[58%] object-contain drop-shadow-md -translate-y-[1.2rem]"
              />
            ) : (
              <Star
                className={`relative z-10 w-10 h-10 -translate-y-4 ${
                  isEarned ? "text-blue-600" : "text-gray-400"
                }`}
              />
            )}
          </div>
        </div>

        <div className="flex-1 text-center">
          <div className="min-h-[2.5rem] flex items-center justify-center mb-1.5">
            <h4
              ref={nameRef}
              className={`font-semibold text-sm ${
                isEarned ? "text-gray-800" : "text-gray-600"
              }`}
            >
              {achievement.name}
            </h4>
          </div>
          <div className="min-h-[2.5rem] flex items-center justify-center mb-6">
            <p
              ref={descRef}
              className={`text-xs ${
                isEarned ? "text-gray-600" : "text-gray-500"
              }`}
            >
              {achievement.description}
            </p>
          </div>

          {rawValue != null && achievement.threshold != null && !isEarned && (
            <div className="mb-2">
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#6250E9] to-[#69BDFF] h-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 text-right mt-1">
                {percent}%
              </p>
            </div>
          )}

          <div className="flex justify-center gap-2 flex-wrap items-center">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                isEarned
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {achievement.pointValue} points
            </span>
            {isEarned && achievement.awardedAt && (
              <span className="text-xs text-gray-500">
                Earned {new Date(achievement.awardedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {canClaim && (
          <>
            <div className="absolute inset-0 z-10 backdrop-blur-[2.5px] rounded-xl"></div>

            <button
              onClick={() => claimReward(achievement.key)}
              disabled={claimingReward === achievement.key}
              className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 gradient-hover-animate disabled:bg-blue-400 text-white py-2 px-4 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 shadow-md w-32 h-10 drop-shadow-sm"
            >
              {claimingReward === achievement.key ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Claiming...
                </>
              ) : (
                <>Claim Reward</>
              )}
            </button>
          </>
        )}

        {isEarned && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-30">
            <Trophy className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  const CertificationCard = ({
    certification,
  }: {
    certification: Certification;
  }): JSX.Element => {
    const isEarned = certification.awardedAt != null;
    const canClaim = isEarned && !certification.rewardClaimed;

    return (
      <div className="relative h-full">
        <div
          className={`relative bg-gradient-to-br from-[#6BBCFB] to-[#BAE1FF] rounded-2xl p-4 flex flex-col cursor-pointer shadow-lg transition-all hover:shadow-xl overflow-hidden h-full min-h-[180px] sm:min-h-[200px] md:min-h-[220px] ${
            !isEarned ? "opacity-60 grayscale" : ""
          }`}
          onClick={() => {
            if (isEarned) {
              handleCertificateClick(certification);
            }
          }}
        >
          {/* Header with title and lock icon */}
          <div className="flex items-start justify-between mb-2 min-h-[2.5rem]">
            <h2 className="text-sm font-bold text-white line-clamp-2 flex-1">
              {certification.title}
            </h2>
            {!isEarned && (
              <Lock className="w-4 h-4 text-white flex-shrink-0 ml-1 mt-0.5" />
            )}
          </div>

          {/* Issue date */}
          <p className="text-white text-xs font-medium mb-2 min-h-[1.25rem]">
            {isEarned
              ? `Issue ${certification.issueDate}`
              : certification.issueDate}
          </p>

          {/* Certificate icon illustration at bottom */}
          <div className="flex-1 flex items-end justify-center mt-auto min-h-[80px] relative">
            {certification.iconUrl ? (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-12 w-36 h-36 flex items-center justify-center">
                <img
                  src={certification.iconUrl}
                  alt={certification.name}
                  className={`w-full h-full object-contain ${
                    !isEarned ? "grayscale" : ""
                  }`}
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="text-xs text-white/80 text-center px-2">
                {certification.name}
              </div>
            )}
          </div>

          {canClaim && (
            <>
              <div className="absolute inset-0 z-10 bg-blue-200/50 backdrop-blur-[2.5px] rounded-2xl"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  claimReward(certification.key);
                }}
                disabled={claimingReward === certification.key}
                className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 gradient-hover-animate disabled:bg-blue-400 text-white py-2 px-4 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 shadow-md w-32 h-10 drop-shadow-sm"
              >
                {claimingReward === certification.key ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Claiming...
                  </>
                ) : (
                  <>Claim Certificate</>
                )}
              </button>
            </>
          )}

          {isEarned && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center z-30">
              <Trophy className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Main Render Logic ---

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your achievements...</p>
        </div>
      </div>
    );
  }

  const categoryIcons: { [key: string]: JSX.Element } = {
    Activities: <BookOpen className="w-5 h-5" />,
    Topics: <BookOpen className="w-5 h-5" />,
    Usage: <Clock className="w-5 h-5" />,
    Streak: <Calendar className="w-5 h-5" />,
    Default: <Star className="w-5 h-5" />,
  };

  return (
    <>
      <style>
        {`
          .gradient-hover-animate {
            background: linear-gradient(to right, #3EA4F9 0%, #0267B5 50%, #3EA4F9 100%);
            background-size: 200% 100%;
            background-position: 0% 50%;
            transition: background-position 0.6s ease;
          }
          .gradient-hover-animate:hover {
            background-position: 100% 50%;
          }
        `}
      </style>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mx-auto">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as "rewards" | "certifications");
              if (v === 'certifications') void fetchCertificates();
              else void fetchAchievements();
            }}
            className="w-full"
          >
            <TabsList className="w-full mb-8 px-2 py-8 gap-2 rounded-3xl">
              <TabsTrigger
                id="tour-rewards-tab"
                className="w-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3EA4F9] data-[state=active]:to-[#0267B5] data-[state=active]:text-white py-3 rounded-xl"
                value="rewards"
              >
                Rewards
              </TabsTrigger>
              <TabsTrigger
                id="tour-certifications-tab"
                className="w-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3EA4F9] data-[state=active]:to-[#0267B5] data-[state=active]:text-white py-3 rounded-xl"
                value="certifications"
              >
                Certifications
              </TabsTrigger>
            </TabsList>
            <TabsContent value="rewards">
              {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error} <button className="underline" onClick={() => void fetchAchievements()}>Retry</button></div>}
              {!error && achievements.length === 0 && <p className="rounded-xl bg-white p-6 text-gray-600">No rewards are available yet. Completed learning activities will appear here when you earn a reward.</p>}
              <main className="space-y-8">
                {achievements.map((category) => (
                  <section key={category.category}>
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                      {categoryIcons[category.category] ||
                        categoryIcons.Default}
                      {category.category} Achievements
                      <span className="text-sm font-normal text-gray-500">
                        ({category.earned.length} earned,{" "}
                        {category.available.length} available)
                      </span>
                    </h2>
                    {(category.earned.length > 0 ||
                      category.available.length > 0) && (
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                        {category.earned.map((achievement) => (
                          <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                            isEarned={true}
                            userStats={userStats}
                          />
                        ))}
                        {category.available.map((achievement) => (
                          <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                            isEarned={false}
                            userStats={userStats}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </main>
            </TabsContent>
            <TabsContent value="certifications">
              {certificatesError && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{certificatesError} <button className="underline" onClick={() => void fetchCertificates()}>Retry</button></div>}
              {!certificatesLoading && !certificatesError && certificates.length === 0 && <p className="rounded-xl bg-white p-6 text-gray-600">No certificates earned yet. Complete a course or a certificate milestone to earn one.</p>}
              {certificatesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">
                      Loading your certifications...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 items-stretch">
                  {certificates.map((cert) => (
                    <CertificationCard key={cert.id} certification={cert} />
                  ))}
                </div>
              )}

              {/* Certificate Dialog */}
              {selectedCertificate && (
                <Dialog
                  open={!!selectedCertificate}
                  onOpenChange={(open) => {
                    if (!open) {
                      setSelectedCertificate(null);
                      setGeneratingPDF(false);
                    }
                  }}
                >
                  <DialogContent className="max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl w-full p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-lg overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold">
                        {selectedCertificate.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="w-full h-full bg-white rounded-lg overflow-hidden">
                      {generatingPDF ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">
                              Generating certificate PDF...
                            </p>
                          </div>
                        </div>
                      ) : selectedCertificate.pdfUrl ? (
                        <div>
                          <Worker
                            workerUrl={pdfWorkerUrl}
                          >
                            <Viewer fileUrl={selectedCertificate.pdfUrl} />
                          </Worker>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <p className="text-gray-600">
                              Failed to generate PDF
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedCertificate.pdfUrl && (
                      <div className="flex flex-col sm:flex-row justify-end gap-4 mt-4">
                        <Button
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = selectedCertificate.pdfUrl!;
                            link.download = `${
                              selectedCertificate.studentName
                            }_${selectedCertificate.title.replace(
                              /\s+/g,
                              "_"
                            )}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="bg-white text-[#065FF0] border border-[#065FF033] hover:bg-[#f0f6ff] hover:border-[#065FF0] transition-colors duration-200 shadow-sm p-4 sm:p-5"
                        >
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <InteractiveTour
        active={tourActive}
        steps={TOUR_STEPS}
        onComplete={() => {
          setTourActive(false);
          navigate("/student/leaderboard?tour=true");
        }}
        onSkip={() => setTourActive(false)}
      />
    </>
  );
};

export default Rewards;
