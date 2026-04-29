import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "注册账号 | 易顺 YiShun",
};
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
