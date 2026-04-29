import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "用户登录 | 易顺 YiShun",
};
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
