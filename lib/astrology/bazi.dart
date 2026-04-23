/// Four Pillars of Destiny (四柱排盘) - Core Algorithm
///
/// References:
/// - 天干 (Heavenly Stems): 甲乙丙丁戊己庚辛壬癸
/// - 地支 (Earthly Branches): 子丑寅卯辰巳午未申酉戌亥
/// - 五行 (Five Elements): 木火土金水
/// - 十神 (Ten Gods): 比肩,劫财,食神,伤官,偏财,正财,偏官,正官,偏印,正印

import 'dart:math' as math;

class BaziData {
  /// 年柱 (Year Pillar)
  final String yearGan;
  final String yearZhi;
  
  /// 月柱 (Month Pillar)  
  final String monthGan;
  final String monthZhi;
  
  /// 日柱 (Day Pillar) - Day Master is the self
  final String dayGan;
  final String dayZhi;
  
  /// 时柱 (Hour Pillar)
  final String hourGan;
  final String hourZhi;
  
  /// 五行统计
  final Map<String, int> wuxingCount;
  
  /// 真太阳时矫正后的出生时间
  final String solarTime;
  
  /// 命主五行旺衰
  final String dayStrength;
  
  /// 胎元, 命宫, 身宫
  final String taiYuan;
  final String mingGong;
  final String shenGong;
  
  /// 大运 (Decade Fortune)
  final List<Map<String, String>> daYun;
  
  /// 流年 (Year Fortune) for current decade
  final List<Map<String, String>> liuNian;

  const BaziData({
    required this.yearGan,
    required this.yearZhi,
    required this.monthGan,
    required this.monthZhi,
    required this.dayGan,
    required this.dayZhi,
    required this.hourGan,
    required this.hourZhi,
    required this.wuxingCount,
    required this.solarTime,
    required this.dayStrength,
    required this.taiYuan,
    required this.mingGong,
    required this.shenGong,
    required this.daYun,
    required this.liuNian,
  });

  Map<String, dynamic> toJson() => {
    'year': {'gan': yearGan, 'zhi': yearZhi, 'wuxing': WuXing.getWuXing(yearGan)},
    'month': {'gan': monthGan, 'zhi': monthZhi, 'wuxing': WuXing.getWuXing(monthGan)},
    'day': {'gan': dayGan, 'zhi': dayZhi, 'wuxing': WuXing.getWuXing(dayGan)},
    'hour': {'gan': hourGan, 'zhi': hourZhi, 'wuxing': WuXing.getWuXing(hourGan)},
    'wuxing_count': wuxingCount,
    'day_master': dayGan,
    'day_strength': dayStrength,
    'tai_yuan': taiYuan,
    'ming_gong': mingGong,
    'shen_gong': shenGong,
    'da_yun': daYun,
    'liu_nian': liuNian,
    'solar_time': solarTime,
  };

  @override
  String toString() => '$yearGan$yearZhi $monthGan$monthZhi $dayGan$dayZhi $hourGan$hourZhi';
}

/// 天干 (Heavenly Stems)
class TianGan {
  static const List<String> names = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  
  /// 天干序号: 0=甲, 1=乙, ..., 9=癸
  static int index(String gan) => names.indexOf(gan);
  
  /// 天干五行: 甲乙→木, 丙丁→火, 戊己→土, 庚辛→金, 壬癸→水
  static String getWuXing(String gan) => WuXing.getWuXing(gan);
  
  /// 天干阴阳: 甲丙戊庚壬→阳, 乙丁己辛癸→阴
  static bool isYang(String gan) => ['甲', '丙', '戊', '庚', '壬'].contains(gan);
  
  /// 获取对应地支的天干 (月令地支)
  static String getGanForZhiMonth(String zhi, int yearGanIdx) {
    // 月令地支对应的天干表 (五鼠遁)
    // 子月(正月)从甲开始, 丑月从乙开始, ...
    final monthGans = [
      ['甲', '丙', '戊', '庚', '壬'], // 子月(正月)
      ['乙', '丁', '己', '辛', '癸'], // 丑月
      ['丙', '戊', '庚', '壬', '甲'], // 寅月
      ['丁', '己', '辛', '癸', '乙'], // 卯月
      ['戊', '庚', '壬', '甲', '丙'], // 辰月
      ['己', '辛', '癸', '乙', '丁'], // 巳月
      ['庚', '壬', '甲', '丙', '戊'], // 午月
      ['辛', '癸', '乙', '丁', '己'], // 未月
      ['壬', '甲', '丙', '戊', '庚'], // 申月
      ['癸', '乙', '丁', '己', '辛'], // 酉月
      ['甲', '丙', '戊', '庚', '壬'], // 戌月
      ['乙', '丁', '己', '辛', '癸'], // 亥月
    ];
    
    // 获取年份天干的阴阳性来决定用哪一列
    final zhiIdx = DiZhi.index(zhi);
    final col = isYang(names[yearGanIdx % 10]) ? 0 : 1;
    // 简化: 使用年干+月支计算月干
    final ganIdx = (yearGanIdx + zhiIdx * 2) % 5;
    return names[(col == 0 ? ganIdx * 2 : ganIdx * 2 + 1) % 10];
  }
}

