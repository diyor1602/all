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

export default function OutcomeCountChart({ outcome_count }) {
  const chartData = [
    {
      name: "Ishlab chiqarish",
      quantity: outcome_count?.production_count,
    },
    {
      name: "Perevod",
      quantity: outcome_count?.transfer_count,
    },
    {
      name: "Mijoz",
      quantity: outcome_count?.customer_count,
    },
    {
      name: "Kamomad",
      quantity: outcome_count?.shortage_count,
    },
    {
      name: "Qoralama",
      quantity: outcome_count?.draft_count,
    },
    {
      name: "Jo'natilgan",
      quantity: outcome_count?.sent_count,
    },
    {
      name: "Bekor qilingan",
      quantity: outcome_count?.cancelled_count,
    },
    {
      name: "Tasdiqlangan",
      quantity: outcome_count?.completed_count,
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
        <CardTitle>Chiqim</CardTitle>
        <CardDescription>Chiqim turlari bo'yicha taqsimod</CardDescription>
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
            <Bar dataKey="quantity" fill="red" radius={8}>
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
