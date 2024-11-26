"use client";
import {
  addRewardPoints,
  removeRewardPoints,
} from "@PNN/utils/data-access/data-acess";
import { useEffect, useState, MouseEvent } from "react";
import { MdStars, MdCircle } from "react-icons/md";

export default function PunchNode({
  cardId,
  punched,
  canModify,
  index,
}: {
  cardId: string;
  punched: boolean;
  canModify: boolean;
  index: number;
}) {
  const [isLoading, setLoading] = useState(false);

  function punchClicked(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || !canModify) {
      return;
    }

    setLoading(true);
    (!punched
      ? addRewardPoints(cardId, index)
      : removeRewardPoints(cardId, index)
    ).finally(() => setLoading(false));
  }

  return (
    <>
      <div
        className="w-[32px] h-[32px] flex justify-center items-center cursor-pointer"
        onClick={punchClicked}
      >
        {isLoading && (
          <MdStars className="animate-ping" fontSize="32"></MdStars>
        )}
        {!isLoading && (
          <>
            {punched ? (
              <MdStars color="#857A46" fontSize="32"></MdStars>
            ) : (
              <MdCircle color="#857A46" fontSize="small"></MdCircle>
            )}
          </>
        )}
      </div>
    </>
  );
}
