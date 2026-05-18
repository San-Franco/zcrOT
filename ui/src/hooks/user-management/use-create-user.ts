import { USER_MANAGEMENT_QUERY_KEY } from "@/api/queries/user-management-queries";
import { apiHasPath } from "@/api/openapi-capabilities";
import api from "@/api";
import { getApiErrorMessage, toUserManagementCreatePayload } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UseCreateUserOptions = {
  onSuccess?: (data: UserManagementApiUserRow) => void | Promise<void>;
};

export default function useCreateUser(options: UseCreateUserOptions = {}) {
  const queryClient = useQueryClient();
  const unsupportedMessage = "User management is not available on the currently running API.";

  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (values: UserManagementUpsertFormValues) => {
      if (!(await apiHasPath("/api/v1/users-management"))) {
        throw new Error(unsupportedMessage);
      }

      const payload = toUserManagementCreatePayload(values);
      const res = await api.post<UserManagementApiUserRow>("/users-management", payload);
      return res.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: [USER_MANAGEMENT_QUERY_KEY] });
      await options.onSuccess?.(data);
      toast.success("User created", {
        description: `${data.username} must verify email before accessing zcrOT.`,
      });
    },
    onError: (error) => {
      toast.error("Unable to create user", {
        description: getApiErrorMessage(error, "The new user account could not be created."),
      });
    },
  });

  return {
    createUser: mutate,
    createUserAsync: mutateAsync,
    creatingUser: isPending,
  };
}
