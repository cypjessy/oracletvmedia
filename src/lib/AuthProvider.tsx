"use client";

import { useEffect, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { useAppStore } from "@/lib/useAppStore";
import type { UserDoc } from "@/lib/useAppStore";
import { churchConfig } from "@/lib/churchConfig";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const PUBLIC_PATHS = ["/", "/login"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setUserDoc, setChurchConfig, setLoading, isLoading } =
    useAppStore();

  // Register push notifications when user is authenticated
  usePushNotifications();

  useEffect(() => {
    // Set church config immediately — it's local, no async needed
    setChurchConfig(churchConfig);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const userData = userSnap.data() as UserDoc;
            setUserDoc(userData);
            setLoading(false);

            // Route based on role
            const role = userData.role;
            const isAdminPath = pathname?.startsWith("/admin");

            if (role === "admin" && !isAdminPath) {
              router.push("/admin");
            } else if (
              role === "member" &&
              (pathname === "/" || pathname === "/login")
            ) {
              router.push("/dashboard");
            } else if (role === "member" && isAdminPath) {
              router.push("/dashboard");
            }
          } else {
            // No user doc yet (first-time or incomplete registration)
            setLoading(false);
            if (!PUBLIC_PATHS.includes(pathname || "/")) {
              router.push("/");
            }
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserDoc(null);
        setLoading(false);

        if (
          pathname &&
          !PUBLIC_PATHS.includes(pathname) &&
          !pathname.startsWith("/admin")
        ) {
          router.push("/");
        }
      }
    });

    return () => unsubscribe();
  }, [router, pathname, setUser, setUserDoc, setChurchConfig, setLoading]);

  const isProtected =
    pathname &&
    !PUBLIC_PATHS.includes(pathname) &&
    !pathname.startsWith("/admin");

  if (isLoading && isProtected) {
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
          flexDirection: "column",
          gap: 16,
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

  return <>{children}</>;
}

/** Hook to check if user has a specific role */
export function useRequireRole(requiredRole: "admin" | "member") {
  const { role, isLoading } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && role !== requiredRole) {
      if (role === "admin") router.push("/admin");
      else if (role === "member") router.push("/dashboard");
      else router.push("/");
    }
  }, [role, isLoading, requiredRole, router]);

  return { isAuthorized: role === requiredRole, isLoading };
}
