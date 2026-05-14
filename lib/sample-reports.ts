export type SampleReport = {
  id: string;
  locale: "zh-CN" | "en";
  title: string;
  persona: string;
  summary: string;
  score: number;
  focus: string;
  bestWindow: string;
  bestFor: string[];
  actions: string[];
  avoid: string;
  elementHint: string;
  whyThisTime: string;
  whyThisResult: string;
  premiumValue: string[];
  retentionPath: string[];
  disclaimer: string;
};

export const SAMPLE_REPORTS: SampleReport[] = [
  {
    id: "zh-founder-launch",
    locale: "zh-CN",
    title: "创业者发布日前的顺势报告",
    persona: "中文样例 · 事业/发布",
    summary: "今天适合把复杂计划收敛成一个可执行发布动作，先确认边界，再对外表达。",
    score: 86,
    focus: "事业",
    bestWindow: "09:00–11:00",
    bestFor: ["规划", "对外沟通", "确定优先级"],
    actions: ["写下发布前唯一必须完成的检查项。", "把对外文案压缩为一个主张和一个下一步。", "在午前完成关键确认，下午只做微调。"],
    avoid: "不要临时扩大范围，也不要为了热度承诺未验证功能。",
    elementHint: "木 · 先定方向，再推进生长。",
    whyThisTime: "上午木火节奏更适合定方向、做发布前确认；规则引擎先给窗口，Gemini 只负责解释。",
    whyThisResult: "分数来自样例出生资料、真太阳时、四柱、五行平衡和今日行动主题的组合，不是黑盒预测。",
    premiumValue: ["7 天发布节奏", "PDF/长图复盘", "每日行动清单", "30 天关键日期提醒"],
    retentionPath: ["保存今天的发布窗口", "明天回来看新节奏", "连续 3 天解锁复盘徽章"],
    disclaimer: "仅供娱乐和自我反思；不构成商业、法律、投资或心理建议。",
  },
  {
    id: "zh-relationship-reset",
    locale: "zh-CN",
    title: "关系修复前的每日时机卡",
    persona: "中文样例 · 情感/沟通",
    summary: "今天更适合温和开场、降低解释密度，用一个具体请求替代情绪拉扯。",
    score: 78,
    focus: "情感",
    bestWindow: "19:00–21:00",
    bestFor: ["敏感沟通", "复盘", "慢决策"],
    actions: ["先写下你真正想要被理解的一句话。", "用“我感受到……”开头，避免给对方下结论。", "如果对话升温，暂停十分钟后再继续。"],
    avoid: "不要在疲惫时追问最终答案。",
    elementHint: "水 · 先缓一缓，让信息沉淀。",
    whyThisTime: "晚间水气更适合慢沟通和复盘；规则引擎先给时段，Gemini 只把依据说清楚。",
    whyThisResult: "分数来自样例出生资料、真太阳时、四柱、五行平衡和沟通主题的组合，不保证具体结果。",
    premiumValue: ["7 天沟通节奏", "PDF/长图保存", "敏感对话清单", "重要日期提醒"],
    retentionPath: ["保存今天的沟通边界", "明天回来看新窗口", "连续记录关系复盘"],
    disclaimer: "仅供娱乐和自我反思；不替代专业心理、医疗或法律建议。",
  },
  {
    id: "en-career-pivot",
    locale: "en",
    title: "Career pivot timing sample",
    persona: "English sample · Work / decision",
    summary: "A clear day for narrowing options: choose one practical experiment before making a larger move.",
    score: 82,
    focus: "Work",
    bestWindow: "07:00–09:00",
    bestFor: ["planning", "focused outreach", "calm decisions"],
    actions: ["Write the smallest reversible test for the new direction.", "Send one focused message to a trusted advisor.", "Define the signal that would make you continue or stop."],
    avoid: "Do not force a final answer before the options are clear.",
    elementHint: "Wood · pick the next branch and let it grow.",
    whyThisTime: "07:00–09:00 is presented as a planning window because the rules engine scores structured, low-noise action higher for this sample.",
    whyThisResult: "The score combines sample birth data, true solar time, Four Pillars, Five Elements balance, and today’s action theme. Gemini explains the computed signal; it does not decide chart facts.",
    premiumValue: ["Deep 7-day timing report", "PDF or share-image summary", "Action checklist", "30-day decision plan"],
    retentionPath: ["Save today’s pivot signal", "Get a tomorrow reminder", "Build a 3-day clarity streak"],
    disclaimer: "For reflection only. Not financial, medical, legal, or psychological advice.",
  },
  {
    id: "en-money-boundary",
    locale: "en",
    title: "Money boundary daily sample",
    persona: "English sample · Money / boundaries",
    summary: "Today favors reviewing the ground rules before saying yes to a purchase, client, or commitment.",
    score: 74,
    focus: "Money",
    bestWindow: "15:00–17:00",
    bestFor: ["budgeting", "reviewing details", "negotiating boundaries"],
    actions: ["List the non-negotiable cost, time, and energy limits.", "Delay any vague commitment until the terms are written down.", "Cut one optional expense before adding a new one."],
    avoid: "Avoid saying yes to vague plans without confirming the ground rules.",
    elementHint: "Metal · simplify before you commit.",
    whyThisTime: "15:00–17:00 is treated as a review window because the rules engine favors detail-checking and boundary-setting for this sample.",
    whyThisResult: "The score combines sample birth data, true solar time, Four Pillars, Five Elements balance, and today’s money-boundary theme. Gemini explains the computed signal; it does not decide chart facts.",
    premiumValue: ["Deep 7-day money rhythm", "PDF or share-image summary", "Boundary checklist", "30-day spending review plan"],
    retentionPath: ["Save today’s money boundary", "Set an important-date reminder", "Keep a weekly review streak"],
    disclaimer: "For reflection only. Not financial advice or deterministic prediction.",
  },
];

export function getSampleReport(id: string) {
  return SAMPLE_REPORTS.find((sample) => sample.id === id) ?? null;
}
