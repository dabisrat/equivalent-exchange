"use client";
import front from "@PNN/assests/front.jpg";
import { Tables } from "@PNN/utils/data-access/database.types";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        className="w-[150px] h-[100px] bg-cover border-[1px] rounded-lg"
        style={{
          backgroundImage: `url(${front.src})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <Link href={`/${card.organization_id}/${card.id}`}>
        {card.organization_id}
      </Link>
    </div>
  );
};

export default RewardsCardPreview;
