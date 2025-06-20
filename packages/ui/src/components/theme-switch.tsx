'use client';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "./tooltip";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Moon, Sun } from "lucide-react";
import { createContext, useContext, useEffect } from "react";

export function ThemeSwitch() {
    const { theme, toggleTheme } = useTheme();

    const handleThemeToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
        const { clientX: x, clientY: y } = event;
        toggleTheme({ x, y });
    };

    return (
        <div className="px-2">
            <Tooltip>
                <TooltipTrigger>
                    <SwitchPrimitives.Root
                        checked={theme === "dark"}
                        onClick={handleThemeToggle}
                        className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent data-[state=unchecked]:bg-input"
                    >
                        <SwitchPrimitives.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 flex items-center justify-center">
                            {theme === "dark" ? (
                                <Moon className="size-3" />
                            ) : (
                                <Sun className="size-3" />
                            )}
                        </SwitchPrimitives.Thumb>
                    </SwitchPrimitives.Root>
                </TooltipTrigger>
                <TooltipContent>Toggle light/dark mode</TooltipContent>
            </Tooltip>
        </div>
    );
}




// import { useThemePresetFromUrl } from "@/hooks/use-theme-preset-from-url";
// import { applyThemeToElement } from "@/utils/apply-theme";
// import { useEditorStore } from "../store/editor-store";

type Theme = "dark" | "light";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
};

type Coords = { x: number; y: number };

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: (coords?: Coords) => void;
};

const initialState: ThemeProviderState = {
    theme: "light",
    setTheme: () => null,
    toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    // const { themeState, setThemeState } = useEditorStore()
    const { themeState, setThemeState } = { themeState: { currentMode: "light" }, setThemeState: (a: any) => null };;

    // Handle theme preset from URL
    // useThemePresetFromUrl();

    useEffect(() => {
        const root = document.documentElement;
        if (!root) return;

        // applyThemeToElement(themeState, root);
    }, [themeState]);

    const handleThemeChange = (newMode: Theme) => {
        setThemeState({ ...themeState, currentMode: newMode });
    };

    const handleThemeToggle = (coords?: Coords) => {
        const root = document.documentElement;
        const newMode = themeState.currentMode === "light" ? "dark" : "light";

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        // if (!document?.startViewTransition || prefersReducedMotion) {
        //     handleThemeChange(newMode);
        //     return;
        // }

        if (coords) {
            root.style.setProperty("--x", `${coords.x}px`);
            root.style.setProperty("--y", `${coords.y}px`);
        }

        // document?.startViewTransition(() => {
        //     handleThemeChange(newMode);
        // });
    };

    const value: ThemeProviderState = {
        theme: themeState.currentMode as any,
        setTheme: handleThemeChange,
        toggleTheme: handleThemeToggle,
    };

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return context;
};
