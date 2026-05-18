import api from "@/api";
import { invalidatePortQueries } from "@/api/queries";
import { getApiErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type UseHotReloadPortConfigOptions = {
  onSuccess?: (data: PortRuntimeActionResponse) => void | Promise<void>;
};

export default function useHotReloadPortConfig(options: UseHotReloadPortConfigOptions = {}) {
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post<PortRuntimeActionResponse>("/ports/hot-reload");

      return res.data
    },
    onSuccess: async (data) => {
      await invalidatePortQueries();
      await options.onSuccess?.(data);
      toast.success("Hot reload completed", {
        description: data.message,
      });
    },
    onError: (error) => {
      toast.error("Unable to hot reload Vector", {
        description: getApiErrorMessage(error, "Vector could not reload the latest port configuration."),
      });
    },
  });

  return {
    hotReloadPortConfig: mutate,
    hotReloadPortConfigAsync: mutateAsync,
    hotReloadingPortConfig: isPending,
  };
}
