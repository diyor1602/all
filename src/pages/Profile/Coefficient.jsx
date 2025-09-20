import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

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

// ✅ Build data from userData
function buildChartData(userData) {
  const logs = userData?.employee_tarification_logs || [];

  const grouped = logs.reduce((acc, log) => {
    const date = log.date; // keep full YYYY-MM-DD
    const qty = parseInt(log.quantity || 0);
    const seconds =
      parseFloat(log.tarification?.second || 0) * (log.quantity || 0);

    if (!acc[date]) {
      acc[date] = { quantity: 0, seconds: 0 };
    }
    acc[date].quantity += qty;
    acc[date].seconds += seconds;
    return acc;
  }, {});

  // convert to array, filter out 0s
  return Object.entries(grouped)
    .map(([date, vals]) => ({
      date,
      quantity: vals.quantity,
      percentage: vals.seconds > 0 ? (vals.seconds / 30000) * 100 : 0, // 500 min = 30000 sec
    }))
    .filter((d) => d.quantity > 0 || d.percentage > 0) // remove empty days
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

const chartConfig = {
  quantity: {
    label: "Miqdor (dona)",
    color: "#000",
  },
  percentage: {
    label: "Foiz (500 daq. nisbatan)",
    color: "#000",
  },
};

export default function Coefficient({ userData }) {
  const chartData = React.useMemo(() => buildChartData(userData), [userData]);
  const [activeChart, setActiveChart] = React.useState("quantity");

  const total = React.useMemo(
    () => ({
      quantity: chartData.reduce((acc, curr) => acc + curr.quantity, 0),
      percentage: Math.round(
        chartData.reduce((acc, curr) => acc + curr.percentage, 0) /
          (chartData.length || 1)
      ), // avg % per day
    }),
    [chartData]
  );

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Ish Ko‘rsatkichlari</CardTitle>
          <CardDescription>
            Kunlik ishlab chiqilgan miqdor va 500 daqiqaga nisbatan foiz
          </CardDescription>
        </div>
        <div className="flex">
          {["quantity", "percentage"].map((key) => {
            const chart = key;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[chart].toLocaleString()}
                  {chart === "percentage" && "%"}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="value"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
