import 'dart:convert';
import 'package:http/http.dart' as http;

class GeminiService {
  static const String _baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  static const String _model = 'gemini-2.0-flash';
  
  // Token usage tracking
  int _totalInputTokens = 0;
  int _totalOutputTokens = 0;
  int _totalCachedTokens = 0;
  
  int get totalInputTokens => _totalInputTokens;
  int get totalOutputTokens => _totalOutputTokens;
  int get totalCachedTokens => _totalCachedTokens;
  int get totalTokens => _totalInputTokens + _totalOutputTokens;

  /// Get Gemini API key from environment or fallback
  String get _apiKey {
    // Try environment variable first
    const apiKey = String.fromEnvironment('GEMINI_API_KEY', defaultValue: '');
    if (apiKey.isNotEmpty) return apiKey;
    
    // Fallback to a placeholder - in production this should be securely stored
    // For now, we'll use the server-side API
    return 'USE_SERVER_API';
  }

  /// Check if server-side Gemini API should be used
  bool get _useServerApi => _apiKey == 'USE_SERVER_API';
  static const String _serverUrl = 'http://34.102.18.91:8000';

  /// Generate AI analysis for Bazi chart
  Future<GeminiAnalysisResult> analyzeBazi(Map<String, dynamic> bazi, {
    String aspect = '综合',
    String? userQuestion,
  }) async {
    final prompt = _buildBaziAnalysisPrompt(bazi, aspect, userQuestion);
    
    if (_useServerApi) {
      return _analyzeViaServer(prompt, bazi);
    }
    
    return _analyzeDirect(prompt);
  }

  /// Analyze compatibility between two Bazi charts
  Future<GeminiAnalysisResult> analyzeCompatibility(
    Map<String, dynamic> bazi1,
    Map<String, dynamic> bazi2,
  ) async {
    final prompt = _buildCompatibilityPrompt(bazi1, bazi2);
    
    if (_useServerApi) {
      return _analyzeViaServer(prompt, {'bazi1': bazi1, 'bazi2': bazi2});
    }
    
    return _analyzeDirect(prompt);
  }

  /// Get daily fortune reading
  Future<GeminiAnalysisResult> getDailyFortune(Map<String, dynamic> bazi) async {
    final prompt = _buildDailyFortunePrompt(bazi);
    
    if (_useServerApi) {
      return _analyzeViaServer(prompt, bazi);
    }
    
    return _analyzeDirect(prompt);
  }

  /// Build prompt for Bazi analysis
  String _buildBaziAnalysisPrompt(
    Map<String, dynamic> bazi,
    String aspect,
    String? userQuestion,
  ) {
    final dayMaster = bazi['day_master'] ?? '';
    final dayStrength = bazi['day_strength'] ?? '';
    final wuxingCount = bazi['wuxing_count'] ?? {};
    final year = bazi['year'] ?? {};
    final month = bazi['month'] ?? {};
    final day = bazi['day'] ?? {};
    final hour = bazi['hour'] ?? {};
    
    StringBuffer sb = StringBuffer();
    sb.writeln('你是一位专业的八字命理分析师。请根据以下八字信息进行深入分析：');
    sb.writeln();
    sb.writeln('【八字排盘】');
    sb.writeln('年柱: ${year['gan']}${year['zhi']} (${year['wuxing']})');
    sb.writeln('月柱: ${month['gan']}${month['zhi']} (${month['wuxing']})');
    sb.writeln('日柱: ${day['gan']}${day['zhi']} (${day['wuxing']}) - 日主');
    sb.writeln('时柱: ${hour['gan']}${hour['zhi']} (${hour['wuxing']})');
    sb.writeln();
    sb.writeln('【五行分布】');
    wuxingCount.forEach((wx, count) {
      sb.writeln('$wx: $count个');
    });
    sb.writeln();
    sb.writeln('【日主状态】');
    sb.writeln('日主($dayMaster) $dayStrength');
    sb.writeln();
    
    if (aspect != '综合') {
      sb.writeln('【重点分析】$aspect 运势');
    }
    
    if (userQuestion != null && userQuestion.isNotEmpty) {
      sb.writeln();
      sb.writeln('【用户问题】$userQuestion');
    }
    
    sb.writeln();
    sb.writeln('请从以下几个方面给出详细分析（使用中文）：');
    sb.writeln('1. 性格特点与天赋');
    sb.writeln('2. $aspect 运势详解');
    sb.writeln('3. 事业/感情/健康建议');
    sb.writeln('4. 流年/大运分析');
    sb.writeln('5. 改善建议');
    
    return sb.toString();
  }

