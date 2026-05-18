import Logo from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { BsEthernet } from "react-icons/bs";
import { RiAlarmWarningLine, RiFileChartLine, RiFlashlightLine, RiShieldFlashLine, RiUserSettingsLine } from "react-icons/ri";
import { VscSourceControl } from "react-icons/vsc";
import { Link, NavLink } from "react-router";

const navLinks = [
  {
    path: "/dashboard/communication-control",
    name: "Communication & Control",
    description: "Asset Paths & Modbus Health",
    icon: VscSourceControl,
  },
  {
    path: "/dashboard/security-exposure",
    name: "Security Exposure",
    description: "Risk Signals & Event Evidence",
    icon: RiShieldFlashLine,
  },
  {
    path: "/dashboard/detection-engine",
    name: "Detection Engine",
    description: "Rules, Allowlists & Incidents",
    icon: RiAlarmWarningLine,
  },
  {
    path: "/dashboard/power-monitoring",
    name: "Power Monitoring",
    description: "Voltage & Energy Signals",
    icon: RiFlashlightLine,
  },
  {
    path: "/dashboard/ports-management",
    name: "Ports Management",
    description: "Reserved for OT ports workflow",
    icon: BsEthernet,
  },
  {
    path: "/dashboard/user-management",
    name: "Users Management",
    description: "Accounts & Access Status",
    icon: RiUserSettingsLine,
  },
  {
    path: "/dashboard/report",
    name: "Report Generator",
    description: "OT Visibility & Security Reports",
    icon: RiFileChartLine,
  },
];

type Props = {
  collapsed: boolean;
  onNavigate?: () => void;
};

export default function Sidebar({ collapsed, onNavigate }: Props) {
  return (
    <aside
      className={cn(
        "fixed z-40 flex h-full flex-col overflow-x-hidden border-r border-zcr-blue/20 bg-dark-bg md:bg-transparent md:bg-linear-to-b md:from-zcr-blue/10 md:via-purple-500/5 md:to-transparent [transition:width_300ms_cubic-bezier(0.4,0,0.2,1),left_300ms_cubic-bezier(0.4,0,0.2,1)]",
        collapsed ? "max-md:-left-full md:w-17.5 md:items-center" : "max-md:left-0 md:w-85",
      )}
    >
      <div
        className={cn(
          "min-h-20",
          collapsed
            ? "p-2"
            : "border-b border-zcr-blue/10 bg-dark-bg p-4 md:bg-transparent md:bg-linear-to-br md:from-zcr-blue/10 md:via-purple-500/5 md:to-transparent",
        )}
      >
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <Logo />
          </div>
        ) : (
          <Link to="/dashboard/communication-control">
            <div className="mt-3 flex items-center justify-center">
              <Logo hideText asLink={false} />
            </div>
          </Link>
        )}
      </div>

      <div className={cn("grow overflow-y-auto overflow-x-hidden no-scrollbar", collapsed ? "p-2" : "p-4")}>
        <nav className="space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-lg transition-all duration-200",
                    collapsed ? "justify-center p-2" : "p-3",
                    isActive
                      ? "bg-gradient cursor-default text-white"
                      : "group cursor-pointer text-slate-600 hover:bg-zcr-blue/10 hover:text-zcr-blue",
                  )
                }
                title={collapsed ? link.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    <div className="shrink-0 rounded-lg p-2">
                      <Icon
                        className={cn(
                          "size-6",
                          isActive ? "text-white" : "text-zcr-blue",
                        )}
                      />
                    </div>
                    {!collapsed && (
                      <div className="ml-3 flex-1 text-left">
                        <div className="line-clamp-1 font-semibold">{link.name}</div>
                        <p
                          className={cn(
                            "line-clamp-1 text-xs",
                            isActive ? "text-blue-100" : "text-slate-500",
                          )}
                        >
                          {link.description}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
