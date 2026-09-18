import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TeacherDashboardProfile from "@/components/ui/TeacherDashboardProfile";
import { RevenueGraph } from "@/components/ui/UsageGraph";
import PerformanceGraph from "@/components/ui/PerformanceGraph";
import { RoleplayModeCards } from "@/components/ui/RoleplayModeCards";
import { CertificationsSection } from "@/components/ui/CertificationsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStudentProfileData } from "@/redux/slices/studentProfileSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

export default function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const myUser = localStorage.getItem("AiTutorUser");
  const parsedUser = JSON.parse(myUser || "{}");
  const teacherId = parsedUser?.id;

  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useAppSelector(
    (state) => state.studentProfile
  );

  const [timeFilter, setTimeFilter] = useState<"weekly" | "monthly" | "all">("all");

  useEffect(() => {
    if (teacherId && studentId) {
      dispatch(fetchStudentProfileData({ teacherId, studentId, timeFilter }));
    }
  }, [teacherId, studentId, timeFilter, dispatch]);

  if (error) {
    return (
      <div className="min-h-screen p-4 border border-[var(--border-light)] rounded-3xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600 mb-4">
                Error loading student profile: {error}
              </p>
              <button
                onClick={() =>
                  teacherId &&
                  studentId &&
                  dispatch(
                    fetchStudentProfileData({
                      teacherId,
                      studentId,
                      timeFilter,
                    })
                  )
                }
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 border border-[var(--border-light)] rounded-3xl">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
          <div className="xl:col-span-3">
            {isLoading ? (
              <div className="border rounded-lg shadow p-4 bg-white">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ) : (
              <TeacherDashboardProfile studentData={data} />
            )}
          </div>

          <div className="xl:col-span-9 space-y-6">
            {isLoading ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="text-center">
                        <Skeleton className="h-6 w-24 mx-auto mb-4" />
                        <div className="p-4 flex items-center justify-center">
                          <div className="text-lg bg-[#F8F9FD] px-6 py-4 rounded-lg">
                            <Skeleton className="h-6 w-8 mx-auto mb-2" />
                            <Skeleton className="h-4 w-16 mx-auto" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2">
                    <div className="bg-white shadow-sm rounded-lg p-4">
                      <Skeleton className="h-6 w-48 mb-4" />
                      <Skeleton className="h-64 md:h-80 w-full" />
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <div className="bg-white shadow-sm rounded-lg p-4">
                      <Skeleton className="h-6 w-32 mb-4" />
                      <div className="space-y-3">
                        {[1, 2, 3].map((index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
                          >
                            <Skeleton className="w-15 h-10 rounded flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <Skeleton className="h-3 w-20 mb-2" />
                              <Skeleton className="h-4 w-32 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-4 w-8" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <RoleplayModeCards modesData={data?.lessonModesByKey} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2">
                    <div className="max-h-[430px] overflow-y-auto space-y-4 pr-2 snap-y snap-mandatory">
                      <div className="snap-start min-h-[400px]">
                        <RevenueGraph
                          usageData={data?.usageGraphData}
                          periodLabel={
                            timeFilter === "weekly"
                              ? "This Week"
                              : timeFilter === "monthly"
                                ? "This Month"
                                : "All Time"
                          }
                        />
                      </div>
                      <div className="snap-start min-h-[400px]">
                        <PerformanceGraph
                          assessmentGraphData={data?.assessmentGraphData}
                          timeFilter={timeFilter}
                          onTimeFilterChange={setTimeFilter}
                          isLoading={isLoading}
                          title="Performance"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-1">
                    <CertificationsSection achievements={data?.achievements} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
