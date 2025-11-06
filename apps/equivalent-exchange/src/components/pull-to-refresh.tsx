"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PullToRefreshProps {
  children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const router = useRouter();
  const isRefreshing = useRef(false);

  const maxPullDistance = 80;
  const triggerDistance = 60;

  useEffect(() => {
    // Only enable on iOS PWAs
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (!isIOS || !isStandalone) {
      return;
    }

    let touchStartY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the page
      if (window.scrollY > 0 || isRefreshing.current) {
        return;
      }

      touchStartY = e.touches[0].clientY;
      startY.current = touchStartY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing.current) {
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY;

      if (distance > 0) {
        e.preventDefault();
        setIsPulling(true);
        // Apply resistance to pull distance
        const resistedDistance = Math.min(
          Math.pow(distance, 0.85),
          maxPullDistance
        );
        setPullDistance(resistedDistance);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= triggerDistance && !isRefreshing.current) {
        isRefreshing.current = true;
        
        // Show loading state
        setPullDistance(triggerDistance);
        
        // Trigger refresh
        router.refresh();
        
        // Wait for animation
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        isRefreshing.current = false;
      }

      setIsPulling(false);
      setPullDistance(0);
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, router]);

  const rotation = (pullDistance / triggerDistance) * 360;
  const opacity = Math.min(pullDistance / triggerDistance, 1);
  const isTriggered = pullDistance >= triggerDistance;

  return (
    <div className="relative">
      {/* Pull indicator */}
      {isPulling && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
          style={{
            transform: `translateY(${Math.min(pullDistance - 20, 40)}px)`,
            transition: pullDistance === 0 ? "transform 0.3s ease-out" : "none",
          }}
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-primary"
            style={{
              opacity,
              transform: `rotate(${rotation}deg) scale(${
                isTriggered ? 1.1 : 1
              })`,
              transition: pullDistance === 0 ? "all 0.3s ease-out" : "none",
            }}
          >
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: isPulling
            ? `translateY(${Math.min(pullDistance * 0.5, 40)}px)`
            : "none",
          transition: pullDistance === 0 ? "transform 0.3s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
