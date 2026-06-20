import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SeverityBadge, StatusBadge } from "@/components/SeverityBadge";
import {
  CATEGORIES, STATUSES, SEVERITIES, CHAD_PROVINCES,
  getCategory, type ReportCategory, type ReportSeverity, type ReportStatus,
} from "@/lib/constants";
import { BarChart3, FileText, AlertTriangle, CheckCircle2, Search, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tableau-de-bord")({
  component: DashboardPage,
});

function DashboardPage() {
  const { isAuthority, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [severity, setSeverity] = useState<ReportSeverity | "all">("all");
  const [province, setProvince] = useState<string | "all">("all");

  const { data: reports = [] } = useQuery({
    queryKey: ["dashboard-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id,title,category,severity,status,province,city,created_at,reporter_id")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const total = reports.length;
    const open = reports.filter((r) => r.status === "signale" || r.status === "verifie").length;
    const inProgress = reports.filter((r) => r.status === "en_cours").length;
    const resolved = reports.filter((r) => r.status === "resolu").length;
    const critical = reports.filter((r) => r.severity === "rouge").length;
    const byProvince: Record<string, number> = {};
    for (const r of reports) if (r.province) byProvince[r.province] = (byProvince[r.province] ?? 0) + 1;
    const byCategory: Record<string, number> = {};
    for (const r of reports) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
    return { total, open, inProgress, resolved, critical, byProvince, byCategory };
  }, [reports]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return reports.filter((r) =>
      (category === "all" || r.category === category) &&
      (status === "all" || r.status === status) &&
      (severity === "all" || r.severity === severity) &&
      (province === "all" || r.province === province) &&
      (!q || r.title.toLowerCase().includes(q)),
    );
  }, [reports, search, category, status, severity, province]);

  if (loading) return <div className="container mx-auto px-4 py-16 text-center">Chargement…</div>;

  if (!isAuthority) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Accès restreint</h1>
        <p className="text-muted-foreground mb-6">
          Ce tableau de bord est réservé aux autorités et administrateurs. Contactez un administrateur pour obtenir l'accès.
        </p>
        <Button asChild><Link to="/">Retour à l'accueil</Link></Button>
      </div>
    );
  }

  const topProvinces = Object.entries(stats.byProvince).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topCategories = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble des signalements sur le territoire tchadien.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FileText} label="Total" value={stats.total} color="bg-primary text-primary-foreground" />
        <StatCard icon={AlertTriangle} label="Critiques (rouge)" value={stats.critical} color="bg-destructive text-destructive-foreground" />
        <StatCard icon={BarChart3} label="En cours" value={stats.inProgress} color="bg-secondary text-secondary-foreground" />
        <StatCard icon={CheckCircle2} label="Résolus" value={stats.resolved} color="bg-[color:var(--color-severity-vert)] text-white" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Top provinces</CardTitle></CardHeader>
          <CardContent>
            {topProvinces.length === 0 ? <p className="text-sm text-muted-foreground">Aucune donnée</p> : (
              <div className="space-y-2">
                {topProvinces.map(([p, n]) => {
                  const pct = stats.total > 0 ? (n / stats.total) * 100 : 0;
                  return (
                    <div key={p}>
                      <div className="flex justify-between text-sm mb-1"><span>{p}</span><span className="font-semibold">{n}</span></div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Par catégorie</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {topCategories.map(([cat, n]) => {
                const c = getCategory(cat);
                return (
                  <div key={cat} className="flex items-center justify-between p-2 rounded-md bg-muted/40">
                    <span className="text-sm">{c.icon} {c.label}</span>
                    <span className="font-bold text-sm">{n}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory | "all")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus | "all")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes provinces</SelectItem>
              {CHAD_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="p-3">Signalement</th>
                  <th className="p-3 hidden md:table-cell">Catégorie</th>
                  <th className="p-3 hidden lg:table-cell">Lieu</th>
                  <th className="p-3">Gravité</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const cat = getCategory(r.category);
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium line-clamp-1">{r.title}</div>
                        <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</div>
                      </td>
                      <td className="p-3 hidden md:table-cell">{cat.icon} {cat.label}</td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{r.city || "—"}, {r.province || "—"}</td>
                      <td className="p-3"><SeverityBadge value={r.severity as ReportSeverity} /></td>
                      <td className="p-3"><StatusBadge value={r.status as ReportStatus} /></td>
                      <td className="p-3 text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/signalements/$id" params={{ id: r.id }}>Ouvrir</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun signalement</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-display">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
