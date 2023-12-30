"use client";
import { useState } from "react";
import { motion } from "framer-motion";

import front from "@PNN/assests/front.jpg";
import back from "@PNN/assests/back.jpg";

interface RewardsCardProps {
  points: number;
}

const RewardsCard: React.FC<RewardsCardProps> = ({ points }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  function handleFlip() {
    if (!isAnimating) {
      setIsFlipped(!isFlipped);
      setIsAnimating(true);
    }
  }
  return (
    <div className="flex items-center justify-center bg-black h-[800px] cursor-pointer">
      <div
        className="flip-card w-[600px] h-[360px] rounded-md"
        onClick={handleFlip}
      >
        <motion.div
          className="flip-card-inner w-[100%] h-[100%]"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 360 }}
          transition={{ duration: 0.3, animationDirection: "normal" }}
          onAnimationComplete={() => setIsAnimating(false)}
        >
          <div
            className="flip-card-front w-[100%] h-[100%] bg-cover border-[1px] text-white rounded-lg p-4"
            style={{ backgroundImage: `url(${front.src})` }}
          ></div>

          <div
            className="flip-card-back w-[100%] h-[100%] bg-cover border-[1px] text-white rounded-lg p-4"
            style={{ backgroundImage: `url(${back.src})` }}
          >
            {points}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RewardsCard;
