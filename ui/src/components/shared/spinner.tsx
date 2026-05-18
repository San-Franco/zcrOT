import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";
import { BiLoaderAlt } from "react-icons/bi";

type SpinnerProps = {
  isLoading: boolean;
  label?: string;
  children: React.ReactNode;
  LoaderIcon?: IconType | LucideIcon;
  iconSize?: string;
};

export default function Spinner({
  isLoading,
  label,
  children,
  LoaderIcon = BiLoaderAlt,
  iconSize = "size-4",
}: SpinnerProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      <LoaderIcon className={`animate-spin ${iconSize}`} />
      {label && <span className="font-medium">{label}</span>}
    </>
  );
}
