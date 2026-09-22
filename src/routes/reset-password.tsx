import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, validatePassword } from "@/lib/auth-validation";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — Aegis" },
      { name: "description", content: "Choose a new password for your Aegis account." },
      { property: "og:title", content: "Set a new password — Aegis" },
      { property: "og:description", content: "Choose a new password for your Aegis account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<"checking" | "valid" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [touched, setTouched] = useState<{ password?: boolean; confirm?: boolean }>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === "PASSWORD_RECOVERY") setReady("valid");
    });
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setReady(data.session ? "valid" : "invalid");
    })();
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  function confirmError(value: string, pwd: string) {
    if (!value) return "Please re-enter your new password.";
    return value === pwd ? "" : "Passwords do not match.";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const passwordError = validatePassword(password);
    const matchError = confirmError(confirm, password);
    setTouched({ password: true, confirm: true });
    if (passwordError || matchError) {
      setFieldErrors({ password: passwordError || undefined, confirm: matchError || undefined });
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(friendlyAuthError(updateError.message));
      setLoading(false);
      return;
    }
    await supabase.auth.signOut();
    setLoading(false);
    setDone(true);
    setTimeout(() => {
      void navigate({ to: "/", replace: true });
    }, 2200);
  }

  return (
    <AuthShell animation="enter-login">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Account recovery</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">Set a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">Choose a strong password you haven't used before.</p>

      {ready === "checking" ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Checking your reset link…
        </p>
      ) : ready === "invalid" ? (
        <p role="alert" className="mt-8 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          This reset link is invalid or has expired. Request a new one to continue.
        </p>
      ) : done ? (
        <p role="status" className="mt-8 rounded-md border border-primary/25 bg-primary/10 p-4 text-sm text-primary">
          Your password has been updated. Taking you to the login screen…
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <label className="block space-y-2 text-sm font-medium">
            <span>New password</span>
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-11 pl-10"
                type="password"
                autoComplete="new-password"
                value={password}
                aria-invalid={Boolean(touched.password && fieldErrors.password)}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (touched.password) setFieldErrors((p) => ({ ...p, password: validatePassword(event.target.value) || undefined }));
                }}
                onBlur={(event) => {
                  setTouched((p) => ({ ...p, password: true }));
                  setFieldErrors((p) => ({ ...p, password: validatePassword(event.target.value) || undefined }));
                }}
                placeholder="At least 6 characters"
              />
            </span>
            {touched.password && fieldErrors.password ? (
              <span className="block text-xs font-normal text-destructive">{fieldErrors.password}</span>
            ) : null}
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Confirm new password</span>
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-11 pl-10"
                type="password"
                autoComplete="new-password"
                value={confirm}
                aria-invalid={Boolean(touched.confirm && fieldErrors.confirm)}
                onChange={(event) => {
                  setConfirm(event.target.value);
                  if (touched.confirm) setFieldErrors((p) => ({ ...p, confirm: confirmError(event.target.value, password) || undefined }));
                }}
                onBlur={(event) => {
                  setTouched((p) => ({ ...p, confirm: true }));
                  setFieldErrors((p) => ({ ...p, confirm: confirmError(event.target.value, password) || undefined }));
                }}
                placeholder="Re-enter your new password"
              />
            </span>
            {touched.confirm && fieldErrors.confirm ? (
              <span className="block text-xs font-normal text-destructive">{fieldErrors.confirm}</span>
            ) : null}
          </label>
          {error ? (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="premium" size="auth" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle className="animate-spin" /> Updating password…
              </>
            ) : (
              <>
                Update password <ArrowRight />
              </>
            )}
          </Button>
        </form>
      )}

      <p className="mt-7 text-center text-sm text-muted-foreground">
        {ready === "invalid" ? (
          <Link to="/forgot-password" className="font-semibold text-primary hover:underline">Request a new link</Link>
        ) : (
          <Link to="/" className="font-semibold text-primary hover:underline">Back to log in</Link>
        )}
      </p>
    </AuthShell>
  );
}
