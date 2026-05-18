import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { CheckCircle, Edit } from "lucide-react";
import { BiTrash } from "react-icons/bi";
import { CiNoWaitingSign } from "react-icons/ci";
import { ImSpinner3 } from "react-icons/im";
import { IoNotifications, IoNotificationsOff } from "react-icons/io5";
import { MdKeyboardArrowDown, MdOutlineBlock, MdOutlineMoreVert } from "react-icons/md";
import { toast } from "sonner";
import { userManagementInfiniteQuery } from "@/api/queries/user-management-queries";
import CreateNewUserBtn from "@/components/btn/create-new-user-btn";
import RefreshBtn from "@/components/btn/refresh-btn";
import ConfirmModal from "@/components/modals/confirm-modal";
import CreateEditUserModal from "@/components/modals/create-edit-user-modal";
import CommonFilter from "@/components/shared/common-filter";
import CustomBadge from "@/components/shared/custom-badge";
import Empty from "@/components/shared/empty";
import LocalSearch from "@/components/shared/local-search";
import PageHeader from "@/components/shared/page-header";
import TableSkeleton from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
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
import useCreateUser from "@/hooks/user-management/use-create-user";
import useDeleteUser from "@/hooks/user-management/use-delete-user";
import useEditUser from "@/hooks/user-management/use-edit-user";
import useToggleUserStatus from "@/hooks/user-management/use-toggle-user-status";
import useTitle from "@/hooks/system/use-title";
import { editUserManagementSchema } from "@/lib/validators";
import {
  buildUserManagementUsers,
  formatUserManagementLastLogin,
  getApiErrorMessage,
  normalizeUserManagementRoleFilter,
  normalizeUserManagementStatusFilter,
  toUserManagementFormValues,
  USER_ROLE_FILTER_OPTIONS,
  USER_STATUS_FILTER_OPTIONS,
} from "@/lib/utils";
import useUserStore from "@/stores/user-store";

