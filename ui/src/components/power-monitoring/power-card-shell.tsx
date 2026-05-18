import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

export default function PowerCardShell({
  title,
  description,
  className,
  contentClassName,
  children,
}: Props) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-dark-border/30 bg-linear-to-br from-dark-surface via-dark-surface to-dark-bg",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-sky-500/5 via-transparent to-cyan-500/5 animate-pulse-slow" />
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(56, 189, 248, 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(56, 189, 248, 0.3) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />
      <CardHeader className="relative z-10">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={cn("relative z-10", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
