import api from "@/api";
import { invalidatePortQueries } from "@/api/queries";
import { getApiErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type UseApplyPortConfigOptions = {
  onSuccess?: (data: PortRuntimeActionResponse) => void | Promise<void>;
};

export default function useApplyPortConfig(options: UseApplyPortConfigOptions = {}) {
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post<PortRuntimeActionResponse>("/ports/apply-config", {
        force_restart: true,
      });

      return res.data
    },
    onSuccess: async (data) => {
      await invalidatePortQueries();
      await options.onSuccess?.(data);
      toast.success("Configuration applied", {
        description: data.message,
      });
    },
    onError: (error) => {
      toast.error("Unable to apply configuration", {
        description: getApiErrorMessage(error, "The runtime configuration could not be applied."),
      });
    },
  });

  return {
    applyPortConfig: mutate,
    applyPortConfigAsync: mutateAsync,
    applyingPortConfig: isPending,
  };
}
