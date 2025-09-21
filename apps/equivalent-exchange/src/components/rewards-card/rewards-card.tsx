"use client";
import { useSupabaseRealtimeSubscription } from "@app/hooks/supabase-real-time-subscription";
import { useBroadcastSubscription } from "@app/hooks/supabase-broadcast-subscription";
import { getStamps, redeemRewards } from "@app/utils/data-access";
import { Tables } from "@app/utils/database.types";
import { Button, buttonVariants } from "@eq-ex/ui/components/button";
import { Skeleton } from "@eq-ex/ui/components/skeleton";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useOrganization } from "@app/contexts/organization-context";
import Link from "next/link";
import { cn } from "@eq-ex/ui/utils/cn";
import {
  BackLayoutOptions,
  BackLayoutVariant,
  renderBackLayout,
} from "./layout";

type Stamp = Tables<"stamp">;

interface RewardsCardProps {
  card: Tables<"reward_card">;
  maxPoints: number;
  canModify: boolean;
  layoutVariant?: BackLayoutVariant;
  layoutOptions?: BackLayoutOptions;
}

interface CardState {
  isFlipped: boolean;
  isAnimating: boolean;
  points: Record<number, Stamp>;
}

const ANIMATION_DURATION = 0.3;

const useConfettiEffect = () => {
  const triggerConfetti = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ["#857A46", "#a39655", "#c9ba6b", "#998d51", "#857A46"],
    };

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ["star"],
      });

      confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ["circle"],
      });
    };

    [0, 100, 200].forEach((delay) => setTimeout(shoot, delay));
  }, []);

  return triggerConfetti;
};

const isValidStamp = (stamp: any): stamp is Stamp => {
  return stamp && typeof stamp === "object" && "stamp_index" in stamp;
};

