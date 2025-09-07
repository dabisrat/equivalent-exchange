"use client";
import backDark from "@app/assests/back-dark.svg";
import back from "@app/assests/back.svg";
import frontDark from "@app/assests/front-dark.svg";
import front from "@app/assests/front.svg";
import { useSupabaseRealtimeSubscription } from "@app/hooks/supabase-real-time-subscription";
import { getStamps, redeemRewards } from "@app/utils/data-access";
import { Tables } from "@app/utils/database.types";
import { Button } from "@eq-ex/ui/components/button";
import { Skeleton } from "@eq-ex/ui/components/skeleton";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { useOrganization } from "@app/contexts/organization-context";
import PunchNode from "./punch-node";
import Link from "next/link";

type Stamp = Tables<"stamp">;

interface RewardsCardProps {
  card: Tables<"reward_card">;
  maxPoints: number;
  canModify: boolean;
}

interface CardState {
  isFlipped: boolean;
  isAnimating: boolean;
  points: Record<number, Stamp>;
}

const GRID_LAYOUT = {
  COLS: 6,
  SPECIAL_INDICES: [0, 5],
};

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
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [state, setState] = useState<CardState>({
    isFlipped: false,
    isAnimating: false,
    points: {},
  });
  const { resolvedTheme } = useTheme();
  const { organization } = useOrganization();

  const triggerConfetti = useConfettiEffect();
  console.log("RewardsCard render", { card, maxPoints, canModify });
  const { isReady, error } = useSupabaseRealtimeSubscription("stamp", {
    callback: useCallback((payload: RealtimePostgresChangesPayload<Stamp>) => {
      const newStamp = payload.new as Stamp;
      if (newStamp && isValidStamp(newStamp)) {
        setState((prev) => ({
          ...prev,
          points: {
            ...prev.points,
            [newStamp.stamp_index]: newStamp,
          },
        }));
      }
    }, []),
    filter: `reward_card_id=eq.${card.id}`,
  });

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
      }
    };

    loadStamps();
  }, [card.id]);

  // Auto-flip the card after loading
  useEffect(() => {
    if (!isLoading && isReady) {
      const timer = setTimeout(handleFlip, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isReady]);

  const handleFlip = useCallback(() => {
    if (!state.isAnimating) {
      setState((prev) => ({
        ...prev,
        isFlipped: !prev.isFlipped,
        isAnimating: true,
      }));
    }
  }, [state.isAnimating]);

  const getTotalPoints = useCallback(() => {
    return Object.values(state.points).filter((point) => point.stamped).length;
  }, [state.points]);

  const handleRedeem = useCallback(async () => {
    try {
      setIsRedeeming(true);
      await redeemRewards(card.id);
      triggerConfetti();
    } catch (error) {
      console.error("Failed to redeem rewards:", error);
    } finally {
      setIsRedeeming(false);
    }
  }, [card.id, triggerConfetti]);

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
    <div className="flex flex-col gap-3 h-full items-center justify-center">
      <div
        className="flip-card p-2 w-[375px] h-[225px] rounded-md cursor-pointer"
        onClick={handleFlip}
      >
        <motion.div
          className="flip-card-inner h-full"
          initial={false}
          animate={{ rotateY: state.isFlipped ? 180 : 360 }}
          transition={{ duration: ANIMATION_DURATION }}
          onAnimationComplete={() =>
            setState((prev) => ({ ...prev, isAnimating: false }))
          }
        >
          {/* Front card content */}
          <div
            className="flip-card-front w-full h-full bg-cover border rounded-lg relative overflow-hidden"
            // style={{
            //   backgroundImage: `url(${resolvedTheme === "light" ? front.src : frontDark.src})`,
            //   backgroundSize: "100% 100%",
            //   backgroundRepeat: "no-repeat",
            // }}
          >
            {/* Progress indicator */}
            <div className="absolute top-2 right-3  font-bold text-lg">
              {getTotalPoints()}
            </div>

            {/* Main content container */}
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
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
              <h2 className="text-2xl font-bold mb-1 ">
                {organization?.organization_name?.toUpperCase() ||
                  "YOUR BUSINESS"}
              </h2>
              <h3 className="mb-6 text-sm">REWARDS</h3>

              {/* Rewards Requirements - Larger text */}
              <div className="text-xs">
                <p className="mb-2">
                  CAPTURE {maxPoints} stamps & GET A FREE REWARD
                </p>
              </div>

              <Link
                href="https://eqxrewards.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Visit eqxrewards.com"
                className="text-xs font-semibold italic tracking-wide bg-gradient-to-r from-sky-600 via-blue-500 to-yellow-400 dark:from-sky-400 dark:via-blue-300 dark:to-amber-300 bg-clip-text text-transparent hover:brightness-110 focus:outline-none focus:ring-1 focus:ring-sky-500/60 rounded-sm transition drop-shadow-[0_0_2px_rgba(0,0,0,0.35)] drop-shadow-[0_0_4px_rgba(160,200,255,0.35)] [font-feature-settings:'ss01','ss02'] font-serif selection:bg-sky-200 selection:text-sky-900"
                style={{
                  fontFamily:
                    "var(--font-brand, var(--font-display, ui-serif))",
                }}
              >
                your business url here
              </Link>
            </div>
          </div>

          {/* Back card content */}
          <div
            className="flip-card-back w-full h-full bg-cover border rounded-lg"
            // style={{
            //   backgroundImage: `url(${resolvedTheme === "light" ? back.src : backDark.src})`,
            //   backgroundSize: "100% 100%",
            //   backgroundRepeat: "no-repeat",
            // }}
          >
            <div className="absolute top-2 left-3 font-bold text-lg">
              {getTotalPoints()}
            </div>
            <div className="grid grid-cols-6 h-full p-4">
              <div className="justify-self-center row-start-2 col-start-2 col-span-4 row-span-3">
                {children}
              </div>
              {Array(maxPoints)
                .fill(null)
                .map((_, i) => (
                  <div
                    key={i}
                    className={`justify-self-center ${
                      GRID_LAYOUT.SPECIAL_INDICES.includes(i)
                        ? "row-span-2 self-center"
                        : ""
                    }`}
                  >
                    <PunchNode
                      punched={state.points[i]?.stamped || false}
                      cardId={card.id}
                      canModify={canModify}
                      index={state.points[i]?.stamp_index || i}
                      // config prop is now optional - will use default if not provided
                      // config={getPunchNodeConfig(i, maxPoints)}
                    />
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
      {maxPoints === getTotalPoints() && canModify && (
        <Button disabled={isRedeeming} onClick={handleRedeem}>
          Redeem Points
        </Button>
      )}
    </div>
  );
};

export default RewardsCard;
