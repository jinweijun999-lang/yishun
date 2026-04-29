import { Solar, LunarUtil } from "lunar-typescript";

export type Gender = "male" | "female" | "other";

export interface FourPillarsInput {
  birthDate: string;
  birthTime: string;
  gender: Gender;
  longitude?: number | null;
  latitude?: number | null;
  timezoneOffsetMinutes?: number | null;
  timezoneName?: string | null;
}

export interface StemInfo {
  name: string;
  element: string;
  polarity: "Yin" | "Yang";
}

export interface BranchInfo {
  name: string;
  zodiac: string;
}

export interface PillarInfo {
  stem: StemInfo;
  branch: BranchInfo;
  pillar: string;
  stemTenGod?: string; // Ten God for the Heavenly Stem
  branchHiddenStems?: Array<{
    stem: StemInfo;
    tenGod: string;
  }>; // Hidden stems and their Ten Gods
}

// Ten Gods Mapping
const TEN_GODS: Record<string, string> = {
  "Bi": "Friend (Bi Jian) / 比肩",
  "Jie": "Rob Wealth (Jie Cai) / 劫财",
  "Shi": "Eating God (Shi Shen) / 食神",
  "Shang": "Hurting Officer (Shang Guan) / 伤官",
  "Cai": "Direct Wealth (Zheng Cai) / 正财",
  "PianCai": "Indirect Wealth (Pian Cai) / 偏财",
  "Guan": "Direct Officer (Zheng Guan) / 正官",
  "Sha": "Seven Killings (Qi Sha) / 七杀",
  "Yin": "Direct Resource (Zheng Yin) / 正印",
  "Xiao": "Indirect Resource (Pian Yin) / 偏印",
};

function calculateTenGod(dayMasterGan: string, targetGan: string): string {
  // Use lunar-typescript's internal logic or a manual map if needed.
  // Since we rely on Solar/Lunar, let's implement a robust lookup based on 
  // the relationship between Day Master and Target.
  
  // Get element and polarity using LunarUtil is possible, but simple lookup is faster.
  // Let's use a verified matrix for accuracy.
  
  const stems = ["Jia", "Yi", "Bing", "Ding", "Wu", "Ji", "Geng", "Xin", "Ren", "Gui"];
  // Corresponding to LunarUtil.GAN: ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
  
  const map: Record<string, string[]> = {
    // Day Master: [Jia, Yi, Bing, Ding, Wu, Ji, Geng, Xin, Ren, Gui] -> result Ten God
    "甲": ["Bi", "Jie", "Shi", "Shang", "PianCai", "Cai", "Sha", "Guan", "Xiao", "Yin"],
    "乙": ["Jie", "Bi", "Shang", "Shi", "Cai", "PianCai", "Guan", "Sha", "Yin", "Xiao"],
    "丙": ["Xiao", "Yin", "Bi", "Jie", "Shi", "Shang", "PianCai", "Cai", "Sha", "Guan"],
    "丁": ["Yin", "Xiao", "Jie", "Bi", "Shang", "Shi", "Cai", "PianCai", "Guan", "Sha"],
    "戊": ["Sha", "Guan", "Xiao", "Yin", "Bi", "Jie", "Shi", "Shang", "PianCai", "Cai"],
    "己": ["Guan", "Sha", "Yin", "Xiao", "Jie", "Bi", "Shang", "Shi", "Cai", "PianCai"],
    "庚": ["PianCai", "Cai", "Sha", "Guan", "Xiao", "Yin", "Bi", "Jie", "Shi", "Shang"],
    "辛": ["Cai", "PianCai", "Guan", "Sha", "Yin", "Xiao", "Jie", "Bi", "Shang", "Shi"],
    "壬": ["Shi", "Shang", "PianCai", "Cai", "Sha", "Guan", "Xiao", "Yin", "Bi", "Jie"],
    "癸": ["Shang", "Shi", "Cai", "PianCai", "Guan", "Sha", "Yin", "Xiao", "Jie", "Bi"],
  };

  const targetIndex = LunarUtil.GAN.indexOf(targetGan);
  // LunarUtil.GAN is ["", "甲", "乙"...] so index 1 is Jia.
  // My stems array is 0-indexed.
  // Let's adjust.
  
  if (!map[dayMasterGan]) return "";
  
  // The map values are ordered by Stem order (Jia...Gui)
  // targetGan index in ["甲"..."癸"] is targetIndex - 1
  return map[dayMasterGan][targetIndex - 1] || "";
}

