import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:yishun_app/astrology/bazi.dart';
import 'auth_service.dart';

class ApiService {
  static const String _baseUrl = 'http://34.102.18.91:8000';
  
  final AuthService _authService;
  final http.Client _client = http.Client();

  ApiService(this._authService);

  // ============ Bazi (Four Pillars) APIs ============

  /// Get Bazi chart calculation
  Future<Map<String, dynamic>> getBazi({
    required int year,
    required int month,
    required int day,
    required int hour,
    int minute = 0,
    double longitude = 116.4,
    String? name,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/v1/bazi'),
        headers: _authService.authHeaders,
        body: jsonEncode({
          'year': year,
          'month': month,
          'day': day,
          'hour': hour,
          'minute': minute,
          'longitude': longitude,
          if (name != null) 'name': name,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized. Please login again.');
      } else {
        throw Exception('API error: ${response.statusCode}');
      }
    } catch (e) {
      // Return local calculation as fallback
      debugPrint('API error, using local calculation: $e');
      return _calculateLocalBazi(year: year, month: month, day: day, hour: hour, longitude: longitude);
    }
  }

  /// Get fortune analysis based on Bazi
  Future<Map<String, dynamic>> getFortune({
    required Map<String, dynamic> bazi,
    String aspect = '综合',
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/v1/fortune'),
        headers: _authService.authHeaders,
        body: jsonEncode({
          'bazi': bazi,
          'aspect': aspect,
        }),
      ).timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('API error: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Fortune API error: $e');
      return _generateLocalFortune(bazi);
    }
  }

  /// Get daily fortune
  Future<Map<String, dynamic>> getDailyFortune() async {
    try {
      final response = await _client.get(
        Uri.parse('$_baseUrl/api/v1/daily-fortune'),
        headers: _authService.authHeaders,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Daily fortune API error: $e');
    }
    return _generateLocalDailyFortune();
  }

  /// Get compatibility analysis
  Future<Map<String, dynamic>> getCompatibility({
    required Map<String, dynamic> bazi1,
    required Map<String, dynamic> bazi2,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/v1/compatibility'),
        headers: _authService.authHeaders,
        body: jsonEncode({
          'bazi_1': bazi1,
          'bazi_2': bazi2,
        }),
      ).timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Compatibility API error: $e');
    }
    return {'score': 75, 'message': 'Basic compatibility analysis'};
  }

  // ============ Premium APIs (require subscription) ============

