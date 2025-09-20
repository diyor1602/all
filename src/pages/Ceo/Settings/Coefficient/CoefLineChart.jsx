import { CartesianGrid, Line, LineChart, XAxis, ReferenceLine } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  efficiency: {
    label: "Foiz",
    color: "#8B5DFF",
  },
};

export default function EfficiencyLineChart({ data: employee }) {
  // Convert days data into chart-friendly format
  const data = (employee?.days || []).map((d) => ({
    date: d.date.slice(5), // show only month-day
    efficiency: d.efficiency_percent,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kunlik foydali ish koefitsienti</CardTitle>
        <CardDescription>
          500 daqiqa uchun unumlilik hisoblangan
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full h-[400px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <LineChart
            width={800}
            height={350}
            data={data}
            margin={{
              left: 12,
              right: 12,
              top: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={{ stroke: "#8B5DFF", strokeWidth: 1 }}
              content={<ChartTooltipContent />}
            />
            <Line
              dataKey="efficiency"
              type="monotone"
              stroke="#8B5DFF"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <ReferenceLine y={100} stroke="red" strokeDasharray="4 4" />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