function buildPillar(gan: string, zhi: string, dayMasterGan?: string): PillarInfo {
  const stem = mapStem(gan);
  const branch = mapBranch(zhi);
  
  let stemTenGod: string | undefined;
  let branchHiddenStems: Array<{ stem: StemInfo; tenGod: string }> | undefined;

  if (dayMasterGan) {
    // 1. Calculate Stem Ten God
    const godKey = calculateTenGod(dayMasterGan, gan);
    stemTenGod = TEN_GODS[godKey] || godKey;

    // 2. Calculate Branch Hidden Stems and their Ten Gods
    // LunarUtil.ZHI_HIDE_GAN returns array of stems hidden in the branch
    const hiddenGans = LunarUtil.ZHI_HIDE_GAN[LunarUtil.ZHI.indexOf(zhi)]; // ["Gui", "Xin", ...]?? No, likely ["癸", "辛"]
    
    if (hiddenGans && hiddenGans.length > 0) {
      branchHiddenStems = hiddenGans.map(hiddenGan => {
        const hiddenGodKey = calculateTenGod(dayMasterGan, hiddenGan);
        return {
          stem: mapStem(hiddenGan),
          tenGod: TEN_GODS[hiddenGodKey] || hiddenGodKey
        };
      });
    }
  }

  return {
    stem,
    branch,
    pillar: `${stem.name} ${branch.name}`,
    stemTenGod,
    branchHiddenStems
  };
}

export interface FourPillarsResult {
  birth: FourPillarsInput;
  trueSolarTime?: {
    date: string;
    time: string;
    offsetMinutes: number;
    equationOfTimeMinutes: number;
    longitudeCorrectionMinutes: number;
    timezoneMeridianDegrees: number;
    timezoneOffsetMinutes: number;
    longitude: number;
    latitude?: number | null;
    timezoneName?: string | null;
    steps: string[];
  };
  fourPillars: {
    year: PillarInfo;
    month: PillarInfo;
    day: PillarInfo;
    hour: PillarInfo;
  };
}

export type ElementBalance = {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
};

export type BaziProfile = {
  day_master: string;
  pillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  elements_balance: ElementBalance;
};

const STEMS: StemInfo[] = [
  { name: "Jia", element: "Wood", polarity: "Yang" },
  { name: "Yi", element: "Wood", polarity: "Yin" },
  { name: "Bing", element: "Fire", polarity: "Yang" },
  { name: "Ding", element: "Fire", polarity: "Yin" },
  { name: "Wu", element: "Earth", polarity: "Yang" },
  { name: "Ji", element: "Earth", polarity: "Yin" },
  { name: "Geng", element: "Metal", polarity: "Yang" },
  { name: "Xin", element: "Metal", polarity: "Yin" },
  { name: "Ren", element: "Water", polarity: "Yang" },
  { name: "Gui", element: "Water", polarity: "Yin" },
];

const BRANCHES: BranchInfo[] = [
  { name: "Zi", zodiac: "Rat" },
  { name: "Chou", zodiac: "Ox" },
  { name: "Yin", zodiac: "Tiger" },
  { name: "Mao", zodiac: "Rabbit" },
  { name: "Chen", zodiac: "Dragon" },
  { name: "Si", zodiac: "Snake" },
  { name: "Wu", zodiac: "Horse" },
  { name: "Wei", zodiac: "Goat" },
  { name: "Shen", zodiac: "Monkey" },
  { name: "You", zodiac: "Rooster" },
  { name: "Xu", zodiac: "Dog" },
  { name: "Hai", zodiac: "Pig" },
];

const BRANCH_ELEMENT: Record<string, keyof ElementBalance> = {
  Zi: "water",
  Chou: "earth",
  Yin: "wood",
  Mao: "wood",
  Chen: "earth",
  Si: "fire",
  Wu: "fire",
  Wei: "earth",
  Shen: "metal",
  You: "metal",
  Xu: "earth",
  Hai: "water",
};

const ELEMENT_KEY: Record<string, keyof ElementBalance> = {
  Wood: "wood",
  Fire: "fire",
  Earth: "earth",
  Metal: "metal",
  Water: "water",
};

function toNumber(value: string, label: string): number {
  const result = Number(value);
  if (Number.isNaN(result)) {
    throw new Error(`Invalid ${label}`);
  }
  return result;
}

function parseBirthInput(birthDate: string, birthTime: string) {
  const [year, month, day] = birthDate.split("-");
  const [hour, minute] = birthTime.split(":");

  if (!year || !month || !day || !hour || !minute) {
    throw new Error("Invalid birth date or time");
  }

  return {
    year: toNumber(year, "year"),
    month: toNumber(month, "month"),
    day: toNumber(day, "day"),
    hour: toNumber(hour, "hour"),
    minute: toNumber(minute, "minute"),
  };
}

