import React from "react";
import { Check, CircleDot, Cog, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeOptions = [
  {
    value: "dark",
    label: "Dark mode",
    description: "Midnight arena look",
    icon: Moon,
    swatches: ["bg-zinc-950", "bg-orange-500"],
  },
  {
    value: "light",
    label: "Light mode",
    description: "Clean daytime scoreboard",
    icon: Sun,
    swatches: ["bg-white", "bg-orange-500"],
  },
  {
    value: "team",
    label: "Team Heat",
    description: "Miami Heat-inspired red, black & gold",
    icon: CircleDot,
    swatches: ["bg-red-800", "bg-zinc-950", "bg-yellow-500"],
  },
];

export default function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const currentTheme = theme || "team";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative overflow-hidden rounded-full border border-border/80 bg-secondary/40 text-muted-foreground hover:text-foreground"
          aria-label="Open settings"
        >
          <Cog className="h-5 w-5 transition-transform duration-300 hover:rotate-45" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Palette className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-bold">Settings</span>
            <span className="text-xs font-normal text-muted-foreground">Theme options</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = currentTheme === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="flex cursor-pointer items-center gap-3 rounded-lg p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {option.label}
                  <span className="flex -space-x-1">
                    {option.swatches.map((swatch) => (
                      <span
                        key={swatch}
                        className={`${swatch} h-3 w-3 rounded-full border border-background`}
                      />
                    ))}
                  </span>
                </span>
                <span className="block text-xs text-muted-foreground">{option.description}</span>
              </span>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
