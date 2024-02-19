"use client";
import { updateRewardPoints } from "@PNN/utils/data-access/data-acess";
import { useEffect, useState } from "react";
import { MdStars, MdCircle } from "react-icons/md";

export default function PunchNode({
  cardId,
  total,
  punched,
}: {
  cardId: string;
  total: number;
  punched: boolean;
}) {
  const [isPunched, punchIt] = useState(punched);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (total === 0) {
      punchIt(false);
    }
  }, [total]);

  async function punchClicked(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    const count = isPunched ? -1 : 1;
    await updateRewardPoints(cardId, count + total).finally(() =>
      setLoading(false)
    );
    punchIt(!isPunched);
  }

  return (
    <>
      <div
        className="w-[24px] h-[24px] flex justify-center items-center"
        onClick={(e) => punchClicked(e)}
      >
        {isLoading && (
          <MdStars className="animate-ping" fontSize="24"></MdStars>
        )}
        {!isLoading && (
          <>
            {isPunched ? (
              <MdStars color="#857A46" fontSize="24"></MdStars>
            ) : (
              <MdCircle color="#857A46" fontSize="small"></MdCircle>
            )}
          </>
        )}
      </div>
    </>
  );
}
