import api from "@/api";
import { invalidatePortQueries } from "@/api/queries";
import { getApiErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type UseDeletePortOptions = {
  onSuccess?: () => void | Promise<void>;
};

export default function useDeletePort(options: UseDeletePortOptions = {}) {
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (portId: number) => {
      const res = await api.delete(`/ports/${portId}`);

      return res.data
    },
    onSuccess: async () => {
      await invalidatePortQueries();
      await options.onSuccess?.();
      toast.success("Port deleted", {
        description: "The managed port was removed successfully.",
      });
    },
    onError: (error) => {
      toast.error("Unable to delete port", {
        description: getApiErrorMessage(error, "The managed port could not be deleted."),
      });
    },
  });

  return {
    deletePort: mutate,
    deletePortAsync: mutateAsync,
    deletingPort: isPending,
  };
}
