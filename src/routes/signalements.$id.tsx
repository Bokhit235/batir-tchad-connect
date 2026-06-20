import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapView } from "@/components/MapView";
import { SeverityBadge, StatusBadge } from "@/components/SeverityBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { signImagePaths } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";
import { getCategory, STATUSES, type ReportCategory, type ReportSeverity, type ReportStatus } from "@/lib/constants";
import { MapPin, Calendar, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signalements/$id")({
  ssr: false,
  component: DetailPage,
});

function DetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { user, isAuthority } = useAuth();
  const [newStatus, setNewStatus] = useState<ReportStatus | "">("");
  const [note, setNote] = useState("");

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: images = [] } = useQuery({
    queryKey: ["report-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_images")
        .select("id,storage_path")
        .eq("report_id", id);
      if (error) throw error;
      const paths = (data ?? []).map((r) => r.storage_path);
      const urls = await signImagePaths(paths);
      return (data ?? []).map((r) => ({ ...r, url: urls[r.storage_path] }));
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["report-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_status_history")
        .select("*")
        .eq("report_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!newStatus) throw new Error("Choisissez un statut");
      const { error } = await supabase
        .from("reports")
        .update({
          status: newStatus,
          resolution_note: note || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut mis à jour");
      setNote("");
      setNewStatus("");
      qc.invalidateQueries({ queryKey: ["report", id] });
      qc.invalidateQueries({ queryKey: ["report-history", id] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !report) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Chargement…</div>;
  }

  const cat = getCategory(report.category);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link to="/signalements" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Retour
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{cat.label}</span>
                </div>
                <div className="flex gap-2">
                  <SeverityBadge value={report.severity as ReportSeverity} />
                  <StatusBadge value={report.status as ReportStatus} />
                </div>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">{report.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1"><MapPin className="h-4 w-4" />{report.city || "—"}, {report.province || "Tchad"}</div>
                <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(report.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-foreground/90">{report.description}</p>
              {report.resolution_note && (
                <div className="mt-4 p-3 rounded-md bg-muted text-sm">
                  <div className="font-semibold mb-1">Note de l'autorité :</div>
                  {report.resolution_note}
                </div>
              )}
            </CardContent>
          </Card>

          {images.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Photos ({images.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img) => (
                    <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-lg border">
                      <img src={img.url} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Localisation</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="h-72">
                <MapView
                  points={[{
                    id: report.id,
                    title: report.title,
                    latitude: report.latitude,
                    longitude: report.longitude,
                    severity: report.severity as ReportSeverity,
                    category: report.category,
                    status: report.status,
                  }]}
                  center={[report.latitude, report.longitude]}
                  zoom={13}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {isAuthority && (
            <Card>
              <CardHeader><CardTitle className="text-base">Action autorité</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ReportStatus)}>
                  <SelectTrigger><SelectValue placeholder="Changer le statut" /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea placeholder="Note (optionnelle)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button className="w-full" onClick={() => updateMut.mutate()} disabled={!newStatus || updateMut.isPending}>
                  Mettre à jour
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Historique</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun changement de statut.</p>
              ) : (
                <ol className="space-y-3">
                  {history.map((h) => (
                    <li key={h.id} className="border-l-2 border-primary/30 pl-3">
                      <div className="text-sm font-medium">
                        {h.old_status ? <>De <StatusBadge value={h.old_status as ReportStatus} /> à </> : null}
                        <StatusBadge value={h.new_status as ReportStatus} />
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("fr-FR")}</div>
                      {h.note && <div className="text-sm mt-1">{h.note}</div>}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
