import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const formatDateForDisplay = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getMaxUsage = (
  usageData: Array<{ date: string; duration: number }>
) => {
  if (usageData.length === 0) return 60;

  // The selected period can be weekly, monthly, or all time. Using only the
  // current month's maximum could clip historic points in an all-time graph.
  return Math.max(1, ...usageData.map((item) => item.duration));
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
        <p className="text-sm font-medium">{`${payload[0].value}min`}</p>
      </div>
    );
  }
  return null;
};

interface RevenueGraphProps {
  usageData?: Array<{
    date: string;
    duration: number;
  }>;
  periodLabel?: string;
}

export function RevenueGraph({ usageData, periodLabel = "This Month" }: RevenueGraphProps) {
  const maxUsage = usageData ? getMaxUsage(usageData) : 60;

  const chartData =
    usageData?.map((item) => ({
      day: formatDateForDisplay(item.date),
      minutes: item.duration,
      originalDate: item.date,
    })) || [];

  const totalUsage =
    usageData?.reduce((sum, item) => sum + item.duration, 0) || 0;
  const totalMinutes = totalUsage;
  return (
    <Card className="w-full bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">
          Usage Graph: {totalMinutes}min Total ({periodLabel})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#666" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#666" }}
                domain={[0, maxUsage]}
                tickFormatter={(value) => `${value}min`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="#3B82F6"
                strokeWidth={3}
                // A one-day activity series has no line segment. Always draw
                // data-point markers so valid single-day usage is visible.
                dot={{ r: 5, fill: "#3B82F6", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#3B82F6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