/// 地支 (Earthly Branches)
class DiZhi {
  static const List<String> names = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  
  static int index(String zhi) => names.indexOf(zhi);
  
  /// 地支五行
  static String getWuXing(String zhi) {
    final m = {
      '子': '水', '丑': '土', '寅': '木', '卯': '木',
      '辰': '土', '巳': '火', '午': '火', '未': '土',
      '申': '金', '酉': '金', '戌': '土', '亥': '水',
    };
    return m[zhi] ?? '土';
  }
  
  /// 地支藏干
  static List<String> getCangGan(String zhi) {
    final m = {
      '子': ['癸'],
      '丑': ['己', '癸', '辛'],
      '寅': ['甲', '丙', '戊'],
      '卯': ['乙'],
      '辰': ['戊', '乙', '癸'],
      '巳': ['丙', '庚', '戊'],
      '午': ['丁', '己'],
      '未': ['己', '丁', '乙'],
      '申': ['庚', '壬', '戊'],
      '酉': ['辛'],
      '戌': ['戊', '辛', '丁'],
      '亥': ['壬', '甲'],
    };
    return m[zhi] ?? [];
  }
  
  /// 地支对应的生肖
  static String getShengXiao(String zhi) {
    final m = {
      '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
      '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
      '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪',
    };
    return m[zhi] ?? '';
  }
  
  /// 时支对应的时辰
  static String getShichen(String zhi) {
    final m = {
      '子': '子时(23-01)', '丑': '丑时(01-03)', '寅': '寅时(03-05)', '卯': '卯时(05-07)',
      '辰': '辰时(07-09)', '巳': '巳时(09-11)', '午': '午时(11-13)', '未': '未时(13-15)',
      '申': '申时(15-17)', '酉': '酉时(17-19)', '戌': '戌时(19-21)', '亥': '亥时(21-23)',
    };
    return m[zhi] ?? '';
  }
}

/// 五行 (Five Elements)
class WuXing {
  static const List<String> names = ['木', '火', '土', '金', '水'];
  
  /// 五行相生: 木生火→火生土→土生金→金生水→水生木
  static String generate(String wuxing) {
    final order = ['木', '火', '土', '金', '水'];
    final idx = order.indexOf(wuxing);
    return order[(idx + 1) % 5];
  }
  
  /// 五行相克: 木克土→土克水→水克火→火克金→金克木
  static String overcome(String wuxing) {
    final order = ['木', '火', '土', '金', '水'];
    final idx = order.indexOf(wuxing);
    return order[(idx + 2) % 5]; // 相克是间隔一个
  }
  
  /// 天干五行
  static String getWuXing(String gan) {
    final m = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火',
      '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
    };
    return m[gan] ?? '土';
  }
  
  /// 地支五行
  static String getWuXingFromZhi(String zhi) => DiZhi.getWuXing(zhi);
  
  /// 计算八字五行强弱
  static Map<String, int> countWuXing(List<String> gans, List<String> zhis) {
    final count = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0};
    
    for (final g in gans) {
      final wx = getWuXing(g);
      count[wx] = (count[wx] ?? 0) + 1;
    }
    
    for (final z in zhis) {
      // 地支按地支本身五行计数
      final wx = getWuXingFromZhi(z);
      count[wx] = (count[wx] ?? 0) + 1;
    }
    
    return count;
  }
}

