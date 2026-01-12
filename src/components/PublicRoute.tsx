import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Loader } from "./Loader";

export const PublicRoute = () => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
