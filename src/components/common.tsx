import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type LessonStatus } from "@/lib/progress";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string | undefined; actions?: ReactNode }) {
  return (
    <div className="mb-6 grid min-w-0 gap-3 sm:flex sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <h2 className="font-medium">{title}</h2>
      {text && <p className="max-w-md text-sm text-muted-foreground">{text}</p>}
      {action}
    </div>
  );
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <div className="h-full rounded-full bg-success transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status as LessonStatus;
  const cls =
    s === "completed"
      ? "border-success/40 bg-success/10 text-success"
      : s === "in_progress"
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-border text-muted-foreground";
  return (
    <Badge variant="outline" className={cls}>
      {STATUS_LABEL[s] ?? status}
    </Badge>
  );
}

export function LoadingBlock() {
  return <div className="panel h-32 animate-pulse" />;
}

export function ErrorBlock({ error }: { error: unknown }) {
  return (
    <div className="panel border-destructive/50 p-4 text-sm text-destructive">
      Não foi possível carregar os dados. {error instanceof Error ? error.message : ""}
    </div>
  );
}

export function ComingSoon({ title, stage }: { title: string; stage: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState title="Em construção" text={`Esta seção será implementada na ${stage}.`} />
    </>
  );
}
