"use client";

import { LabelList, Pie, PieChart } from "recharts";

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

export default function Min3Income({ min3income }) {
  const chartData = [
    {
      browser: min3income[0]?.product__name,
      visitors: min3income[0]?.accepted_quantity,
      fill: "#20B2AA",
    },
    {
      browser: min3income[1]?.product__name,
      visitors: min3income[1]?.accepted_quantity,
      fill: "#FF69B4",
    },
    {
      browser: min3income[2]?.product__name,
      visitors: min3income[2]?.accepted_quantity,
      fill: "#B22222",
    },
  ];

  const chartConfig = {
    visitors: {
      label: "Miqdori",
    },
    [min3income[0]?.product__name]: {
      label: min3income[0]?.product__name,
      color: "#20B2AA",
    },
    [min3income[1]?.product__name]: {
      label: min3income[1]?.product__name,
      color: "#FF69B4",
    },
    [min3income[2]?.product__name]: {
      label: min3income[2]?.product__name,
      color: "#B22222",
    },
  };
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Eng kam kirim qilingan mahsulotlar</CardTitle>
        <CardDescription>Butun davr mobaynida</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] [&_.recharts-text]:fill-background"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="visitors" hideLabel />}
            />
            <Pie data={chartData} dataKey="visitors">
              <LabelList
                dataKey="browser"
                className="fill-background"
                stroke="none"
                fontSize={12}
                formatter={(value) => chartConfig[value]?.label}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
