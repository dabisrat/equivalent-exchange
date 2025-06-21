"use client"
import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
};

type Coords = { x: number; y: number };

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: (coords?: Coords, theme?: Theme) => void;
};

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
    toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function CustomThemeProvider({ children, ...props }: ThemeProviderProps) {
    const { setTheme, theme } = useTheme()


    useEffect(() => {
        const root = document.documentElement;
        if (!root) return;

        setTheme(theme as Theme);
    }, [theme]);


    const handleThemeToggle = (coords?: Coords, theme?: Theme) => {
        const root = document.documentElement;
        const newMode = 'system'

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        // Check if View Transitions API is supported
        const supportsViewTransitions = 'startViewTransition' in document;

        if (!supportsViewTransitions || prefersReducedMotion) {
            setTheme(theme || newMode);
            return;
        }

        if (coords) {
            root.style.setProperty("--x", `${coords.x}px`);
            root.style.setProperty("--y", `${coords.y}px`);
        }

        // Use type assertion only after confirming support
        (document as any).startViewTransition(() => {
            setTheme(theme || newMode);
        });
    };

    const value: ThemeProviderState = {
        theme: theme as Theme,
        setTheme: setTheme,
        toggleTheme: handleThemeToggle,
    };

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useCustomTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return context;
};