"use client";
import { PropsWithChildren, useEffect, useState } from "react";
import { motion } from "framer-motion";
import front from "@PNN/assests/front.jpg";
import back from "@PNN/assests/back.jpg";
import { Tables } from "@PNN/utils/data-access/database.types";
import PunchNode from "./punch-node";
import { Button } from "@PNN/components/ui/button";
import { redeemRewards } from "@PNN/utils/data-access/data-acess";
import { Skeleton } from "../ui/skeleton";
import { useSupabaseRealtimeSubscription } from "@PNN/hooks/supabase-real-time-subscription";
interface RewardsCardProps {
  card: Tables<"reward_card">;
  maxPoints: number;
  canModify: boolean;
}

const RewardsCard: React.FC<PropsWithChildren<RewardsCardProps>> = ({
  card,
  maxPoints,
  canModify,
  children,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [points, setPoints] = useState(card.points);
  const [ignorePunchUpdate, setIgnorePunchUpdate] = useState(false);
  const { isReady } = useSupabaseRealtimeSubscription(
    (payload) => {
      if (payload.new.points === 0) {
        setIgnorePunchUpdate(false);
      }
      setPoints(payload.new.points);
    },
    "UPDATE",
    "reward_card",
    `id=eq.${card.id}`
  );

  function handleFlip() {
    if (!isAnimating) {
      setIsFlipped(!isFlipped);
      setIsAnimating(true);
    }
  }

  return (
    <>
      {!isReady && (
        <div className="flex flex-col space-y-3 justify-center items-center">
          <Skeleton className="w-[375px] h-[225px] rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      )}
      {isReady && (
        <div className="flex flex-col gap-3 h-full items-center justify-center cursor-pointer">
          <div
            className="flip-card  w-[375px] h-[225px] rounded-md"
            onClick={handleFlip}
          >
            <motion.div
              className="flip-card-inner h-full"
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 360 }}
              transition={{ duration: 0.3, animationDirection: "normal" }}
              onAnimationComplete={() => setIsAnimating(false)}
            >
              <div
                className="flip-card-front w-full h-full bg-cover border-[1px] text-white rounded-lg p-4"
                style={{
                  backgroundImage: `url(${front.src})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }}
              ></div>

              <div
                className="flip-card-back w-full h-full bg-cover border-[1px] text-white rounded-lg"
                style={{
                  backgroundImage: `url(${back.src})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div className="absolute top-1 left-2">{points}</div>
                <div className="grid grid-cols-6 h-full p-4">
                  <div className="justify-self-center row-start-2 col-start-2 col-span-4 row-span-3">
                    {children}
                  </div>
                  {Array(maxPoints)
                    .fill(0)
                    .map((_, i) => {
                      let className = "justify-self-center";
                      if (i == 0 || i === 5) {
                        className = `${className} row-span-2 self-center`;
                      }

                      return (
                        <div key={i} className={className}>
                          <PunchNode
                            cardId={card.id}
                            punched={i < points}
                            canModify={canModify}
                            ignorePunchUpdate={ignorePunchUpdate}
                            setIgnorePunchUpdate={setIgnorePunchUpdate}
                          ></PunchNode>
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          </div>
          {maxPoints === points && canModify && (
            <Button onClick={() => redeemRewards(card.id)}>
              Redeem Points
            </Button>
          )}
        </div>
      )}
    </>
  );
};

export default RewardsCard;