export default function UserManagementPage() {
  useTitle("User Management");

  const { user } = useUserStore();
  const isViewer = user?.role === "viewer";
  const [searchParams] = useSearchParams();
  const keyword = (searchParams.get("kw") || "").trim();
  const statusFilter = normalizeUserManagementStatusFilter(searchParams.get("status"));
  const roleFilter = normalizeUserManagementRoleFilter(searchParams.get("role"));

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingUserState, setEditingUserState] = useState<UserManagementUser | null>(null);
  const [toggleStatusUserState, setToggleStatusUserState] = useState<UserManagementUser | null>(null);
  const [deleteUserState, setDeleteUserState] = useState<UserManagementUser | null>(null);

  const usersInfiniteQueryOptions = userManagementInfiniteQuery({
    limit: 20,
    kw: keyword || undefined,
    status: statusFilter,
    role: roleFilter,
  });

  const {
    data,
    status,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(usersInfiniteQueryOptions);

  const users = buildUserManagementUsers(data?.pages.flatMap((page) => page.rows) || []);

  const { createUserAsync, creatingUser } = useCreateUser();
  const { editUserAsync, editingUser } = useEditUser({
    onSuccess: async () => {
      setEditingUserState(null);
    },
  });
  const { toggleUserStatusAsync, togglingUserStatus } = useToggleUserStatus({
    onSuccess: async () => {
      setToggleStatusUserState(null);
    },
  });
  const { deleteUserAsync, deletingUser } = useDeleteUser({
    onSuccess: async () => {
      setDeleteUserState(null);
    },
  });

  const isActionLocked = isRefreshing || creatingUser || editingUser || deletingUser || togglingUserStatus;

  return (
    <section className="space-y-4">
      <PageHeader
        title="Users Management"
        subTitle="Manage account roles, verification states, and notification preferences."
        size="lg"
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <RefreshBtn
          isRefreshing={isRefreshing}
          setIsRefreshing={setIsRefreshing}
          onAction={async () => {
            const result = await refetch();
            if (result.error) {
              throw result.error;
            }
          }}
          isDisabled={status === "pending" || isActionLocked}
          height="h-11"
        />
        <CreateNewUserBtn
          onBeforeOpen={() => {
            if (user?.role === "viewer") {
              toast.error("Action Denied", {
                description: "You are not allowed to create users with the viewer role.",
              });
              return false;
            }
            return true;
          }}
          onCreate={async (values) => {
            if (user?.role === "viewer") {
              toast.error("Action Denied", {
                description: "You are not allowed to create users with the viewer role.",
              });
              return false;
            }

            try {
              await createUserAsync(values);
              return true;
            } catch {
              return false;
            }
          }}
          isDisabled={isActionLocked}
          isSubmitting={creatingUser}
        />
      </div>

      <div className="flex flex-col gap-2 2xl:flex-row">
        <LocalSearch
          isDisabled={isActionLocked}
          filterValue="kw"
          inputClassName="w-full xl:w-[520px]"
          placeholder="Search by username or email..."
        />
        <div className="flex flex-wrap gap-2">
          <CommonFilter
            isDisabled={isActionLocked}
            filterValue="status"
            filters={USER_STATUS_FILTER_OPTIONS}
            otherClasses="min-h-[44px] min-w-[180px] w-fit"
          />
          <CommonFilter
            isDisabled={isActionLocked}
            filterValue="role"
            filters={USER_ROLE_FILTER_OPTIONS}
            otherClasses="min-h-[44px] min-w-[140px] w-fit"
          />
        </div>
      </div>

      <Card className="relative overflow-hidden border-dark-border/50 bg-dark-surface/80 pt-0! backdrop-blur-sm">
        <CardContent className="p-0">
          {status === "pending" || isRefreshing ? (
            <Table>
              <TableHeader className="bg-dark-bg/60 backdrop-blur-sm">
                <TableRow className="border-b border-dark-border/50 hover:bg-transparent">
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Username</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Email</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Role</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Status</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-center text-sm font-semibold text-white">Notification</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Last Login</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-center text-sm font-semibold text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableSkeleton cols={7} rows={8} />
            </Table>
          ) : status === "error" ? (
            <Table>
              <TableHeader className="bg-dark-bg/60 backdrop-blur-sm">
                <TableRow className="border-b border-dark-border/50 hover:bg-transparent">
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Username</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Email</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Role</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Status</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-center text-sm font-semibold text-white">Notification</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Last Login</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-center text-sm font-semibold text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableCaption className="mt-0 p-0">
                <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                  <Empty
                    label="Unable to load users"
                    description={getApiErrorMessage(error, "Unable to load users right now.")}
                    classesName="h-[140px] w-[180px]"
                    lottie="fail"
                  />
                  <Button
                    className="mt-4 cursor-pointer"
                    onClick={() => {
                      void refetch();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Retry
                  </Button>
                </div>
              </TableCaption>
            </Table>
          ) : !users.length ? (
            <Table>
              <TableHeader className="bg-dark-bg/60 backdrop-blur-sm">
                <TableRow className="border-b border-dark-border/50 hover:bg-transparent">
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Username</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Email</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Role</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Status</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-center text-sm font-semibold text-white">Notification</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Last Login</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-center text-sm font-semibold text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableCaption className="mt-0 p-0">
                <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                  <Empty
                    label="No users found"
                    description="Try adjusting keyword, role, or status filter."
                    classesName="h-[140px] w-[180px]"
                  />
                </div>
              </TableCaption>
            </Table>
          ) : (
            <Table>
              <TableHeader className="bg-dark-bg/60 backdrop-blur-sm">
                <TableRow className="border-b border-dark-border/50 hover:bg-transparent">
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Username</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Email</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Role</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Status</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-center text-sm font-semibold text-white">Notification</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-sm font-semibold text-white">Last Login</TableHead>
                  <TableHead className="h-14 whitespace-nowrap px-6 text-center text-sm font-semibold text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((row, index) => {
                  const isProtectedAdmin = row.id === 1;

                  return (
                    <TableRow
                      key={row.id}
                      className={`
                        border-b border-dark-border/30
                        ${index % 2 === 0 ? "bg-dark-surface/20" : "bg-transparent"}
                      `}
                    >
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zcr-blue/30 bg-linear-to-br from-zcr-blue/20 to-purple-500/20">
                            {row.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="whitespace-nowrap text-base font-medium">{row.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <span className="whitespace-nowrap text-sm text-muted-foreground">{row.email}</span>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <CustomBadge value={row.role} />
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <CustomBadge value={row.status} />
                      </TableCell>
                      <TableCell className="px-6 py-5 text-center">
                        {row.notificationEnabled ? (
                          <IoNotifications className="mx-auto size-5 text-emerald-400" />
                        ) : (
                          <IoNotificationsOff className="mx-auto size-5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <span className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatUserManagementLastLogin(row.lastLogin)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 cursor-pointer text-muted-foreground transition-all duration-200"
                            >
                              <MdOutlineMoreVert className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 bg-dark-surface">
                            <DropdownMenuItem
                              onClick={() => {
                                if (isViewer && user?.id !== row.id) {
                                  toast.error("Action Denied", {
                                    description: "You can only edit your own account with the viewer role.",
                                  });
                                  return;
                                }
                                setEditingUserState(row);
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            {row.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  if (user?.role === "viewer") {
                                    toast.error("Action Denied", {
                                      description: "You are not allowed to update user status with the viewer role.",
                                    });
                                    return;
                                  }
                                  setToggleStatusUserState(row);
                                }}
                                disabled={isProtectedAdmin}
                                className="cursor-pointer text-amber-400 focus:bg-amber-500/10 focus:text-amber-400"
                              >
                                <MdOutlineBlock className="mr-2 h-4 w-4" />
                                Disable User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  if (user?.role === "viewer") {
                                    toast.error("Action Denied", {
                                      description: "You are not allowed to update user status with the viewer role.",
                                    });
                                    return;
                                  }
                                  setToggleStatusUserState(row);
                                }}
                                className="cursor-pointer text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-400"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (user?.role === "viewer") {
                                  toast.error("Action Denied", {
                                    description: "You are not allowed to delete users with the viewer role.",
                                  });
                                  return;
                                }
                                setDeleteUserState(row);
                              }}
                              disabled={isProtectedAdmin}
                              className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                            >
                              <BiTrash className="mr-2 h-4 w-4" />
                              Delete User
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

          {status !== "pending" && !isRefreshing && status !== "error" && users.length > 0 && (
            <div className="my-4 flex flex-col items-center justify-center">
              <Button
                onClick={() => {
                  void fetchNextPage();
                }}
                disabled={!hasNextPage || isFetchingNextPage || isActionLocked}
                variant={!hasNextPage ? "ghost" : "secondary"}
                className="cursor-pointer gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <ImSpinner3 className="animate-spin" />
                    Loading more...
                  </>
                ) : hasNextPage ? (
                  <>
                    <MdKeyboardArrowDown />
                    Load More
                  </>
                ) : (
                  <>
                    <CiNoWaitingSign />
                    Nothing more to load
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingUserState} onOpenChange={(open) => !open && setEditingUserState(null)}>
        {editingUserState && (
          <CreateEditUserModal
            formType="EDIT"
            schema={editUserManagementSchema}
            defaultValues={toUserManagementFormValues(editingUserState)}
            onSubmit={async (values) => {
              if (isViewer && user?.id !== editingUserState.id) {
                toast.error("Action Denied", {
                  description: "You can only edit your own account with the viewer role.",
                });
                return false;
              }

              try {
                await editUserAsync({ userId: editingUserState.id, values });
                return true;
              } catch {
                return false;
              }
            }}
            isSubmitting={editingUser}
            onClose={() => setEditingUserState(null)}
            isViewerSelfEdit={isViewer && user?.id === editingUserState.id}
            isOpen={!!editingUserState}
          />
        )}
      </Dialog>

      <Dialog open={!!toggleStatusUserState} onOpenChange={(open) => !open && setToggleStatusUserState(null)}>
        {toggleStatusUserState && (
          <ConfirmModal
            title={`${toggleStatusUserState.status === "active" ? "Disable" : "Activate"} User`}
            description={`Are you sure you want to ${toggleStatusUserState.status === "active" ? "disable" : "activate"} "${toggleStatusUserState.username}"?`}
            isLoading={togglingUserStatus}
            loadingLabel={toggleStatusUserState.status === "active" ? "Disabling..." : "Activating..."}
            onConfirm={() => {
              if (user?.role === "viewer") {
                toast.error("Action Denied", {
                  description: "You are not allowed to update user status with the viewer role.",
                });
                return;
              }

              void toggleUserStatusAsync(toggleStatusUserState.id);
            }}
          />
        )}
      </Dialog>

      <Dialog open={!!deleteUserState} onOpenChange={(open) => !open && setDeleteUserState(null)}>
        {deleteUserState && (
          <ConfirmModal
            title="Delete User"
            description={`Are you sure you want to delete "${deleteUserState.username}"? This action cannot be undone.`}
            isLoading={deletingUser}
            loadingLabel="Deleting..."
            onConfirm={() => {
              if (user?.role === "viewer") {
                toast.error("Action Denied", {
                  description: "You are not allowed to delete users with the viewer role.",
                });
                return;
              }

              void deleteUserAsync(deleteUserState.id);
            }}
          />
        )}
      </Dialog>
    </section>
  );
}