  Future<Map<String, dynamic>> getPremiumReport({
    required Map<String, dynamic> bazi,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/v1/premium/report'),
        headers: _authService.authHeaders,
        body: jsonEncode({'bazi': bazi}),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 403) {
        throw Exception('Premium subscription required');
      }
    } catch (e) {
      debugPrint('Premium report API error: $e');
    }
    throw Exception('Premium feature unavailable');
  }

  // ============ User APIs ============

  Future<Map<String, dynamic>> getUserProfile() async {
    try {
      final response = await _client.get(
        Uri.parse('$_baseUrl/api/v1/user/profile'),
        headers: _authService.authHeaders,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Profile API error: $e');
    }
    return {};
  }

  Future<bool> updateUserProfile(Map<String, dynamic> data) async {
    try {
      final response = await _client.put(
        Uri.parse('$_baseUrl/api/v1/user/profile'),
        headers: _authService.authHeaders,
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Update profile API error: $e');
      return false;
    }
  }

  // ============ Local Fallback Calculations ============

  Map<String, dynamic> _calculateLocalBazi({
    required int year,
    required int month,
    required int day,
    required int hour,
    double longitude = 116.4,
  }) {
    try {
      final bazi = BaziCalculator.calculate(
        DateTime(year, month, day, hour),
        longitude: longitude,
      );
      
      return {
        'year': {
          'gan': bazi.yearGan,
          'zhi': bazi.yearZhi,
          'wuxing': WuXing.getWuXing(bazi.yearGan),
        },
        'month': {
          'gan': bazi.monthGan,
          'zhi': bazi.monthZhi,
          'wuxing': WuXing.getWuXing(bazi.monthGan),
        },
        'day': {
          'gan': bazi.dayGan,
          'zhi': bazi.dayZhi,
          'wuxing': WuXing.getWuXing(bazi.dayGan),
          'shishen': ShiShen.getShiShen(bazi.dayGan, bazi.dayGan),
        },
        'hour': {
          'gan': bazi.hourGan,
          'zhi': bazi.hourZhi,
          'wuxing': WuXing.getWuXing(bazi.hourGan),
        },
        'wuxing_count': bazi.wuxingCount,
        'day_master': bazi.dayGan,
        'day_strength': bazi.dayStrength,
        'tai_yuan': bazi.taiYuan,
        'ming_gong': bazi.mingGong,
        'shen_gong': bazi.shenGong,
        'da_yun': bazi.daYun,
        'liu_nian': bazi.liuNian,
        'solar_time': bazi.solarTime,
        'local': true,
      };
    } catch (e) {
      debugPrint('BaziCalculator error, using legacy fallback: $e');
      return _calculateLocalBaziLegacy(
        year: year, month: month, day: day, hour: hour,
      );
    }
  }

  /// 旧的简化算法 (保留学名以防万一)
  Map<String, dynamic> _calculateLocalBaziLegacy({
    required int year,
    required int month,
    required int day,
    required int hour,
  }) {
    final tiangan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    final dizhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    final wuxing = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火',
      '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
    };
    final shishen = {
      '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官',
      '戊': '偏印', '己': '正印', '庚': '偏财', '辛': '正财',
      '壬': '偏官', '癸': '正官'
    };

    // Simplified calculation
    int yearGan = (year - 4) % 10;
    int yearZhi = (year - 4) % 12;
    int monthZhi = (month - 1) % 12;
    int monthGan = ((year - 4) % 5 * 2 + month + 2) % 10;
    int dayGan = ((year * 5 + year ~/ 4 + month * 3 + (month + 1) * 3 + day) % 10 + 10) % 10;
    int dayZhi = ((year * 5 + year ~/ 4 + month * 3 + (month + 1) * 3 + day) % 12 + 12) % 12;
    int hourZhi = ((hour + 1) ~/ 2) % 12;
    int hourGan = (dayGan * 2 + hourZhi) % 10;

    String yearGanStr = tiangan[yearGan < 0 ? yearGan + 10 : yearGan % 10];
    String monthGanStr = tiangan[monthGan < 0 ? monthGan + 10 : monthGan % 10];
    String dayGanStr = tiangan[dayGan < 0 ? dayGan + 10 : dayGan % 10];
    String hourGanStr = tiangan[hourGan < 0 ? hourGan + 10 : hourGan % 10];

    // Count wuxing
    Map<String, int> wuxingCount = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0};
    for (final g in [yearGanStr, monthGanStr, dayGanStr, hourGanStr]) {
      final element = wuxing[g] ?? '土';
      wuxingCount[element] = (wuxingCount[element] ?? 0) + 1;
    }

    return {
      'year': {
        'gan': yearGanStr,
        'zhi': dizhi[(yearZhi + 12) % 12],
        'wuxing': wuxing[yearGanStr],
        'shishen': shishen[dayGanStr],
      },
      'month': {
        'gan': monthGanStr,
        'zhi': dizhi[monthZhi],
        'wuxing': wuxing[monthGanStr],
        'shishen': shishen[dayGanStr],
      },
      'day': {
        'gan': dayGanStr,
        'zhi': dizhi[dayZhi],
        'wuxing': wuxing[dayGanStr],
        'shishen': shishen[dayGanStr],
      },
      'hour': {
        'gan': hourGanStr,
        'zhi': dizhi[hourZhi],
        'wuxing': wuxing[hourGanStr],
        'shishen': shishen[dayGanStr],
      },
      'solar_time': '$hour:00',
      'wuxing_count': wuxingCount,
      'day_master': dayGanStr,
      'local': true,
    };
  }

  Map<String, dynamic> _generateLocalFortune(Map<String, dynamic> bazi) {
    return {
      'fortune': '综合运势平稳',
      'career': '事业上有发展机会',
      'love': '感情运势不错',
      'health': '注意身体健康',
      'wealth': '财运有起色',
      'tips': ['多关注人际关系', '保持积极心态', '注意休息'],
    };
  }

  Map<String, dynamic> _generateLocalDailyFortune() {
    final colors = ['红色', '黄色', '绿色', '白色', '黑色'];
    final directions = ['东', '南', '西', '北', '东南'];
    return {
      'date': DateTime.now().toIso8601String().split('T')[0],
      'lucky_color': colors[DateTime.now().day % colors.length],
      'lucky_number': (DateTime.now().day * 7 % 9) + 1,
      'lucky_direction': directions[DateTime.now().weekday % directions.length],
      'god_of_day': '青龙',
      'summary': '今日运势较好，适合做重要决定',
    };
  }

  void dispose() {
    _client.close();
  }
}
