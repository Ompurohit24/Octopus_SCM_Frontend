import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  spinning?: boolean;
};

export function Logo({ size = 32, showWordmark = false, className, spinning = false }: Props) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          className={cn("text-brand", spinning && "animate-spin-slow")}
          fill="none"
        >
          <defs>
            <linearGradient id="oct-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.45 0.16 255)" />
              <stop offset="100%" stopColor="oklch(0.55 0.17 255)" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="28" stroke="url(#oct-g)" strokeWidth="2.5" />
          <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          {/* compass needle */}
          <path d="M32 10 L36 32 L32 54 L28 32 Z" fill="oklch(0.72 0.17 55)" />
          <path d="M10 32 L32 28 L54 32 L32 36 Z" fill="url(#oct-g)" opacity="0.9" />
          <circle cx="32" cy="32" r="3" fill="currentColor" />
        </svg>
      </div>
      {showWordmark && (
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            Octopus<span className="text-brand-orange">.</span>SCM
          </span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Freight Forwarding ERP
          </span>
        </div>
      )}
    </div>
  );
}
