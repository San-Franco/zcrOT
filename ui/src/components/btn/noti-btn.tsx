import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import logo from "@/assets/images/zcr_logo.svg";
import useNotiStore from "@/stores/noti-store";
import useMarkAsRead from "@/hooks/system/use-read-noti";
import useDeleteNoti from "@/hooks/system/use-delete-noti";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { VscEye } from "react-icons/vsc";

export default function NotiBtn() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const notifications = useNotiStore((state) => state.notifications);
  const { markAsRead, updating } = useMarkAsRead();
  const { deleteNoti, deleting } = useDeleteNoti();

  const unreadCount = useMemo(
    () => notifications.filter((noti) => noti.status === "SENT").length,
    [notifications],
  );

  const filteredNotifications = useMemo(
    () =>
      filter === "all"
        ? notifications
        : notifications.filter((noti) => noti.status === "SENT"),
    [filter, notifications],
  );

  const handleMarkAsRead = (
    e: React.MouseEvent<HTMLButtonElement>,
    notiId: number,
    status: "SENT" | "READ",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (status === "SENT") {
      markAsRead(notiId);
    }
  };

  const handleDelete = (
    e: React.MouseEvent<HTMLButtonElement>,
    notiId: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNoti(notiId);
  };

  const formatRelativeTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "just now";
    }
    return `${formatDistanceToNowStrict(parsed, { addSuffix: true })}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="relative cursor-pointer"
        >
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute h-5 min-w-5 rounded-full px-1 -right-2 -top-2"
            >
              {unreadCount}
            </Badge>
          )}
          <Bell />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="md:w-105 w-85 h-100 z-1000 flex flex-col p-0 primary-gradient"
        align="end"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 pt-2 pb-2 border-b">
          <h2 className="text-lg font-medium">Notifications</h2>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="w-22.5">
            <TabsList className="h-6 dialog-bg">
              <TabsTrigger value="all" className="text-[10px] cursor-pointer py-0">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-[10px] cursor-pointer py-0">
                Unread
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 p-2 space-y-2 overflow-y-auto no-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <BellOff className="w-12 h-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onSelect={(event) => event.preventDefault()}
                className={cn(
                  "group relative flex cursor-pointer items-start gap-3 rounded-md border p-3",
                  item.status === "SENT"
                    ? "border-blue-400/30 bg-blue-500/10"
                    : "border-dark-border/40 bg-dark-surface/35",
                )}
              >
                {item.status === "SENT" && (
                  <div className="absolute top-3 left-1 h-2 w-2 rounded-full bg-blue-500" />
                )}

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zcr-blue/30 bg-zcr-blue/10 p-1">
                  <img src={logo} alt="zcrOT logo" className="h-8 w-8 object-contain" />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-xs",
                      item.status === "SENT"
                        ? "font-semibold text-foreground"
                        : "font-medium text-muted-foreground",
                    )}
                    title={item.title}
                  >
                    {item.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground" title={item.content}>
                    {item.content}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] italic text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                    <div className="flex items-center gap-1" onMouseDown={(event) => event.stopPropagation()}>
                      {item.status === "SENT" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          type="button"
                          disabled={updating}
                          onClick={(event) => handleMarkAsRead(event, item.id, item.status)}
                          className="h-6 w-6 cursor-pointer"
                          title="Mark as read"
                        >
                          <VscEye className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        type="button"
                        disabled={deleting}
                        onClick={(event) => handleDelete(event, item.id)}
                        className="h-6 w-6 cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
