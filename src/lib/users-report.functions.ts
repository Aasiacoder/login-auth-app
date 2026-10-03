import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function cell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function fmt(value?: string | null) {
  return value ? new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "—";
}

// Signed-in users only: fetches registered users from Supabase Auth,
// renders them via Papermill, and returns the PDF as base64.
export const generateUsersPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: myRole, error: roleError } = await context.supabase.rpc("get_my_role");
    if (roleError || myRole !== "admin") throw new Error("Only admins can download the user report.");
    const apiKey = process.env["PAPERMILL_API_KEY"];
    if (!apiKey) throw new Error("PDF service is not configured.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const users: { id: string; email?: string; created_at: string; last_sign_in_at?: string | null; email_confirmed_at?: string | null }[] = [];
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error("Could not load users.");
      users.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const { data: roleRows } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const roles = new Map((roleRows ?? []).map((r) => [r.user_id, r.role]));

    const rows = users
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((u, i) => `| ${i + 1} | ${cell(u.email ?? "—")} | ${roles.get(u.id) === "admin" ? "Admin" : "User"} | ${fmt(u.created_at)} | ${fmt(u.last_sign_in_at)} | ${u.email_confirmed_at ? "Yes" : "No"} |`)
      .join("\n");

    const markdown = `# Registered Users

Secure Access Hub — generated ${fmt(new Date().toISOString())}

Total users: **${users.length}**

| # | Email | Role | Registered | Last login | Verified |
|---|---|---|---|---|---|
${rows || "| — | No users yet | — | — | — | — |"}
`;

    const res = await fetch("https://api.papermill.io/v2/pdf?template=papermill-simple-report", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "text/markdown" },
      body: markdown,
    });
    if (!res.ok) throw new Error(`PDF generation failed (${res.status}).`);
    const buf = Buffer.from(await res.arrayBuffer());
    return { base64: buf.toString("base64"), count: users.length };
  });
