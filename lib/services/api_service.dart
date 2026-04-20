import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // TODO: 部署后替换为实际API地址
  static const String baseUrl = 'https://api.11263.com';
  
  final http.Client _client = http.Client();
  
  /// 获取八字排盘结果
  Future<Map<String, dynamic>> getBazi({
    required int year,
    required int month,
    required int day,
    required int hour,
    double longitude = 116.4,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/api/v1/bazi'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'year': year,
          'month': month,
          'day': day,
          'hour': hour,
          'minute': 0,
          'longitude': longitude,
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('API错误: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }
  
  /// 获取运势分析
  Future<Map<String, dynamic>> getFortune({
    required Map<String, dynamic> bazi,
    String aspect = '综合',
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/api/v1/fortune'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'bazi': bazi,
          'aspect': aspect,
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('API错误: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }
  
  void dispose() {
    _client.close();
  }
}