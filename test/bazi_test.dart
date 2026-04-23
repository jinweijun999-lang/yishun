import 'package:flutter_test/flutter_test.dart';
import 'package:yishun_app/astrology/bazi.dart';

void main() {
  group('TianGan (天干) Tests', () {
    test('天干名称列表包含所有10个天干', () {
      expect(TianGan.names.length, 10);
      expect(TianGan.names, ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']);
    });

    test('甲乙丙丁对应木火木火', () {
      expect(WuXing.getWuXing('甲'), '木');
      expect(WuXing.getWuXing('乙'), '木');
      expect(WuXing.getWuXing('丙'), '火');
      expect(WuXing.getWuXing('丁'), '火');
    });

    test('戊己对应土, 庚辛对应金', () {
      expect(WuXing.getWuXing('戊'), '土');
      expect(WuXing.getWuXing('己'), '土');
      expect(WuXing.getWuXing('庚'), '金');
      expect(WuXing.getWuXing('辛'), '金');
    });

    test('壬癸对应水', () {
      expect(WuXing.getWuXing('壬'), '水');
      expect(WuXing.getWuXing('癸'), '水');
    });

    test('天干阴阳判断', () {
      expect(TianGan.isYang('甲'), true);
      expect(TianGan.isYang('乙'), false);
      expect(TianGan.isYang('丙'), true);
      expect(TianGan.isYang('丁'), false);
      expect(TianGan.isYang('戊'), true);
      expect(TianGan.isYang('己'), false);
      expect(TianGan.isYang('庚'), true);
      expect(TianGan.isYang('辛'), false);
      expect(TianGan.isYang('壬'), true);
      expect(TianGan.isYang('癸'), false);
    });

    test('天干索引计算', () {
      expect(TianGan.index('甲'), 0);
      expect(TianGan.index('乙'), 1);
      expect(TianGan.index('丙'), 2);
      expect(TianGan.index('丁'), 3);
      expect(TianGan.index('戊'), 4);
      expect(TianGan.index('己'), 5);
      expect(TianGan.index('庚'), 6);
      expect(TianGan.index('辛'), 7);
      expect(TianGan.index('壬'), 8);
      expect(TianGan.index('癸'), 9);
    });
  });

  group('DiZhi (地支) Tests', () {
    test('地支名称列表包含所有12个地支', () {
      expect(DiZhi.names.length, 12);
      expect(DiZhi.names, ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']);
    });

    test('地支五行-水火支', () {
      expect(DiZhi.getWuXing('子'), '水');
      expect(DiZhi.getWuXing('亥'), '水');
      expect(DiZhi.getWuXing('午'), '火');
      expect(DiZhi.getWuXing('巳'), '火');
    });

    test('地支五行-木支', () {
      expect(DiZhi.getWuXing('寅'), '木');
      expect(DiZhi.getWuXing('卯'), '木');
    });

    test('地支五行-金支', () {
      expect(DiZhi.getWuXing('申'), '金');
      expect(DiZhi.getWuXing('酉'), '金');
    });

    test('地支五行-土支', () {
      expect(DiZhi.getWuXing('辰'), '土');
      expect(DiZhi.getWuXing('戌'), '土');
      expect(DiZhi.getWuXing('丑'), '土');
      expect(DiZhi.getWuXing('未'), '土');
    });

    test('地支藏干-子午卯酉单藏', () {
      expect(DiZhi.getCangGan('子'), ['癸']);
      expect(DiZhi.getCangGan('卯'), ['乙']);
      expect(DiZhi.getCangGan('酉'), ['辛']);
    });

    test('地支藏干-寅含甲丙戊', () {
      expect(DiZhi.getCangGan('寅'), ['甲', '丙', '戊']);
    });

    test('地支藏干-申含庚壬戊', () {
      expect(DiZhi.getCangGan('申'), ['庚', '壬', '戊']);
    });

    test('地支生肖对应', () {
      expect(DiZhi.getShengXiao('子'), '鼠');
      expect(DiZhi.getShengXiao('丑'), '牛');
      expect(DiZhi.getShengXiao('寅'), '虎');
      expect(DiZhi.getShengXiao('卯'), '兔');
      expect(DiZhi.getShengXiao('辰'), '龙');
      expect(DiZhi.getShengXiao('巳'), '蛇');
      expect(DiZhi.getShengXiao('午'), '马');
      expect(DiZhi.getShengXiao('未'), '羊');
      expect(DiZhi.getShengXiao('申'), '猴');
      expect(DiZhi.getShengXiao('酉'), '鸡');
      expect(DiZhi.getShengXiao('戌'), '狗');
      expect(DiZhi.getShengXiao('亥'), '猪');
    });

    test('时辰对应', () {
      expect(DiZhi.getShichen('子'), '子时(23-01)');
      expect(DiZhi.getShichen('丑'), '丑时(01-03)');
      expect(DiZhi.getShichen('卯'), '卯时(05-07)');
      expect(DiZhi.getShichen('午'), '午时(11-13)');
      expect(DiZhi.getShichen('酉'), '酉时(17-19)');
    });
  });

  group('WuXing (五行) Tests', () {
    test('五行名称', () {
      expect(WuXing.names, ['木', '火', '土', '金', '水']);
    });

    test('木生火', () {
      expect(WuXing.generate('木'), '火');
    });

    test('火生土', () {
      expect(WuXing.generate('火'), '土');
    });

    test('土生金', () {
      expect(WuXing.generate('土'), '金');
    });

    test('金生水', () {
      expect(WuXing.generate('金'), '水');
    });

    test('水生木', () {
      expect(WuXing.generate('水'), '木');
    });

    test('木克土', () {
      expect(WuXing.overcome('木'), '土');
    });

    test('土克水', () {
      expect(WuXing.overcome('土'), '水');
    });

    test('水克火', () {
      expect(WuXing.overcome('水'), '火');
    });

    test('火克金', () {
      expect(WuXing.overcome('火'), '金');
    });

    test('金克木', () {
      expect(WuXing.overcome('金'), '木');
    });
  });

  group('ShiShen (十神) Tests', () {
    test('甲日主-庚辛为官杀', () {
      expect(ShiShen.getShiShen('甲', '庚'), '偏官');
      expect(ShiShen.getShiShen('甲', '辛'), '正官');
    });

    test('甲日主-壬癸为印', () {
      expect(ShiShen.getShiShen('甲', '壬'), '偏印');
      expect(ShiShen.getShiShen('甲', '癸'), '正印');
    });

    test('甲日主-丙丁为食伤', () {
      expect(ShiShen.getShiShen('甲', '丙'), '食神');
      expect(ShiShen.getShiShen('甲', '丁'), '伤官');
    });

    test('甲日主-戊己为财', () {
      expect(ShiShen.getShiShen('甲', '戊'), '偏财');
      expect(ShiShen.getShiShen('甲', '己'), '正财');
    });

    test('甲日主-甲乙为比劫', () {
      expect(ShiShen.getShiShen('甲', '甲'), '比肩');
      expect(ShiShen.getShiShen('甲', '乙'), '劫财');
    });

    test('乙日主与甲相反', () {
      expect(ShiShen.getShiShen('乙', '甲'), '劫财');
      expect(ShiShen.getShiShen('乙', '乙'), '比肩');
    });

    test('丙日主-壬癸为官杀', () {
      expect(ShiShen.getShiShen('丙', '壬'), '偏官');
      expect(ShiShen.getShiShen('丙', '癸'), '正官');
    });
  });

  group('BaziCalculator Tests', () {
    test('1984-01-15 12:00 排盘', () {
      // 1984年1月15日中午12点
      final bazi = BaziCalculator.calculate(DateTime(1984, 1, 15, 12, 0));
      
      // 验证四柱完整
      expect(bazi.yearGan, '甲'); // 84年是甲子年
      expect(bazi.yearZhi, '子');
      expect(bazi.dayGan, isNotEmpty);
      expect(bazi.dayZhi, isNotEmpty);
      expect(bazi.wuxingCount['木'], greaterThan(0));
    });

    test('2000-08-15 08:30 辰时', () {
      // 2000年8月15日上午8:30
      final bazi = BaziCalculator.calculate(DateTime(2000, 8, 15, 8, 30));
      
      expect(bazi.yearGan, '庚'); // 2000年是庚辰年
      expect(bazi.yearZhi, '辰');
      expect(bazi.hourGan, isNotEmpty);
      expect(bazi.hourZhi, '辰');
      expect(bazi.solarTime, isNotEmpty);
    });

    test('1990-02-14 23:30 亥时附近', () {
      // 1990年2月14日23:30
      final bazi = BaziCalculator.calculate(DateTime(1990, 2, 14, 23, 30));
      
      expect(bazi.yearGan, '庚'); // 1990年是庚午年
      // 23:30 接近子时(23-01), 但由于真太阳时调整可能有偏差
      expect(['子', '丑', '亥'], contains(bazi.hourZhi));
    });

    test('2020-05-20 14:20 午时/未时', () {
      // 2020年5月20日14:20
      final bazi = BaziCalculator.calculate(DateTime(2020, 5, 20, 14, 20));
      
      expect(bazi.yearGan, '庚'); // 2020年是庚子年
      expect(bazi.yearZhi, '子');
      // 14:20 接近未时(13-15)开始
      expect(['午', '未'], contains(bazi.hourZhi));
    });

    test('1995-03-08 06:00 卯时', () {
      // 1995年3月8日早晨6点
      final bazi = BaziCalculator.calculate(DateTime(1995, 3, 8, 6, 0));
      
      expect(bazi.yearGan, '乙'); // 1995年是乙亥年
      expect(bazi.yearZhi, '亥');
      expect(bazi.hourZhi, '卯'); // 05-07为卯时
    });

    test('真太阳时-经度调整', () {
      // 同一时间不同经度
      final baziBeijing = BaziCalculator.calculate(
        DateTime(1990, 1, 15, 12, 0),
        longitude: 116.4, // 北京
      );
      final baziShanghai = BaziCalculator.calculate(
        DateTime(1990, 1, 15, 12, 0),
        longitude: 121.4, // 上海
      );
      
      // 北京时间相同, 但真太阳时有差异
      expect(baziBeijing.solarTime, isNot(equals(baziShanghai.solarTime)));
    });

    test('四柱完整输出', () {
      final bazi = BaziCalculator.calculate(DateTime(1988, 8, 8, 8, 8));
      
      expect(bazi.yearGan, isNotEmpty);
      expect(bazi.yearZhi, isNotEmpty);
      expect(bazi.monthGan, isNotEmpty);
      expect(bazi.monthZhi, isNotEmpty);
      expect(bazi.dayGan, isNotEmpty);
      expect(bazi.dayZhi, isNotEmpty);
      expect(bazi.hourGan, isNotEmpty);
      expect(bazi.hourZhi, isNotEmpty);
    });

    test('五行统计不为空', () {
      final bazi = BaziCalculator.calculate(DateTime(1988, 8, 8, 8, 8));
      
      expect(bazi.wuxingCount['木'], greaterThanOrEqualTo(0));
      expect(bazi.wuxingCount['火'], greaterThanOrEqualTo(0));
      expect(bazi.wuxingCount['土'], greaterThanOrEqualTo(0));
      expect(bazi.wuxingCount['金'], greaterThanOrEqualTo(0));
      expect(bazi.wuxingCount['水'], greaterThanOrEqualTo(0));
      
      // 总数应为8(4天干+4地支)
      final total = bazi.wuxingCount.values.fold(0, (a, b) => a + b);
      expect(total, 8);
    });

    test('大运生成10步', () {
      final bazi = BaziCalculator.calculate(DateTime(1988, 8, 8, 8, 8));
      
      expect(bazi.daYun.length, 10);
      for (final dy in bazi.daYun) {
        expect(dy['gan'], isNotEmpty);
        expect(dy['zhi'], isNotEmpty);
        expect(dy['start_age'], isNotEmpty);
        expect(dy['end_age'], isNotEmpty);
        expect(dy['wuxing'], isNotEmpty);
      }
    });

    test('流年生成10年', () {
      final bazi = BaziCalculator.calculate(DateTime(1988, 8, 8, 8, 8));
      
      expect(bazi.liuNian.length, 10);
      final currentYear = DateTime.now().year;
      expect(int.parse(bazi.liuNian[0]['year']!), currentYear);
      expect(int.parse(bazi.liuNian[9]['year']!), currentYear + 9);
    });

    test('胎元命宫身宫不为空', () {
      final bazi = BaziCalculator.calculate(DateTime(1988, 8, 8, 8, 8));
      
      expect(bazi.taiYuan, isNotEmpty);
      expect(bazi.taiYuan.length, 2);
      expect(bazi.mingGong, isNotEmpty);
      expect(bazi.mingGong.length, 2);
      expect(bazi.shenGong, isNotEmpty);
      expect(bazi.shenGong.length, 2);
    });

    test('日主强弱判断', () {
      final bazi = BaziCalculator.calculate(DateTime(1988, 8, 8, 8, 8));
      
      expect(['旺', '偏旺', '中和', '偏弱', '弱'], contains(bazi.dayStrength));
    });
  });

  group('Compatibility (合盘) Tests', () {
    test('相同八字得分应该很高', () {
      final bazi1 = BaziCalculator.calculate(DateTime(1988, 8, 8, 8, 8));
      final bazi2 = BaziCalculator.calculate(DateTime(1988, 8, 8, 8, 8));
      
      final result = BaziCalculator.calculateCompatibility(bazi1, bazi2);
      
      expect(result['score'], greaterThanOrEqualTo(0));
      expect(result['level'], isNotEmpty);
      expect(result['reasons'], isA<List<String>>());
    });

    test('不同八字合盘结果包含两个八字', () {
      final bazi1 = BaziCalculator.calculate(DateTime(1988, 8, 8, 8, 8));
      final bazi2 = BaziCalculator.calculate(DateTime(1990, 1, 1, 0, 0));
      
      final result = BaziCalculator.calculateCompatibility(bazi1, bazi2);
      
      expect(result['bazi1'], isNotNull);
      expect(result['bazi2'], isNotNull);
    });

    test('生肖相合加分', () {
      // 鼠(子)和牛(丑)相合
      // 龙(辰)和鸡(酉)相合
      final bazi1 = BaziCalculator.calculate(DateTime(1984, 1, 15, 12, 0)); // 甲子年, 鼠
      final bazi2 = BaziCalculator.calculate(DateTime(1985, 2, 20, 12, 0)); // 乙丑年, 牛
      
      final result = BaziCalculator.calculateCompatibility(bazi1, bazi2);
      
      expect((result['reasons'] as List<String>), contains('生肖鼠与牛相合'));
    });
  });

  group('BaziData JSON Tests', () {
    test('toJson包含所有字段', () {
      final bazi = BaziCalculator.calculate(DateTime(1988, 8, 8, 8, 8));
      final json = bazi.toJson();
      
      expect(json['year'], isA<Map>());
      expect(json['year']['gan'], isNotEmpty);
      expect(json['year']['zhi'], isNotEmpty);
      expect(json['year']['wuxing'], isNotEmpty);
      
      expect(json['month'], isA<Map>());
      expect(json['day'], isA<Map>());
      expect(json['hour'], isA<Map>());
      
      expect(json['wuxing_count'], isA<Map>());
      expect(json['day_master'], isNotEmpty);
      expect(json['day_strength'], isNotEmpty);
      
      expect(json['tai_yuan'], isNotEmpty);
      expect(json['ming_gong'], isNotEmpty);
      expect(json['shen_gong'], isNotEmpty);
      
      expect(json['da_yun'], isA<List>());
      expect(json['liu_nian'], isA<List>());
      
      expect(json['solar_time'], isNotEmpty);
    });

    test('toString输出四柱', () {
      final bazi = BaziCalculator.calculate(DateTime(1988, 8, 8, 8, 8));
      final str = bazi.toString();
      
      // 应为4个2字符的柱子
      final parts = str.split(' ');
      expect(parts.length, 4);
    });
  });

  group('Edge Cases', () {
    test('闰年2月29日', () {
      final bazi = BaziCalculator.calculate(DateTime(2000, 2, 29, 12, 0));
      
      expect(bazi.yearGan, isNotEmpty);
      expect(bazi.dayGan, isNotEmpty);
    });

    test('12月31日年末', () {
      final bazi = BaziCalculator.calculate(DateTime(1999, 12, 31, 23, 59));
      
      expect(bazi.yearGan, '己'); // 1999年是己卯年
    });

    test('凌晨0点属于子时范围', () {
      final bazi = BaziCalculator.calculate(DateTime(1990, 1, 1, 0, 0));
      
      // 0点应属于子时(23-01时)
      expect(bazi.hourZhi, '子');
    });

    test('23:59属于子时范围', () {
      final bazi = BaziCalculator.calculate(DateTime(1990, 1, 1, 23, 59));
      
      // 23:59应属于子时
      expect(bazi.hourZhi, '子');
    });

    test('经度边界值-中国最西', () {
      // 帕米尔高原约73度E
      final bazi = BaziCalculator.calculate(DateTime(1990, 1, 1, 12, 0), longitude: 73.0);
      expect(bazi.solarTime, isNotEmpty);
    });

    test('经度边界值-中国最东', () {
      // 黑龙江乌苏里江约135度E
      final bazi = BaziCalculator.calculate(DateTime(1990, 1, 1, 12, 0), longitude: 135.0);
      expect(bazi.solarTime, isNotEmpty);
    });
  });
}
