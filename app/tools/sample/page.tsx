"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Background from "../../components/Background";
import Navigation from "../../components/Navigation";
import LanguageSwitcher from "../../components/LanguageSwitcher";

export default function SamplePage() {
  const router = useRouter();
  const handleBack = () => { router.back(); };

  // Sample data for demonstration
  const sampleData = {
    name: "示例用户",
    birthDate: "1990-01-01",
    birthTime: "子时 (23:00-01:00)",
    gender: "男",
    bazi: {
      year: "己巳",
      month: "乙丑",
      day: "戊子",
      hour: "壬子",
    },
    wuxing: {
      year: "土火",
      month: "木土",
      day: "土水",
      hour: "水水",
    },
    tenGods: {
      year: "正官",
      month: "比肩",
      day: "日主",
      hour: "偏财",
    },
  };

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label="返回"
              >
                ←
              </button>
              <span className="text-xl" role="img" aria-label="示例">🔮</span>
              <h1 className="text-lg font-heading font-bold text-white">
                示例命盘
              </h1>
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Notice */}
          <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4">
            <p className="text-xs text-accent text-center">
              📌 这是示例数据，仅供演示功能。输入你的真实出生信息即可查看专属命盘。
            </p>
          </div>

          {/* User Info */}
          <div className="rounded-2xl bg-surface/60 border border-white/10 p-5">
            <h2 className="text-lg font-heading font-bold text-white mb-4">
              个人信息
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">姓名</p>
                <p className="text-white">{sampleData.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">性别</p>
                <p className="text-white">{sampleData.gender}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">出生日期</p>
                <p className="text-white">{sampleData.birthDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">出生时辰</p>
                <p className="text-white">{sampleData.birthTime}</p>
              </div>
            </div>
          </div>

          {/* Eight Characters */}
          <div className="rounded-2xl bg-surface/60 border border-white/10 p-5">
            <h2 className="text-lg font-heading font-bold text-white mb-4">
              四柱八字
            </h2>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-3 rounded-xl bg-accent/10">
                <p className="text-xs text-accent mb-1">年柱</p>
                <p className="text-xl font-bold text-white">{sampleData.bazi.year}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/10">
                <p className="text-xs text-secondary mb-1">月柱</p>
                <p className="text-xl font-bold text-white">{sampleData.bazi.month}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-primary/10">
                <p className="text-xs text-primary mb-1">日柱</p>
                <p className="text-xl font-bold text-white">{sampleData.bazi.day}</p>
                <p className="text-xs text-gray-500 mt-1">日主</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-500/10">
                <p className="text-xs text-green-500 mb-1">时柱</p>
                <p className="text-xl font-bold text-white">{sampleData.bazi.hour}</p>
              </div>
            </div>
          </div>

          {/* Five Elements */}
          <div className="rounded-2xl bg-surface/60 border border-white/10 p-5">
            <h2 className="text-lg font-heading font-bold text-white mb-4">
              五行分布
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">木</span>
                  <span className="text-gray-400">20%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: "20%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">火</span>
                  <span className="text-gray-400">20%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-2 rounded-full bg-red-500" style={{ width: "20%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">土</span>
                  <span className="text-gray-400">40%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-2 rounded-full bg-yellow-600" style={{ width: "40%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">金</span>
                  <span className="text-gray-400">0%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-2 rounded-full bg-gray-400" style={{ width: "0%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">水</span>
                  <span className="text-gray-400">20%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: "20%" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Ten Gods */}
          <div className="rounded-2xl bg-surface/60 border border-white/10 p-5">
            <h2 className="text-lg font-heading font-bold text-white mb-4">
              十神关系
            </h2>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-3 rounded-xl bg-accent/10">
                <p className="text-xs text-accent mb-1">年柱</p>
                <p className="text-sm font-bold text-white">{sampleData.tenGods.year}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/10">
                <p className="text-xs text-secondary mb-1">月柱</p>
                <p className="text-sm font-bold text-white">{sampleData.tenGods.month}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-primary/10">
                <p className="text-xs text-primary mb-1">日柱</p>
                <p className="text-sm font-bold text-white">{sampleData.tenGods.day}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-500/10">
                <p className="text-xs text-green-500 mb-1">时柱</p>
                <p className="text-sm font-bold text-white">{sampleData.tenGods.hour}</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="rounded-2xl bg-gradient-to-br from-secondary/10 to-accent/5 border border-secondary/20 p-5">
            <h3 className="text-lg font-heading font-bold text-white mb-2">
              查看你的专属命盘
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              输入你的出生信息，获取完整的八字命盘分析
            </p>
            <a
              href="/tools"
              className="block w-full px-4 py-3 rounded-xl bg-secondary/80 text-white font-semibold text-sm text-center hover:bg-secondary transition-colors"
            >
              开始排盘 →
            </a>
          </div>
        </div>

        <Navigation />
      </main>
    </>
  );
}
