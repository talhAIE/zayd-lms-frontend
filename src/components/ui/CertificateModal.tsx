import React, { useRef } from "react";
import { X, Download } from "lucide-react";
import html2canvas from "html2canvas";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  user: any;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  course,
  user,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const studentName = [user?.firstName, user?.lastName]
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    .join(' ')
    || user?.name
    || user?.username
    || 'Student Name';
  const certificateFilePart = (value: string) =>
    value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');

  if (!isOpen || !course) return null;

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    try {
      await document.fonts.ready;
      const canvas = await html2canvas(certificateRef.current, { scale: 2 });
      const link = document.createElement("a");
      link.download = `${certificateFilePart(studentName)}_${certificateFilePart(course.title || 'Course')}_${certificateFilePart(course.code || 'Course')}_Certificate.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to download certificate", err);
    }
  };

  const getOrdinalSuffix = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const dateObj = new Date();
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString("en-US", { month: "long" });
  const year = dateObj.getFullYear();
  const formattedDate = `${day}${getOrdinalSuffix(day)} of ${month}, ${year}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap');
        `}
      </style>
      <div
        className="relative w-full max-w-[950px] flex flex-col gap-4 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Actions */}
        <div className="flex justify-end items-center gap-2 w-full">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-[#0F1450] font-semibold rounded-full shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Download</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 rounded-full shadow-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Container */}
        <div
          ref={certificateRef}
          className="bg-[#F6F8F9] shrink-0 w-full relative overflow-hidden shadow-2xl rounded-sm"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {/* Inner Border (Teal) */}
          <div className="absolute inset-4 sm:inset-6 border-[6px] border-[#14B8A6]/30 rounded-lg z-0 pointer-events-none" />

          {/* BACKGROUND DECORATIONS (Z-10) */}

          {/* Top Edge Banner */}
          <div className="absolute top-0 right-[20%] flex h-4 sm:h-6 z-10">
            <div className="w-10 sm:w-16 h-full bg-[#4AA9E9]" />
            <div className="w-10 sm:w-16 h-full bg-[#007BCE]" />
            <div className="w-10 sm:w-16 h-full bg-[#F7941D]" />
            <div className="w-10 sm:w-16 h-full bg-[#F4B325]" />
            <div className="w-10 sm:w-16 h-full bg-[#4AA9E9]" />
            <div className="w-10 sm:w-16 h-full bg-[#007BCE]" />
          </div>

          {/* Bottom Right Paint Splatter */}
          <div className="absolute bottom-0 right-0 flex items-end z-10 opacity-90">
            <div className="w-6 h-[100px] bg-[#F4B325] rounded-t-full shadow-sm" />
            <div className="w-10 h-[220px] bg-[#F7941D] rounded-t-full -ml-2 shadow-sm" />
            <div className="w-8 h-[140px] bg-[#007BCE] rounded-t-full -ml-3 shadow-sm" />
            <div className="w-12 h-[280px] bg-[#4AA9E9] rounded-t-full -ml-4 shadow-sm" />
            <div className="w-8 h-[120px] bg-[#F4B325] rounded-t-full -ml-2 shadow-sm" />
            <div className="w-4 h-[50px] bg-[#F7941D] rounded-t-full -ml-1" />
          </div>

          {/* Bottom Left Paint Splatter */}
          <div className="absolute bottom-0 left-0 flex items-end z-10 opacity-90">
            <div className="w-12 h-[120px] bg-[#4AA9E9] rounded-t-full shadow-sm" />
            <div className="w-10 h-[80px] bg-[#007BCE] rounded-t-full -ml-3 shadow-sm" />
            <div className="w-12 h-[160px] bg-[#F7941D] rounded-t-full -ml-4 shadow-sm" />
            <div className="w-10 h-[100px] bg-[#F4B325] rounded-t-full -ml-3 shadow-sm" />
            <div className="w-12 h-[70px] bg-[#4AA9E9] rounded-t-full -ml-4 shadow-sm" />
            <div className="w-10 h-[130px] bg-[#007BCE] rounded-t-full -ml-3 shadow-sm" />
            <div className="w-8 h-[60px] bg-[#F7941D] rounded-t-full -ml-2 shadow-sm" />
          </div>



          {/* MAIN CONTENT FRAME - Z-30 */}
          <div className="relative w-full aspect-[1.41/1] px-12 sm:px-24 py-16 sm:py-24 flex flex-col items-center text-center z-30">
            <h4 className="text-[#333333] font-bold text-base sm:text-lg mb-2 mt-4">
              Zayd AI Learning
            </h4>

            {/* TEAL TITLE */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl text-[#14B8A6] mb-6 font-[800] tracking-tight uppercase">
              Certificate of Completion
            </h1>

            <p className="text-[#333333] text-base sm:text-lg font-semibold mb-2">
              This certificate is proudly awarded to
            </p>

            <div className="flex flex-col items-center mb-6 w-full px-4">
              {/* BLUE NAME */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-[800] text-[#2563EB] mb-2 leading-tight break-words max-w-full">
                {studentName}
              </h2>
            </div>

            <p className="text-[#555555] text-sm sm:text-base md:text-[17px] font-medium max-w-2xl mx-auto mb-6 leading-relaxed px-4">
              for consistently showing outstanding effort, curiosity, and
              dedication at Zayd AI Learning. We applaud{" "}
              {studentName} for being a shining role
              model in the virtual classroom and beyond.
            </p>

            <p className="text-[#333333] text-base sm:text-lg font-bold mb-8 sm:mb-12">
              Awarded on the {formattedDate}.
            </p>

            {/* Signature Area */}
            <div className="flex flex-col items-center mt-auto pb-4">
              <div className="w-48 sm:w-64 h-[2px] bg-[#94A3B8] mb-2" />
              <span className="text-lg sm:text-xl font-[800] text-[#14B8A6]">
                Zayd AI
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#333333]">
                Awesome Instructor
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
