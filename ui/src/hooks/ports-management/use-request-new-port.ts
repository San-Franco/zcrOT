import api from "@/api";
import { invalidatePortQueries } from "@/api/queries";
import { getApiErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type UseRequestNewPortOptions = {
  onSuccess?: (data: PortItem) => void | Promise<void>;
};

export default function useRequestNewPort(options: UseRequestNewPortOptions = {}) {
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post<PortItem>("/ports/request-new");

      return res.data
    },
    onSuccess: async (data) => {
      await invalidatePortQueries();
      await options.onSuccess?.(data);
      toast.success("New port reserved", {
        description: `Managed port ${data.port_number} is now available.`,
      });
    },
    onError: (error) => {
      toast.error("Unable to request a new port", {
        description: getApiErrorMessage(error, "The next free managed port could not be reserved."),
      });
    },
  });

  return {
    requestNewPort: mutate,
    requestNewPortAsync: mutateAsync,
    requestingNewPort: isPending,
  };
}
