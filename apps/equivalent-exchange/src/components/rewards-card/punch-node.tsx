"use client";
import { updateStampById } from "@app/utils/data-access";
import { MouseEvent, useState } from "react";
import { MdCircle, MdStars } from "react-icons/md";

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
    updateStampById(cardId, index).finally(() => setLoading(false));
  }

  return (
    <>
      <div
        className="w-[32px] h-[32px] flex justify-center items-center cursor-pointer"
        onClick={punchClicked}
      >
        {isLoading && (
          <MdStars className="animate-spin" fontSize="32"></MdStars>
        )}
        {!isLoading && (
          <>
            {punched ? (
              <MdStars color="#b89f3d" fontSize="32"></MdStars>
            ) : (
              <MdCircle color="#b89f3d" fontSize="small"></MdCircle>
            )}
          </>
        )}
      </div>
    </>
  );
}
