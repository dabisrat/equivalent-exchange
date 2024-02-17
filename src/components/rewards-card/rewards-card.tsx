"use client";
import { PropsWithChildren, useState } from "react";
import { motion } from "framer-motion";
import front from "@PNN/assests/front.jpg";
import back from "@PNN/assests/back.jpg";
import { Tables } from "@PNN/utils/data-access/database.types";
import { Button } from "@PNN/components/ui/button";
interface RewardsCardProps {
  card: Tables<"reward_card">;
  updatePoints: (cardId: string, points: number) => Promise<any>;
}

const RewardsCard: React.FC<PropsWithChildren<RewardsCardProps>> = ({
  card,
  updatePoints,
  children,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  function handleFlip() {
    if (!isAnimating) {
      setIsFlipped(!isFlipped);
      setIsAnimating(true);
    }
  }

  return (
    <div className="flex flex-col h-full items-center justify-center cursor-pointer">
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
            className="flip-card-back w-full h-full bg-cover border-[1px] text-white rounded-lg p-4"
            style={{
              backgroundImage: `url(${back.src})`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="grid grid-rows-4 grid-cols-3 w-full h-full">
              <div className="item1">{card.points}</div>
              <div className="item2 justify-self-center row-start-2 col-start-2">
                {children}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="mt-1 flex gap-1">
        <Button
          variant="outline"
          onClick={() => updatePoints(card.id, card.points + 1)}
        >
          tickup
        </Button>
        <Button
          variant="outline"
          onClick={() => updatePoints(card.id, card.points - 1)}
        >
          tickdown
        </Button>
      </div>
    </div>
  );
};

export default RewardsCard;
