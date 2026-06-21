import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";

const LANGS = [
  { code: "fr", flag: "🇫🇷", label: "FR" },
  { code: "ar", flag: "🇸🇦", label: "AR" },
] as const;

export function LanguageSwitcher({ variant = "navbar" }: { variant?: "navbar" | "plain" }) {
  const { i18n } = useTranslation();
  const current = LANGS.find((l) => i18n.language.startsWith(l.code)) ?? LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant={variant === "navbar" ? "ghost" : "outline"}
          className={
            variant === "navbar"
              ? "text-primary-foreground hover:bg-primary/60 gap-1"
              : "gap-1"
          }
        >
          <Languages className="h-4 w-4" />
          <span className="text-base leading-none">{current.flag}</span>
          <span className="font-semibold">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => i18n.changeLanguage(l.code)}
            className="gap-2 cursor-pointer"
          >
            <span className="text-lg">{l.flag}</span>
            <span className="font-medium">{l.label}</span>
            {current.code === l.code && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
