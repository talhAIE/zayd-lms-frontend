import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { User, Download, Loader2 } from "lucide-react";
import {
  StudentProfileData,
  generateIndividualStudentPdf,
} from "@/services/teacherService";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface StudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData?: StudentProfileData | null;
}

export default function StudentReportModal({
  isOpen,
  onClose,
  studentData,
}: StudentReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!studentData) {
    return null;
  }

  const data = studentData;

  const totalUsageMinutes = Math.round(data.usage / 60);
  const totalUsageDisplay = `${totalUsageMinutes} Mins`;

  const formatModeName = (modeKey: string): string => {
    return modeKey
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const modesData = Object.entries(data.lessonModesByKey).map(
    ([modeKey, modeData]) => ({
      name: formatModeName(modeKey),
      completedModes: `${modeData.completed} modes`,
      incompleteModes: `${modeData.incomplete} modes`,
    })
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const assessmentData =
    data.assessmentGraphData?.map((assessment) => ({
      date: formatDate(assessment.date),
      averageAccuracy: `${Math.round(assessment.averageAccuracy)}%`,
      averageFluency: `${Math.round(assessment.averageFluency)}%`,
      averagePronunciation: `${Math.round(assessment.averagePronunciation)}%`,
      totalAssessmentScore: `${Math.round(assessment.totalAssessmentScore)}%`,
    })) || [];

  const certificates =
    data.achievements?.filter(
      (achievement) => achievement.category === "certificate"
    ) || [];
  const rewards =
    data.achievements?.filter(
      (achievement) => achievement.category !== "certificate"
    ) || [];

  const downloadReport = async () => {
    if (!studentData) return;

    setIsDownloading(true);
    try {
      // The LMS derives the teacher and assignment scope from the JWT.
      const result = await generateIndividualStudentPdf(studentData.id);

      // Download the PDF file
      const link = document.createElement("a");
      link.href = result.blobUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("PDF report downloaded successfully!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(error.message || "Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full mx-1 sm:mx-0">
        <Button
          className="absolute left-2 sm:left-1/2 sm:-translate-x-1/2 top-2 sm:top-4 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
          onClick={downloadReport}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
              <span className="hidden sm:inline">Generating...</span>
              <span className="sm:hidden">Generating...</span>
            </>
          ) : (
            <>
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Download Report</span>
              <span className="sm:hidden">Download</span>
            </>
          )}
        </Button>
        <DialogHeader className="mt-12 sm:mt-16">
          <DialogTitle className="text-lg sm:text-2xl font-bold text-center mb-2">
            Student Report
          </DialogTitle>
          <p className="text-center text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            A Clear View of Academic Growth
          </p>
        </DialogHeader>

        <div
          ref={reportRef}
          className="space-y-4 sm:space-y-6 bg-[#F8F9FD] p-3 sm:p-6 rounded-2xl w-full overflow-hidden"
        >
          {/* Student Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Student Name Card - Blue background */}
            <Card className="bg-blue-600 text-white">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm opacity-90">
                      Student Name
                    </p>
                    <p className="text-lg sm:text-xl font-bold">
                      {data.studentName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Card */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Class</p>
                  <p className="text-base sm:text-lg font-semibold">
                    {data.class}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* School Name Card */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    School Name
                  </p>
                  <p className="text-base sm:text-lg font-semibold">
                    {data.schoolName}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            <Card className="bg-white border-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between h-full">
                  <p className="text-sm font-medium text-blue-600">
                    TOTAL POINTS
                  </p>
                  <div className="bg-gray-100 rounded-xl px-4 py-2">
                    <p className="text-lg font-bold text-blue-600">
                      {data.totalPoints}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between h-full">
                  <p className="text-sm font-medium text-blue-600">
                    TOTAL USAGE
                  </p>
                  <div className="bg-gray-100 rounded-xl px-4 py-2">
                    <p className="text-lg font-bold text-blue-600">
                      {totalUsageDisplay}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lesson mode completion */}
          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-blue-600">
                        MODES
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-600">
                        COMPLETED MODES
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-600">
                        INCOMPLETE MODES
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modesData?.map((model, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4 font-medium">{model.name}</td>
                        <td className="py-3 px-4 text-center">
                          {model.completedModes}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold text-blue-600">
                            {model.incompleteModes}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-xl font-bold text-blue-600 mt-8 mb-4 ms-2">
            Speech Assessment
          </h2>

          {/* Assessment Data */}
          {assessmentData.length > 0 && (
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-blue-600">
                          DATE
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-blue-600">
                          ACCURACY
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-blue-600">
                          FLUENCY
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-blue-600">
                          PRONUNCIATION
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-blue-600">
                          TOTAL SCORE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessmentData.map((assessment, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4 font-medium">
                            {assessment.date}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {assessment.averageAccuracy}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {assessment.averageFluency}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {assessment.averagePronunciation}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-semibold text-blue-600">
                              {assessment.totalAssessmentScore}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Awards and Recognition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Certifications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-blue-600">
                  CERTIFICATION
                </h3>
                <hr />
                <div className="space-y-3 mt-6">
                  {certificates.length > 0 ? (
                    certificates.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 16 17"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              opacity="0.5"
                              d="M1.29166 5.85156V8.4349C1.29166 10.2616 1.29166 11.1749 1.85914 11.7424C2.16679 12.0501 2.57608 12.1909 3.17743 12.2554C3.22522 12.1909 3.27046 12.1401 3.30274 12.1046C3.37776 12.0221 3.47289 11.9283 3.56512 11.8374L4.5293 10.8866L4.88538 10.5259C5.11939 9.15509 6.31277 8.11198 7.75004 8.11198C9.18731 8.11198 10.3807 9.15509 10.6147 10.5259L10.9708 10.8866L11.935 11.8374C12.0272 11.9283 12.1223 12.0221 12.1973 12.1046C12.2296 12.1401 12.2748 12.1909 12.3226 12.2554C12.924 12.1909 13.3332 12.05 13.6409 11.7424C14.2083 11.1749 14.2083 10.2616 14.2083 8.4349V5.85156C14.2083 4.02487 14.2083 3.11152 13.6409 2.54404C13.0734 1.97656 12.16 1.97656 10.3333 1.97656H5.16666C3.33997 1.97656 2.42663 1.97656 1.85914 2.54404C1.29166 3.11152 1.29166 4.02487 1.29166 5.85156Z"
                              fill="#065FF0"
                            />
                            <path
                              d="M4.52084 6.33586C4.25332 6.33586 4.03646 6.55272 4.03646 6.82023C4.03646 7.08774 4.25332 7.30461 4.52084 7.30461H10.9792C11.2467 7.30461 11.4635 7.08774 11.4635 6.82023C11.4635 6.55272 11.2467 6.33586 10.9792 6.33586H4.52084Z"
                              fill="#065FF0"
                            />
                            <path
                              d="M5.32813 4.55981C5.32813 4.2923 5.54499 4.07544 5.8125 4.07544H9.6875C9.95502 4.07544 10.1719 4.2923 10.1719 4.55981C10.1719 4.82733 9.95502 5.04419 9.6875 5.04419H5.8125C5.54499 5.04419 5.32813 4.82733 5.32813 4.55981Z"
                              fill="#065FF0"
                            />
                            <path
                              d="M5.81322 10.9647C5.81274 10.9825 5.8125 11.0002 5.8125 11.0181C5.8125 12.0881 6.67995 12.9556 7.75 12.9556C8.82005 12.9556 9.6875 12.0881 9.6875 11.0181C9.6875 11.0002 9.68726 10.9825 9.68678 10.9647C9.65853 9.91934 8.80222 9.08057 7.75 9.08057C6.74683 9.08057 5.92172 9.84297 5.8225 10.82C5.81765 10.8677 5.81454 10.916 5.81322 10.9647Z"
                              fill="#065FF0"
                            />
                            <path
                              d="M4.95722 11.8249L4.25942 12.513C4.05013 12.7194 3.94548 12.8226 3.90927 12.91C3.82675 13.1092 3.89737 13.3301 4.07704 13.4348C4.15588 13.4808 4.2981 13.4951 4.58253 13.5238C4.74313 13.5399 4.82342 13.548 4.89068 13.5726C5.04124 13.6275 5.15837 13.743 5.2141 13.8915C5.239 13.9578 5.2472 14.037 5.26361 14.1954C5.29266 14.4758 5.30719 14.6161 5.35381 14.6938C5.46004 14.871 5.68405 14.9406 5.886 14.8593C5.97462 14.8236 6.07927 14.7204 6.28856 14.514L6.98633 13.8229C6.00951 13.5576 5.23717 12.7956 4.95722 11.8249Z"
                              fill="#065FF0"
                            />
                            <path
                              d="M8.51367 13.8229L9.21144 14.514C9.42073 14.7204 9.52538 14.8236 9.614 14.8593C9.81595 14.9406 10.04 14.871 10.1462 14.6938C10.1928 14.6161 10.2073 14.4758 10.2364 14.1954C10.2528 14.037 10.261 13.9578 10.2859 13.8915C10.3416 13.743 10.4588 13.6275 10.6093 13.5726C10.6766 13.548 10.7569 13.5399 10.9175 13.5238C11.2019 13.4951 11.3441 13.4808 11.423 13.4348C11.6026 13.3301 11.6733 13.1092 11.5907 12.91C11.5545 12.8226 11.4499 12.7194 11.2406 12.513L10.5428 11.8249C10.2628 12.7956 9.49049 13.5576 8.51367 13.8229Z"
                              fill="#065FF0"
                            />
                          </svg>
                        </div>
                        <span className="text-sm">{achievement.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No certificates earned yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rewards */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-blue-600">
                  REWARDS
                </h3>
                <hr />
                <div className="space-y-3 mt-6">
                  {rewards.length > 0 ? (
                    rewards.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg
                            width="16"
                            height="17"
                            viewBox="0 0 16 17"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              opacity="0.4"
                              d="M12.125 13.9243H11.4792V13.7628C11.4792 13.0524 10.8979 12.4711 10.1875 12.4711H8.73438V10.9922C8.57292 11.0116 8.41146 11.018 8.25 11.018C8.08854 11.018 7.92708 11.0116 7.76563 10.9922V12.4711H6.3125C5.60208 12.4711 5.02083 13.0524 5.02083 13.7628V13.9243H4.375C4.11021 13.9243 3.89062 14.1439 3.89062 14.4086C3.89062 14.6734 4.11021 14.893 4.375 14.893H12.125C12.3898 14.893 12.6094 14.6734 12.6094 14.4086C12.6094 14.1439 12.3898 13.9243 12.125 13.9243Z"
                              fill="#065FF0"
                            />
                            <path
                              opacity="0.4"
                              d="M4.065 8.2024C3.63875 8.04094 3.26417 7.77615 2.96709 7.47906C2.36646 6.81385 1.9725 6.01948 1.9725 5.08948C1.9725 4.15948 2.7023 3.42969 3.6323 3.42969H3.99396C3.82605 3.77198 3.72917 4.15302 3.72917 4.5599V6.4974C3.72917 7.10448 3.84542 7.67927 4.065 8.2024Z"
                              fill="#065FF0"
                            />
                            <path
                              opacity="0.4"
                              d="M14.5275 5.08948C14.5275 6.01948 14.1335 6.81385 13.5329 7.47906C13.2358 7.77615 12.8612 8.04094 12.435 8.2024C12.6546 7.67927 12.7708 7.10448 12.7708 6.4974V4.5599C12.7708 4.15302 12.674 3.77198 12.506 3.42969H12.8677C13.7977 3.42969 14.5275 4.15948 14.5275 5.08948Z"
                              fill="#065FF0"
                            />
                            <path
                              d="M10.1875 1.97656H6.31251C4.88521 1.97656 3.72917 3.1326 3.72917 4.5599V6.4974C3.72917 8.99677 5.75063 11.0182 8.25001 11.0182C10.7494 11.0182 12.7708 8.99677 12.7708 6.4974V4.5599C12.7708 3.1326 11.6148 1.97656 10.1875 1.97656ZM10.0842 6.14219L9.68376 6.63302C9.61917 6.70406 9.57396 6.84615 9.58042 6.94302L9.61917 7.57594C9.64501 7.96344 9.3673 8.16365 9.00563 8.02156L8.41792 7.78906C8.32751 7.75677 8.17251 7.75677 8.08209 7.78906L7.49438 8.02156C7.13271 8.16365 6.85501 7.96344 6.88084 7.57594L6.91959 6.94302C6.92605 6.84615 6.88084 6.70406 6.81626 6.63302L6.41584 6.14219C6.16396 5.8451 6.27376 5.51573 6.64834 5.41885L7.26188 5.26385C7.35876 5.23802 7.47501 5.1476 7.52667 5.06365L7.86896 4.53406C8.08209 4.20469 8.41792 4.20469 8.63105 4.53406L8.97334 5.06365C9.02501 5.1476 9.14126 5.23802 9.23813 5.26385L9.85167 5.41885C10.2263 5.51573 10.336 5.8451 10.0842 6.14219Z"
                              fill="#065FF0"
                            />
                            <path
                              opacity="0.4"
                              d="M10.0842 6.14202L9.68376 6.63285C9.61918 6.7039 9.57397 6.84598 9.58043 6.94285L9.61918 7.57577C9.64501 7.96327 9.3673 8.16348 9.00563 8.0214L8.41793 7.7889C8.32751 7.75661 8.17251 7.75661 8.08209 7.7889L7.49438 8.0214C7.13272 8.16348 6.85501 7.96327 6.88084 7.57577L6.91959 6.94285C6.92605 6.84598 6.88084 6.7039 6.81626 6.63285L6.41584 6.14202C6.16397 5.84494 6.27376 5.51556 6.64834 5.41869L7.26188 5.26369C7.35876 5.23785 7.47501 5.14744 7.52668 5.06348L7.86897 4.5339C8.08209 4.20452 8.41793 4.20452 8.63105 4.5339L8.97334 5.06348C9.02501 5.14744 9.14126 5.23785 9.23813 5.26369L9.85168 5.41869C10.2263 5.51556 10.3361 5.84494 10.0842 6.14202Z"
                              fill="#065FF0"
                            />
                          </svg>
                        </div>
                        <span className="text-sm">{achievement.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No rewards earned yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
