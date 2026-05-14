"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Background from "../../components/Background";
import Navigation from "../../components/Navigation";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import AppBackLink from "../../components/AppBackLink";
import { useI18n } from "../../components/LocaleProvider";

export default function BaziBasicsPage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <>
      <Background />
      <main className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-white/10 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppBackLink label={t("common.goBack")} context="YiShun" />
              <span className="text-xl" role="img" aria-label="八字">📚</span>
              <h1 className="text-lg font-heading font-bold text-white">
                四柱八字基础
              </h1>
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Introduction */}
          <div className="rounded-2xl bg-surface/60 border border-white/10 p-5">
            <h2 className="text-xl font-heading font-bold text-white mb-3">
              什么是四柱八字？
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              四柱八字是中国传统命理学的核心体系，以年、月、日、时四柱为基础，
              结合天干地支的五行生克关系，分析一个人的命运走势与性格特征。
            </p>
          </div>

          {/* Four Pillars */}
          <div className="rounded-2xl bg-surface/60 border border-white/10 p-5">
            <h2 className="text-xl font-heading font-bold text-white mb-4">
              四柱构成
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📅</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">年柱</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    由出生年份的天干地支组成，代表祖辈、童年时期的影响力
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🌙</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">月柱</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    由出生月份的天干地支组成，代表青年时期的事业与感情
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">☀️</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">日柱</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    由出生日期的天干地支组成，日干代表本人，是八字的核心
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⏰</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">时柱</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    由出生时辰的天干地支组成，代表晚年运势与子女缘
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Five Elements */}
          <div className="rounded-2xl bg-surface/60 border border-white/10 p-5">
            <h2 className="text-xl font-heading font-bold text-white mb-4">
              五行生克
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl bg木/10 border border木/20">
                <span className="text-2xl">🌳</span>
                <p className="text-sm text-white mt-1">木</p>
              </div>
              <div className="text-center p-3 rounded-xl bg火/10 border border火/20">
                <span className="text-2xl">🔥</span>
                <p className="text-sm text-white mt-1">火</p>
              </div>
              <div className="text-center p-3 rounded-xl bg土/10 border border土/20">
                <span className="text-2xl">🪨</span>
                <p className="text-sm text-white mt-1">土</p>
              </div>
              <div className="text-center p-3 rounded-xl bg金/10 border border金/20">
                <span className="text-2xl">🥇</span>
                <p className="text-sm text-white mt-1">金</p>
              </div>
              <div className="text-center p-3 rounded-xl bg水/10 border border水/20 col-span-2">
                <span className="text-2xl">💧</span>
                <p className="text-sm text-white mt-1">水</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              五行相生：木生火 → 火生土 → 土生金 → 金生水 → 水生木<br/>
              五行相克：木克土 → 土克水 → 水克火 → 火克金 → 金克木
            </p>
          </div>

          {/* Call to Action */}
          <div className="rounded-2xl bg-gradient-to-br from-secondary/10 to-accent/5 border border-secondary/20 p-5">
            <h3 className="text-lg font-heading font-bold text-white mb-2">
              立即体验排盘
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
