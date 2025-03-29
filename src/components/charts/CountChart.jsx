"use client";

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

export default function CountChart({ outcome_count, income_count }) {
  const [activeChart, setActiveChart] = React.useState("income");

  const chartData = [
    {
      date: "Ishlab chiqarish",
      income: income_count[0].production_count,
      outcome: outcome_count[0].production_count,
    },
    {
      date: "Bozor",
      income: income_count[0].transfer_count,
      outcome: outcome_count[0].transfer_count,
    },
    {
      date: "Mijoz",
      income: income_count[0].customer_count,
      outcome: outcome_count[0].customer_count,
    },
    {
      date: "Ishlab chiqarish",
      income: income_count[0].production_count,
      outcome: outcome_count[0].production_count,
    },
    {
      date: "Tasdiqlangan",
      income: income_count[0].completed_count,
      outcome: outcome_count[0].completed_count,
    },
    {
      date: "Qoralama",
      income: income_count[0].draft_count,
      outcome: outcome_count[0].draft_count,
    },
  ];

  const chartConfig = {
    views: {
      label: "Miqdori",
    },
    income: {
      label: "Kirim",
      color: "hsl(var(--chart-1))",
    },
    outcome: {
      label: "Chiqim",
      color: "hsl(var(--chart-2))",
    },
  };

  const total = React.useMemo(
    () => ({
      income: chartData.reduce((acc, curr) => acc + curr.income, 0),
      outcome: chartData.reduce((acc, curr) => acc + curr.outcome, 0),
    }),
    []
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Line Chart - Interactive</CardTitle>
          <CardDescription>
            Showing total visitors for the last 3 months
          </CardDescription>
        </div>
        <div className="flex">
          {["income", "outcome"].map((key) => {
            const chart = key;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key].toLocaleString()}
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
            />
            <ChartTooltip
              content={
                <ChartTooltipContent className="w-[150px]" nameKey="views" />
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
