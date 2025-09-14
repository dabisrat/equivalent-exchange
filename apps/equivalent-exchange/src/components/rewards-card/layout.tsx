import React, { PropsWithChildren } from "react";
import { cn } from "@eq-ex/ui/utils/cn";
import PunchNode from "./punch-node";

export type BackLayoutVariant =
  | "vertical"
  | "vertical-condensed"
  | "vertical-separated"
  | "grid-first"
  | "two-column"
  | "two-column-reverse"
  | "overlay";

export interface BackLayoutOptions {
  gap?: number; // general vertical gap (px) for stacked variants
  topWidth?: number; // percent (0-100) for two-column
  gridWidth?: number; // percent (0-100) for two-column
  gridJustify?: "around" | "between" | "center" | "start" | "end" | "evenly"; // control stamp distribution in row
  overlay?: {
    backdrop?: boolean;
    blur?: boolean;
    dimGrid?: boolean; // reduce grid opacity
  };
}

interface RenderParams {
  variant: BackLayoutVariant;
  options?: BackLayoutOptions;
  maxPoints: number;
  points: Record<number, { stamped?: boolean | null; stamp_index?: number }>;
  cardId: string;
  canModify: boolean;
  children: React.ReactNode;
}

const defaultOptions: Required<BackLayoutOptions> = {
  gap: 10,
  topWidth: 40,
  gridWidth: 60,
  gridJustify: "around",
  overlay: { backdrop: true, blur: true, dimGrid: true },
};

function renderGrid(
  maxPoints: number,
  points: RenderParams["points"],
  cardId: string,
  canModify: boolean,
  justify: BackLayoutOptions["gridJustify"]
) {
  const justifyClass =
    justify === "around"
      ? "justify-around"
      : justify === "between"
        ? "justify-between"
        : justify === "center"
          ? "justify-center"
          : justify === "start"
            ? "justify-start"
            : justify === "end"
              ? "justify-end"
              : justify === "evenly"
                ? "justify-evenly"
                : "justify-around";
  return (
    <div className={cn("flex flex-row flex-wrap", justifyClass)}>
      {Array(maxPoints)
        .fill(null)
        .map((_, i) => (
          <div key={i}>
            <PunchNode
              punched={!!points[i]?.stamped}
              cardId={cardId}
              canModify={canModify}
              index={points[i]?.stamp_index || i}
            />
          </div>
        ))}
    </div>
  );
}

export function renderBackLayout(params: RenderParams) {
  const { variant, options, children, maxPoints, points, cardId, canModify } =
    params;
  const merged: Required<BackLayoutOptions> = {
    gap: options?.gap ?? defaultOptions.gap,
    topWidth: options?.topWidth ?? defaultOptions.topWidth,
    gridWidth: options?.gridWidth ?? defaultOptions.gridWidth,
    gridJustify: options?.gridJustify ?? defaultOptions.gridJustify,
    overlay: {
      backdrop: options?.overlay?.backdrop ?? defaultOptions.overlay.backdrop,
      blur: options?.overlay?.blur ?? defaultOptions.overlay.blur,
      dimGrid: options?.overlay?.dimGrid ?? defaultOptions.overlay.dimGrid,
    },
  };

  const gapStyle = { gap: `${merged.gap}px` };
  // Adjust default justification for two-column variants if left at default 'around'
  const effectiveJustify =
    (variant === "two-column" || variant === "two-column-reverse") &&
    options?.gridJustify == null
      ? "start"
      : merged.gridJustify;
  const grid = renderGrid(
    maxPoints,
    points,
    cardId,
    canModify,
    effectiveJustify
  );
  const top = (
    <div className="flex items-center justify-center">{children}</div>
  );

  switch (variant) {
    case "vertical-condensed":
      return (
        <div className="flex flex-col" style={{ gap: 8 }}>
          {top}
          {grid}
        </div>
      );
    case "vertical-separated":
      return (
        <div className="flex flex-col" style={gapStyle}>
          {top}
          <div className="h-px bg-border" />
          {grid}
        </div>
      );
    case "grid-first":
      return (
        <div className="flex flex-col" style={gapStyle}>
          {grid}
          {top}
        </div>
      );
    case "two-column":
    case "two-column-reverse": {
      const first =
        variant === "two-column" ? top : <div className="p-3">{grid}</div>;
      const second =
        variant === "two-column" ? <div className="p-3">{grid}</div> : top;
      return (
        <div
          className={cn("flex flex-row w-full items-center", "min-h-[140px]")}
          style={{ gap: 16 }}
        >
          <div
            className={cn("flex flex-col justify-center")}
            style={{ flexBasis: `${merged.topWidth}%` }}
          >
            {first}
          </div>
          <div
            className="flex flex-col flex-1 justify-center"
            style={{ flexBasis: `${merged.gridWidth}%` }}
          >
            {second}
          </div>
        </div>
      );
    }
    case "overlay":
      return (
        <div className="relative">
          <div
            className={cn(
              merged.overlay.dimGrid && "opacity-60",
              "transition-opacity"
            )}
          >
            {grid}
          </div>
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              merged.overlay.backdrop && "bg-background/40",
              merged.overlay.blur && "backdrop-blur-sm"
            )}
          >
            {top}
          </div>
        </div>
      );
    case "vertical":
    default:
      return (
        <div className="flex flex-col" style={gapStyle}>
          {top}
          {grid}
        </div>
      );
  }
}
