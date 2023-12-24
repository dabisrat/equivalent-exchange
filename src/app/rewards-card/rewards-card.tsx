"use client";
import { useState } from "react";

interface RewardsCardProps {
  points: number;
}

const RewardsCard: React.FC<RewardsCardProps> = ({ points }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      onClick={flipCard}
      className={`relative border border-gray-300 rounded-lg p-6 m-4 text-center bg-gray-800 text-white transform ${
        isFlipped ? "rotate-y-180" : ""
      } w-64 h-64`}
    >
      <div
        style={{
          backfaceVisibility: "hidden",
          transform: isFlipped ? "rotateY(180deg)" : "none",
        }}
        className={`absolute w-full h-full transition-transform duration-700 ease-in-out`}
      >
        <h2 className="text-2xl font-bold">Rewards Card</h2>
        <p className="text-lg">You have {points} points.</p>
      </div>
      <div
        style={{
          backfaceVisibility: "hidden",
          transform: isFlipped ? "none" : "rotateY(180deg)",
        }}
        className={`absolute w-full h-full transition-transform duration-700 ease-in-out`}
      >
        <h2 className="text-2xl font-bold">Back of Card</h2>
        <p className="text-lg">This is the back of the card.</p>
      </div>
    </div>
  );
};

export default RewardsCard;
