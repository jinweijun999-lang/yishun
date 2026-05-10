"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Background from "@/app/components/Background";
import { useI18n } from "@/app/components/LocaleProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const isLoginPage = pathname === "/admin/login";
  const [loading, setLoading] = useState(!isLoginPage);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Skip auth check for login page
    if (isLoginPage) {
      return;
    }

    // Check if user is authenticated as admin
    const checkAuth = async () => {
      setLoading(true);
      try {
        // Read the fortune_session cookie and send to verify endpoint
        // Parse cookies properly - cookie value may contain = characters (JWT tokens)
        const cookies = document.cookie.split(";").reduce((acc, cookie) => {
          const eqIndex = cookie.indexOf("=");
          if (eqIndex === -1) return acc;
          const key = cookie.substring(0, eqIndex).trim();
          const value = cookie.substring(eqIndex + 1).trim();
          acc[key] = decodeURIComponent(value);
          return acc;
        }, {} as Record<string, string>);

        if (!cookies["fortune_session"]) {
          router.push("/admin/login");
          return;
        }

        // Try to fetch a protected endpoint that validates the admin session
        const res = await fetch("/api/admin/stats", {
          headers: {
            Cookie: `fortune_session=${cookies["fortune_session"]}`,
          },
        });

        if (res.ok) {
          setIsAdmin(true);
        } else {
          router.push("/admin/login");
        }
      } catch {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    // Clear the session cookie
    document.cookie = "fortune_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";

    // Clear the session cookie
    document.cookie = "fortune_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";

    router.push("/admin/login");
  };

  // Login page - no sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <Background />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-gray-400">{t("common.loadingAuth")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Background />
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 glass border-r border-white/10 flex flex-col">
          <div className="p-6">
            <h1 className="text-xl font-bold text-glow">{t("admin.dashboard.title")}</h1>
          </div>

          <nav className="flex-1 px-4">
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                pathname === "/admin"
                  ? "bg-secondary/20 text-secondary"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>📊</span>
              <span>{t("admin.nav.dashboard")}</span>
            </Link>

            <Link
              href="/admin/users"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                pathname === "/admin/users"
                  ? "bg-secondary/20 text-secondary"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>👥</span>
              <span>{t("admin.nav.users")}</span>
            </Link>

            <Link
              href="/admin/consultations"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                pathname === "/admin/consultations"
                  ? "bg-secondary/20 text-secondary"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>💬</span>
              <span>{t("admin.nav.consultations")}</span>
            </Link>

            <Link
              href="/admin/stats"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                pathname === "/admin/stats"
                  ? "bg-secondary/20 text-secondary"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>📈</span>
              <span>{t("admin.nav.stats")}</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all w-full"
            >
              <span>🚪</span>
              <span>{t("admin.nav.logout")}</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}