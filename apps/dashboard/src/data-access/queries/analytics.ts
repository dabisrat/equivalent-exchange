"use server";

import { AsyncResult } from "@app/schemas/responses";
import {
  createClient as createServerClient,
  supabaseAdmin,
} from "@eq-ex/shared/server";
import { commonValidations } from "@app/schemas/common";

export type DashboardAnalytics = {
  kpi: {
    stamps: { value: number; change: number };
    newCustomers: { value: number; change: number };
    activeCustomers: { value: number; change: number };
    redemptions: { value: number; change: number };
  };
  trends: {
    date: string;
    stamps: number;
    redemptions: number;
  }[];
  peakActivity: {
    day: string;
    count: number;
  }[];
  segments: {
    segment: string;
    count: number;
    fill: string;
  }[];
  recentActivity: {
    id: string;
    customerName: string;
    action: string;
    staffName: string;
    date: string;
  }[];
};

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getDashboardAnalytics(
  organizationId: string
): AsyncResult<DashboardAnalytics> {
  try {
    const validatedOrgId = commonValidations.id.safeParse(organizationId);

    if (!validatedOrgId.success) {
      return { success: false, message: "Invalid organization ID" };
    }

    const supabase = await createServerClient();

    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Unauthorized" };
    }

    // Verify membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .single();

    if (membershipError || !membership) {
      return { success: false, message: "Access denied" };
    }

    // Time ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const currentPeriodStart = thirtyDaysAgo.toISOString();
    const previousPeriodStart = sixtyDaysAgo.toISOString();
    const previousPeriodEnd = thirtyDaysAgo.toISOString();

    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString();

    // Execute independent queries in parallel
    const [{ data: trendData }, { data: allCards }, { data: recentHistory }] =
      await Promise.all([
        // 1. Trends (Last 90 days) - Source for Stamps, Redemptions, Active Customers
        supabaseAdmin
          .from("transaction_history")
          .select("created_at, action_type, user_id")
          .eq("organization_id", organizationId)
          .in("action_type", ["stamp", "redeem"])
          .gte("created_at", ninetyDaysAgoStr)
          .order("created_at", { ascending: true }),

        // 2. Segments (All Cards) - Source for New Customers
        supabaseAdmin
          .from("reward_card")
          .select("points, created_at, user_id")
          .eq("organization_id", organizationId),

        // 3. Recent Activity
        supabaseAdmin
          .from("transaction_history")
          .select(
            `
        id,
        created_at,
        action_type,
        stamper_id,
        user_id
      `
          )
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    // --- Process Data for KPIs ---

    // Time boundaries
    const currentStart = thirtyDaysAgo.getTime();
    const previousStart = sixtyDaysAgo.getTime();
    const previousEnd = currentStart;

    // Initialize counters
    let currentStamps = 0;
    let previousStamps = 0;
    let currentRedemptions = 0;
    let previousRedemptions = 0;
    const currentActiveSet = new Set<string>();
    const previousActiveSet = new Set<string>();

    // Process trendData for Stamps, Redemptions, and Active Customers
    trendData?.forEach((t) => {
      const tTime = new Date(t.created_at).getTime();
      const isCurrent = tTime >= currentStart;
      const isPrevious = tTime >= previousStart && tTime < previousEnd;

      if (isCurrent || isPrevious) {
        if (t.action_type === "stamp") {
          if (isCurrent) {
            currentStamps++;
            currentActiveSet.add(t.user_id);
          } else {
            previousStamps++;
            previousActiveSet.add(t.user_id);
          }
        } else if (t.action_type === "redeem") {
          if (isCurrent) currentRedemptions++;
          else previousRedemptions++;
        }
      }
    });

    // Process allCards for New Customers
    let currentNewCustomers = 0;
    let previousNewCustomers = 0;

    allCards?.forEach((c) => {
      const cTime = new Date(c.created_at).getTime();
      if (cTime >= currentStart) {
        currentNewCustomers++;
      } else if (cTime >= previousStart && cTime < previousEnd) {
        previousNewCustomers++;
      }
    });

    const currentActiveCount = currentActiveSet.size;
    const previousActiveCount = previousActiveSet.size;

    // --- Process Trends Chart ---
    const trendsMap = new Map<
      string,
      { stamps: number; redemptions: number }
    >();
    // Initialize last 90 days with 0
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendsMap.set(d.toISOString().split("T")[0], {
        stamps: 0,
        redemptions: 0,
      });
    }

    // Track active users in the last 60 days for "At Risk" calculation
    const activeInLast60Days = new Set<string>();
    const sixtyDaysAgoTime = sixtyDaysAgo.getTime();

    trendData?.forEach((s) => {
      const date = s.created_at.split("T")[0];
      const current = trendsMap.get(date) || { stamps: 0, redemptions: 0 };
      if (s.action_type === "stamp") {
        current.stamps++;
      } else if (s.action_type === "redeem") {
        current.redemptions++;
      }
      trendsMap.set(date, current);

      // Check recency
      if (new Date(s.created_at).getTime() >= sixtyDaysAgoTime) {
        activeInLast60Days.add(s.user_id);
      }
    });

    const trends = Array.from(trendsMap.entries())
      .map(([date, counts]) => ({
        date,
        stamps: counts.stamps,
        redemptions: counts.redemptions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Process Peak Activity
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const peakMap = new Array(7).fill(0);

    trendData?.forEach((s) => {
      // Count both stamps and redemptions as activity
      const dayIndex = new Date(s.created_at).getDay();
      peakMap[dayIndex]++;
    });

    const peakActivity = daysOfWeek.map((day, index) => ({
      day,
      count: peakMap[index],
    }));

    // Process Segments
    let newCust = 0;
    let regular = 0;
    let loyal = 0;
    let atRisk = 0;

    allCards?.forEach((c) => {
      const isActiveRecently = activeInLast60Days.has(c.user_id);
      const isNewCard =
        new Date(c.created_at).getTime() >= thirtyDaysAgo.getTime();

      if (!isActiveRecently && !isNewCard) {
        // Not active in 60 days AND not a brand new card -> At Risk
        atRisk++;
      } else if (c.points <= 1) {
        newCust++;
      } else if (c.points <= 5) {
        regular++;
      } else {
        loyal++;
      }
    });

    const segments = [
      { segment: "New", count: newCust, fill: "var(--chart-1)" },
      { segment: "Regular", count: regular, fill: "var(--chart-2)" },
      { segment: "Loyal", count: loyal, fill: "var(--chart-3)" },
      { segment: "At Risk", count: atRisk, fill: "var(--chart-4)" },
    ];

    // Process Recent Activity (Fetch stampers AND customers)
    const stamperIds = [
      ...new Set(recentHistory?.map((s) => s.stamper_id).filter(Boolean)),
    ] as string[];

    const customerIds = [
      ...new Set(recentHistory?.map((s) => s.user_id).filter(Boolean)),
    ] as string[];

    // Fetch Stampers (Staff)
    const { data: stampers } = await supabaseAdmin
      .from("organization_members")
      .select("user_id, name")
      .in("user_id", stamperIds)
      .eq("organization_id", organizationId);

    const stamperMap = new Map(stampers?.map((s) => [s.user_id, s.name]));

    // Fetch Customers (Auth Users)
    // Note: listUsers doesn't support 'in' filter for IDs directly in a simple way for bulk
    // But we can iterate or use a workaround. For < 20 items, parallel requests are okay or we can just show IDs if this fails.
    // Actually, we can't easily bulk fetch users by ID list via admin API without a loop or specific filter.
    // Optimization: Since we only have 20 items max, we can just fetch them.
    // Better approach: Create a map of promises.

    const customerMap = new Map<string, string>();
    if (customerIds.length > 0) {
      // We'll fetch all users involved.
      // Since there isn't a "getUsersByIds" method, we will loop.
      // To avoid 20 requests, we can try to see if we can rely on metadata or just accept the N+1 for now (it's small N).
      // Alternatively, if we had a public profiles table, we'd use that.
      // Let's try to fetch them in parallel.
      await Promise.all(
        customerIds.map(async (uid) => {
          const {
            data: { user },
            error,
          } = await supabaseAdmin.auth.admin.getUserById(uid);
          if (user) {
            const name =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email;
            customerMap.set(uid, name);
          }
        })
      );
    }

    const recentActivity =
      recentHistory?.map((s) => ({
        id: s.id,
        customerName:
          customerMap.get(s.user_id) || `Customer ${s.user_id.slice(0, 4)}...`,
        action: s.action_type.charAt(0).toUpperCase() + s.action_type.slice(1),
        staffName: s.stamper_id
          ? stamperMap.get(s.stamper_id) || "Unknown"
          : "System",
        date: new Date(s.created_at).toLocaleDateString(),
      })) || [];

    return {
      success: true,
      data: {
        kpi: {
          stamps: {
            value: currentStamps || 0,
            change: calculateChange(currentStamps || 0, previousStamps || 0),
          },
          newCustomers: {
            value: currentNewCustomers || 0,
            change: calculateChange(
              currentNewCustomers || 0,
              previousNewCustomers || 0
            ),
          },
          activeCustomers: {
            value: currentActiveCount,
            change: calculateChange(currentActiveCount, previousActiveCount),
          },
          redemptions: {
            value: currentRedemptions || 0,
            change: calculateChange(
              currentRedemptions || 0,
              previousRedemptions || 0
            ),
          },
        },
        trends,
        peakActivity,
        segments,
        recentActivity,
      },
    };
  } catch (error) {
    console.error("Unexpected error fetching analytics:", error);
    return { success: false, message: "Error fetching analytics" };
  }
}