function getDayOfYear(year: number, month: number, day: number): number {
  const current = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 1);
  return Math.floor((current - start) / 86400000) + 1;
}

function equationOfTimeMinutes(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): number {
  const dayOfYear = getDayOfYear(year, month, day);
  const fractionalHour = hour + minute / 60;
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (fractionalHour - 12) / 24);
  return 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );
}

function applyTrueSolarTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  longitude: number | null,
  timezoneOffsetMinutes: number,
  timezoneName?: string | null,
  latitude?: number | null
) {
  const eotMinutes = equationOfTimeMinutes(year, month, day, hour, minute);
  const timezoneHours = -timezoneOffsetMinutes / 60;
  const timezoneMeridian = timezoneHours * 15;
  const effectiveLongitude = longitude ?? timezoneMeridian;
  const longitudeCorrectionMinutes = (timezoneMeridian - effectiveLongitude) * 4;
  const totalCorrectionMinutes = eotMinutes + longitudeCorrectionMinutes;
  const totalSeconds = (hour * 60 + minute + totalCorrectionMinutes) * 60;
  const normalizedSeconds = ((totalSeconds % 86400) + 86400) % 86400;
  const dayShift = Math.floor((totalSeconds - normalizedSeconds) / 86400);
  const date = new Date(Date.UTC(year, month - 1, day + dayShift));
  const correctedHour = Math.floor(normalizedSeconds / 3600);
  const correctedMinute = Math.floor((normalizedSeconds % 3600) / 60);
  const correctedSecond = Math.round(normalizedSeconds % 60);
  const formattedDate = date.toISOString().slice(0, 10);
  const formattedTime = `${String(correctedHour).padStart(2, "0")}:${String(correctedMinute).padStart(2, "0")}`;

  const steps = [
    `Standard time (Local clock) / 标准时间: ${birthTimeString(hour, minute)}`,
    `Equation of time (EoT) / 时差: ${eotMinutes.toFixed(2)} min`,
    `Timezone meridian / 时区中心经度: ${timezoneMeridian.toFixed(2)}°`,
    `Longitude correction / 经度修正: (${timezoneMeridian.toFixed(2)} - ${effectiveLongitude.toFixed(2)}) × 4 = ${longitudeCorrectionMinutes.toFixed(2)} min`,
    `Total offset / 总偏移: ${totalCorrectionMinutes.toFixed(2)} min`,
    `True solar time / 真太阳时: ${formattedTime}`,
  ];

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: correctedHour,
    minute: correctedMinute,
    second: correctedSecond,
    formattedDate,
    formattedTime,
    offsetMinutes: totalCorrectionMinutes,
    equationOfTimeMinutes: eotMinutes,
    longitudeCorrectionMinutes,
    timezoneMeridianDegrees: timezoneMeridian,
    timezoneOffsetMinutes,
    longitude: effectiveLongitude,
    latitude,
    timezoneName,
    steps,
  };
}

