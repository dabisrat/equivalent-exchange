"use client";
import frontDark from "@app/assests/front-dark.svg";
import front from "@app/assests/front.svg";
import { Tables } from "@app/utils/database.types";
import { useRouter } from "next/navigation";

interface RewardsCardProps {
  card: Tables<"reward_card">;
}

const RewardsCardPreview: React.FC<RewardsCardProps> = ({ card }) => {
  const router = useRouter();

  return (
    <div
      onClick={() => {
        router.push(`/${card.organization_id}/${card.id}`);
      }}
      className="w-[300px] h-[200px] bg-cover border rounded-lg rewards-card-bg"
      style={
        {
          "--light-bg": `url(${front.src})`,
          "--dark-bg": `url(${frontDark.src})`,
        } as React.CSSProperties
      }
    >
      <div className="flex flex-row-reverse pr-1.5 text-[#b89f3d]">
        {card.points}
      </div>
    </div>
  );
};

export default RewardsCardPreview;