/// 十神 (Ten Gods)
class ShiShen {
  /// 计算十神关系
  /// dayGan: 日主天干
  /// otherGan: 其他天干
  static String getShiShen(String dayGan, String otherGan) {
    final dayIdx = TianGan.index(dayGan);
    final otherIdx = TianGan.index(otherGan);
    
    // 计算天干间的十神关系
    // 同我者为比劫, 我生者为食伤, 我克者为财, 克我者为官杀, 生我者为印
    final diff = (otherIdx - dayIdx + 10) % 10;
    
    // 以日干为基准的关系表
    // 十神表: 比和(比肩/劫财), 异我生(食神/伤官), 异我克(偏财/正财), 克我(七杀/正官), 生我(偏印/正印)
    // 0:同, 1:我生, 2:我克, 3:克我, 4:生我
    
    // 根据日干阴阳和关系干阴阳决定具体十神
    final dayIsYang = TianGan.isYang(dayGan);
    final otherIsYang = TianGan.isYang(otherGan);
    
    // 计算生克关系
    // 10天干顺序: 甲1乙2丙3丁4戊5己6庚7辛8壬9癸10
    // 1(甲)生3(丙),2(乙)生4(丁)... 即(我生) = (我索引+2)%10
    // 1(甲)克5(戊),2(乙)克6(己)... 即(我克) = (我索引+4)%10
    // 3(丙)克1(甲),4(丁)克2(乙)... 即(克我) = (我索引-4+10)%10
    
    final table = [
      //  甲    乙    丙    丁    戊    己    庚    辛    壬    癸
      ['比肩','劫财','食神','伤官','偏财','正财','偏官','正官','偏印','正印'], // 甲
      ['劫财','比肩','伤官','食神','正财','偏财','正官','偏官','正印','偏印'], // 乙
      ['偏印','正印','比肩','劫财','食神','伤官','偏财','正财','偏官','正官'], // 丙
      ['正印','偏印','劫财','比肩','伤官','食神','正财','偏财','正官','偏官'], // 丁
      ['偏官','正官','偏印','正印','比肩','劫财','食神','伤官','偏财','正财'], // 戊
      ['正官','偏官','正印','偏印','劫财','比肩','伤官','食神','正财','偏财'], // 己
      ['偏财','正财','偏官','正官','偏印','正印','比肩','劫财','食神','伤官'], // 庚
      ['正财','偏财','正官','偏官','正印','偏印','劫财','比肩','伤官','食神'], // 辛
      ['食神','伤官','偏财','正财','偏官','正官','偏印','正印','比肩','劫财'], // 壬
      ['伤官','食神','正财','偏财','正官','偏官','正印','偏印','劫财','比肩'], // 癸
    ];
    
    return table[dayIdx][otherIdx];
  }
}