  /// Build prompt for compatibility analysis
  String _buildCompatibilityPrompt(
    Map<String, dynamic> bazi1,
    Map<String, dynamic> bazi2,
  ) {
    StringBuffer sb = StringBuffer();
    sb.writeln('你是一位专业的八字合盘分析师。请分析以下两位当事人的八字合盘：');
    sb.writeln();
    
    for (int i = 1; i <= 2; i++) {
      final bazi = i == 1 ? bazi1 : bazi2;
      final label = i == 1 ? '甲方' : '乙方';
      final year = bazi['year'] ?? {};
      final month = bazi['month'] ?? {};
      final day = bazi['day'] ?? {};
      final hour = bazi['hour'] ?? {};
      
      sb.writeln('【$label 八字】');
      sb.writeln('${year['gan']}${year['zhi']} ${month['gan']}${month['zhi']} ${day['gan']}${day['zhi']} ${hour['gan']}${hour['zhi']}');
      sb.writeln();
    }
    
    sb.writeln('请从以下几个方面给出详细分析（使用中文）：');
    sb.writeln('1. 双方日主关系分析');
    sb.writeln('2. 五行互补与冲突');
    sb.writeln('3. 性格契合度');
    sb.writeln('4. 事业/财运合作分析');
    sb.writeln('5. 感情兼容性');
    sb.writeln('6. 整体合盘评分(0-100)及建议');
    
    return sb.toString();
  }

  /// Build prompt for daily fortune
  String _buildDailyFortunePrompt(Map<String, dynamic> bazi) {
    final dayMaster = bazi['day_master'] ?? '';
    final dayGan = bazi['day']?['gan'] ?? '';
    final dayZhi = bazi['day']?['zhi'] ?? '';
    
    final now = DateTime.now();
    final dateStr = '${now.year}年${now.month}月${now.day}日';
    return '''
你是一位专业的八字命理分析师。请为以下八字提供今日运势指导：

【八字】${bazi['year']?['gan']}${bazi['year']?['zhi']} ${bazi['month']?['gan']}${bazi['month']?['zhi']} $dayGan$dayZhi ${bazi['hour']?['gan']}${bazi['hour']?['zhi']}
【日主】$dayMaster

请分析今日（$dateStr）的运势：
1. 今日整体运势（1-5星）
2. 幸运方位与颜色
3. 今日提示与建议
4. 注意事项
''';
  }

  /// Analyze via server (when no local API key)
  Future<GeminiAnalysisResult> _analyzeViaServer(String prompt, Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$_serverUrl/api/v1/gemini/analyze'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'prompt': prompt,
          'data': data,
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        
        // Update token stats from response if available
        if (result['usage'] != null) {
          final usage = result['usage'] as Map<String, dynamic>;
          _totalInputTokens += (usage['input_tokens'] as int? ?? 0);
          _totalOutputTokens += (usage['output_tokens'] as int? ?? 0);
          _totalCachedTokens += (usage['cached_tokens'] as int? ?? 0);
        }
        
        return GeminiAnalysisResult(
          success: true,
          content: result['content'] ?? result['text'] ?? '',
          usage: result['usage'],
        );
      } else {
        return GeminiAnalysisResult(
          success: false,
          error: 'Server error: ${response.statusCode}',
        );
      }
    } catch (e) {
      return GeminiAnalysisResult(
        success: false,
        error: 'Network error: $e',
      );
    }
  }

  /// Analyze directly via Gemini API
  Future<GeminiAnalysisResult> _analyzeDirect(String prompt) async {
    try {
      final uri = Uri.parse('$_baseUrl/$_model:generateContent').replace(
        queryParameters: {'key': _apiKey},
      );
      
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'contents': [{
            'parts': [{'text': prompt}]
          }],
          'generationConfig': {
            'temperature': 0.7,
            'maxOutputTokens': 2048,
          },
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        final candidates = result['candidates'] as List?;
        
        if (candidates != null && candidates.isNotEmpty) {
          final content = candidates.first['content'];
          final parts = content['parts'] as List?;
          final text = parts?.isNotEmpty == true ? parts!.first['text'] : '';
          
          // Update token stats
          final usage = result['usageMetadata'] as Map<String, dynamic>? ?? {};
          _totalInputTokens += (usage['promptTokenCount'] as int? ?? 0);
          _totalOutputTokens += (usage['candidatesTokenCount'] as int? ?? 0);
          _totalCachedTokens += (usage['cachedContentTokenCount'] as int? ?? 0);
          
          return GeminiAnalysisResult(
            success: true,
            content: text,
            usage: {
              'input_tokens': usage['promptTokenCount'] ?? 0,
              'output_tokens': usage['candidatesTokenCount'] ?? 0,
              'cached_tokens': usage['cachedContentTokenCount'] ?? 0,
            },
          );
        }
      }
      
      return GeminiAnalysisResult(
        success: false,
        error: 'Gemini API error: ${response.statusCode}',
      );
    } catch (e) {
      return GeminiAnalysisResult(
        success: false,
        error: 'Error: $e',
      );
    }
  }

  /// Clear token statistics
  void resetUsageStats() {
    _totalInputTokens = 0;
    _totalOutputTokens = 0;
    _totalCachedTokens = 0;
  }

  /// Get formatted usage report
  String getUsageReport() {
    return '''
Gemini API Usage:
- Input Tokens: $_totalInputTokens
- Output Tokens: $_totalOutputTokens  
- Cached Tokens: $_totalCachedTokens
- Total Tokens: $totalTokens
''';
  }
}

class GeminiAnalysisResult {
  final bool success;
  final String content;
  final String? error;
  final Map<String, dynamic>? usage;

  GeminiAnalysisResult({
    required this.success,
    this.content = '',
    this.error,
    this.usage,
  });
}
