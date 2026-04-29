import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "个人资料 | 易顺 YiShun",
};
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
