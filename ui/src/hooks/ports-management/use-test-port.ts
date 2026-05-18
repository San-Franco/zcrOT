import api from "@/api";
import { formatDuration, getApiErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type UseTestPortOptions = {
  portId: number;
  onSuccess?: (data: PortTestResponse) => void | Promise<void>;
};

export default function useTestPort({ portId, onSuccess }: UseTestPortOptions) {
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post<PortTestResponse>(`/ports/${portId}/test`);

      return res.data
    },
    onSuccess: async (result) => {
      await onSuccess?.(result);

      if (result.success) {
        toast.success("Port test passed", {
          description: `Port ${result.port_number} responded in ${formatDuration(result.duration_ms)}.`,
        });
        return;
      }

      toast.error("Port test failed", {
        description: result.error_message || "The port could not be bound successfully.",
      });
    },
    onError: (error) => {
      toast.error("Port test failed", {
        description: getApiErrorMessage(error, "Unable to complete the port test right now."),
      });
    },
  });

  return {
    testPort: mutate,
    testPortAsync: mutateAsync,
    testingPort: isPending,
  };
}
