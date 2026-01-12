import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ThemeProvider } from "next-themes";
import { authClient } from "@/lib/auth-client";
import "./index.css";
import { App } from "./App.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexBetterAuthProvider>
    </ThemeProvider>
  </StrictMode>
);
