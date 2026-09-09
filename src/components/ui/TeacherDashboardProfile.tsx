// import { Badge } from "./badge";
import { Card, CardContent } from "./card";
import { Activity } from "lucide-react";

interface TeacherDashboardProfileProps {
  studentData?: {
    studentName: string;
    class: string;
    cefrLevel: string;
    totalPoints: number;
    currentStreak: number;
    progressPct: number;
    completedLessons: number;
    totalLessons: number;
  } | null;
}

const TeacherDashboardProfile = ({
  studentData,
}: TeacherDashboardProfileProps) => {
  return (
    <Card className="w-full my-4 md:my-0 bg-slate-50">
      <CardContent className="p-2 xs:p-3 sm:p-4">
        <div className="flex justify-center items-center mb-3 xs:mb-4 rounded-3xl gradientBg">
          <div className="flex items-center justify-center">
            <div className="relative p-6 xs:p-8 sm:p-12">
              <div className="w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden">
                <img
                  src="https://www.gravatar.com/avatar/?d=mp"
                  alt="Profile"
                  className="w-full h-full object-cover border p-1 bg-white rounded-3xl"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 xs:pt-4 sm:pt-6">
          <div className="flex items-center justify-center mb-2 xs:mb-3 sm:mb-4">
            <h3 className="text-xs xs:text-sm sm:text-md font-bold text-center truncate max-w-full px-2">
              {studentData?.studentName || "Student Name"}
            </h3>
          </div>
          <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
            {/* Class Box */}
            <div className="flex items-center justify-between rounded-full p-1.5 xs:p-2 sm:p-3 border border-gray-200">
              <span className="font-medium text-xs text-[#6250E9] truncate">
                Class
              </span>
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-full px-2 xs:px-3 sm:px-4 py-1">
                <span className="font-medium text-xs bg-gradient-to-r from-[#6250E9] to-[#69BDFF] bg-clip-text text-transparent">
                  {studentData?.class || "N/A"}
                </span>
              </div>
            </div>

            {/* Level Box */}
            <div className="flex items-center justify-between rounded-full p-1.5 xs:p-2 sm:p-3 border border-gray-200">
              <span className="font-medium text-xs text-[#6250E9] truncate">
                Level
              </span>
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-full px-2 xs:px-3 sm:px-4 py-1">
                <span className="font-medium text-xs bg-gradient-to-r from-[#6250E9] to-[#69BDFF] bg-clip-text text-transparent">
                  {studentData?.cefrLevel || "N/A"}
                </span>
              </div>
            </div>

            {/* Total Points Box */}
            <div className="flex items-center justify-between rounded-full p-1.5 xs:p-2 sm:p-3 border border-gray-200">
              <span className="font-medium text-xs text-[#6250E9] truncate">
                Total Points
              </span>
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-full px-2 xs:px-3 sm:px-4 py-1">
                <span className="font-medium text-xs bg-gradient-to-r from-[#6250E9] to-[#69BDFF] bg-clip-text text-transparent">
                  {studentData?.totalPoints || "N/A"}
                </span>
              </div>
            </div>

            <div className="relative bg-[#065FF014] rounded-2xl p-3 xs:p-4 sm:p-6 border border-gray-200">
              <div className="absolute top-2 left-2 xs:top-3 xs:left-3 sm:top-4 sm:left-4 w-8 h-8 xs:w-10 xs:h-10 sm:w-14 sm:h-14 bg-white rounded-2xl flex items-center justify-center">
                <Activity className="w-4 h-4 xs:w-5 xs:h-5 sm:w-8 sm:h-8 text-[#065FF0]" />
              </div>

              <div className="absolute top-2 right-2 xs:top-3 xs:right-3 sm:top-4 sm:right-4 w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 xs:w-5 xs:h-5 sm:w-8 sm:h-8 text-blue-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>

              <div className="flex items-center justify-center mt-10 xs:mt-12 sm:mt-16">
                <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-4">
                  <div className="text-center min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      Current streak
                    </div>
                    <div className="text-sm xs:text-lg sm:text-2xl font-bold text-blue-600">
                      {studentData?.currentStreak || 0}
                    </div>
                  </div>

                  <div className="w-px h-6 xs:h-8 sm:h-12 bg-gray-300"></div>

                  <div className="text-center min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      LMS progress
                    </div>
                    <div className="text-sm xs:text-lg sm:text-2xl font-bold text-blue-600">
                      {studentData?.progressPct ?? 0}%
                    </div>
                  </div>

                  <div className="w-px h-6 xs:h-8 sm:h-12 bg-gray-300"></div>

                  <div className="text-center min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      Lessons
                    </div>
                    <div className="text-sm xs:text-lg sm:text-2xl font-bold text-blue-600">
                      {studentData?.completedLessons ?? 0}/{studentData?.totalLessons ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherDashboardProfile;
