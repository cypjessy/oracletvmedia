"use client";

import { usePathname } from "next/navigation";
import { useRequireRole } from "@/lib/AuthProvider";

const PUBLIC_ADMIN_PATHS = ["/admin/register"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPath = PUBLIC_ADMIN_PATHS.includes(pathname || "");
  const { isAuthorized, isLoading } = useRequireRole("admin");

  // Skip auth guard for public admin paths (e.g. admin registration)
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F0F0F",
          color: "#fff",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid #242424",
            borderTopColor: "#E8A838",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If not authorized, useRequireRole will redirect; render nothing
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
