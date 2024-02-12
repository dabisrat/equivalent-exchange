"use client";
import { PropsWithChildren, useState } from "react";
import { motion } from "framer-motion";
import front from "@PNN/assests/front.jpg";
import back from "@PNN/assests/back.jpg";
import { Tables } from "@PNN/utils/data-access/database.types";
import { useRouter } from "next/navigation";

interface RewardsCardProps {
  card: Tables<"reward_card">;
}

const RewardsCardPreview: React.FC<RewardsCardProps> = ({ card }) => {
  const router = useRouter();
  return (
    <>
      <div
        onClick={() => router.push(`/${card.organization_id}/${card.id}`)}
        className="w-[150px] h-[100px] bg-cover border-[1px] text-white rounded-lg p-4"
        style={{
          backgroundImage: `url(${front.src})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      {card.organization_id}
    </>
  );
};

export default RewardsCardPreview;