function birthTimeString(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function mapStem(gan: string): StemInfo {
  const index = LunarUtil.GAN.indexOf(gan);
  if (index <= 0) {
    throw new Error("Unknown heavenly stem");
  }
  return STEMS[index - 1];
}

function mapBranch(zhi: string): BranchInfo {
  const index = LunarUtil.ZHI.indexOf(zhi);
  if (index <= 0) {
    throw new Error("Unknown earthly branch");
  }
  return BRANCHES[index - 1];
}



export function computeFourPillars(input: FourPillarsInput): FourPillarsResult {
  const {
    birthDate,
    birthTime,
    gender,
    longitude,
    latitude,
    timezoneOffsetMinutes,
    timezoneName,
  } = input;
  const { year, month, day, hour, minute } = parseBirthInput(birthDate, birthTime);
  const hasTimezoneOffset = typeof timezoneOffsetMinutes === "number";
  const trueSolar = hasTimezoneOffset
    ? applyTrueSolarTime(
        year,
        month,
        day,
        hour,
        minute,
        typeof longitude === "number" ? longitude : null,
        timezoneOffsetMinutes,
        timezoneName ?? undefined,
        typeof latitude === "number" ? latitude : null
      )
    : null;

  const solar = trueSolar
    ? Solar.fromYmdHms(
        trueSolar.year,
        trueSolar.month,
        trueSolar.day,
        trueSolar.hour,
        trueSolar.minute,
        trueSolar.second
      )
    : Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunarInstance = solar.getLunar() as unknown as {
    getEightChar: () => {
      getMonthGan: () => string;
      getMonthZhi: () => string;
      getDayGan: () => string;
      getDayZhi: () => string;
      getTimeGan: () => string;
      getTimeZhi: () => string;
    };
    getYearGanByLiChun?: () => string;
    getYearZhiByLiChun?: () => string;
    getYearGan?: () => string;
    getYearZhi: () => string;
    getYearShengXiao: () => string;
  };
  const eightChar = lunarInstance.getEightChar();
  const yearGan = lunarInstance.getYearGanByLiChun
    ? lunarInstance.getYearGanByLiChun()
    : lunarInstance.getYearGan ? lunarInstance.getYearGan() : "";
  const yearZhi = lunarInstance.getYearZhiByLiChun
    ? lunarInstance.getYearZhiByLiChun()
    : lunarInstance.getYearZhi();

  const baziZodiac = mapBranch(yearZhi).zodiac;
  const folkZodiac = mapBranch(lunarInstance.getYearZhi()).zodiac;

  const dayGan = eightChar.getDayGan();

  return {
    birth: {
      birthDate,
      birthTime,
      gender,
      longitude,
      latitude,
      timezoneOffsetMinutes,
      timezoneName,
    },
    trueSolarTime: trueSolar
      ? {
          date: trueSolar.formattedDate,
          time: trueSolar.formattedTime,
          offsetMinutes: Number(trueSolar.offsetMinutes.toFixed(2)),
          equationOfTimeMinutes: Number(trueSolar.equationOfTimeMinutes.toFixed(2)),
          longitudeCorrectionMinutes: Number(trueSolar.longitudeCorrectionMinutes.toFixed(2)),
          timezoneMeridianDegrees: Number(trueSolar.timezoneMeridianDegrees.toFixed(2)),
          timezoneOffsetMinutes: trueSolar.timezoneOffsetMinutes,
          longitude: trueSolar.longitude,
          latitude: trueSolar.latitude,
          timezoneName: trueSolar.timezoneName,
          steps: trueSolar.steps,
        }
      : undefined,
    fourPillars: {
      year: buildPillar(yearGan, yearZhi, dayGan),
      month: buildPillar(eightChar.getMonthGan(), eightChar.getMonthZhi(), dayGan),
      day: buildPillar(dayGan, eightChar.getDayZhi(), dayGan),
      hour: buildPillar(eightChar.getTimeGan(), eightChar.getTimeZhi(), dayGan),
    },
  };
}

export function computeElementBalance(bazi: FourPillarsResult): ElementBalance {
  const balance: ElementBalance = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };

  const pillars = Object.values(bazi.fourPillars);
  for (const pillar of pillars) {
    const stemElement = ELEMENT_KEY[pillar.stem.element];
    if (stemElement) {
      balance[stemElement] += 1;
    }
    const branchElement = BRANCH_ELEMENT[pillar.branch.name];
    if (branchElement) {
      balance[branchElement] += 1;
    }
  }

  return balance;
}

export interface BaziInterpretation {
  dayMasterDescription: string;
  monthSeasonDescription: string;
  strengthAnalysis: string;
  favorableElements: string[];
}