const RewardsCard: React.FC<PropsWithChildren<RewardsCardProps>> = ({
  card,
  maxPoints,
  canModify,
  layoutVariant = "vertical",
  layoutOptions,
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [state, setState] = useState<CardState>({
    isFlipped: false,
    isAnimating: false,
    points: {},
  });
  const frontRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState<number>(225);
  const { organization } = useOrganization();

  const triggerConfetti = useConfettiEffect();
  // const { isReady, error } = useSupabaseRealtimeSubscription("stamp", {
  //   callback: useCallback((payload: RealtimePostgresChangesPayload<Stamp>) => {
  //     const newStamp = payload.new as Stamp;
  //     if (newStamp && isValidStamp(newStamp)) {
  //       setState((prev) => ({
  //         ...prev,
  //         points: {
  //           ...prev.points,
  //           [newStamp.stamp_index]: newStamp,
  //         },
  //       }));
  //     }
  //   }, []),
  //   filter: `reward_card_id=eq.${card.id}`,
  // });

  // Use card-specific subscription for stamps belonging to this card
  const { isReady } = useBroadcastSubscription("stamp", {
    topic: `card:${card.id}:stamp`,
    callback: useCallback((payload: any) => {
      let stampData;
      if (payload.record) {
        stampData = payload.record;
      } else if (payload.payload?.record) {
        stampData = payload.payload.record;
      } else {
        console.log("Unknown payload structure:", payload);
        return;
      }

      if (stampData && isValidStamp(stampData)) {
        const newStamp = stampData as Stamp;
        setState((prev) => ({
          ...prev,
          points: {
            ...prev.points,
            [newStamp.stamp_index]: newStamp,
          },
        }));
      }
    }, []),
    events: ["INSERT", "UPDATE"],
  });

  const handleFlip = useCallback(() => {
    if (!state.isAnimating) {
      setState((prev) => ({
        ...prev,
        isFlipped: !prev.isFlipped,
      }));
    }
  }, [state.isAnimating]);

  const getTotalPoints = useCallback(() => {
    return Object.values(state.points).filter((point) => point.stamped).length;
  }, [state.points]);

  const handleRedeem = useCallback(async () => {
    if (isRedeeming) return;

    try {
      setIsRedeeming(true);
      await redeemRewards(card.id);
      triggerConfetti();
    } catch (error) {
      console.error("Failed to redeem rewards:", error);
    } finally {
      setIsRedeeming(false);
    }
  }, [card.id, triggerConfetti, isRedeeming]);

  const measure = useCallback(() => {
    const frontH = frontRef.current?.offsetHeight ?? 0;
    const backH = backRef.current?.offsetHeight ?? 0;
    const activeH = state.isFlipped ? backH : frontH;
    const next = Math.max(activeH, 225);
    if (next !== cardHeight) setCardHeight(next);
  }, [state.isFlipped, cardHeight]);

  useEffect(() => {
    const loadStamps = async () => {
      try {
        const stampsArray = await getStamps(card.id);
        const stamps = stampsArray.reduce(
          (memo: Record<number, Stamp>, stamp) => {
            memo[stamp.stamp_index] = stamp;
            return memo;
          },
          {}
        );
        setState((prev) => ({ ...prev, points: stamps }));
      } catch (error) {
        console.error("Failed to load stamps:", error);
      } finally {
        setIsLoading(false);
        setTimeout(handleFlip, 200);
      }
    };

    loadStamps();
  }, [card.id]);

  useEffect(() => {
    const ro = new ResizeObserver(() => measure());
    if (frontRef.current) ro.observe(frontRef.current);
    if (backRef.current) ro.observe(backRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Post-flip refine measurement after animation ends
  useEffect(() => {
    const id = setTimeout(() => measure(), ANIMATION_DURATION * 1000 + 30);
    return () => clearTimeout(id);
  }, [state.isFlipped, measure]);

  useLayoutEffect(() => {
    measure();
  }, [
    measure,
    state.points,
    organization?.organization_name,
    organization?.logo_url,
    maxPoints,
    children,
  ]);

  if (isLoading || !isReady) {
    return (
      <div className="flex flex-col space-y-3 justify-center items-center">
        <Skeleton className="w-[375px] h-[225px] rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center">
        <motion.div
          className="mt-2 w-[375px] perspective-1000 cursor-pointer relative"
          onClick={handleFlip}
          initial={false}
          animate={{ height: cardHeight }}
          style={{ minHeight: 225 }}
          transition={{ height: { duration: 0.25 } }}
        >
          <motion.div
            className="flip-card-inner relative"
            initial={false}
            animate={{ rotateY: state.isFlipped ? 180 : 0 }}
            transition={{ duration: ANIMATION_DURATION }}
            onAnimationComplete={() =>
              setState((prev) => ({ ...prev, isAnimating: false }))
            }
          >
            <div
              ref={frontRef}
              className="flip-card-front backface-hidden absolute w-full bg-card border rounded-lg shadow-sm"
            >
              {/* Progress indicator */}
              <div className="absolute top-2 right-3 font-bold text-lg">
                {getTotalPoints()}
              </div>

              {/* Main content container */}
              <div className="flex flex-col items-center justify-center p-4 text-center">
                {/* Company Logo */}
                <div className="mb-3">
                  {organization?.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt={`${organization.organization_name} logo`}
                      className="w-12 h-12 object-contain drop-shadow-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center drop-shadow-lg">
                      <span className="text-xl font-bold">
                        {organization?.organization_name?.charAt(0) || "R"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Business Name - Larger and more prominent */}
                <h2 className="text-2xl font-bold mb-1">
                  {organization?.organization_name?.toUpperCase() ||
                    "YOUR BUSINESS"}
                </h2>
                <h3 className="mb-6 text-sm">REWARDS</h3>

                {/* Rewards Requirements - Larger text */}
                <div className="text-xs">
                  <p className="mb-2">
                    Collect {maxPoints} stamps & get a free reward!
                  </p>
                </div>

                <Link
                  href="https://eqxrewards.com"
                  target="_blank"
                  title="Visit eqxrewards.com"
                  className="text-xs font-semibold italic tracking-wide bg-gradient-to-r from-sky-600 via-blue-500 to-yellow-400 dark:from-sky-400 dark:via-blue-300 dark:to-amber-300 bg-clip-text text-transparent hover:brightness-110 focus:outline-none focus:ring-1 focus:ring-sky-500/60 rounded-sm transition drop-shadow-[0_0_2px_rgba(0,0,0,0.35)] drop-shadow-[0_0_4px_rgba(160,200,255,0.35)] [font-feature-settings:'ss01','ss02'] font-serif selection:bg-sky-200 selection:text-sky-900"
                  style={{
                    fontFamily:
                      "var(--font-brand, var(--font-display, ui-serif))",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  your business url here
                </Link>
              </div>
            </div>

            <div
              ref={backRef}
              className="flip-card-back backface-hidden absolute rotate-y-180 w-full bg-card border rounded-lg shadow-sm"
            >
              <div className="p-3 flex flex-col">
                <div className="flex items-start justify-between mb-0.5">
                  <div className="font-bold text-lg leading-none pl-1 pt-0.5">
                    {getTotalPoints()}
                  </div>
                  <Link
                    href="https://eqxrewards.com"
                    target="_blank"
                    title="Visit eqxrewards.com"
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "p-0 items-start h-[25px]"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    order online
                  </Link>
                </div>
                {renderBackLayout({
                  variant: layoutVariant,
                  options: layoutOptions,
                  maxPoints,
                  points: state.points as any,
                  cardId: card.id,
                  canModify,
                  children,
                })}
                <div className="mt-2 flex justify-center">
                  <p className="text-xs text-center opacity-75 px-4">
                    Terms and conditions apply.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        {maxPoints <= getTotalPoints() && canModify && (
          <div className="pt-4 flex flex-col items-center">
            <Button disabled={isRedeeming} onClick={handleRedeem}>
              Redeem Points
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default RewardsCard;
