import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../astrology/bazi.dart';

class HistoryService {
  static const String _historyKey = 'divination_history';
  static const int _maxHistoryItems = 100;
  
  SharedPreferences? _prefs;

  /// Initialize shared preferences
  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  /// Save a Bazi calculation to history
  Future<void> saveBaziToHistory({
    required Map<String, dynamic> bazi,
    required String name,
    required DateTime birthDate,
    required DateTime createdAt,
    String? aiAnalysis,
  }) async {
    await init();
    
    final history = await getHistory();
    
    final entry = HistoryEntry(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      type: HistoryType.bazi,
      name: name,
      birthDate: birthDate,
      createdAt: createdAt,
      baziData: bazi,
      aiAnalysis: aiAnalysis,
    );
    
    history.insert(0, entry);
    
    // Keep only the most recent items
    if (history.length > _maxHistoryItems) {
      history.removeRange(_maxHistoryItems, history.length);
    }
    
    await _saveHistory(history);
  }

  /// Save a compatibility analysis to history
  Future<void> saveCompatibilityToHistory({
    required Map<String, dynamic> bazi1,
    required Map<String, dynamic> bazi2,
    required String name1,
    required String name2,
    required DateTime birthDate1,
    required DateTime birthDate2,
    required Map<String, dynamic> compatibilityResult,
    required DateTime createdAt,
  }) async {
    await init();
    
    final history = await getHistory();
    
    final entry = HistoryEntry(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      type: HistoryType.compatibility,
      name: name1,
      name2: name2,
      birthDate: birthDate1,
      birthDate2: birthDate2,
      baziData: bazi1,
      baziData2: bazi2,
      compatibilityResult: compatibilityResult,
      createdAt: createdAt,
    );
    
    history.insert(0, entry);
    
    if (history.length > _maxHistoryItems) {
      history.removeRange(_maxHistoryItems, history.length);
    }
    
    await _saveHistory(history);
  }

  /// Get all history entries
  Future<List<HistoryEntry>> getHistory() async {
    await init();
    
    final jsonString = _prefs!.getString(_historyKey);
    if (jsonString == null || jsonString.isEmpty) {
      return [];
    }
    
    try {
      final List<dynamic> jsonList = jsonDecode(jsonString);
      return jsonList.map((json) => HistoryEntry.fromJson(json)).toList();
    } catch (e) {
      // If parsing fails, return empty list
      return [];
    }
  }

  /// Get history by type
  Future<List<HistoryEntry>> getHistoryByType(HistoryType type) async {
    final history = await getHistory();
    return history.where((entry) => entry.type == type).toList();
  }

  /// Delete a history entry
  Future<void> deleteHistoryEntry(String id) async {
    await init();
    
    final history = await getHistory();
    history.removeWhere((entry) => entry.id == id);
    await _saveHistory(history);
  }

  /// Clear all history
  Future<void> clearAllHistory() async {
    await init();
    await _prefs!.remove(_historyKey);
  }

  /// Clear history by type
  Future<void> clearHistoryByType(HistoryType type) async {
    final history = await getHistory();
    history.removeWhere((entry) => entry.type == type);
    await _saveHistory(history);
  }

  /// Search history by name
  Future<List<HistoryEntry>> searchHistory(String query) async {
    final history = await getHistory();
    final lowerQuery = query.toLowerCase();
    
    return history.where((entry) {
      return entry.name.toLowerCase().contains(lowerQuery) ||
             (entry.name2?.toLowerCase().contains(lowerQuery) ?? false);
    }).toList();
  }

  Future<void> _saveHistory(List<HistoryEntry> history) async {
    final jsonList = history.map((e) => e.toJson()).toList();
    await _prefs!.setString(_historyKey, jsonEncode(jsonList));
  }
}

enum HistoryType {
  bazi,
  compatibility,
}

class HistoryEntry {
  final String id;
  final HistoryType type;
  final String name;
  final String? name2;
  final DateTime birthDate;
  final DateTime? birthDate2;
  final Map<String, dynamic>? baziData;
  final Map<String, dynamic>? baziData2;
  final Map<String, dynamic>? compatibilityResult;
  final String? aiAnalysis;
  final DateTime createdAt;

  HistoryEntry({
    required this.id,
    required this.type,
    required this.name,
    this.name2,
    required this.birthDate,
    this.birthDate2,
    this.baziData,
    this.baziData2,
    this.compatibilityResult,
    this.aiAnalysis,
    required this.createdAt,
  });

  factory HistoryEntry.fromJson(Map<String, dynamic> json) {
    return HistoryEntry(
      id: json['id'] ?? '',
      type: HistoryType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => HistoryType.bazi,
      ),
      name: json['name'] ?? '',
      name2: json['name2'],
      birthDate: DateTime.parse(json['birthDate']),
      birthDate2: json['birthDate2'] != null ? DateTime.parse(json['birthDate2']) : null,
      baziData: json['baziData'],
      baziData2: json['baziData2'],
      compatibilityResult: json['compatibilityResult'],
      aiAnalysis: json['aiAnalysis'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'name': name,
      'name2': name2,
      'birthDate': birthDate.toIso8601String(),
      'birthDate2': birthDate2?.toIso8601String(),
      'baziData': baziData,
      'baziData2': baziData2,
      'compatibilityResult': compatibilityResult,
      'aiAnalysis': aiAnalysis,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Get formatted birth date string
  String get birthDateStr {
    return '${birthDate.year}-${birthDate.month.toString().padLeft(2, '0')}-${birthDate.day.toString().padLeft(2, '0')}';
  }

  /// Get formatted birth date string for second person
  String? get birthDate2Str {
    if (birthDate2 == null) return null;
    return '${birthDate2!.year}-${birthDate2!.month.toString().padLeft(2, '0')}-${birthDate2!.day.toString().padLeft(2, '0')}';
  }

  /// Get short summary for display
  String get summary {
    if (type == HistoryType.bazi) {
      final bazi = baziData;
      if (bazi == null) return name;
      final year = bazi['year'];
      final month = bazi['month'];
      final day = bazi['day'];
      return '$name: ${year?['gan']}${year?['zhi']} ${month?['gan']}${month?['zhi']} ${day?['gan']}${day?['zhi']}';
    } else {
      return '$name & $name2 合盘分析';
    }
  }

  /// Get BaziData object (if applicable)
  BaziData? get baziDataObject {
    if (baziData == null) return null;
    
    try {
      final year = baziData!['year'];
      final month = baziData!['month'];
      final day = baziData!['day'];
      final hour = baziData!['hour'];
      
      return BaziData(
        yearGan: year['gan'] ?? '',
        yearZhi: year['zhi'] ?? '',
        monthGan: month['gan'] ?? '',
        monthZhi: month['zhi'] ?? '',
        dayGan: day['gan'] ?? '',
        dayZhi: day['zhi'] ?? '',
        hourGan: hour['gan'] ?? '',
        hourZhi: hour['zhi'] ?? '',
        wuxingCount: Map<String, int>.from(baziData!['wuxing_count'] ?? {}),
        solarTime: baziData!['solar_time'] ?? '',
        dayStrength: baziData!['day_strength'] ?? '',
        taiYuan: baziData!['tai_yuan'] ?? '',
        mingGong: baziData!['ming_gong'] ?? '',
        shenGong: baziData!['shen_gong'] ?? '',
        daYun: List<Map<String, String>>.from(baziData!['da_yun'] ?? []),
        liuNian: List<Map<String, String>>.from(baziData!['liu_nian'] ?? []),
      );
    } catch (e) {
      return null;
    }
  }
}
