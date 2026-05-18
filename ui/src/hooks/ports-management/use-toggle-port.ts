import api from "@/api";
import { invalidatePortQueries } from "@/api/queries";
import { getApiErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type UseTogglePortOptions = {
  onSuccess?: (data: PortItem) => void | Promise<void>;
};

export default function useTogglePort(options: UseTogglePortOptions = {}) {
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (portId: number) => {
      const res = await api.post<PortItem>(`/ports/${portId}/toggle`);

      return res.data
    },
    onSuccess: async (data) => {
      await invalidatePortQueries();
      await options.onSuccess?.(data);
      toast.success(data.status === "ACTIVE" ? "Port activated" : "Port deactivated", {
        description: `Port ${data.port_number} is now ${data.status.toLowerCase()}.`,
      });
    },
    onError: (error) => {
      toast.error("Unable to update port status", {
        description: getApiErrorMessage(error, "The port status could not be changed."),
      });
    },
  });

  return {
    togglePort: mutate,
    togglePortAsync: mutateAsync,
    togglingPort: isPending,
  };
}
