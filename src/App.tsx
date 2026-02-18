import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { SidebarLayout } from "./components/SidebarLayout";
import { POSPage } from "./pages/POS/POSPage";
import { Integrations } from "./pages/Integrations";
import { Toaster } from "./components/ui/sonner";
import { InventoryProvider, POSProvider } from "@/contexts";

export const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<SidebarLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/pos"
              element={
                <POSProvider>
                  <POSPage />
                </POSProvider>
              }
            />
            <Route
              path="/inventory"
              element={
                <InventoryProvider>
                  <Inventory />
                </InventoryProvider>
              }
            />
            <Route path="/integrations" element={<Integrations />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  );
};
