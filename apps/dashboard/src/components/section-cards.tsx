import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@eq-ex/ui/components/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";

export function SectionCards({
  kpi,
}: {
  kpi: {
    stamps: { value: number; change: number };
    newCustomers: { value: number; change: number };
    activeCustomers: { value: number; change: number };
    redemptions: { value: number; change: number };
  };
}) {
  const renderTrend = (change: number) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? IconTrendingUp : IconTrendingDown;
    const colorClass = isPositive ? "text-green-500" : "text-red-500";
    // For redemptions/stamps/customers, positive is usually good.
    // If we had "churn", positive would be bad. Assuming positive is good for all these.

    return (
      <Badge variant="outline" className={colorClass}>
        <Icon className="mr-1 size-3" />
        {Math.abs(change)}%
      </Badge>
    );
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Stamps (30d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpi.stamps.value.toLocaleString()}
          </CardTitle>
          <CardAction>{renderTrend(kpi.stamps.change)}</CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            vs previous 30 days
          </div>
          <div className="text-muted-foreground">
            Total stamps issued to customers
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers (30d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpi.newCustomers.value.toLocaleString()}
          </CardTitle>
          <CardAction>{renderTrend(kpi.newCustomers.change)}</CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            vs previous 30 days
          </div>
          <div className="text-muted-foreground">
            Acquisition in last 30 days
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Customers (30d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpi.activeCustomers.value.toLocaleString()}
          </CardTitle>
          <CardAction>{renderTrend(kpi.activeCustomers.change)}</CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            vs previous 30 days
          </div>
          <div className="text-muted-foreground">Returning customers</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Redemptions (30d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpi.redemptions.value.toLocaleString()}
          </CardTitle>
          <CardAction>{renderTrend(kpi.redemptions.change)}</CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            vs previous 30 days
          </div>
          <div className="text-muted-foreground">Rewards claimed</div>
        </CardFooter>
      </Card>
    </div>
  );
}
