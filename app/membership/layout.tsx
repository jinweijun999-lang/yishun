import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "会员中心 | 易顺 YiShun",
};
export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
