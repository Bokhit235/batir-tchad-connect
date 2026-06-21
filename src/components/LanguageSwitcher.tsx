import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");

  return (
    <div className={cn("inline-flex items-center rounded-md border overflow-hidden bg-background", className)}>
      <Button
        type="button"
        size="sm"
        variant={isAr ? "ghost" : "default"}
        onClick={() => i18n.changeLanguage("fr")}
        className="rounded-none px-2.5 py-1 text-xs gap-1"
        aria-pressed={!isAr}
      >
        <span aria-hidden>🇫🇷</span>
        <span className="font-semibold">FR</span>
      </Button>
      <div className="w-px bg-border h-4" />
      <Button
        type="button"
        size="sm"
        variant={isAr ? "default" : "ghost"}
        onClick={() => i18n.changeLanguage("ar")}
        className="rounded-none px-2.5 py-1 text-xs gap-1"
        aria-pressed={isAr}
      >
        <span aria-hidden>🇸🇦</span>
        <span className="font-semibold">AR</span>
      </Button>
    </div>
  );
}
