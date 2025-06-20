"use client";
import frontDark from "@app/assests/front-dark.svg";
import front from "@app/assests/front.svg";
import { Tables } from "@app/utils/database.types";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RewardsCardProps {
  card: Tables<"reward_card">;
}

const RewardsCardPreview: React.FC<RewardsCardProps> = ({ card }) => {
  const router = useRouter();

  return (
    <div className="mb-4">
      <div
        onClick={() => {
          router.push(`/${card.organization_id}/${card.id}`);
        }}
        className="w-[300px] h-[200px] bg-cover border rounded-lg rewards-card-bg"
        style={{
          '--light-bg': `url(${front.src})`,
          '--dark-bg': `url(${frontDark.src})`,
        } as React.CSSProperties}
      ></div>
      <Link href={`/${card.organization_id}/${card.id}`}>{card.points}</Link>
    </div>
  );
};

export default RewardsCardPreview;
