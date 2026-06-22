import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyReports } from "@/lib/reports.functions";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SeverityBadge, StatusBadge } from "@/components/SeverityBadge";
import { CHAD_PROVINCES, getCategory, type ReportSeverity, type ReportStatus } from "@/lib/constants";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profil")({
  component: ProfilPage,
});

function ProfilPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setProvince(data.province ?? "");
        setCity(data.city ?? "");
      }
    });
  }, [user]);

  const fetchMyReports = useServerFn(getMyReports);
  const { data: myReports = [] } = useQuery({
    queryKey: ["my-reports", user?.id],
    enabled: !!user,
    queryFn: () => fetchMyReports(),
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, full_name: fullName, phone, province: province || null, city: city || null,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t("profile.saved"));
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="font-display text-3xl font-bold mb-6">{t("profile.title")}</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("profile.info")}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.fullName")}</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("profile.phone")}</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("map.province")}</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger><SelectValue placeholder={t("profile.selectProvince")} /></SelectTrigger>
                  <SelectContent>
                    {CHAD_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t("profile.city")}</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving}>{t("common.save")}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("profile.myReports")} ({myReports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {myReports.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {t("profile.emptyReports")}
                <div className="mt-3"><Button asChild size="sm"><Link to="/signaler">{t("profile.createFirst")}</Link></Button></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {myReports.map((r) => {
                  const cat = getCategory(r.category);
                  return (
                    <Link key={r.id} to="/signalements/$id" params={{ id: r.id }}
                      className="block p-3 rounded-lg border hover:border-primary/40 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-medium text-sm line-clamp-1">{cat.icon} {r.title}</div>
                        <StatusBadge value={r.status as ReportStatus} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city || r.province || t("common.chad")}</span>
                        <SeverityBadge value={r.severity as ReportSeverity} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
