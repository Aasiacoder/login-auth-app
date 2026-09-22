import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
  animation: "enter-login" | "enter-signup";
};

export function AuthShell({ children, animation }: AuthShellProps) {
  return (
    <main className="auth-page">
      <div className="blur-shape blur-shape-one" aria-hidden="true" />
      <div className="blur-shape blur-shape-two" aria-hidden="true" />
      <section className={`auth-layout ${animation}`}>
        <div className="auth-art" aria-hidden="true">
          <div className="icon-stage">
            <div className="icon-aura" />
            <div className="lock-cube">
              <div className="lock-face lock-face-front">
                <ShieldCheck strokeWidth={1.35} />
              </div>
              <div className="lock-face lock-face-back">
                <ShieldCheck strokeWidth={1.35} />
              </div>
              <div className="lock-face lock-face-left" />
              <div className="lock-face lock-face-right" />
              <div className="lock-face lock-face-top" />
              <div className="lock-face lock-face-bottom" />
            </div>
            <div className="icon-shadow" />
          </div>
          <p className="art-kicker">Private by design</p>
          <h2 className="art-title">Your space,<br />securely yours.</h2>
        </div>
        <div className="auth-panel">{children}</div>
      </section>
    </main>
  );
}