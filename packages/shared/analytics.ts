import { createClient } from "./server";

export interface CustomerRetentionMetrics {
  totalCustomers: number;
  activeCustomers: number; // Stamped in last 30 days
  newCustomers: number; // Cards created in last 30 days
  returningCustomers: number; // Multiple stamps
  avgVisitsPerCustomer: number;
  retentionRate: number; // % who came back after first visit
  churnRisk: Array<{
    customerId: string;
    lastStampDate: Date;
    daysSinceLastVisit: number;
    totalStamps: number;
    riskLevel: "low" | "medium" | "high";
  }>;
}

export interface BusinessInsights {
  programROI: {
    totalRedemptions: number;
    avgStampsToRedeem: number;
    customerLifetimeStamps: number;
    redeemRate: number; // % of customers who reach max stamps
  };
  peakTimes: Array<{
    hour: number;
    day: string;
    stampCount: number;
  }>;
  teamPerformance: Array<{
    memberId: string;
    memberName: string;
    stampsGiven: number;
    customersServed: number;
    avgStampsPerCustomer: number;
  }>;
  growthTrends: {
    monthlyGrowth: number; // % growth in new customers
    weeklyStampVolume: number[];
    seasonalTrends: Array<{
      month: string;
      customerCount: number;
      avgStampsPerCustomer: number;
    }>;
  };
}

export interface LoyaltyProgramValue {
  estimatedRevenueImpact: number;
  customerSegments: {
    newCustomers: number;
    regularCustomers: number; // 3-9 stamps
    loyalCustomers: number; // 10+ stamps
    championCustomers: number; // Multiple redemptions
  };
  conversionFunnel: {
    totalVisitors: number;
    signedUpForLoyalty: number;
    completedFirstStamp: number;
    reachedHalfway: number;
    completedFullCard: number;
    conversionRate: number;
  };
}

