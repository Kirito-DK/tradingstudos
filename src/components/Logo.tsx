export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/40">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 17l5-5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="font-semibold tracking-tight">
        Trade<span className="text-primary">Study</span>
      </span>
    </div>
  );
}
