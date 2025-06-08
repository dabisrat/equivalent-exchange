"use client";
import front from "@eq-ex/app/assests/front.svg";
import frontDark from "@eq-ex/app/assests/front-dark.svg";
import { Tables } from "@eq-ex/app/utils/data-access/database.types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";

interface RewardsCardProps {
  card: Tables<"reward_card">;
}

const RewardsCardPreview: React.FC<RewardsCardProps> = ({ card }) => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  return (
    <div className="mb-4">
      <div
        onClick={() => {
          router.push(`/${card.organization_id}/${card.id}`);
        }}
        className="w-[300px] h-[200px] bg-cover border-[1px] rounded-lg"
        style={{
          backgroundImage: `url(${resolvedTheme === 'light' ? front.src : frontDark.src})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <Link href={`/${card.organization_id}/${card.id}`}>{card.points}</Link>
    </div>
  );
};

export default RewardsCardPreview;
