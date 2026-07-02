"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";

function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.username) {
      localStorage.setItem("user", (session.user as any).username as string);
      localStorage.setItem("auth_provider", "google");
    } else if (status === "unauthenticated") {
      // Only clear if the user was logged in via Google
      const authProvider = localStorage.getItem("auth_provider");
      if (authProvider === "google") {
        localStorage.removeItem("user");
        localStorage.removeItem("auth_provider");
      }
    }
  }, [session, status]);

  return <>{children}</>;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync>{children}</SessionSync>
    </SessionProvider>
  );
}
