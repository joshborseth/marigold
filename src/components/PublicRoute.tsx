import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Loader } from "./Loader";

export const PublicRoute = () => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Loader size="lg" variant="page" />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
