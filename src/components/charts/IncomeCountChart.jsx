"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

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

export default function IncomeCountChart({ income_count }) {
  const chartData = [
    {
      name: "Ishlab chiqarish",
      quantity: income_count?.production_count,
    },
    {
      name: "Perevod",
      quantity: income_count?.transfer_count,
    },
    {
      name: "Mijoz",
      quantity: income_count?.customer_count,
    },
    {
      name: "Bozor",
      quantity: income_count?.market_count,
    },
    {
      name: "Qoralama",
      quantity: income_count?.draft_count,
    },
    {
      name: "Bekor qilingan",
      quantity: income_count?.rejected_count,
    },
    {
      name: "Tasdiqlangan",
      quantity: income_count?.completed_count,
    },
  ];

  const chartConfig = {
    quantity: {
      label: "Miqdori",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kirim</CardTitle>
        <CardDescription>Kirim turlari bo'yicha taqsimod</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 10)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="quantity" fill="green" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