/// 四柱排盘计算器
class BaziCalculator {
  /// 计算四柱八字
  /// [birthTime] 出生时间 (北京时间)
  /// [longitude] 经度 (用于真太阳时计算, 默认116.4北京)
  static BaziData calculate(DateTime birthTime, {double longitude = 116.4}) {
    // 1. 计算真太阳时
    final trueSolarTime = _calculateTrueSolarTime(birthTime, longitude);
    
    // 2. 计算年柱
    final yearGanIdx = (birthTime.year - 4) % 10;
    final yearZhiIdx = (birthTime.year - 4) % 12;
    
    // 3. 计算月柱 (月令地支)
    final monthZhiIdx = (birthTime.month - 1) % 12;
    
    // 4. 计算月干 (五虎遁)
    // 甲己之年丙作首, 乙庚之年戊为头, 丙辛必定寻庚起, 丁壬壬位顺行流, 戊癸之年何方发, 甲寅之上好追求
    final monthGanIdx = _getMonthGanIndex(birthTime.year, birthTime.month);
    
    // 5. 计算日柱 (日干支 - 1900年1月31日 农历新年为基准计算)
    final dayGanZhiIdx = _getDayGanZhiIndex(birthTime);
    
    // 6. 计算时柱 (时令地支 + 五鼠遁)
    final hourZhiIdx = ((trueSolarTime.hour + 1) ~/ 2) % 12;
    // 五鼠遁: 日干为甲则起甲子, 乙起丙子, 丙起戊子, 丁起庚子, 戊起壬子
    // 甲0乙2丙4丁6戊8庚0辛2壬4癸6 -> (日干索引 * 2) % 10
    final shiShuStart = (dayGanZhiIdx % 10 * 2) % 10;
    final hourGanIdx = (shiShuStart + hourZhiIdx) % 10;
    
    // 7. 计算四柱
    final yearGan = TianGan.names[yearGanIdx < 0 ? yearGanIdx + 10 : yearGanIdx % 10];
    final yearZhi = DiZhi.names[(yearZhiIdx + 12) % 12];
    final monthGan = TianGan.names[monthGanIdx < 0 ? monthGanIdx + 10 : monthGanIdx % 10];
    final monthZhi = DiZhi.names[monthZhiIdx];
    final dayGan = TianGan.names[dayGanZhiIdx % 10];
    final dayZhi = DiZhi.names[dayGanZhiIdx % 12];
    final hourGan = TianGan.names[hourGanIdx < 0 ? hourGanIdx + 10 : hourGanIdx % 10];
    final hourZhi = DiZhi.names[hourZhiIdx];
    
    // 8. 五行统计
    final gans = [yearGan, monthGan, dayGan, hourGan];
    final zhis = [yearZhi, monthZhi, dayZhi, hourZhi];
    final wuxingCount = WuXing.countWuXing(gans, zhis);
    
    // 9. 日主强弱
    final dayStrength = _calculateDayStrength(dayGan, wuxingCount);
    
    // 10. 胎元, 命宫, 身宫
    final taiYuan = _calculateTaiYuan(monthGan, monthZhi, yearGan);
    final mingGong = _calculateMingGong(monthZhi, dayGan, dayZhi);
    final shenGong = _calculateShenGong(monthZhi, dayGan, dayZhi);
    
    // 11. 大运 (从月柱开始, 顺行)
    final daYun = _calculateDaYun(monthGan, monthZhi, birthTime, dayGan);
    
    // 12. 流年 (当前10年)
    final liuNian = _calculateLiuNian(daYun, birthTime);
    
    return BaziData(
      yearGan: yearGan,
      yearZhi: yearZhi,
      monthGan: monthGan,
      monthZhi: monthZhi,
      dayGan: dayGan,
      dayZhi: dayZhi,
      hourGan: hourGan,
      hourZhi: hourZhi,
      wuxingCount: wuxingCount,
      solarTime: '${trueSolarTime.hour}:${trueSolarTime.minute.toString().padLeft(2, '0')}',
      dayStrength: dayStrength,
      taiYuan: taiYuan,
      mingGong: mingGong,
      shenGong: shenGong,
      daYun: daYun,
      liuNian: liuNian,
    );
  }
  
  /// 计算真太阳时
  /// 将北京时间转换为真太阳时, 考虑经度和太阳时差
  /// [birthTime] 出生时间 (本地时间, 假设为北京时间)
  /// [longitude] 经度 (默认116.4北京)
  static DateTime _calculateTrueSolarTime(DateTime birthTime, double longitude) {
    // 北京时间基于东经120度, 但北京实际在116.4度
    // 每差1度 = 4分钟 (东经120度在东经116.4度之东, 北京时间比当地太阳时快)
    // 经度差 * 4分钟 = 当地时间比太阳时快多少
    final longitudeDiff = 120.0 - longitude;
    final longitudeOffsetMinutes = longitudeDiff * 4;
    
    // 计算一年中的第几天
    final dayOfYear = birthTime.difference(DateTime(birthTime.year, 1, 1)).inDays + 1;
    
    // 太阳时差: 约±16分钟周期性变化
    // 使用近似公式: 平太阳时差 ≈ sin(2π*(D-81)/365) * 约9.87分钟
    // D=1时接近冬至(12月22日左右), 太阳时差接近-9.87分钟
    final solarTimeOffset = 9.87 * math.sin(2 * math.pi * (dayOfYear - 81) / 365);
    
    // 总调整 = 经度调整 + 太阳时差
    // 北京时间已经基于东经120度, 我们只需要调整为当地的真太阳时
    final totalOffsetMinutes = longitudeOffsetMinutes + solarTimeOffset;
    
    return birthTime.add(Duration(minutes: totalOffsetMinutes.round()));
  }
  
  /// 计算月干 (五虎遁)
  static int _getMonthGanIndex(int year, int month) {
    // 甲己之年丙作首 -> 年干%10为0或5时, 正月为丙(索引2)
    // 乙庚之年戊为头 -> 年干%10为1或6时, 正月为戊(索引4)
    // 丙辛必定寻庚起 -> 年干%10为2或7时, 正月为庚(索引6)
    // 丁壬壬位顺行流 -> 年干%10为3或8时, 正月为壬(索引8)
    // 戊癸之年何方发, 甲寅之上好追求 -> 年干%10为4或9时, 正月为甲(索引0)
    final yearGanIdx = (year - 4) % 10;
    final startGans = [2, 4, 6, 8, 0]; // 丙戊庚壬甲
    final startGanIdx = startGans[yearGanIdx % 5];
    
    // 月干 = (起始月干 + (月支-1)) % 10
    return (startGanIdx + (month - 1)) % 10;
  }
  