export async function getCustomerRetentionMetrics(
  organizationId: string
): Promise<CustomerRetentionMetrics> {
  const supabase = await createClient();

  // Total customers
  const { data: totalCustomersData } = await supabase
    .from("reward_card")
    .select("id, created_at, user_id")
    .eq("organization_id", organizationId);

  const totalCustomers = totalCustomersData?.length || 0;

  // Active customers (stamped in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentStamps } = await supabase
    .from("stamp")
    .select(
      `
      reward_card_id,
      created_at,
      reward_card!inner(organization_id, user_id)
    `
    )
    .eq("reward_card.organization_id", organizationId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .eq("stamped", true);

  const activeCustomers = new Set(
    recentStamps?.map((s) => s.reward_card_id) || []
  ).size;

  // New customers (cards created in last 30 days)
  const { data: newCustomersData } = await supabase
    .from("reward_card")
    .select("id")
    .eq("organization_id", organizationId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const newCustomers = newCustomersData?.length || 0;

  // Calculate detailed customer analytics
  const { data: customerStampCounts } = await supabase
    .from("reward_card")
    .select(
      `
      id,
      user_id,
      created_at,
      stamp!inner(id, created_at, stamped)
    `
    )
    .eq("organization_id", organizationId)
    .eq("stamp.stamped", true);

  // Process customer behavior data
  const customerAnalytics =
    customerStampCounts?.map((card) => {
      const stamps = card.stamp.filter((s) => s.stamped);
      const lastStamp =
        stamps.length > 0
          ? new Date(
              Math.max(...stamps.map((s) => new Date(s.created_at).getTime()))
            )
          : null;
      const daysSinceLastVisit = lastStamp
        ? Math.floor((Date.now() - lastStamp.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      return {
        customerId: card.id,
        userId: card.user_id,
        totalStamps: stamps.length,
        lastStampDate: lastStamp,
        daysSinceLastVisit,
        cardCreated: new Date(card.created_at),
        isReturning: stamps.length > 1,
      };
    }) || [];

  const returningCustomers = customerAnalytics.filter(
    (c) => c.isReturning
  ).length;
  const avgVisitsPerCustomer =
    customerAnalytics.reduce((sum, c) => sum + c.totalStamps, 0) /
    Math.max(totalCustomers, 1);
  const retentionRate =
    totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

  // Churn risk analysis
  const churnRisk = customerAnalytics
    .filter((c) => c.totalStamps > 0) // Only customers who visited at least once
    .map((c) => {
      const riskLevel: "low" | "medium" | "high" =
        c.daysSinceLastVisit > 30
          ? "high"
          : c.daysSinceLastVisit > 14
            ? "medium"
            : "low";
      return {
        customerId: c.customerId,
        lastStampDate: c.lastStampDate!,
        daysSinceLastVisit: c.daysSinceLastVisit,
        totalStamps: c.totalStamps,
        riskLevel,
      };
    })
    .sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);

  return {
    totalCustomers,
    activeCustomers,
    newCustomers,
    returningCustomers,
    avgVisitsPerCustomer: Math.round(avgVisitsPerCustomer * 100) / 100,
    retentionRate: Math.round(retentionRate * 100) / 100,
    churnRisk: churnRisk.slice(0, 20), // Top 20 at-risk customers
  };
}

export async function getBusinessInsights(
  organizationId: string
): Promise<BusinessInsights> {
  const supabase = await createClient();

  // Get organization details for max_points
  const { data: org } = await supabase
    .from("organization")
    .select("max_points")
    .eq("id", organizationId)
    .single();

  const maxPoints = org?.max_points || 10;

  // Calculate redemptions (cards that hit max points then reset to 0)
  const { data: allCards } = await supabase
    .from("reward_card")
    .select(
      `
      id,
      points,
      created_at,
      stamp(id, created_at, stamped, stamper_id)
    `
    )
    .eq("organization_id", organizationId);

  let totalRedemptions = 0;
  let totalStampsGiven = 0;
  const stamperActivity: Record<
    string,
    { stamps: number; customers: Set<string> }
  > = {};

  allCards?.forEach((card) => {
    const stamps = card.stamp.filter((s) => s.stamped);
    totalStampsGiven += stamps.length;

    // Estimate redemptions based on stamp pattern
    const redemptionCount = Math.floor(stamps.length / maxPoints);
    totalRedemptions += redemptionCount;

    // Track stamper activity
    stamps.forEach((stamp) => {
      const stamperId = stamp.stamper_id;
      if (stamperId) {
        if (!stamperActivity[stamperId]) {
          stamperActivity[stamperId] = { stamps: 0, customers: new Set() };
        }
        stamperActivity[stamperId].stamps++;
        stamperActivity[stamperId].customers.add(card.id);
      }
    });
  });

  // Calculate peak times from stamp creation times
  const { data: stampTimes } = await supabase
    .from("stamp")
    .select(
      `
      created_at,
      reward_card!inner(organization_id)
    `
    )
    .eq("reward_card.organization_id", organizationId)
    .eq("stamped", true)
    .gte(
      "created_at",
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    ); // Last 90 days

  const hourlyActivity: Record<string, Record<number, number>> = {};

  stampTimes?.forEach((stamp) => {
    const date = new Date(stamp.created_at);
    const day = date.toLocaleDateString("en-US", { weekday: "long" });
    const hour = date.getHours();

    if (!hourlyActivity[day]) hourlyActivity[day] = {};
    if (!hourlyActivity[day][hour]) hourlyActivity[day][hour] = 0;
    hourlyActivity[day][hour]++;
  });

  const peakTimes = Object.entries(hourlyActivity)
    .flatMap(([day, hours]) =>
      Object.entries(hours).map(([hour, count]) => ({
        day,
        hour: parseInt(hour),
        stampCount: count,
      }))
    )
    .sort((a, b) => b.stampCount - a.stampCount)
    .slice(0, 10);

  // Get team member details
  const { data: teamMembers } = await supabase
    .from("organization_members")
    .select("user_id, name, email")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  const teamPerformance = Object.entries(stamperActivity)
    .map(([stamperId, activity]) => {
      const member = teamMembers?.find((m) => m.user_id === stamperId);
      return {
        memberId: stamperId,
        memberName: member?.name || member?.email || "Unknown",
        stampsGiven: activity.stamps,
        customersServed: activity.customers.size,
        avgStampsPerCustomer:
          Math.round((activity.stamps / activity.customers.size) * 100) / 100,
      };
    })
    .sort((a, b) => b.stampsGiven - a.stampsGiven);

  // Calculate growth trends
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data: recentCustomers } = await supabase
    .from("reward_card")
    .select("created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const { data: previousCustomers } = await supabase
    .from("reward_card")
    .select("created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", sixtyDaysAgo.toISOString())
    .lt("created_at", thirtyDaysAgo.toISOString());

  const recentCount = recentCustomers?.length || 0;
  const previousCount = previousCustomers?.length || 0;
  const monthlyGrowth =
    previousCount > 0
      ? ((recentCount - previousCount) / previousCount) * 100
      : 0;

  // Weekly stamp volume for last 8 weeks
  const weeklyStampVolume: number[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - (i - 1) * 7);

    const { data: weekStamps } = await supabase
      .from("stamp")
      .select(
        `
        id,
        reward_card!inner(organization_id)
      `
      )
      .eq("reward_card.organization_id", organizationId)
      .eq("stamped", true)
      .gte("created_at", weekStart.toISOString())
      .lt("created_at", weekEnd.toISOString());

    weeklyStampVolume.push(weekStamps?.length || 0);
  }

  return {
    programROI: {
      totalRedemptions,
      avgStampsToRedeem: maxPoints,
      customerLifetimeStamps:
        totalStampsGiven / Math.max(allCards?.length || 1, 1),
      redeemRate: allCards?.length
        ? (totalRedemptions / allCards.length) * 100
        : 0,
    },
    peakTimes,
    teamPerformance,
    growthTrends: {
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      weeklyStampVolume,
      seasonalTrends: [], // Could be expanded to show monthly patterns
    },
  };
}

export async function getLoyaltyProgramValue(
  organizationId: string,
  estimatedAvgSpend: number = 15
): Promise<LoyaltyProgramValue> {
  const supabase = await createClient();

  // Get all customer data
  const { data: allCards } = await supabase
    .from("reward_card")
    .select(
      `
      id,
      points,
      created_at,
      stamp(id, stamped, created_at)
    `
    )
    .eq("organization_id", organizationId);

  const { data: org } = await supabase
    .from("organization")
    .select("max_points")
    .eq("id", organizationId)
    .single();

  const maxPoints = org?.max_points || 10;

  // Analyze customer segments
  let newCustomers = 0;
  let regularCustomers = 0;
  let loyalCustomers = 0;
  let championCustomers = 0;

  let completedFirstStamp = 0;
  let reachedHalfway = 0;
  let completedFullCard = 0;

  allCards?.forEach((card) => {
    const stamps = card.stamp.filter((s) => s.stamped).length;
    const redemptions = Math.floor(stamps / maxPoints);

    if (stamps === 0) {
      // New customer with no stamps yet
    } else if (stamps < 3) {
      newCustomers++;
      completedFirstStamp++;
    } else if (stamps < 10) {
      regularCustomers++;
      completedFirstStamp++;
      if (stamps >= maxPoints / 2) reachedHalfway++;
    } else if (redemptions === 0) {
      loyalCustomers++;
      completedFirstStamp++;
      reachedHalfway++;
    } else {
      championCustomers++;
      completedFirstStamp++;
      reachedHalfway++;
      completedFullCard += redemptions;
    }
  });

  const totalVisitors = allCards?.length || 0;
  const signedUpForLoyalty = totalVisitors; // Everyone who has a card
  const conversionRate =
    totalVisitors > 0 ? (completedFullCard / totalVisitors) * 100 : 0;

  // Estimate revenue impact
  // Assume loyal customers visit 2x more often than without program
  const estimatedExtraVisits =
    regularCustomers * 1 + loyalCustomers * 2 + championCustomers * 3;
  const estimatedRevenueImpact = estimatedExtraVisits * estimatedAvgSpend;

  return {
    estimatedRevenueImpact: Math.round(estimatedRevenueImpact),
    customerSegments: {
      newCustomers,
      regularCustomers,
      loyalCustomers,
      championCustomers,
    },
    conversionFunnel: {
      totalVisitors,
      signedUpForLoyalty,
      completedFirstStamp,
      reachedHalfway,
      completedFullCard,
      conversionRate: Math.round(conversionRate * 100) / 100,
    },
  };
}

// New metrics that track usage and value
export interface UsageMetrics {
  monthlyCardVolume: number;
  teamEngagement: {
    activeMembers: number;
    totalMembers: number;
    avgStampsPerMember: number;
  };
  featureUsage: {
    qrCodeScans: number; // Could track from server logs
    mobileVsDesktop: { mobile: number; desktop: number };
    peakUsageHours: string[];
  };
}

export interface ConversionTriggers {
  volumeLimitApproaching: boolean;
  teamLimitReached: boolean;
  dataInsightNeeded: boolean;
  competitorAdvantage: number; // Score 1-10
  revenueOpportunity: number; // Estimated $ lost without upgrade
}

export async function getUsageMetrics(
  organizationId: string
): Promise<UsageMetrics> {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Monthly card volume
  const { data: monthlyCards } = await supabase
    .from("reward_card")
    .select("id")
    .eq("organization_id", organizationId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Team engagement
  const { data: allMembers } = await supabase
    .from("organization_members")
    .select("user_id, last_active_at")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  const { data: memberActivity } = await supabase
    .from("stamp")
    .select(
      `
      stamper_id,
      reward_card!inner(organization_id)
    `
    )
    .eq("reward_card.organization_id", organizationId)
    .eq("stamped", true)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const activeStampers = new Set(
    memberActivity?.map((s) => s.stamper_id) || []
  );
  const activeMembers = activeStampers.size;
  const totalMembers = allMembers?.length || 0;
  const avgStampsPerMember =
    activeMembers > 0 ? (memberActivity?.length || 0) / activeMembers : 0;

  return {
    monthlyCardVolume: monthlyCards?.length || 0,
    teamEngagement: {
      activeMembers,
      totalMembers,
      avgStampsPerMember: Math.round(avgStampsPerMember * 100) / 100,
    },
    featureUsage: {
      qrCodeScans: 0, // Would need additional tracking
      mobileVsDesktop: { mobile: 0, desktop: 0 }, // Would need user agent tracking
      peakUsageHours: [], // Could derive from stamp timestamps
    },
  };
}

export async function getConversionTriggers(
  organizationId: string,
  currentTier: "free" | "premium"
): Promise<ConversionTriggers> {
  if (currentTier === "premium") {
    return {
      volumeLimitApproaching: false,
      teamLimitReached: false,
      dataInsightNeeded: false,
      competitorAdvantage: 0,
      revenueOpportunity: 0,
    };
  }

  const supabase = await createClient();

  // Check volume limits (free tier: 50 customers/month)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: monthlyCards } = await supabase
    .from("reward_card")
    .select("id")
    .eq("organization_id", organizationId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const volumeLimitApproaching = (monthlyCards?.length || 0) >= 40; // 80% of 50-card limit

  // Check team limits (free tier: 2 members)
  const { data: teamMembers } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  const teamLimitReached = (teamMembers?.length || 0) >= 2;

  // Data insight opportunities
  const retentionMetrics = await getCustomerRetentionMetrics(organizationId);
  const dataInsightNeeded = retentionMetrics.churnRisk.length > 5; // Has actionable churn data

  // Estimate revenue opportunity
  const businessInsights = await getBusinessInsights(organizationId);
  const estimatedMonthlyRevenue =
    businessInsights.programROI.totalRedemptions * 15; // Assume $15 avg order
  const revenueOpportunity = Math.max(0, estimatedMonthlyRevenue * 0.2); // 20% improvement potential

  // Competitor advantage score (based on feature gaps)
  let competitorAdvantage = 0;
  if (retentionMetrics.churnRisk.length > 3) competitorAdvantage += 3; // Churn prevention
  if (businessInsights.teamPerformance.length > 1) competitorAdvantage += 2; // Team analytics
  if (businessInsights.programROI.redeemRate > 10) competitorAdvantage += 2; // ROI tracking
  if (volumeLimitApproaching) competitorAdvantage += 3; // Scalability

  return {
    volumeLimitApproaching,
    teamLimitReached,
    dataInsightNeeded,
    competitorAdvantage,
    revenueOpportunity: Math.round(revenueOpportunity),
  };
}
