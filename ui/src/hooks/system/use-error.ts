import { useEffect } from "react";
import { toast } from "sonner";

export default function useError(check: unknown, message: string) {
  useEffect(() => {
    if (!check) {
      return;
    }

    toast.error("Error", {
      description: message || "Something went wrong. Please try again.",
    });
  }, [check, message]);
}
