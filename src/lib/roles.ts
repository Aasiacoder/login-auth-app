import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "user";

// Fail safe: any error or empty result means "user", never admin.
export async function getMyRole(): Promise<AppRole> {
  try {
    const { data, error } = await supabase.rpc("get_my_role");
    if (error || !data) return "user";
    return data === "admin" ? "admin" : "user";
  } catch {
    return "user";
  }
}

export function homePathForRole(role: AppRole): "/admin" | "/home" {
  return role === "admin" ? "/admin" : "/home";
}
