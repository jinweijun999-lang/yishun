"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/app/components/LocaleProvider";

interface TrendData {
  date: string;
  count: number;
}

interface MemberDistribution {
  tier: string;
  count: number;
}

interface Stats {
  totalUsers: number;
  todayRegistrations: number;
  totalConsultations: number;
  todayConsultations: number;
  registrationTrend: TrendData[];
  consultationTrend: TrendData[];
  memberDistribution: MemberDistribution[];
}

export default function AdminStatsPage() {
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

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "free":
        return t("admin.users.tier.free");
      case "monthly":
        return t("admin.users.tier.monthly");
      case "annual":
        return t("admin.users.tier.annual");
      default:
        return tier;
    }
  };

  const totalUsers = stats?.totalUsers ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 text-glow">
        {t("admin.stats.title")}
      </h1>

      <div className="space-y-8">
        {/* Registration Trend */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("admin.stats.registrationTrend")}
          </h2>
          {stats?.registrationTrend && stats.registrationTrend.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      {t("admin.stats.date")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      {t("admin.stats.count")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      图表
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.registrationTrend.map((item) => {
                    const maxCount = Math.max(...stats.registrationTrend.map((r) => r.count), 1);
                    const barWidth = (item.count / maxCount) * 100;
                    return (
                      <tr key={item.date} className="border-t border-white/5">
                        <td className="px-4 py-3 text-sm">{item.date}</td>
                        <td className="px-4 py-3 text-sm">{item.count}</td>
                        <td className="px-4 py-3 w-48">
                          <div className="h-4 bg-secondary/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-secondary/60 to-accent/60 rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-4">
              暂无数据
            </div>
          )}
        </div>

        {/* Consultation Trend */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("admin.stats.consultationTrend")}
          </h2>
          {stats?.consultationTrend && stats.consultationTrend.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      {t("admin.stats.date")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      {t("admin.stats.count")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      图表
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.consultationTrend.map((item) => {
                    const maxCount = Math.max(...stats.consultationTrend.map((r) => r.count), 1);
                    const barWidth = (item.count / maxCount) * 100;
                    return (
                      <tr key={item.date} className="border-t border-white/5">
                        <td className="px-4 py-3 text-sm">{item.date}</td>
                        <td className="px-4 py-3 text-sm">{item.count}</td>
                        <td className="px-4 py-3 w-48">
                          <div className="h-4 bg-purple-500/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500/60 to-purple-400/60 rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-4">
              暂无数据
            </div>
          )}
        </div>

        {/* Member Distribution (Pie chart represented as horizontal bars) */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("admin.stats.memberDistribution")}
          </h2>
          {stats?.memberDistribution && stats.memberDistribution.length > 0 ? (
            <div className="space-y-4">
              {stats.memberDistribution.map((item) => {
                const percentage = totalUsers > 0 ? (item.count / totalUsers * 100).toFixed(1) : "0";
                return (
                  <div key={item.tier} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{getTierLabel(item.tier)}</span>
                      <span className="text-gray-400">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-6 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.tier === "annual"
                            ? "bg-gradient-to-r from-yellow-500/60 to-yellow-400/60"
                            : item.tier === "monthly"
                            ? "bg-gradient-to-r from-blue-500/60 to-blue-400/60"
                            : "bg-gradient-to-r from-gray-500/60 to-gray-400/60"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 border-t border-white/10 flex justify-between text-sm">
                <span className="text-gray-300">{t("admin.stats.total")}</span>
                <span className="text-white font-semibold">{totalUsers}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-4">
              暂无数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}