import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <div className="space-y-3 text-center">
      <div className="space-x-2 flex-center text-slate-400">
        <div className="h-px w-8 bg-linear-to-r from-transparent to-slate-600" />
        <ShieldCheck className="h-4 w-4" />
        <div className="h-px w-8 bg-linear-to-l from-transparent to-slate-600" />
      </div>
      <p className="text-sm font-medium text-slate-300">
        OT Focused • Monitored • Controlled
      </p>
      <p className="text-xs text-slate-400">
        Security Monitoring for ABC Smart Energy Factory
      </p>
      <div className="pt-1">
        <div className="inline-flex items-center rounded-md border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
          <span className="mr-2 h-2 w-2 rounded-full bg-green-400" />
          Live Monitoring
        </div>
      </div>
      <p className="pt-2 text-xs text-slate-500">Version: 1.3.0</p>
    </div>
  );
}
