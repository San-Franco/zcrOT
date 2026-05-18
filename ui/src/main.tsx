import queryClient from "@/api/queries";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import Router from "@/routes";
import { Toaster } from "sonner";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="zcrot-ui-theme">
      <Router />
      <Toaster richColors theme="dark" closeButton />
    </ThemeProvider>
  </QueryClientProvider>,
);
