"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/app/components/LocaleProvider";

interface User {
  id: string;
  email: string;
  gender: string | null;
  birthDate: string | null;
  planTier: string;
  consultationCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const page = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    fetchUsers(page, search);
  }, [page, search]);

  const fetchUsers = (pageNum: number, searchQuery: string) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: pageNum.toString(),
      limit: "20",
    });
    if (searchQuery) {
      params.set("search", searchQuery);
    }

    fetch(`/api/admin/users?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setPagination(data.pagination || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search param
    const params = new URLSearchParams();
    if (search) {
      params.set("search", search);
    }
    window.location.href = `/admin/users${params.toString() ? `?${params.toString()}` : ""}`;
  };

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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "text-gray-400";
      case "monthly":
        return "text-blue-400";
      case "annual":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 text-glow">
        {t("admin.users.title")}
      </h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.users.search")}
          className="input-field w-full md:w-96"
        />
      </form>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            {t("common.loadingAuth")}
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {t("admin.users.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("admin.users.headers.email")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("admin.users.headers.gender")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("admin.users.headers.birthDate")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("admin.users.headers.registeredAt")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("admin.users.headers.planTier")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("admin.users.headers.consultations")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {user.gender || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {user.birthDate || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={getTierColor(user.planTier)}>
                        {getTierLabel(user.planTier)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {user.consultationCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-center gap-4">
            {page > 1 && (
              <a
                href={`/admin/users?page=${page - 1}${search ? `&search=${search}` : ""}`}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                ←
              </a>
            )}
            <span className="text-gray-400 text-sm">
              {t("admin.users.pagination", {
                page: page.toString(),
                total: pagination.totalPages.toString(),
              })}
            </span>
            {page < pagination.totalPages && (
              <a
                href={`/admin/users?page=${page + 1}${search ? `&search=${search}` : ""}`}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}