  /// 计算日干支索引
  static int _getDayGanZhiIndex(DateTime birthTime) {
    // 以1900年1月31日(春节)为基础计算
    // 1900年1月31日 = 甲子日 (索引0)
    final baseDate = DateTime(1900, 1, 31);
    
    // 计算日期差
    final daysSinceBase = birthTime.difference(baseDate).inDays;
    
    // 60甲子循环
    final cycle60 = daysSinceBase % 60;
    
    // cycle60即为日干支在60甲子中的位置
    return cycle60;
  }
  
  /// 计算日主强弱
  static String _calculateDayStrength(String dayGan, Map<String, int> wuxingCount) {
    final dayWuXing = WuXing.getWuXing(dayGan);
    
    // 得令 = 与月令相同五行
    // 党多 = 八字中同类五行多
    // 库多 = 地支中含同类余气
    
    // 简化判断: 根据五行数量判断
    final dayCount = wuxingCount[dayWuXing] ?? 0;
    final generateCount = wuxingCount[WuXing.generate(dayWuXing)] ?? 0;
    final overcomeCount = wuxingCount[WuXing.overcome(dayWuXing)] ?? 0;
    
    if (dayCount >= 3 && generateCount >= 1) {
      return '旺';
    } else if (dayCount >= 2 && generateCount >= 1) {
      return '偏旺';
    } else if (overcomeCount > dayCount + generateCount) {
      return '弱';
    } else if (overcomeCount > dayCount) {
      return '偏弱';
    } else {
      return '中和';
    }
  }
  
  /// 计算胎元 (出生月地支的后一月份+天干)
  static String _calculateTaiYuan(String monthGan, String monthZhi, String yearGan) {
    // 胎元 = 月支后一辰 + 月干所生之干
    // 简化: 月支的下一个地支
    final monthZhiIdx = DiZhi.index(monthZhi);
    final taiYuanZhi = DiZhi.names[(monthZhiIdx + 1) % 12];
    
    // 天干 = 月干的合冲之干 (简化: 往后推3位)
    final monthGanIdx = TianGan.index(monthGan);
    final taiYuanGan = TianGan.names[(monthGanIdx + 3) % 10];
    
    return '$taiYuanGan$taiYuanZhi';
  }
  
  /// 计算命宫
  static String _calculateMingGong(String monthZhi, String dayGan, String dayZhi) {
    // 命宫口诀: 以月支与时支查命宫
    // 简化: 用月支和日干支推算
    final monthZhiIdx = DiZhi.index(monthZhi);
    final dayZhiIdx = DiZhi.index(dayZhi);
    
    // 命宫 = (月支 + 日支) % 12, 对应天干用年干推
    final mingGongZhiIdx = (monthZhiIdx + dayZhiIdx) % 12;
    final mingGongZhi = DiZhi.names[mingGongZhiIdx];
    
    // 天干简化: 使用日干
    return '$dayGan$mingGongZhi';
  }
  
  /// 计算身宫
  static String _calculateShenGong(String monthZhi, String dayGan, String dayZhi) {
    // 身宫 = (月支 + 日支 + 6) % 12
    final monthZhiIdx = DiZhi.index(monthZhi);
    final dayZhiIdx = DiZhi.index(dayZhi);
    
    final shenGongZhiIdx = (monthZhiIdx + dayZhiIdx + 6) % 12;
    final shenGongZhi = DiZhi.names[shenGongZhiIdx];
    
    return '$dayGan$shenGongZhi';
  }
  
