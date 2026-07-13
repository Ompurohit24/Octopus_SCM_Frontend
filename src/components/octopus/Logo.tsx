import logo from "../../assests/logo.jpeg";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

export function Logo({
  size = 40,
  showWordmark = false,
  className,
}: Props) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={logo}
        alt="Octopus SCM"
        style={{
          width: size,
          height: size,
          objectFit: "contain",
        }}
      />

      {showWordmark && (
        <div className="flex flex-col leading-tight">
          <span className="text-[18px] font-bold tracking-tight text-foreground">
            Octopus.SCM
          </span>

          <span className="text-[10px] uppercase tracking-[0.20em] text-muted-foreground">
            Operations ERP
          </span>
        </div>
      )}
    </div>
  );
}