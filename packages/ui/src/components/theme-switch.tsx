'use client';

import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCustomTheme } from "../providers/custom-theme-provider";


export function ThemeSwitch() {
    const { theme, toggleTheme } = useCustomTheme();

    const handleThemeToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
        const { clientX: x, clientY: y } = event;
        toggleTheme({ x, y });
    };

    return (
        <div className="px-2">
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
        </div >
    );
}