export function generateInterpretation(bazi: FourPillarsResult): BaziInterpretation {
  const dayMaster = bazi.fourPillars.day.stem;
  const monthBranch = bazi.fourPillars.month.branch;
  const balance = computeElementBalance(bazi);

  // 1. Day Master Description
  const dmDescMap: Record<string, string> = {
    "Jia": "Jia Wood (Yang): Like a towering tree, sturdy and upright. Growth-oriented, benevolent, and straightforward.",
    "Yi": "Yi Wood (Yin): Like flowers or vines, flexible and adaptable. Gentle, expressive, and tactful.",
    "Bing": "Bing Fire (Yang): Like the sun, radiant and generous. Passionate, charismatic, but can be impulsive.",
    "Ding": "Ding Fire (Yin): Like a candle flame, focused and meticulous. Warm, insightful, and self-sacrificing.",
    "Wu": "Wu Earth (Yang): Like a mountain, stable and trustworthy. Solid, grounded, but can be stubborn.",
    "Ji": "Ji Earth (Yin): Like garden soil, nurturing and productive. Tolerant, resourceful, and detail-oriented.",
    "Geng": "Geng Metal (Yang): Like a sword or raw iron, tough and decisive. Just, loyal, and altruistic.",
    "Xin": "Xin Metal (Yin): Like jewelry or a dagger, elegant and sharp. Sentimental, precise, and values reputation.",
    "Ren": "Ren Water (Yang): Like an ocean or river, dynamic and wise. Adaptable, energetic, and sometimes restless.",
    "Gui": "Gui Water (Yin): Like rain or mist, gentle and penetrating. Intuitive, imaginative, and somewhat mysterious.",
  };
  const dayMasterDescription = dmDescMap[dayMaster.name] || `Day Master is ${dayMaster.name} ${dayMaster.element}.`;

  // 2. Month Season Analysis (Simplified)
  // In northern hemisphere:
  // Yin/Mao/Chen = Spring (Wood)
  // Si/Wu/Wei = Summer (Fire)
  // Shen/You/Xu = Autumn (Metal)
  // Hai/Zi/Chou = Winter (Water)
  // Chen/Xu/Chou/Wei are also Earth transitions.
  
  let season = "";
  const mName = monthBranch.name;
  if (["Yin", "Mao", "Chen"].includes(mName)) season = "Spring (Wood prosperous)";
  else if (["Si", "Wu", "Wei"].includes(mName)) season = "Summer (Fire prosperous)";
  else if (["Shen", "You", "Xu"].includes(mName)) season = "Autumn (Metal prosperous)";
  else if (["Hai", "Zi", "Chou"].includes(mName)) season = "Winter (Water prosperous)";
  
  const monthSeasonDescription = `Born in ${monthBranch.name} month (${season}).`;

  // 3. Strength Analysis (Very Basic)
  // Compare Day Master element with Balance
  const selfElement = ELEMENT_KEY[dayMaster.element];
  const selfCount = balance[selfElement];
  // Resource produces Self
  const resourceMap: Record<string, string> = { wood: "water", fire: "wood", earth: "fire", metal: "earth", water: "metal" };
  const resourceElement = resourceMap[selfElement as string] as keyof ElementBalance;
  const resourceCount = balance[resourceElement];
  
  const selfStrengthScore = selfCount + resourceCount;
  let strengthAnalysis = "";
  if (selfStrengthScore >= 5) strengthAnalysis = "Day Master appears Strong (supported by many same/resource elements).";
  else if (selfStrengthScore <= 2) strengthAnalysis = "Day Master appears Weak (few same/resource elements).";
  else strengthAnalysis = "Day Master appears Balanced.";

  // 4. Favorable Elements (Simplified)
  // If Strong -> Output (Child), Wealth (Control), Officer (Controlled by)
  // If Weak -> Resource (Mother), Self (Friend)
  let favorableElements: string[] = [];
  if (selfStrengthScore >= 4) {
     // Suppress
     // Wood -> Fire (Output), Earth (Wealth), Metal (Officer)
     if (selfElement === "wood") favorableElements = ["Fire", "Earth", "Metal"];
     if (selfElement === "fire") favorableElements = ["Earth", "Metal", "Water"];
     if (selfElement === "earth") favorableElements = ["Metal", "Water", "Wood"];
     if (selfElement === "metal") favorableElements = ["Water", "Wood", "Fire"];
     if (selfElement === "water") favorableElements = ["Wood", "Fire", "Earth"];
  } else {
     // Support
     // Wood -> Water (Resource), Wood (Self)
     if (selfElement === "wood") favorableElements = ["Water", "Wood"];
     if (selfElement === "fire") favorableElements = ["Wood", "Fire"];
     if (selfElement === "earth") favorableElements = ["Fire", "Earth"];
     if (selfElement === "metal") favorableElements = ["Earth", "Metal"];
     if (selfElement === "water") favorableElements = ["Metal", "Water"];
  }

  return {
    dayMasterDescription,
    monthSeasonDescription,
    strengthAnalysis,
    favorableElements
  };
}

export function buildBaziProfile(bazi: FourPillarsResult): BaziProfile {
  const dayStem = bazi.fourPillars.day.stem;
  const interpretation = generateInterpretation(bazi);
  
  return {
    day_master: `${dayStem.name} (${dayStem.polarity} ${dayStem.element})`,
    pillars: {
      year: bazi.fourPillars.year.pillar,
      month: bazi.fourPillars.month.pillar,
      day: bazi.fourPillars.day.pillar,
      hour: bazi.fourPillars.hour.pillar,
    },
    elements_balance: computeElementBalance(bazi),
    // We can add interpretation to the profile if we update the type, 
    // or just rely on the API returning it separately if needed.
    // For now, let's keep BaziProfile as is, but we might want to extend it.
  };
}
