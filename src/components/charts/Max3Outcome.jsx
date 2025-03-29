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

export default function Max3Outcome({ max3outcome }) {
  const chartData = [
    {
      browser: max3outcome[0]?.product__name,
      visitors: max3outcome[0]?.quantity,
      fill: "#FFD700",
    },
    {
      browser: max3outcome[1]?.product__name,
      visitors: max3outcome[1]?.quantity,
      fill: "#8A2BE2",
    },
    {
      browser: max3outcome[2]?.product__name,
      visitors: max3outcome[2]?.quantity,
      fill: "#FF4500",
    },
  ];

  const chartConfig = {
    visitors: {
      label: "Miqdori",
    },
    [max3outcome[0]?.product__name]: {
      label: max3outcome[0]?.product__name,
      color: "#FFD700",
    },
    [max3outcome[1]?.product__name]: {
      label: max3outcome[1]?.product__name,
      color: "#8A2BE2",
    },
    [max3outcome[2]?.product__name]: {
      label: max3outcome[2]?.product__name,
      color: "#FF4500",
    },
  };
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Eng ko'p chiqim qilingan mahsulotlar</CardTitle>
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
