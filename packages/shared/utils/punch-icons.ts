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
import { FaRegLemon, FaLemon } from "react-icons/fa6";

export const PUNCH_ICONS = {
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
  FaRegLemon,
  FaLemon,
} as const;

export const PUNCH_ICON_OPTIONS = [
  "MdCircle",
  "MdStars",
  "MdStar",
  "MdStarBorder",
  "MdAutorenew",
  "MdDiamond",
  "MdOutlineDiamond",
  "MdFavorite",
  "MdFavoriteBorder",
  "RiExchangeFill",
  "FaRegLemon",
  "FaLemon",
] as const;

export type PunchIconKey = (typeof PUNCH_ICON_OPTIONS)[number];
