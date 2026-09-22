import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — Aegis" },
      { name: "description", content: "Your private Aegis home." },
      { property: "og:title", content: "Home — Aegis" },
      { property: "og:description", content: "Your private Aegis home." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.from("users_profile").select("last_login_at").eq("id", user.id).single()
      .then(({ data }) => {
        if (active) setLastLogin(data?.last_login_at ?? null);
      });
    return () => { active = false; };
  }, [user.id]);

  async function handleLogout() {
    await supabase.auth.signOut();
    await navigate({ to: "/", replace: true });
  }

  return (
    <main className="auth-page flex min-h-svh flex-col">
      <div className="blur-shape blur-shape-one" aria-hidden="true" />
      <div className="blur-shape blur-shape-two" aria-hidden="true" />
      <header className="relative z-10 flex items-center justify-between border-b border-border px-6 py-5 sm:px-10">
        <span className="font-display text-lg font-semibold">AEGIS</span>
        <Button variant="outline" onClick={handleLogout} className="bg-transparent">
          <LogOut /> Log out
        </Button>
      </header>
      <section className="enter-login relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <Clock3 className="h-5 w-5" />
        </span>
        <h1 className="font-display text-5xl font-semibold sm:text-7xl">Hello World</h1>
        <p className="mt-5 text-sm text-muted-foreground">
          Last login {lastLogin ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastLogin)) : "just now"}
        </p>
      </section>
    </main>
  );
}