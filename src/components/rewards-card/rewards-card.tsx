"use client";
import { PropsWithChildren, useState } from "react";
import { motion } from "framer-motion";
import front from "@PNN/assests/front.jpg";
import back from "@PNN/assests/back.jpg";
import { Tables } from "@PNN/utils/data-access/database.types";
import PunchNode from "./punch-node";
import { Button } from "@PNN/components/ui/button";
import { redeemRewards } from "@PNN/utils/data-access/data-acess";
interface RewardsCardProps {
  card: Tables<"reward_card">;
  maxPoints: number;
}

const RewardsCard: React.FC<PropsWithChildren<RewardsCardProps>> = ({
  card,
  maxPoints,
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
    <div className="flex flex-col  gap-3 h-full items-center justify-center cursor-pointer">
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
            className="flip-card-back w-full h-full bg-cover border-[1px] text-white rounded-lg "
            style={{
              backgroundImage: `url(${back.src})`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="absolute top-1 left-2">{card.points}</div>
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
                        total={card.points}
                        punched={i < card.points}
                      ></PunchNode>
                    </div>
                  );
                })}
            </div>
          </div>
        </motion.div>
      </div>
      {maxPoints === card.points && (
        <div>
          <Button onClick={() => redeemRewards(card.id)}>Redeem Points</Button>
        </div>
      )}
    </div>
  );
};

export default RewardsCard;
