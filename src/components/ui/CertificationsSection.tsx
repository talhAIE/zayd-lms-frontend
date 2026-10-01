import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CertificationsSectionProps {
  achievements?: Array<{
    id: string;
    name: string;
    description: string;
    pointValue: number;
    awardedAt: string;
    iconUrl: string;
    category: string;
  }>;
}

export function CertificationsSection({
  achievements,
}: CertificationsSectionProps) {
  const certificates = achievements?.filter(
    (achievement) => achievement.category === "certificate"
  ) ?? [];
  const rewards = achievements?.filter(
    (achievement) => achievement.category !== "certificate"
  ) ?? [];
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="w-full bg-white shadow-sm">
      <CardHeader className="pb-4">
        <Tabs defaultValue="certifications" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="certifications"
              className="truncate text-xs sm:text-sm [@media(min-width:1023px)_and_(max-width:1380px)]:text-[12px]"
            >
              Certifications
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="truncate text-xs sm:text-sm [@media(min-width:1023px)_and_(max-width:1380px)]:text-[12px]"
            >
              Rewards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="certifications" className="mt-4">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {certificates.length > 0 ? (
                certificates.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {achievement.iconUrl ? (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6BBCFB] to-[#BAE1FF] flex items-center justify-center flex-shrink-0 p-1.5">
                          <img
                            src={achievement.iconUrl}
                            alt={achievement.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6BBCFB] to-[#BAE1FF] flex-shrink-0 flex items-center justify-center">
                          <span className="text-xs text-white">No icon</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">
                          Awarded {formatDate(achievement.awardedAt)}
                        </p>
                        <p className="mt-1 text-sm font-bold text-gray-800 break-words">
                          {achievement.name}
                        </p>
                        <p className="text-xs text-gray-600 break-words leading-relaxed">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No certifications yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="mt-4">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {rewards.length > 0 ? (
                rewards.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {achievement.iconUrl ? (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6BBCFB] to-[#BAE1FF] flex items-center justify-center flex-shrink-0 p-1.5">
                          <img
                            src={achievement.iconUrl}
                            alt={achievement.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6BBCFB] to-[#BAE1FF] flex-shrink-0 flex items-center justify-center">
                          <span className="text-xs text-white">No icon</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 break-words">
                          {achievement.name}
                        </p>
                        <p className="text-xs text-gray-600 break-words leading-relaxed">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {achievement.category} •{" "}
                          {formatDate(achievement.awardedAt)}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No rewards yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}
