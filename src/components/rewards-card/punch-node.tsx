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
  ignorePunchUpdate,
  setIgnorePunchUpdate,
}: {
  cardId: string;
  punched: boolean;
  canModify: boolean;
  ignorePunchUpdate: boolean;
  setIgnorePunchUpdate: (bol: boolean) => void;
}) {
  const [isPunched, punchIt] = useState(false);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!ignorePunchUpdate) {
      punchIt(punched);
    }
  }, [punched]);

  async function punchClicked(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) {
      return;
    }

    if (!canModify) {
      return;
    }

    if (!ignorePunchUpdate) {
      setIgnorePunchUpdate(true);
    }

    setLoading(true);
    await (!isPunched
      ? addRewardPoints(cardId)
      : removeRewardPoints(cardId)
    ).finally(() => setLoading(false));

    punchIt((p) => !p);
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
            {isPunched ? (
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
