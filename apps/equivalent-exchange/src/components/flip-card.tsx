"use client";

import type React from "react";
import { useState } from "react";
import { cn } from "@eq-ex/ui/utils/cn";

interface FlipCardProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function FlipCard({
  frontContent,
  backContent,
  className,
  onClick,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
    onClick?.();
  };

  return (
    <div
      className={cn(
        "group perspective-1000 cursor-pointer min-h-fit",
        className
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "relative transition-transform duration-700 transform-style-preserve-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        <div className="absolute inset-0 backface-hidden">
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 flex flex-col h-full">
            {frontContent}
          </div>
        </div>

        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 flex flex-col h-full">
            {backContent}
          </div>
        </div>

        <div className="invisible">
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 flex flex-col">
            {isFlipped ? backContent : frontContent}
          </div>
        </div>
      </div>
    </div>
  );
}
