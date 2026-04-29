import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "仪表盘 | 易顺 YiShun",
};
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
