"use client";

import * as React from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

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
export const description = "A mixed bar chart";

const chartConfig = {
  count: {
    label: "Stamps",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ChartBarMixed({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  const maxDay = React.useMemo(() => {
    if (!data.length) return null;
    return data.reduce((prev, current) =>
      prev.count > current.count ? prev : current
    );
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak Activity</CardTitle>
        <CardDescription>Stamps by day of week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 0,
            }}
          >
            <XAxis
              dataKey="day"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={5} fill="var(--color-count)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {maxDay && (
          <div className="flex gap-2 font-medium leading-none">
            Busiest day: {maxDay.day} ({maxDay.count} stamps)
          </div>
        )}
        <div className="leading-none text-muted-foreground">
          Showing total stamps for the last 3 months
        </div>
      </CardFooter>
    </Card>
  );
}
