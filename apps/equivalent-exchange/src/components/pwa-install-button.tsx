"use client";

import { useState, useEffect } from "react";
import { Button } from "@eq-ex/ui/components/button";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@eq-ex/ui/components/dialog";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showSafariInstructions, setShowSafariInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone
    ) {
      setIsInstalled(true);
      return;
    }

    // Detect Safari (both macOS and iOS)
    const userAgent = window.navigator.userAgent;
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isIOSDevice = /iphone|ipad|ipod/i.test(userAgent);
    setIsSafari(isSafariBrowser);
    setIsIOS(isIOSDevice);

    const handler = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if the app was installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    // For Safari, show install option if not already installed
    if (isSafariBrowser) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Chrome/Edge install flow
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } else if (isSafari) {
      // Safari install flow - show instructions
      setShowSafariInstructions(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Install App
      </Button>

      {/* Safari Install Instructions Dialog */}
      <Dialog
        open={showSafariInstructions}
        onOpenChange={setShowSafariInstructions}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Install EQ/EX</DialogTitle>
            <DialogDescription>
              {isIOS
                ? "Add this app to your home screen for quick access"
                : "Add this app to your Dock for quick access"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                  1
                </span>
              </div>
              <div className="pt-1">
                <span className="text-gray-700 dark:text-gray-300">
                  Click the <strong>Share</strong> button in Safari&apos;s
                  toolbar
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                  2
                </span>
              </div>
              <div className="pt-1">
                <span className="text-gray-700 dark:text-gray-300">
                  Select{" "}
                  <strong>
                    {isIOS ? "Add to Home Screen" : "Add to Dock"}
                  </strong>{" "}
                  from the menu
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                  3
                </span>
              </div>
              <div className="pt-1">
                <span className="text-gray-700 dark:text-gray-300">
                  Click <strong>&ldquo;Add&rdquo;</strong> to install the app
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowSafariInstructions(false)}
              className="w-full"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
