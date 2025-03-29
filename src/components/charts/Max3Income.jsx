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

export default function Max3Income({ max3income }) {
  const chartData = [
    {
      browser: max3income[0]?.product__name,
      visitors: max3income[0]?.accepted_quantity,
      fill: "#DA70D6",
    },
    {
      browser: max3income[1]?.product__name,
      visitors: max3income[1]?.accepted_quantity,
      fill: "#7FFF00",
    },
    {
      browser: max3income[2]?.product__name,
      visitors: max3income[2]?.accepted_quantity,
      fill: "#1E90FF",
    },
  ];

  const chartConfig = {
    visitors: {
      label: "Miqdori",
    },
    [max3income[0]?.product__name]: {
      label: max3income[0]?.product__name,
      color: "#DA70D6",
    },
    [max3income[1]?.product__name]: {
      label: max3income[1]?.product__name,
      color: "#7FFF00",
    },
    [max3income[2]?.product__name]: {
      label: max3income[2]?.product__name,
      color: "#1E90FF",
    },
  };
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Eng ko'p kirim qilingan mahsulotlar</CardTitle>
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
