import { USER_MANAGEMENT_QUERY_KEY } from "@/api/queries/user-management-queries";
import { apiHasPath } from "@/api/openapi-capabilities";
import api from "@/api";
import { getApiErrorMessage } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UseToggleUserStatusOptions = {
  onSuccess?: (data: UserManagementApiUserRow) => void | Promise<void>;
};

export default function useToggleUserStatus(options: UseToggleUserStatusOptions = {}) {
  const queryClient = useQueryClient();
  const unsupportedMessage = "User management is not available on the currently running API.";

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (userId: number) => {
      if (!(await apiHasPath("/api/v1/users-management"))) {
        throw new Error(unsupportedMessage);
      }

      const res = await api.post<UserManagementApiUserRow>(`/users-management/${userId}/toggle-status`);
      return res.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: [USER_MANAGEMENT_QUERY_KEY] });
      await options.onSuccess?.(data);
      toast.success("Status updated", {
        description: `${data.username} is now ${data.status}.`,
      });
    },
    onError: (error) => {
      toast.error("Unable to update status", {
        description: getApiErrorMessage(error, "The user status could not be changed."),
      });
    },
  });

  return {
    toggleUserStatus: mutate,
    toggleUserStatusAsync: mutateAsync,
    togglingUserStatus: isPending,
  };
}
