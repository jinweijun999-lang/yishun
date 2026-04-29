"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/app/components/LocaleProvider";

interface Stats {
  totalUsers: number;
  todayRegistrations: number;
  totalConsultations: number;
  todayConsultations: number;
}

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">{t("common.loadingAuth")}</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 text-glow">
        {t("admin.dashboard.title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t("admin.dashboard.totalUsers")}
          value={stats?.totalUsers ?? 0}
          icon="👥"
          color="blue"
        />
        <StatCard
          title={t("admin.dashboard.todayRegistrations")}
          value={stats?.todayRegistrations ?? 0}
          icon="📅"
          color="green"
        />
        <StatCard
          title={t("admin.dashboard.totalConsultations")}
          value={stats?.totalConsultations ?? 0}
          icon="💬"
          color="purple"
        />
        <StatCard
          title={t("admin.dashboard.todayConsultations")}
          value={stats?.todayConsultations ?? 0}
          icon="✨"
          color="orange"
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    green: "from-green-500/20 to-green-600/10 border-green-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    orange: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  };

  return (
    <div
      className={`glass rounded-2xl p-6 border bg-gradient-to-br ${colorClasses[color]} animate-in`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{title}</div>
    </div>
  );
}