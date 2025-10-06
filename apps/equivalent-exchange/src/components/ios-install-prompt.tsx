"use client";

import { useState, useEffect } from "react";
import { Button } from "@eq-ex/ui/components/button";
import { Share, Plus, X } from "lucide-react";

export function IOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    setIsIOS(isIOSDevice);
    setIsStandalone(isStandaloneMode);

    // Show prompt if it's iOS, not in standalone mode, and user hasn't dismissed it
    if (isIOSDevice && !isStandaloneMode) {
      const hasSeenPrompt = localStorage.getItem(
        "ios-install-prompt-dismissed"
      );
      if (!hasSeenPrompt) {
        // Show prompt after a short delay
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }
  }, []);

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem("ios-install-prompt-dismissed", "true");
  };

  if (!isIOS || isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          Install EQ/EX
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={dismissPrompt}
          className="p-1 h-auto"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Add EQ/EX to your home screen for a better experience
      </p>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-xs">1</span>
          </div>
          <span className="text-gray-700 dark:text-gray-300">
            Tap the <Share className="w-4 h-4 inline mx-1" /> share button
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-xs">2</span>
          </div>
          <span className="text-gray-700 dark:text-gray-300">
            Tap &ldquo;Add to Home Screen&rdquo;{" "}
            <Plus className="w-4 h-4 inline ml-1" />
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={dismissPrompt} className="flex-1">
          Got it
        </Button>
      </div>
    </div>
  );
}
