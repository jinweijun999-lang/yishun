import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "排盘工具 | 易顺 YiShun",
};
export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
