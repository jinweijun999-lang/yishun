"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Background from "@/app/components/Background";
import { useI18n } from "@/app/components/LocaleProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Give server time to set cookie, then redirect
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <Background />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-center mb-2 text-glow">
              {t("admin.login.title")}
            </h1>
            <p className="text-gray-400 text-center mb-8">
              {t("admin.login.subtitle")}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  {t("admin.login.email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  {t("admin.login.password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? t("admin.login.loggingIn") : t("admin.login.submit")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}