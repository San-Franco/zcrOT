import { USER_MANAGEMENT_QUERY_KEY } from "@/api/queries/user-management-queries";
import { apiHasPath } from "@/api/openapi-capabilities";
import api from "@/api";
import { getApiErrorMessage } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UseDeleteUserOptions = {
  onSuccess?: () => void | Promise<void>;
};

export default function useDeleteUser(options: UseDeleteUserOptions = {}) {
  const queryClient = useQueryClient();
  const unsupportedMessage = "User management is not available on the currently running API.";

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (userId: number) => {
      if (!(await apiHasPath("/api/v1/users-management"))) {
        throw new Error(unsupportedMessage);
      }

      await api.delete(`/users-management/${userId}`);
      return null;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [USER_MANAGEMENT_QUERY_KEY] });
      await options.onSuccess?.();
      toast.success("User deleted", {
        description: "The user account was removed.",
      });
    },
    onError: (error) => {
      toast.error("Unable to delete user", {
        description: getApiErrorMessage(error, "The user account could not be deleted."),
      });
    },
  });

  return {
    deleteUser: mutate,
    deleteUserAsync: mutateAsync,
    deletingUser: isPending,
  };
}
