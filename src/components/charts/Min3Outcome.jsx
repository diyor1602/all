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

export default function Min3Outcome({ min3outcome }) {
  const chartData = [
    {
      browser: min3outcome[0]?.product__name,
      visitors: min3outcome[0]?.quantity,
      fill: "#FF6347",
    },
    {
      browser: min3outcome[1]?.product__name,
      visitors: min3outcome[1]?.quantity,
      fill: "#4682B4",
    },
    {
      browser: min3outcome[2]?.product__name,
      visitors: min3outcome[2]?.quantity,
      fill: "#32CD32",
    },
  ];

  const chartConfig = {
    visitors: {
      label: "Miqdori",
    },
    [min3outcome[0]?.product__name]: {
      label: min3outcome[0]?.product__name,
      color: "#FF6347",
    },
    [min3outcome[1]?.product__name]: {
      label: min3outcome[1]?.product__name,
      color: "#4682B4",
    },
    [min3outcome[2]?.product__name]: {
      label: min3outcome[2]?.product__name,
      color: "#32CD32",
    },
  };
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Eng kam chiqim qilingan mahsulotlar</CardTitle>
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
