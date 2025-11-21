"use client";
import { useBroadcastSubscription } from "@app/hooks/supabase-broadcast-subscription";
import { redeemRewards } from "@app/data-access/actions/rewards-card";
import { Tables } from "@app/utils/database.types";
import { Button, buttonVariants } from "@eq-ex/ui/components/button";
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
  stamps: Stamp[];
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
  stamps,
  layoutVariant = "vertical",
  layoutOptions,
  children,
}) => {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showRefreshMessage, setShowRefreshMessage] = useState(false);
  const [state, setState] = useState<CardState>({
    isFlipped: false,
    isAnimating: false,
    points: {},
  });
  const [cardHeight, setCardHeight] = useState<number>(225);
  const frontRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLDivElement | null>(null);

  const { organization } = useOrganization();
  const triggerConfetti = useConfettiEffect();
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

  const getBackgroundStyles = useCallback((config: any) => {
    if (!config) return {};

    const lightBg = config.background_image;
    const darkBg = config.dark_background_image || config.background_image;

    const styles: Record<string, string> = {};

    if (lightBg) {
      styles["--bg-image-light"] = `url('${lightBg}')`;
    }
    if (darkBg && darkBg !== lightBg) {
      styles["--bg-image-dark"] = `url('${darkBg}')`;
    }

    return styles;
  }, []);

  useEffect(() => {
    // Initialize points from the passed-in stamps
    const stampsByIndex = stamps.reduce(
      (memo: Record<number, Stamp>, stamp: Stamp) => {
        memo[stamp.stamp_index] = stamp;
        return memo;
      },
      {}
    );
    setState((prev) => ({ ...prev, points: stampsByIndex }));
  }, [stamps]);

  useEffect(() => {
    // Show refresh message if connection takes longer than 5 seconds
    if (!isReady) {
      const timer = setTimeout(() => {
        setShowRefreshMessage(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      // Reset refresh message when connection is ready
      setShowRefreshMessage(false);
    }
  }, [isReady]);

  useEffect(() => {
    if (!state.isFlipped) {
      const timeout = setTimeout(handleFlip, 200);
      return () => clearTimeout(timeout);
    }
  }, []);

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

  return (
    <>
      <div className="flex flex-col items-center">
        {/* Connecting message above the card */}
        {!isReady && (
          <div className="mb-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md">
            {showRefreshMessage ? (
              <span>
                Connection issues?{" "}
                <Button
                  onClick={() => window.location.reload()}
                  className="p-0"
                  variant={"link"}
                >
                  Refresh
                </Button>
                <span> for updates</span>
              </span>
            ) : (
              "Connecting for live updates..."
            )}
          </div>
        )}

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
              className="flip-card-front backface-hidden absolute w-full bg-card border rounded-lg shadow-sm min-h-[225px] bg-cover bg-center bg-no-repeat [background-image:var(--bg-image-light)] dark:[background-image:var(--bg-image-dark,var(--bg-image-light))]"
              style={getBackgroundStyles(
                organization?.card_config?.card_front_config
              )}
            >
              {/* Progress indicator */}
              <div className="absolute top-2 right-3 font-bold text-lg">
                {getTotalPoints()}
              </div>

              {/* Main content container */}
              {organization?.card_config?.card_front_config?.show_content !==
                false && (
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
                    {organization?.card_config?.card_front_config
                      ?.company_name ||
                      organization?.organization_name?.toUpperCase()}
                  </h2>
                  <h3 className="mb-6 text-sm">REWARDS</h3>

                  {/* Rewards Requirements - Larger text */}
                  <div className="text-xs">
                    <p className="mb-2">
                      {organization?.card_config?.card_front_config
                        ?.offer_description ||
                        `Collect ${maxPoints} stamps & get a free reward!`}
                    </p>
                  </div>
                </div>
              )}

              {/* Website Link - Always visible at bottom if provided */}
              {organization?.card_config?.card_front_config?.website_link && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                  <Link
                    href={
                      organization.card_config.card_front_config.website_link
                    }
                    target="_blank"
                    title="Visit website"
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "p-0 items-end h-[25px]"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visit us online
                  </Link>
                </div>
              )}
            </div>

            <div
              ref={backRef}
              className="flip-card-back backface-hidden absolute rotate-y-180 w-full bg-card border rounded-lg shadow-sm min-h-[225px] p-3 bg-cover bg-center bg-no-repeat [background-image:var(--bg-image-light)] dark:[background-image:var(--bg-image-dark,var(--bg-image-light))]"
              style={getBackgroundStyles(
                organization?.card_config?.card_back_config
              )}
            >
              <div className="flex items-start justify-between mb-0.5">
                {/* Points Display */}
                <div className="font-bold text-lg leading-none pl-1 pt-0.5">
                  {getTotalPoints()}
                </div>

                {/* Store Link */}
                {organization?.card_config?.card_back_config?.website_link && (
                  <Link
                    href={
                      organization.card_config.card_back_config.website_link
                    }
                    target="_blank"
                    title="Visit website"
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "p-0 items-start h-[25px]"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Order online
                  </Link>
                )}
              </div>

              {renderBackLayout({
                variant:
                  organization?.card_config?.card_layout_config?.variant ||
                  layoutVariant,
                options:
                  organization?.card_config?.card_layout_config?.options ||
                  layoutOptions,
                maxPoints,
                points: state.points as any,
                cardId: card.id,
                canModify,
                punchNodeConfig: organization?.card_config?.punch_node_config,
                isReady: true,
                children,
              })}

              {/* Terms - Smaller and lighter text */}
              <div className="mt-2 flex justify-center">
                <p className="text-xs text-center opacity-75 px-4">
                  {organization?.card_config?.card_back_config.description ??
                    "Terms and conditions apply."}
                </p>
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
