import 'package:flutter/material.dart';

class YiShunTheme {
  static const Color primaryColor = Color(0xFFFF6B35);
  static const Color secondaryColor = Color(0xFF2D3142);
  static const Color accentColor = Color(0xFFFFD166);
  static const Color surfaceLight = Color(0xFFFFF8F0);
  static const Color surfaceDark = Color(0xFF0F1C2E); // 墨蓝渐变深色背景
  
  // Five Elements Colors (五行配色)
  static const Color woodColor = Color(0xFF2D8B57);    // 木 - 翠青
  static const Color fireColor = Color(0xFFD84A32);    // 火 - 朱砂红
  static const Color earthColor = Color(0xFFC9A227);    // 土 - 琥珀黄
  static const Color metalColor = Color(0xFFE8E8E8);     // 金 - 霜白
  static const Color waterColor = Color(0xFF1565C0);     // 水 - 墨蓝

  // Brand colors
  static const Color brandInkBlue = Color(0xFF1A3A5C);   // 玄青 - 主色
  static const Color brandCinnabar = Color(0xFFD84A32); // 朱砂红 - 点缀
  static const Color brandAmber = Color(0xFFC9A227);    // 琥珀黄 - 辅助

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: brandInkBlue,
        brightness: Brightness.light,
        primary: brandInkBlue,
        secondary: brandCinnabar,
        tertiary: brandAmber,
        surface: surfaceLight,
      ),
      scaffoldBackgroundColor: surfaceLight,
      appBarTheme: const AppBarTheme(
        backgroundColor: brandInkBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        color: Colors.white,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: primaryColor.withAlpha(30),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(color: primaryColor, fontWeight: FontWeight.w600, fontSize: 12);
          }
          return TextStyle(color: Colors.grey.shade600, fontSize: 12);
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: primaryColor);
          }
          return IconThemeData(color: Colors.grey.shade600);
        }),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: brandInkBlue,
        brightness: Brightness.dark,
        primary: brandInkBlue,
        secondary: brandCinnabar,
        tertiary: brandAmber,
        surface: surfaceDark,
      ),
      scaffoldBackgroundColor: surfaceDark,
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceDark,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        color: const Color(0xFF1A3A5C),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }

  static Color getWuxingColor(String wuxing) {
    switch (wuxing) {
      case '木': return woodColor;
      case '火': return fireColor;
      case '土': return earthColor;
      case '金': return metalColor;
      case '水': return waterColor;
      default: return Colors.grey;
    }
  }

  static IconData getWuxingIcon(String wuxing) {
    switch (wuxing) {
      case '木': return Icons.park;
      case '火': return Icons.local_fire_department;
      case '土': return Icons.landscape;
      case '金': return Icons.star;
      case '水': return Icons.water_drop;
      default: return Icons.circle;
    }
  }

  // Animation durations
  static const Duration animFast = Duration(milliseconds: 200);
  static const Duration animNormal = Duration(milliseconds: 300);
  static const Duration animSlow = Duration(milliseconds: 500);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF0F1C2E), Color(0xFF1A3A5C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [brandInkBlue, Color(0xFF2D5280)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // 五行相生相克顺时针排列
  static const List<String> wuxingCycle = ['木', '火', '土', '金', '水'];
  // 木→火→土→金→水→木 (相生)
  static const Map<String, String> wuxingSheng = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
  };
  // 金→木→土→水→火→金 (相克)
  static const Map<String, String> wuxingKe = {
    '金': '木', '木': '土', '土': '水', '水': '火', '火': '金',
  };
}
