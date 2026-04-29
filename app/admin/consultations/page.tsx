"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/app/components/LocaleProvider";

interface Consultation {
  id: string;
  userEmail: string;
  question: string;
  response: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminConsultationsPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    fetchConsultations(page);
  }, [page]);

  const fetchConsultations = (pageNum: number) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: pageNum.toString(),
      limit: "20",
    });

    fetch(`/api/admin/consultations?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setConsultations(data.consultations || []);
        setPagination(data.pagination || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 text-glow">
        {t("admin.consultations.title")}
      </h1>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            {t("common.loadingAuth")}
          </div>
        ) : consultations.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {t("admin.consultations.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("admin.consultations.headers.user")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("admin.consultations.headers.question")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("admin.consultations.headers.response")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                    {t("admin.consultations.headers.createdAt")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {consultations.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm">{c.userEmail}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {truncateText(c.question, 100)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {c.response ? truncateText(c.response, 80) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(c.createdAt).toLocaleString()}
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
                href={`/admin/consultations?page=${page - 1}`}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                ←
              </a>
            )}
            <span className="text-gray-400 text-sm">
              {t("admin.consultations.pagination", {
                page: page.toString(),
                total: pagination.totalPages.toString(),
              })}
            </span>
            {page < pagination.totalPages && (
              <a
                href={`/admin/consultations?page=${page + 1}`}
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