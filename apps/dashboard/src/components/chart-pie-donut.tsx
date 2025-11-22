"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@eq-ex/ui/components/chart";

export const description = "A donut chart with text";

const chartConfig = {
  count: {
    label: "Count",
  },
  segment: {
    label: "Segment",
  },
} satisfies ChartConfig;

export function ChartPieDonut({
  data,
}: {
  data: { segment: string; count: number; fill: string }[];
}) {
  const totalVisitors = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0);
  }, [data]);

  const largestSegment = React.useMemo(() => {
    if (!data.length) return null;
    return data.reduce((prev, current) =>
      prev.count > current.count ? prev : current
    );
  }, [data]);

  return (
    <Card className="flex flex-col @container/card">
      <CardHeader className="items-center pb-0">
        <CardTitle>Customer Segments</CardTitle>
        <CardDescription>Current customer base distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="segment"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Customers
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        {largestSegment && (
          <div className="flex items-center gap-2 font-medium leading-none">
            Largest segment: {largestSegment.segment} ({largestSegment.count})
          </div>
        )}
        <div className="leading-none text-muted-foreground">
          Showing total customers by segment
        </div>
      </CardFooter>
    </Card>
  );
}
