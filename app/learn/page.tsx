"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LearnPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to first lesson
    router.replace("/learn/bazi-basics");
  }, [router]);
  
  return null;
}