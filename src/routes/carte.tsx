import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapView, type MapPoint } from "@/components/MapView";
import { CATEGORIES, STATUSES, SEVERITIES, CHAD_PROVINCES, type ReportCategory, type ReportStatus, type ReportSeverity } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge, StatusBadge } from "@/components/SeverityBadge";
import { Filter, X } from "lucide-react";

export const Route = createFileRoute("/carte")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Carte des signalements — BATIR TCHAD" },
      { name: "description", content: "Carte interactive de tous les signalements d'infrastructures dégradées au Tchad." },
    ],
  }),
  component: CartePage,
});

function CartePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [severity, setSeverity] = useState<ReportSeverity | "all">("all");
  const [province, setProvince] = useState<string | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: reports = [] } = useQuery({
    queryKey: ["reports", "map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id,title,latitude,longitude,severity,category,status,province,city,created_at")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return reports.filter((r) =>
      (category === "all" || r.category === category) &&
      (status === "all" || r.status === status) &&
      (severity === "all" || r.severity === severity) &&
      (province === "all" || r.province === province),
    );
  }, [reports, category, status, severity, province]);

  const points: MapPoint[] = filtered.map((r) => ({
    id: r.id,
    title: r.title,
    latitude: r.latitude,
    longitude: r.longitude,
    severity: r.severity as ReportSeverity,
    category: r.category,
    status: r.status,
  }));

  const activeFilters = [category, status, severity, province].filter((f) => f !== "all").length;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Carte des signalements</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} signalement(s) affiché(s)</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          Filtres {activeFilters > 0 && <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5">{activeFilters}</span>}
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory | "all")}>
              <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus | "all")}>
              <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={(v) => setSeverity(v as ReportSeverity | "all")}>
              <SelectTrigger><SelectValue placeholder="Gravité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes gravités</SelectItem>
                {SEVERITIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger><SelectValue placeholder="Province" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes provinces</SelectItem>
                {CHAD_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setCategory("all"); setStatus("all"); setSeverity("all"); setProvince("all"); }} className="col-span-2 md:col-span-4">
                <X className="h-4 w-4 mr-1" /> Réinitialiser
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ height: "calc(100vh - 240px)", minHeight: 500 }}>
        <MapView
          points={points}
          onMarkerClick={(id) => navigate({ to: "/signalements/$id", params: { id } })}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <span className="text-muted-foreground">Légende :</span>
        {SEVERITIES.map((s) => (
          <div key={s.value} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: s.hex }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
