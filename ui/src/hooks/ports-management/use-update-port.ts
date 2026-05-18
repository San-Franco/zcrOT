import api from "@/api";
import { invalidatePortQueries } from "@/api/queries";
import { getApiErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

type UpdatePortPayload = {
  portId: number;
  values: PortFormValues;
};

type UseUpdatePortOptions = {
  onSuccess?: (data: PortItem) => void | Promise<void>;
};

export default function useUpdatePort(options: UseUpdatePortOptions = {}) {
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async ({ portId, values }: UpdatePortPayload) => {
      const res = await api.put<PortItem>(`/ports/${portId}`, values);

      return res.data
    },
    onSuccess: async (data) => {
      await invalidatePortQueries();
      await options.onSuccess?.(data);
      toast.success("Port updated", {
        description: `Port ${data.port_number} configuration was saved.`,
      });
    },
    onError: (error) => {
      toast.error("Unable to update port", {
        description: getApiErrorMessage(error, "The port configuration could not be saved."),
      });
    },
  });

  const updatePortWithValues = (portId: number, values: PortFormValues) => mutate({ portId, values });
  const updatePortWithValuesAsync = (portId: number, values: PortFormValues) =>
    mutateAsync({ portId, values });

  return {
    updatePort: updatePortWithValues,
    updatePortAsync: updatePortWithValuesAsync,
    updatingPort: isPending,
  };
}
