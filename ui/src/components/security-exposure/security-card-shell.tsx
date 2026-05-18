import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  className?: string;
  contentClassName?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
};

export default function SecurityCardShell({
  title,
  description,
  className,
  contentClassName,
  headerRight,
  children,
}: Props) {
  return (
    <Card className={cn("card", className)}>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zcr-blue/8 via-transparent to-logo-three/8" />
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(56, 189, 248, 0.35) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(56, 189, 248, 0.35) 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
        }}
      />
      <CardHeader className="relative z-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="md:line-clamp-1">{description}</CardDescription>
          </div>
          {headerRight && (
            <div className="shrink-0">
              {headerRight}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn("relative z-10", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
