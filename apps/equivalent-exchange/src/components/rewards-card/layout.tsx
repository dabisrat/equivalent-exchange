import React, { PropsWithChildren } from "react";
import { cn } from "@eq-ex/ui/utils/cn";
import PunchNode from "./punch-node";
import { PunchNodeConfig } from "@eq-ex/shared/schemas/card-config";
// Import safelist to ensure grid classes are included in production build
import "@app/components/rewards-card/grid-safelist";

export type BackLayoutVariant =
  | "vertical"
  | "grid-first"
  | "two-column"
  | "two-column-reverse"
  | "overlay"
  | "custom";

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
  // Custom CSS Grid layout configuration
  customGrid?: {
    containerClasses?: string; // Tailwind classes for the grid container
    punchNodes: Array<{
      index: number; // Which punch node (0-based)
      classes: string; // Tailwind classes for positioning this punch node
    }>;
    contentClasses?: string; // Tailwind classes for positioning the content
  };
}

interface RenderParams {
  variant: BackLayoutVariant;
  options?: BackLayoutOptions;
  maxPoints: number;
  points: Record<number, { stamped?: boolean | null; stamp_index?: number }>;
  cardId: string;
  canModify: boolean;
  punchNodeConfig?: PunchNodeConfig;
  isReady: boolean;
  children: React.ReactNode;
}

const defaultOptions: Required<Omit<BackLayoutOptions, "customGrid">> & {
  customGrid?: BackLayoutOptions["customGrid"];
} = {
  gap: 10,
  topWidth: 40,
  gridWidth: 60,
  gridJustify: "start",
  overlay: { backdrop: true, blur: true, dimGrid: true },
};

function renderGrid(
  maxPoints: number,
  points: RenderParams["points"],
  cardId: string,
  canModify: boolean,
  isReady: boolean,
  punchNodeConfig?: PunchNodeConfig
) {
  // Use CSS Grid for all layouts for consistent spacing
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(32px,1fr))] justify-items-center">
      {Array(maxPoints)
        .fill(null)
        .map((_, i) => (
          <PunchNode
            key={i}
            punched={!!points[i]?.stamped}
            cardId={cardId}
            canModify={canModify}
            index={points[i]?.stamp_index || i}
            loading={!isReady}
            config={punchNodeConfig}
          />
        ))}
    </div>
  );
}
export function renderBackLayout(params: RenderParams) {
  const {
    variant,
    options,
    children,
    maxPoints,
    points,
    cardId,
    canModify,
    isReady,
    punchNodeConfig,
  } = params;
  const merged: Required<Omit<BackLayoutOptions, "customGrid">> & {
    customGrid?: BackLayoutOptions["customGrid"];
  } = {
    gap: options?.gap ?? defaultOptions.gap,
    topWidth: options?.topWidth ?? defaultOptions.topWidth,
    gridWidth: options?.gridWidth ?? defaultOptions.gridWidth,
    gridJustify: options?.gridJustify ?? defaultOptions.gridJustify,
    overlay: {
      backdrop: options?.overlay?.backdrop ?? defaultOptions.overlay.backdrop,
      blur: options?.overlay?.blur ?? defaultOptions.overlay.blur,
      dimGrid: options?.overlay?.dimGrid ?? defaultOptions.overlay.dimGrid,
    },
    customGrid: options?.customGrid,
  };

  const gapStyle = { gap: `${merged.gap}px` };
  const grid = renderGrid(
    maxPoints,
    points,
    cardId,
    canModify,
    isReady,
    punchNodeConfig
  );
  const top = (
    <div className="flex items-center justify-center">{children}</div>
  );

  switch (variant) {
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
    case "custom":
      if (!merged.customGrid) {
        // Fallback to vertical if no custom grid defined
        return (
          <div className="flex flex-col" style={gapStyle}>
            {top}
            {grid}
          </div>
        );
      }

      const { containerClasses, punchNodes, contentClasses } =
        merged.customGrid;

      return (
        <div className={cn("grid", containerClasses)}>
          {/* Render content if contentClasses provided */}
          {contentClasses && <div className={contentClasses}>{children}</div>}

          {/* Render punch nodes at specified positions */}
          {punchNodes.map((punchNode) => (
            <div key={punchNode.index} className={punchNode.classes}>
              <PunchNode
                punched={!!points[punchNode.index]?.stamped}
                cardId={cardId}
                canModify={canModify}
                loading={!isReady}
                index={points[punchNode.index]?.stamp_index || punchNode.index}
                config={punchNodeConfig}
              />
            </div>
          ))}
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