  /// 计算大运
  static List<Map<String, String>> _calculateDaYun(String monthGan, String monthZhi, DateTime birthTime, String dayGan) {
    final results = <Map<String, String>>[];
    
    // 大运从月柱开始, 阳男阴女顺行, 阴男阳女逆行
    final yearGanIdx = TianGan.index(monthGan); // 使用月干年份
    final isYangYear = TianGan.isYang(TianGan.names[(birthTime.year - 4) % 10]);
    final isYangDay = TianGan.isYang(dayGan);
    
    // 顺逆决定: 阳男阴女顺, 阴男阳女逆
    final forward = (isYangYear && isYangDay) || (!isYangYear && !isYangDay);
    
    final monthZhiIdx = DiZhi.index(monthZhi);
    final monthGanIdx = TianGan.index(monthGan);
    
    // 计算10步大运
    for (int i = 0; i < 10; i++) {
      int ganIdx, zhiIdx;
      
      if (forward) {
        // 顺行: 天干地支各往后推
        ganIdx = (monthGanIdx + i + 1) % 10;
        zhiIdx = (monthZhiIdx + i + 1) % 12;
      } else {
        // 逆行
        ganIdx = (monthGanIdx - i - 1) % 10;
        zhiIdx = (monthZhiIdx - i - 1) % 12;
      }
      
      // 处理负索引
      ganIdx = ganIdx < 0 ? ganIdx + 10 : ganIdx;
      zhiIdx = zhiIdx < 0 ? zhiIdx + 12 : zhiIdx;
      
      final gan = TianGan.names[ganIdx];
      final zhi = DiZhi.names[zhiIdx];
      
      // 计算起始年龄
      final startAge = (i < 5) ? i * 10 + 1 : (i - 5) * 10 + 1;
      final endAge = startAge + 9;
      
      results.add({
        'gan': gan,
        'zhi': zhi,
        'start_age': '$startAge',
        'end_age': '$endAge',
        'wuxing': WuXing.getWuXing(gan),
      });
    }
    
    return results;
  }
  
  /// 计算流年
  static List<Map<String, String>> _calculateLiuNian(List<Map<String, String>> daYun, DateTime birthTime) {
    final results = <Map<String, String>>[];
    final currentYear = DateTime.now().year;
    
    for (int i = 0; i < 10; i++) {
      final year = currentYear + i;
      final ganIdx = (year - 4) % 10;
      final zhiIdx = (year - 4) % 12;
      
      final gan = TianGan.names[ganIdx < 0 ? ganIdx + 10 : ganIdx % 10];
      final zhi = DiZhi.names[(zhiIdx + 12) % 12];
      
      results.add({
        'year': '$year',
        'gan': gan,
        'zhi': zhi,
        'wuxing': WuXing.getWuXing(gan),
        'shengxiao': DiZhi.getShengXiao(zhi),
      });
    }
    
    return results;
  }
  
  /// 计算合盘 (双人八字匹配)
  static Map<String, dynamic> calculateCompatibility(BaziData bazi1, BaziData bazi2) {
    int harmonyScore = 0;
    final reasons = <String>[];
    
    // 1. 五行相生评分
    final wx1 = bazi1.wuxingCount;
    final wx2 = bazi2.wuxingCount;
    
    // 木生火, 火生土等
    final wxPairs = [
      ['木', '火'], ['火', '土'], ['土', '金'], ['金', '水'], ['水', '木']
    ];
    
    for (final pair in wxPairs) {
      if ((wx1[pair[0]] ?? 0) > 0 && (wx2[pair[1]] ?? 0) > 0) {
        harmonyScore += 10;
        reasons.add('${pair[0]}生${pair[1]}');
      }
    }
    
    // 2. 日主关系
    final dayRelation = ShiShen.getShiShen(bazi1.dayGan, bazi2.dayGan);
    if (dayRelation == '正官' || dayRelation == '正印' || dayRelation == '正财') {
      harmonyScore += 20;
      reasons.add('日主关系为$dayRelation');
    }
    
    // 3. 生肖匹配
    final sx1 = DiZhi.getShengXiao(bazi1.yearZhi);
    final sx2 = DiZhi.getShengXiao(bazi2.yearZhi);
    final sxPairs = [
      ['鼠', '牛'], ['虎', '猪'], ['兔', '狗'], ['龙', '鸡'],
      ['蛇', '猴'], ['马', '羊']
    ];
    for (final pair in sxPairs) {
      if ((sx1 == pair[0] && sx2 == pair[1]) || (sx1 == pair[1] && sx2 == pair[0])) {
        harmonyScore += 15;
        reasons.add('生肖${pair[0]}与${pair[1]}相合');
      }
    }
    
    // 4. 大运同步率
    // 简化: 检查大运起运年龄差
    harmonyScore += 10; // 基础分
    
    // 归一化到0-100
    final score = (harmonyScore.clamp(0, 100));
    
    return {
      'score': score,
      'level': score >= 80 ? '极佳' : (score >= 60 ? '优良' : (score >= 40 ? '一般' : '需注意')),
      'reasons': reasons,
      'bazi1': bazi1.toJson(),
      'bazi2': bazi2.toJson(),
    };
  }
}
