import logo from "@/assets/images/zcr_logo.svg";

export default function Header() {
  return (
    <div className="text-center">
      <img
        src={logo}
        alt="zcrOT Logo"
        className="mx-auto mb-4 h-20 w-20 flex-center"
      />
      <h1 className="mb-1 text-4xl font-semibold">
        zcr<span className="text-gradient">OT</span>
      </h1>
      <p className="text-lg text-slate-300">ABC Smart Energy Factory OT Visibility Demo</p>
      <p className="mt-2 text-sm text-slate-400">
        Operational technology monitoring and visibility platform
      </p>
    </div>
  );
}
