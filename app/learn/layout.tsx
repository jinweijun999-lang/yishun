import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "命理学习 | 易顺 YiShun",
};
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
