import { USER_MANAGEMENT_QUERY_KEY } from "@/api/queries/user-management-queries";
import { apiHasPath } from "@/api/openapi-capabilities";
import api from "@/api";
import { getApiErrorMessage, toUserManagementUpdatePayload } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type EditUserPayload = {
  userId: number;
  values: UserManagementUpsertFormValues;
};

type UseEditUserOptions = {
  onSuccess?: (data: UserManagementApiUserRow) => void | Promise<void>;
};

export default function useEditUser(options: UseEditUserOptions = {}) {
  const queryClient = useQueryClient();
  const unsupportedMessage = "User management is not available on the currently running API.";

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async ({ userId, values }: EditUserPayload) => {
      if (!(await apiHasPath("/api/v1/users-management"))) {
        throw new Error(unsupportedMessage);
      }

      const payload = toUserManagementUpdatePayload(values);
      const res = await api.put<UserManagementApiUserRow>(`/users-management/${userId}`, payload);
      return res.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: [USER_MANAGEMENT_QUERY_KEY] });
      await options.onSuccess?.(data);
      toast.success("User updated", {
        description: `${data.username} details were saved.`,
      });
    },
    onError: (error) => {
      toast.error("Unable to update user", {
        description: getApiErrorMessage(error, "The user details could not be updated."),
      });
    },
  });

  return {
    editUser: mutate,
    editUserAsync: mutateAsync,
    editingUser: isPending,
  };
}
