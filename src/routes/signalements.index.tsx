import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, STATUSES, SEVERITIES, CHAD_PROVINCES, getCategory, type ReportCategory, type ReportSeverity, type ReportStatus } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge, StatusBadge } from "@/components/SeverityBadge";
import { MapPin, Search } from "lucide-react";

export const Route = createFileRoute("/signalements/")({
  head: () => {
    const siteUrl = typeof window !== "undefined"
      ? (import.meta.env?.VITE_SITE_URL || window.location.origin)
      : (import.meta.env?.VITE_SITE_URL || "https://batirtchad.org");
    const pageUrl = `${siteUrl}/signalements`;

    return {
      meta: [
        { title: "Signalements citoyens au Tchad | BATIR TCHAD" },
        { name: "description", content: "Découvrez les signalements d'infrastructures réalisés par les citoyens au Tchad et suivez leur évolution." },
        { property: "og:title", content: "Signalements citoyens au Tchad | BATIR TCHAD" },
        { property: "og:description", content: "Découvrez les signalements d'infrastructures réalisés par les citoyens au Tchad et suivez leur évolution." },
        { property: "og:url", content: pageUrl },
        { property: "og:type", content: "website" },
      ],
      links: [
        { rel: "canonical", href: pageUrl },
      ],
    };
  },
  component: ListPage,
});

function ListPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [severity, setSeverity] = useState<ReportSeverity | "all">("all");
  const [province, setProvince] = useState<string | "all">("all");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports_public")
        .select("id,title,description,category,severity,status,province,city,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return reports.filter((r) =>
      (category === "all" || r.category === category) &&
      (status === "all" || r.status === status) &&
      (severity === "all" || r.severity === severity) &&
      (province === "all" || r.province === province) &&
      (!q || (r.title ?? "").toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q)),
    );
  }, [reports, search, category, status, severity, province]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">{t("list.title")}</h1>
        <p className="text-muted-foreground">{t("list.subtitle")}</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="ps-9" placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory | "all")}>
            <SelectTrigger><SelectValue placeholder={t("map.category")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("map.allCategories")}</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.icon} {t(`categories.${c.value}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus | "all")}>
            <SelectTrigger><SelectValue placeholder={t("map.status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("map.allStatuses")}</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{t(`statuses.${s.value}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger><SelectValue placeholder={t("map.province")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("map.allProvinces")}</SelectItem>
              {CHAD_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t("list.empty")}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const cat = getCategory(r.category as ReportCategory);
            return (
              <Link key={r.id!} to="/signalements/$id" params={{ id: r.id! }}>

                <Card className="h-full hover:border-primary/40 hover:-translate-y-0.5 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-medium text-muted-foreground uppercase">{t(`categories.${cat.value}`)}</span>
                      </div>
                      <SeverityBadge value={r.severity as ReportSeverity} />
                    </div>
                    <h3 className="font-semibold mb-1 line-clamp-2">{r.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{r.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {r.city || r.province || t("common.chad")}
                      </div>
                      <StatusBadge value={r.status as ReportStatus} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
