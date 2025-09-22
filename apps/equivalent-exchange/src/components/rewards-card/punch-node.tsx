"use client";
import { updateStampById } from "@app/data-access/actions/rewards-card";
import { MouseEvent, useState } from "react";
import {
  MdCircle,
  MdStars,
  MdStar,
  MdStarBorder,
  MdAutorenew,
  MdDiamond,
  MdOutlineDiamond,
  MdFavorite,
  MdFavoriteBorder,
} from "react-icons/md";
import { RiExchangeFill } from "react-icons/ri";
import { PunchNodeConfig } from "@eq-ex/shared/utils/shared.types";

interface PunchNodeProps {
  cardId: string;
  punched: boolean;
  canModify: boolean;
  index: number;
  config?: PunchNodeConfig;
}

const ICONS = {
  MdCircle,
  MdStars,
  MdStar,
  MdStarBorder,
  MdAutorenew,
  MdDiamond,
  MdOutlineDiamond,
  MdFavorite,
  MdFavoriteBorder,
  RiExchangeFill,
} as const;

const SIZES = {
  small: 24,
  medium: 32,
  large: 40,
} as const;

const ANIMATIONS = {
  spin: "animate-spin",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  ping: "animate-ping",
  flip: "animate-flip",
} as const;

const DEFAULT_CONFIG: PunchNodeConfig = {
  id: "default-free",
  name: "Free Tier Default",
  type: "standard",
  size: { punched: "medium", unpunched: "medium", loading: "medium" },
  colors: { punched: "#6b7280", unpunched: "#6b7280", loading: "#6b7280" },
  icons: {
    punched: "RiExchangeFill",
    unpunched: "MdCircle",
    loading: "RiExchangeFill",
  },
  animation: { enabled: true, loading: { type: "flip" } },
};

export default function PunchNode({
  cardId,
  punched,
  canModify,
  index,
  config = DEFAULT_CONFIG,
}: PunchNodeProps) {
  const [isLoading, setLoading] = useState(false);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading || !canModify) return;

    setLoading(true);
    updateStampById(cardId, index).finally(() => setLoading(false));
  };

  // Determine current state
  const state = isLoading ? "loading" : punched ? "punched" : "unpunched";

  // Get current values based on state
  const iconName =
    (state === "loading" && config.icons.loading) ||
    (state === "punched" && config.icons.punched) ||
    config.icons.unpunched;

  const color =
    (state === "loading" && config.colors.loading) ||
    (state === "punched" && config.colors.punched) ||
    config.colors.unpunched;

  const sizeKey =
    (state === "loading" && config.size.loading) ||
    (state === "punched" && config.size.punched) ||
    config.size.unpunched;

  const size = SIZES[sizeKey];

  // Get animation
  const animationConfig =
    config.animation?.enabled &&
    config.animation[state as keyof typeof config.animation];
  const animationClass =
    animationConfig && typeof animationConfig === "object"
      ? ANIMATIONS[animationConfig.type]
      : "";
  const animationDuration =
    animationConfig &&
    typeof animationConfig === "object" &&
    animationConfig.duration
      ? `${animationConfig.duration}ms`
      : undefined;

  // Get icon component
  const IconComponent = ICONS[iconName as keyof typeof ICONS] || MdCircle;

  return (
    <div
      className={`flex justify-center items-center cursor-pointer ${animationClass}`}
      style={{ width: size, height: size, animationDuration }}
      onClick={handleClick}
      title={`${config.name} - ${config.type}`}
    >
      <IconComponent color={color} size={size} />
    </div>
  );
}
