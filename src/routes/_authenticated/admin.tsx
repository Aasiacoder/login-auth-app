import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, LoaderCircle, LogOut, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { generateUsersPdf } from "@/lib/users-report.functions";
import { formatDate, saveBase64Pdf } from "@/lib/download-pdf";
import type { AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") throw redirect({ to: "/home" });
  },
  head: () => ({
    meta: [
      { title: "User Management — Aegis" },
      { name: "description", content: "Manage Aegis users and their roles." },
      { property: "og:title", content: "User Management — Aegis" },
      { property: "og:description", content: "Manage Aegis users and their roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

type Row = { id: string; email: string | null; role: AppRole; created_at: string; last_sign_in_at: string | null };

function AdminPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const generatePdf = useServerFn(generateUsersPdf);
  const [downloading, setDownloading] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError("");
    setRows(null);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      setLoadError(error.message || "Could not load users.");
      return;
    }
    setRows((data ?? []) as Row[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function changeRole(row: Row, role: AppRole) {
    if (role === row.role) return;
    const prev = row.role;
    setSaving(row.id);
    setRows((r) => r?.map((x) => (x.id === row.id ? { ...x, role } : x)) ?? r);
    const { error } = await supabase.rpc("admin_set_user_role", { _user_id: row.id, _role: role });
    setSaving(null);
    if (error) {
      setRows((r) => r?.map((x) => (x.id === row.id ? { ...x, role: prev } : x)) ?? r);
      toast.error(error.message);
      return;
    }
    toast.success(`Role updated to ${role === "admin" ? "Admin" : "User"} for ${row.email ?? "user"}`);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const { base64 } = await generatePdf();
      saveBase64Pdf(base64);
    } catch {
      toast.error("Could not generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    await navigate({ to: "/", replace: true });
  }

  const admins = rows?.filter((r) => r.role === "admin").length ?? 0;

  return (
    <main className="auth-page flex min-h-svh flex-col">
      <div className="blur-shape blur-shape-one" aria-hidden="true" />
      <div className="blur-shape blur-shape-two" aria-hidden="true" />
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-semibold">AEGIS</span>
          <Badge>Admin</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={downloading} className="bg-transparent">
            {downloading ? <LoaderCircle className="animate-spin" /> : <Download />} Download PDF
          </Button>
          <Button variant="outline" onClick={handleLogout} className="bg-transparent">
            <LogOut /> Log out
          </Button>
        </div>
      </header>
      <section className="enter-login relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="font-display text-4xl font-semibold">User Management</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {rows ? `${rows.length} ${rows.length === 1 ? "user" : "users"} · ${admins} ${admins === 1 ? "admin" : "admins"}` : "Loading…"}
        </p>
        <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-card/40">
          {loadError ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button variant="outline" onClick={load}><RotateCw /> Retry</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!rows ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">No users yet.</TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const self = row.id === user.id;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.email ?? "—"} {self ? <span className="text-muted-foreground">(you)</span> : null}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(row.created_at)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(row.last_sign_in_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={row.role}
                              disabled={self || saving === row.id}
                              onValueChange={(v) => changeRole(row, v as AppRole)}
                            >
                              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                            {saving === row.id ? <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                          </div>
                          {self ? <p className="mt-1 text-xs text-muted-foreground">You can't change your own role</p> : null}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </main>
  );
}
