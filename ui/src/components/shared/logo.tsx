import { Link } from "react-router";
import logo from "@/assets/images/zcr_logo.svg";
import { cn } from "@/lib/utils";

type Props = {
  hideText?: boolean;
  asLink?: boolean;
};

export default function Logo({ hideText = false, asLink = true }: Props) {
  const content = (
    <>
      <img src={logo} alt="zcrOT logo" className="size-11 rounded-lg" />
      <div className={cn(hideText && "hidden")}>
        <h2 className="text-lg font-semibold tracking-wider line-clamp-1">
          zcr<span className="tracking-normal text-gradient">OT</span>
        </h2>
        <p className="text-xs text-slate-500 line-clamp-1">
          ABC OT Visibility Demo
        </p>
      </div>
    </>
  );

  if (!asLink) {
    return <div className="gap-3 flex-center">{content}</div>;
  }

  return (
    <Link to="/dashboard/communication-control" className="gap-3 flex-center">
      {content}
    </Link>
  );
}
