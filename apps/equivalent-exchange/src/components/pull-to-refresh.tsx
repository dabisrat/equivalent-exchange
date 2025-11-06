"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
// @ts-ignore
import PullToRefreshLib from "pulltorefreshjs";

interface PullToRefreshProps {
  children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter();
  const ptrRef = useRef<any>(null);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (!isIOS || !isStandalone) {
      return;
    }

    if (PullToRefreshLib && typeof PullToRefreshLib.init === "function") {
      ptrRef.current = PullToRefreshLib.init({
        mainElement: "body",
        onRefresh: () => {
          router.refresh();
        },
        instructionsPullToRefresh: "Pull down to refresh",
        instructionsReleaseToRefresh: "Release to refresh",
        instructionsRefreshing: "Refreshing",
        iconArrow: "↓",
        iconRefreshing: "...",
      });
    } else {
      console.error("PullToRefreshLib.init is not a function");
    }

    return () => {
      if (
        ptrRef.current &&
        typeof PullToRefreshLib?.destroyAll === "function"
      ) {
        PullToRefreshLib.destroyAll();
      }
    };
  }, [router]);

  return <div>{children}</div>;
}
