"use client";
import { PropsWithChildren, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import front from "@PNN/assests/front.svg";
import frontDark from "@PNN/assests/front-dark.svg";
import back from "@PNN/assests/back.svg";
import backDark from "@PNN/assests/back-dark.svg";
import { Tables } from "@PNN/utils/data-access/database.types";
import PunchNode from "./punch-node";
import { Button } from "@PNN/components/ui/button";
import { getStamps, redeemRewards } from "@PNN/utils/data-access/data-acess";
import { Skeleton } from "../ui/skeleton";
import { useSupabaseRealtimeSubscription } from "@PNN/hooks/supabase-real-time-subscription";
import confetti from "canvas-confetti";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useTheme } from "next-themes";

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
  SPECIAL_INDICES: [0, 5]
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

    [0, 100, 200].forEach(delay => setTimeout(shoot, delay));
  }, []);

  return triggerConfetti;
};

const isValidStamp = (stamp: any): stamp is Stamp => {
  return stamp && typeof stamp === 'object' && 'stamp_index' in stamp;
};

const RewardsCard: React.FC<PropsWithChildren<RewardsCardProps>> = ({
  card,
  maxPoints,
  canModify,
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<CardState>({
    isFlipped: false,
    isAnimating: false,
    points: {},
  });
  const { resolvedTheme } = useTheme();

  const triggerConfetti = useConfettiEffect();

  const { isReady, error } = useSupabaseRealtimeSubscription(
    "stamp",
    {
      callback: useCallback((payload: RealtimePostgresChangesPayload<Stamp>) => {
        const newStamp = payload.new as Stamp;
        if (newStamp && isValidStamp(newStamp)) {
          setState(prev => ({
            ...prev,
            points: {
              ...prev.points,
              [newStamp.stamp_index]: newStamp
            }
          }));
        }
      }, []),
      filter: `reward_card_id=eq.${card.id}`
    }
  );

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
        setState(prev => ({ ...prev, points: stamps }));
      } catch (error) {
        console.error('Failed to load stamps:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStamps();
  }, [card.id]);

  const handleFlip = useCallback(() => {
    if (!state.isAnimating) {
      setState(prev => ({
        ...prev,
        isFlipped: !prev.isFlipped,
        isAnimating: true
      }));
    }
  }, [state.isAnimating]);

  const getTotalPoints = useCallback(() => {
    return Object.values(state.points).filter((point) => point.stamped).length;
  }, [state.points]);

  const handleRedeem = useCallback(async () => {
    try {
      await redeemRewards(card.id);
      triggerConfetti();
    } catch (error) {
      console.error('Failed to redeem rewards:', error);
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
    <div className="flex flex-col gap-3 h-full items-center justify-center cursor-pointer">
      <div
        className="flip-card w-[375px] h-[225px] rounded-md"
        onClick={handleFlip}
      >
        <motion.div
          className="flip-card-inner h-full"
          initial={false}
          animate={{ rotateY: state.isFlipped ? 180 : 360 }}
          transition={{ duration: ANIMATION_DURATION, animationDirection: "normal" }}
          onAnimationComplete={() => setState(prev => ({ ...prev, isAnimating: false }))}
        >
          {/* Front card content */}
          <div
            className="flip-card-front w-full h-full bg-cover border-[1px] text-white rounded-lg p-4"
            style={{
              backgroundImage: `url(${resolvedTheme === 'dark' ? frontDark.src : front.src})`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="absolute top-1 right-2 text-[#b89f3d]">
              {getTotalPoints()}
            </div>
          </div>

          {/* Back card content */}
          <div
            className="flip-card-back w-full h-full bg-cover border-[1px] text-white rounded-lg"
            style={{
              backgroundImage: `url(${resolvedTheme === 'dark' ? backDark.src : back.src})`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="absolute top-1 left-2 text-[#b89f3d]">
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
                    className={`justify-self-center ${GRID_LAYOUT.SPECIAL_INDICES.includes(i) ? 'row-span-2 self-center' : ''
                      }`}
                  >
                    <PunchNode
                      punched={state.points[i]?.stamped || false}
                      cardId={card.id}
                      canModify={canModify}
                      index={state.points[i]?.stamp_index || i}
                    />
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
      {maxPoints === getTotalPoints() && canModify && (
        <Button onClick={handleRedeem}>
          Redeem Points
        </Button>
      )}
    </div>
  );
};

export default RewardsCard;
