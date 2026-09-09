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

const getCurrentMonthMaxUsage = (
  usageData: Array<{ date: string; duration: number }>
) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthData = usageData.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate.getMonth() === currentMonth &&
      itemDate.getFullYear() === currentYear
    );
  });

  if (currentMonthData.length === 0) return 60;

  return Math.max(...currentMonthData.map((item) => item.duration));
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

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;

  if (payload.day === "Fri") {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#3B82F6"
        stroke="#ffffff"
        strokeWidth={2}
      />
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
  const maxUsage = usageData ? getCurrentMonthMaxUsage(usageData) : 60;

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
                dot={<CustomDot />}
                activeDot={{ r: 6, fill: "#3B82F6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
