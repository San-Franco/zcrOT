import api from "@/api";
import queryClient from "@/api/queries";
import useUserStore from "@/stores/user-store";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useUserStore((state) => state.clearAuth);

  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: async () => {
      const response = await api.post<LogoutResponse>("/auth/logout");

      if (response.status !== 200) {
        throw new Error("Something went wrong. Please try again.");
      }

      return response.data;
    },
    onSuccess: async () => {
      clearAuth();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      clearAuth();
      queryClient.clear();
      navigate("/login", { replace: true });
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    },
  });

  return {
    logout,
    isLoggingOut,
  };
}
