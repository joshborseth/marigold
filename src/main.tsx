import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { authClient } from "@/lib/auth-client";
import "./index.css";
import { App } from "./App.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ConvexBetterAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
