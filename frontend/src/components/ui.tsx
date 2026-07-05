import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export function Button({ children, variant = "primary", ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }>) {
  return (
    <button className={`button ${variant}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ title, action, children }: PropsWithChildren<{ title?: string; action?: ReactNode }>) {
  return (
    <section className="card">
      {(title || action) && (
        <div className="card-header">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: PropsWithChildren<{ tone?: "neutral" | "success" | "warning" | "danger" | "info" }>) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function StatCard({ label, value, detail, tone = "info" }: { label: string; value: string | number; detail?: string; tone?: "success" | "warning" | "danger" | "info" }) {
  return (
    <div className={`stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

export function Skeleton() {
  return <div className="skeleton" aria-label="Loading" />;
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="state">
      <AlertTriangle size={20} />
      <p>{title}</p>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="state">
      <Loader2 className="spin" size={20} />
      <p>{label}</p>
    </div>
  );
}
