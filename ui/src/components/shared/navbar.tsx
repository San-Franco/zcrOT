import LogoutModal from "@/components/modals/logout-modal";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useLogout from "@/hooks/auth/use-logout";
import { cn } from "@/lib/utils";
import useUserStore from "@/stores/user-store";
import { useState } from "react";
import { AiOutlineLogout } from "react-icons/ai";
import { BiMenuAltRight } from "react-icons/bi";
import { HiOutlineUser } from "react-icons/hi";
import { MdOutlineKeyboardDoubleArrowLeft } from "react-icons/md";
import CustomBadge from "./custom-badge";
import NotiBtn from "@/components/btn/noti-btn";

type Props = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

export default function Navbar({ collapsed, setCollapsed }: Props) {
  const { user } = useUserStore();
  const { logout, isLoggingOut } = useLogout();
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const confirmLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setLogoutOpen(false);
    setMobileActionsOpen(false);
    await logout();
  };

  return (
    <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
      <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between border-b border-zcr-blue/20 bg-linear-to-r from-zcr-blue/10 via-purple-500/5 to-transparent px-4 shadow-md">
        <div className="w-full gap-x-3 flex-between">
          <div className="gap-6 flex-center">
            <Button
              title="Toggle Sidebar"
              variant="outline"
              size="icon"
              className="icon-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              <MdOutlineKeyboardDoubleArrowLeft className={cn(collapsed ? "rotate-180" : undefined, "size-5")} />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </div>

          <div className="gap-3 flex-center">
            <div className="hidden items-center gap-3 md:flex">
              <NotiBtn />
              <button
                type="button"
                className="group rounded-lg border border-transparent px-3 py-2 transition-all duration-200 hover:border-zcr-blue/20 hover:bg-zcr-blue/10 hover:shadow-sm"
                title="Profile button"
              >
                <div className="flex items-center gap-2 text-sm text-slate-600 group-hover:text-zcr-blue">
                  <span className="hidden font-medium transition-colors md:inline group-hover:text-slate-300">
                    {user?.username || "OT Operator"}
                  </span>
                  <CustomBadge value={user?.role as string} />
                </div>
              </button>
              <Button
                variant="outline"
                size="icon"
                className="icon-btn"
                title="Logout Button"
                onClick={() => setLogoutOpen(true)}
              >
                <AiOutlineLogout className="size-4" />
                <span className="sr-only">Logout Button</span>
              </Button>
            </div>

            <Sheet open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="icon-btn md:hidden"
                  title="Open Navbar Actions"
                >
                  <BiMenuAltRight className="size-6" />
                  <span className="sr-only">Open Navbar Actions</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex h-full flex-col primary-gradient border-zcr-blue/20 sm:max-w-lg"
              >
                <SheetHeader className="pr-8">
                  <SheetTitle>Quick Actions</SheetTitle>
                  <SheetDescription>
                    Notifications, profile shortcut, and session actions.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 flex min-h-0 flex-1 flex-col gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Notifications
                    </p>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-zcr-blue/15 p-3 modal-bg/40">
                      <div>
                        <p className="text-sm font-medium">Open notification center</p>
                        <p className="text-xs text-muted-foreground">
                          View OT alerts and updates
                        </p>
                      </div>
                      <NotiBtn />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="flex items-center justify-between gap-3 rounded-lg border border-zcr-blue/15 p-3 text-left transition-all modal-bg/40 hover:bg-zcr-blue/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-md bg-zcr-blue/10 text-zcr-blue">
                        <HiOutlineUser className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{user?.username}</p>
                          <CustomBadge value={user?.role} />
                        </div>
                        <p className="text-xs text-muted-foreground">{user?.email || "Profile button only"}</p>
                      </div>
                    </div>
                  </button>

                  <div className="mt-auto border-t border-zcr-blue/20 pt-4">
                    <Button
                      variant="destructive"
                      className="min-h-11 w-full cursor-pointer justify-start"
                      onClick={() => {
                        setMobileActionsOpen(false);
                        setLogoutOpen(true);
                      }}
                    >
                      <AiOutlineLogout className="size-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <LogoutModal onConfirm={confirmLogout} isLoading={isLoggingOut} />
    </Dialog>
  );
}
