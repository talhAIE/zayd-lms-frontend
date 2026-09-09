import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface LessonModeProgress {
  completed: number;
  incomplete: number;
  total: number;
}

interface RoleplayModeCardsProps {
  modesData?: Record<string, LessonModeProgress>;
}

export function RoleplayModeCards({ modesData }: RoleplayModeCardsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const formatModeName = (modeKey: string): string => {
    return (
      modeKey
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") + " Mode"
    );
  };

  const learningModes = modesData
    ? Object.entries(modesData).map(([modeKey, modeData]) => ({
        name: formatModeName(modeKey),
        key: modeKey,
        color: "#2DE000",
        completed: modeData.completed,
        incomplete: modeData.incomplete,
        total: modeData.total,
      }))
    : [];

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 304;
      scrollContainerRef.current.scrollBy({
        left: -cardWidth,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 304;
      scrollContainerRef.current.scrollBy({
        left: cardWidth,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScrollPosition, 100);
    return () => clearTimeout(timer);
  }, [learningModes]);

  return (
    <div className="relative mb-6 max-w-4xl mx-auto">
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-4 bg-white shadow-lg hover:bg-gray-50"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-4 bg-white shadow-lg hover:bg-gray-50"
          onClick={scrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide"
        onScroll={checkScrollPosition}
        onLoad={checkScrollPosition}
      >
        {learningModes.map((mode, index) => (
          <Card
            key={index}
            className="bg-white border border-gray-200 transition-shadow flex-shrink-0"
          >
            <CardContent className="p-2">
              <div className="text-center">
                <h3 className="text-md font-bold text-gray-800 mt-2">
                  {mode.name}
                </h3>
                <div className="flex">
                  <div className="p-4 flex items-center justify-center">
                    <div className="text-lg bg-[#F8F9FD] px-6 py-4 rounded-lg">
                      <span className="text-[#2DE000] font-bold">
                        {mode.completed || 0}
                      </span>
                      <br />
                      <span className="text-sm">Completed</span>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    <div className="text-lg bg-[#F8F9FD] px-6 py-4 rounded-lg">
                      <span className="text-[#FF6B6B] font-bold">
                        {mode.incomplete || 0}
                      </span>
                      <br />
                      <span className="text-sm">Incomplete</span>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    <div className="text-lg bg-[#F8F9FD] px-12 py-4 rounded-lg">
                      <span className="text-[#065FF0] font-bold">
                        {mode.total || 0}
                      </span>
                      <br />
                      <span className="text-sm">Total</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
