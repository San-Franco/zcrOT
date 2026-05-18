import { invalidatePortQueries, portsQuery as portsQueryOptions } from "@/api/queries";
import RefreshBtn from "@/components/btn/refresh-btn";
import ConfirmModal from "@/components/modals/confirm-modal";
import PortConfigModal from "@/components/modals/port-config-modal";
import PortTestInterfaceModal from "@/components/modals/port-test-interface-modal";
import CommonFilter from "@/components/shared/common-filter";
import CustomBadge from "@/components/shared/custom-badge";
import Empty from "@/components/shared/empty";
import LocalSearch from "@/components/shared/local-search";
import PageHeader from "@/components/shared/page-header";
import Spinner from "@/components/shared/spinner";
import TableSkeleton from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useApplyPortConfig from "@/hooks/ports-management/use-apply-port-config";
import useDeletePort from "@/hooks/ports-management/use-delete-port";
import useHotReloadPortConfig from "@/hooks/ports-management/use-hot-reload-port-config";
import useRequestNewPort from "@/hooks/ports-management/use-request-new-port";
import useTogglePort from "@/hooks/ports-management/use-toggle-port";
import useUpdatePort from "@/hooks/ports-management/use-update-port";
import useTitle from "@/hooks/system/use-title";
import { formatNumberShort, formatPortDate, getApiErrorMessage } from "@/lib/utils";
import useUserStore from "@/stores/user-store";
import { useQuery } from "@tanstack/react-query";
import { Pause, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { BsCloudPlus } from "react-icons/bs";
import { FiPlay, FiSearch } from "react-icons/fi";
import {
  HiDatabase,
  HiOutlineDotsVertical,
  HiOutlineStatusOffline,
  HiOutlineStatusOnline,
} from "react-icons/hi";
import { LuCog } from "react-icons/lu";
import { MdDelete, MdEdit } from "react-icons/md";
import { RxReload } from "react-icons/rx";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

export default function PortsManagementPage() {
  useTitle("Ports Management");
  const { user } = useUserStore();

  const [searchParams] = useSearchParams();
  const search = (searchParams.get("portSearch") || "").trim() || undefined;
  const statusFilter = (searchParams.get("portStatus") || "all").trim().toLowerCase();

  const [testPortState, setTestPortState] = useState<PortItem | null>(null);
  const [editPortState, setEditPortState] = useState<PortItem | null>(null);
  const [togglePortState, setTogglePortState] = useState<PortItem | null>(null);
  const [deletePortState, setDeletePortState] = useState<PortItem | null>(null);
  const [showRequestPortConfirm, setShowRequestPortConfirm] = useState(false);
  const [showHotReloadConfirm, setShowHotReloadConfirm] = useState(false);
  const [showApplyConfigConfirm, setShowApplyConfigConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const portStatusFilters = useMemo(
    () => [
      { name: "All Status", value: "all" },
      { name: "Active", value: "active" },
      { name: "Inactive", value: "inactive" },
    ],
    [],
  );

  const portsListQuery = useQuery(portsQueryOptions({
    search,
    status: statusFilter === "all" ? undefined : statusFilter,
    skip: 0,
    limit: 200,
  }));

  const { requestNewPort, requestingNewPort } = useRequestNewPort({
    onSuccess: async () => {
      setShowRequestPortConfirm(false);
    },
  });
  const { updatePortAsync, updatingPort } = useUpdatePort({
    onSuccess: async () => {
      setEditPortState(null);
    },
  });
  const { togglePort, togglingPort } = useTogglePort({
    onSuccess: async () => {
      setTogglePortState(null);
    },
  });
  const { deletePort, deletingPort } = useDeletePort({
    onSuccess: async () => {
      setDeletePortState(null);
    },
  });
  const { hotReloadPortConfig, hotReloadingPortConfig } = useHotReloadPortConfig({
    onSuccess: async () => {
      setShowHotReloadConfirm(false);
    },
  });
  const { applyPortConfig, applyingPortConfig } = useApplyPortConfig({
    onSuccess: async () => {
      setShowApplyConfigConfirm(false);
    },
  });

  const ports = portsListQuery.data?.ports || [];
  const totalPorts = portsListQuery.data?.total_count || 0;
  const activePorts = portsListQuery.data?.active_count || 0;
  const inactivePorts = portsListQuery.data?.inactive_count || 0;
  const totalLogs = ports.reduce((sum, item) => sum + item.logs_received_count, 0);
  const errorMessage = getApiErrorMessage(portsListQuery.error, "Failed to load ports.");

  const isMutating =
    requestingNewPort ||
    updatingPort ||
    togglingPort ||
    deletingPort ||
    hotReloadingPortConfig ||
    applyingPortConfig;
  const isPortsLoading = portsListQuery.isLoading || isRefreshing;
  const isPortsBusy = portsListQuery.isFetching || isMutating || isRefreshing;

  const refreshPortsManagement = async () => {

    await invalidatePortQueries();
  };

  const denyMutationForViewer = (action: string) => {
    if (user?.role === "viewer") {
      toast.error("Action Denied", {
        description: `You are not allowed to ${action} with the viewer role.`,
      });
      return true;
    }

    return false;
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Ports Management"
        subTitle="Manage OT ingestion ports backed by the live API, Vector runtime, and containerized deployment."
        size="lg"
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <RefreshBtn
          height="min-h-11"
          isDisabled={isPortsBusy}
          isRefreshing={isRefreshing}
          setIsRefreshing={setIsRefreshing}
          onAction={refreshPortsManagement}
        />
        <Button
          type="button"
          variant="outline"
          className="min-h-11 cursor-pointer"
          disabled={isPortsBusy}
          onClick={() => {
            if (denyMutationForViewer("hot reload ports")) {
              return;
            }
            setShowHotReloadConfirm(true);
          }}
        >
          <Spinner isLoading={hotReloadingPortConfig} label="Reloading...">
            <RxReload className="size-4" />
            Hot Reload
          </Spinner>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 cursor-pointer"
          disabled={isPortsBusy}
          onClick={() => {
            if (denyMutationForViewer("apply port configuration")) {
              return;
            }
            setShowApplyConfigConfirm(true);
          }}
        >
          <Spinner isLoading={applyingPortConfig} label="Applying...">
            <LuCog className="size-4" />
            Apply Config
          </Spinner>
        </Button>
        <Button
          type="button"
          className="min-h-11 cursor-pointer bg-gradient text-white transition-all duration-300 hover:brightness-110"
          disabled={isPortsBusy}
          onClick={() => {
            if (denyMutationForViewer("request new ports")) {
              return;
            }
            setShowRequestPortConfirm(true);
          }}
        >
          <Spinner isLoading={requestingNewPort} label="Requesting...">
            <BsCloudPlus className="size-4" />
            Request New Port
          </Spinner>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Card className="border-emerald-500/20 bg-linear-to-br from-emerald-500/10 via-dark-surface to-dark-bg">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                <HiOutlineStatusOnline className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Ports</p>
                {isPortsLoading ? (
                  <Skeleton className="mt-1 h-7 w-24 bg-white/10" />
                ) : (
                  <p className="text-2xl font-semibold">{formatNumberShort(activePorts)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-linear-to-br from-orange-500/10 via-dark-surface to-dark-bg">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/15 text-orange-300">
                <HiOutlineStatusOffline className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inactive Ports</p>
                {isPortsLoading ? (
                  <Skeleton className="mt-1 h-7 w-24 bg-white/10" />
                ) : (
                  <p className="text-2xl font-semibold">{formatNumberShort(inactivePorts)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-500/20 bg-linear-to-br from-indigo-500/10 via-dark-surface to-dark-bg">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                <HiDatabase className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Logs Received</p>
                {isPortsLoading ? (
                  <Skeleton className="mt-1 h-7 w-24 bg-white/10" />
                ) : (
                  <p className="text-2xl font-semibold">{formatNumberShort(totalLogs)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dark-border/30 bg-linear-to-br from-dark-surface via-dark-surface to-dark-bg">
        <CardHeader>
          <CardTitle>Dedicated Syslog Ports ({formatNumberShort(totalPorts)})</CardTitle>
          <CardDescription>
            Track managed ingestion ports, edit their metadata, and control their active runtime state.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-2 2xl:flex-row">
            <LocalSearch
              isDisabled={isPortsBusy}
              inputClassName="w-full xl:w-[520px]"
              filterValue="portSearch"
              placeholder="Search by port, label, description, or status..."
              Icon={FiSearch}
            />
            <div className="flex flex-wrap gap-2">
              <CommonFilter
                isDisabled={isPortsBusy}
                filterValue="portStatus"
                filters={portStatusFilters}
                addFirst={true}
                otherClasses="min-h-[44px] min-w-[140px] w-fit"
              />
            </div>
          </div>

          {isPortsLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Port</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Logs Received</TableHead>
                  <TableHead className="pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableSkeleton cols={6} rows={8} />
            </Table>
          ) : portsListQuery.isError ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Port</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Logs Received</TableHead>
                  <TableHead className="pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableCaption className="mt-0 p-0">
                <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                  <Empty
                    label="Unable to load managed ports"
                    description={errorMessage}
                    classesName="h-[140px] w-[180px]"
                    lottie="fail"
                  />
                </div>
              </TableCaption>
            </Table>
          ) : !ports.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Port</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Logs Received</TableHead>
                  <TableHead className="pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableCaption className="mt-0 p-0">
                <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                  <Empty
                    label="No managed ports found"
                    description="Try changing the filters or request a new port to start OT log ingestion."
                    classesName="h-[140px] w-[180px]"
                  />
                </div>
              </TableCaption>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Port</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Logs Received</TableHead>
                  <TableHead className="pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ports.map((port) => {
                  const isActive = port.status === "ACTIVE";
                  const isPrimary = port.is_primary;

                  return (
                    <TableRow key={port.id}>
                      <TableCell className="py-6 pl-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{port.port_number}</span>
                          {port.is_primary ? (
                            <CustomBadge value="PRIMARY" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <p>{port.label || "Untitled Port"}</p>
                          <p className="text-xs text-muted-foreground">
                            {port.description || "No description provided."}
                          </p>
                          {port.error_message ? (
                            <p className="text-xs text-red-300">{port.error_message}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CustomBadge value={port.status} />
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {formatPortDate(port.last_activity)}
                      </TableCell>
                      <TableCell>{formatNumberShort(port.logs_received_count)}</TableCell>
                      <TableCell className="pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="cursor-pointer"
                              disabled={isMutating || isPortsBusy}
                            >
                              <HiOutlineDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44 border-dark-border/50 bg-linear-to-br from-dark-surface via-dark-surface to-dark-bg"
                          >
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                if (denyMutationForViewer("test ports")) {
                                  return;
                                }
                                setTestPortState(port);
                              }}
                            >
                              <FiPlay className="size-4" />
                              Test Port
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                if (denyMutationForViewer("edit ports")) {
                                  return;
                                }
                                setEditPortState(port);
                              }}
                            >
                              <MdEdit className="size-4" />
                              Edit Port
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                if (denyMutationForViewer("change port status")) {
                                  return;
                                }
                                setTogglePortState(port);
                              }}
                              disabled={isPrimary}
                            >
                              {isActive ? (
                                <Pause className="size-4 text-amber-500" />
                              ) : (
                                <Play className="size-4 text-emerald-500" />
                              )}
                              {isActive ? "Deactivate Port" : "Activate Port"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              className="cursor-pointer"
                              onClick={() => {
                                if (denyMutationForViewer("delete ports")) {
                                  return;
                                }
                                setDeletePortState(port);
                              }}
                              disabled={isPrimary}
                            >
                              <MdDelete className="size-4" />
                              Delete Port
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {testPortState ? (
        <PortTestInterfaceModal
          isOpen={!!testPortState}
          onClose={() => setTestPortState(null)}
          port={testPortState}
        />
      ) : null}

      {editPortState ? (
        <PortConfigModal
          isOpen={!!editPortState}
          onClose={() => setEditPortState(null)}
          port={editPortState}
          isSaving={updatingPort}
          onSave={async (portId, values) => {
            if (denyMutationForViewer("edit ports")) {
              return;
            }
            await updatePortAsync(portId, values);
          }}
        />
      ) : null}

      <Dialog open={showRequestPortConfirm} onOpenChange={setShowRequestPortConfirm}>
        {showRequestPortConfirm ? (
          <ConfirmModal
            title="Request New Port Confirmation"
            description={
              "This will reserve the next available managed UDP port, write the latest Vector configuration, and apply the runtime update.\n\nContinue with the new port request?"
            }
            isLoading={requestingNewPort}
            loadingLabel="Requesting..."
            onConfirm={() => {
              if (denyMutationForViewer("request new ports")) {
                return;
              }
              requestNewPort();
            }}
          />
        ) : null}
      </Dialog>

      <Dialog open={!!togglePortState} onOpenChange={(open) => !open && setTogglePortState(null)}>
        {togglePortState ? (
          <ConfirmModal
            title={togglePortState.status === "ACTIVE" ? "Deactivate port?" : "Activate port?"}
            description={`Are you sure you want to ${togglePortState.status === "ACTIVE" ? "deactivate" : "activate"} port ${togglePortState.port_number}?`}
            isLoading={togglingPort}
            loadingLabel={togglePortState.status === "ACTIVE" ? "Deactivating..." : "Activating..."}
            onConfirm={() => {
              if (denyMutationForViewer("change port status")) {
                return;
              }
              togglePort(togglePortState.id);
            }}
          />
        ) : null}
      </Dialog>

      <Dialog open={!!deletePortState} onOpenChange={(open) => !open && setDeletePortState(null)}>
        {deletePortState ? (
          <ConfirmModal
            title="Delete Port Confirmation"
            description={`Are you sure you want to delete port ${deletePortState.port_number}? This action cannot be undone.`}
            isLoading={deletingPort}
            loadingLabel="Deleting..."
            onConfirm={() => {
              if (denyMutationForViewer("delete ports")) {
                return;
              }
              deletePort(deletePortState.id);
            }}
          />
        ) : null}
      </Dialog>

      <Dialog open={showHotReloadConfirm} onOpenChange={setShowHotReloadConfirm}>
        {showHotReloadConfirm ? (
          <ConfirmModal
            title="Hot Reload Confirmation"
            description={
              "Hot Reload tells the running Vector service to reread the latest managed port configuration without doing a full restart.\n\nUse this when you want the newest config picked up quickly."
            }
            isLoading={hotReloadingPortConfig}
            loadingLabel="Reloading..."
            onConfirm={() => {
              if (denyMutationForViewer("hot reload ports")) {
                return;
              }
              hotReloadPortConfig();
            }}
          />
        ) : null}
      </Dialog>

      <Dialog open={showApplyConfigConfirm} onOpenChange={setShowApplyConfigConfirm}>
        {showApplyConfigConfirm ? (
          <ConfirmModal
            title="Apply Config Confirmation"
            description={
              "Apply Config rewrites the managed runtime artifacts and performs a fuller runtime apply for the Vector service.\n\nUse this after infrastructure changes or when a hot reload is not enough."
            }
            isLoading={applyingPortConfig}
            loadingLabel="Applying..."
            onConfirm={() => {
              if (denyMutationForViewer("apply port configuration")) {
                return;
              }
              applyPortConfig();
            }}
          />
        ) : null}
      </Dialog>
    </section>
  );
}
