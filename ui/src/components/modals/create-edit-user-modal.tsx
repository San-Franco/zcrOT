import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { ZodTypeAny } from "zod";
import { FaUserPen, FaUserPlus } from "react-icons/fa6";
import { IoNotifications, IoNotificationsOff } from "react-icons/io5";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Spinner from "../shared/spinner";

interface CreateEditUserModalProps {
  formType: "CREATE" | "EDIT";
  schema: ZodTypeAny;
  defaultValues: UserManagementUpsertFormValues;
  onSubmit: (values: UserManagementUpsertFormValues) => boolean | void | Promise<boolean | void>;
  isSubmitting?: boolean;
  onClose?: () => void;
  isViewerSelfEdit?: boolean;
  isOpen?: boolean;
}

export default function CreateEditUserModal({
  formType,
  schema,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  onClose,
  isViewerSelfEdit = false,
  isOpen = true,
}: CreateEditUserModalProps) {
  const form = useForm<UserManagementUpsertFormValues>({
    resolver: zodResolver(schema as any) as any,
    defaultValues,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset(defaultValues);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [defaultValues, form, isOpen]);

  const handleSubmit = async (values: UserManagementUpsertFormValues) => {
    const shouldClose = await onSubmit(values);
    if (shouldClose !== false) {
      onClose?.();
    }
  };

  const isCreate = formType === "CREATE";
  const isRestrictedViewerEdit = !isCreate && isViewerSelfEdit;
  const showPendingVerificationOption =
    !isCreate && defaultValues.status === "pending_verification";

  const statusOptions: Array<{ value: UserStatus; label: string }> = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "locked", label: "Locked" },
  ];

  if (showPendingVerificationOption) {
    statusOptions.push({
      value: "pending_verification",
      label: "Pending Verification",
    });
  }

  return (
    <DialogContent className="no-scrollbar max-h-[92vh] overflow-y-auto border-dark-border/50 primary-gradient sm:max-w-180">
      <DialogHeader className="space-y-1">
        <DialogTitle className="flex items-center gap-2 text-xl">
          {isCreate ? <FaUserPlus className="size-5 text-zcr-blue" /> : <FaUserPen className="size-5 text-zcr-blue" />}
          {isCreate ? "Create New User" : "Edit User"}
        </DialogTitle>
        <DialogDescription>
          {isCreate
            ? "Create a new account for zcrOT platform access."
            : "Update user profile details and access status."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          {formType === 'CREATE' && <div className="flex items-start w-fit gap-2 rounded-md border border-zcr-blue/25 bg-zcr-blue/10 px-3 py-2 text-xs text-muted-foreground">
            <IoNotifications className="mt-0.5 size-3.5 shrink-0 text-zcr-blue" />
            <span>
              Tip: For reliable notification delivery, use a Gmail or Google Workspace email address.
            </span>
          </div>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Username <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as string | undefined) ?? ""}
                      placeholder="Enter username"
                      className="min-h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      value={(field.value as string | undefined) ?? ""}
                      placeholder="Enter email"
                      className="min-h-11"
                      disabled={!isCreate}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className={isCreate ? "md:col-span-2" : undefined}>
                  <FormLabel>
                    Role <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    value={field.value as string | undefined}
                    onValueChange={field.onChange}
                    disabled={isRestrictedViewerEdit}
                  >
                    <FormControl>
                      <SelectTrigger className="min-h-11 w-full cursor-pointer">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent
                      className="z-1001 border-dark-border/50 bg-linear-to-br from-dark-surface via-dark-surface to-dark-bg"
                      position="popper"
                      align="start"
                      side="bottom"
                      sideOffset={0}
                    >
                      <SelectItem className="cursor-pointer" value="admin">
                        Admin
                      </SelectItem>
                      <SelectItem className="cursor-pointer" value="viewer">
                        Viewer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className={isCreate ? "hidden" : undefined}>
                  <FormLabel>
                    Status <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    value={field.value as string | undefined}
                    onValueChange={field.onChange}
                    disabled={isRestrictedViewerEdit}
                  >
                    <FormControl>
                      <SelectTrigger className="min-h-11 w-full cursor-pointer">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent
                      className="z-1001 border-dark-border/50 bg-linear-to-br from-dark-surface via-dark-surface to-dark-bg"
                      position="popper"
                      align="start"
                      side="bottom"
                      sideOffset={0}
                    >
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} className="cursor-pointer" value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notificationEnabled"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <div
                    className={`relative overflow-hidden rounded-xl border px-4 py-3 transition-all duration-200 ${field.value
                      ? "border-emerald-400/40 bg-emerald-500/10"
                      : "border-dark-border/60 bg-dark-bg/40"
                      }`}
                  >
                    <div
                      className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${field.value ? "bg-emerald-500/20" : "bg-slate-500/15"
                        }`}
                    />
                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${field.value
                            ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                            : "border-dark-border/70 bg-dark-surface/70 text-muted-foreground"
                            }`}
                        >
                          {field.value ? (
                            <IoNotifications className="size-5" />
                          ) : (
                            <IoNotificationsOff className="size-5" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <FormLabel className="cursor-pointer font-semibold">
                            Notification Alerts
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {field.value
                              ? "Alerts are enabled for this account."
                              : "Alerts are disabled for this account."}
                          </p>
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCreate && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Password <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            value={(field.value as string | undefined) ?? ""}
                            placeholder="Enter password"
                            className="min-h-11 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-3 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {showPassword ? <VscEyeClosed className="size-4" /> : <VscEye className="size-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Confirm Password <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            value={(field.value as string | undefined) ?? ""}
                            placeholder="Confirm password"
                            className="min-h-11 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-3 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {showConfirmPassword ? <VscEyeClosed className="size-4" /> : <VscEye className="size-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          <DialogFooter className="border-t border-dark-border/50 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="cursor-pointer" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer bg-gradient text-white transition-all duration-300 hover:brightness-110"
            >
              <Spinner isLoading={isSubmitting} label={isCreate ? "Creating..." : "Saving..."}>
                {isCreate ? "Create User" : "Save Changes"}
              </Spinner>
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
