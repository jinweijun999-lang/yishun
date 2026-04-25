import 'package:flutter/material.dart';

/// YiShun Theme - 神秘东方色彩，玄学风格
/// Mysterious Eastern aesthetics, fortune-telling style
class YiShunTheme {
  // === Color Palette ===
  // Primary backgrounds
  static const Color backgroundDark = Color(0xFF0D0D1A);     // 深紫黑 - 主背景
  static const Color backgroundMid = Color(0xFF1A1A2E);      // 深紫 - 次背景
  static const Color backgroundLight = Color(0xFF252542);     // 浅紫 - 卡片背景

  // Brand colors
  static const Color goldPrimary = Color(0xFFC9A227);         // 古金色 - 主色调
  static const Color goldAccent = Color(0xFFFFD700);          // 亮金 - 强调色
  static const Color purpleMystic = Color(0xFF6B5B95);          // 神秘紫 - 辅助色
  static const Color purpleDeep = Color(0xFF4A3F6B);           // 深紫

  // Text colors
  static const Color textPrimary = Color(0xFFE8E8E8);           // 浅灰白 - 主文字
  static const Color textSecondary = Color(0xFFB0B0B0);        // 中灰 - 次文字
  static const Color textMuted = Color(0xFF7A7A8C);             // 暗灰 - 辅助文字

  // Five Elements Colors (五行配色)
  static const Color wuXingWood = Color(0xFF2D8B57);    // 木 - 翠青
  static const Color wuXingFire = Color(0xFFD84A32);     // 火 - 朱砂红
  static const Color wuXingEarth = Color(0xFFC9A227);    // 土 - 琥珀黄
  static const Color wuXingMetal = Color(0xFFB8C5D6);    // 金 - 霜白
  static const Color wuXingWater = Color(0xFF3B7DD8);    // 水 - 墨蓝

  // Status colors
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFE53935);
  static const Color warning = Color(0xFFFFB300);

  // === Spacing System (8px grid) ===
  static const double space1 = 4;
  static const double space2 = 8;
  static const double space3 = 12;
  static const double space4 = 16;
  static const double space5 = 20;
  static const double space6 = 24;
  static const double space8 = 32;
  static const double space10 = 40;
  static const double space12 = 48;

  // === Border Radius ===
  static const double radiusSm = 8;
  static const double radiusMd = 12;
  static const double radiusLg = 16;
  static const double radiusXl = 20;
  static const double radiusFull = 100;

  // === Shadows (subtle, dark mode) ===
  static List<BoxShadow> shadowSm([Color? color]) => [
    BoxShadow(
      color: (color ?? goldPrimary).withAlpha(25),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> shadowMd([Color? color]) => [
    BoxShadow(
      color: (color ?? goldPrimary).withAlpha(38),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> shadowLg([Color? color]) => [
    BoxShadow(
      color: (color ?? goldPrimary).withAlpha(51),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];

  // === Gradients ===
  static const LinearGradient backgroundGradient = LinearGradient(
    colors: [backgroundDark, backgroundMid],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [goldPrimary, Color(0xFFE8B830)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [backgroundLight, backgroundMid],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient purpleGlowGradient = LinearGradient(
    colors: [purpleMystic.withAlpha(76), purpleDeep.withAlpha(51)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // === Animation Durations ===
  static const Duration animFast = Duration(milliseconds: 150);
  static const Duration animNormal = Duration(milliseconds: 250);
  static const Duration animSlow = Duration(milliseconds: 400);

  // === Theme Data ===
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: backgroundDark,
      colorScheme: const ColorScheme.dark(
        primary: goldPrimary,
        secondary: purpleMystic,
        tertiary: goldAccent,
        surface: backgroundMid,
        error: error,
        onPrimary: backgroundDark,
        onSecondary: textPrimary,
        onSurface: textPrimary,
        onError: textPrimary,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: backgroundLight,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
          side: BorderSide(color: Colors.white.withAlpha(13)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: goldPrimary,
          foregroundColor: backgroundDark,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: goldPrimary,
          side: const BorderSide(color: goldPrimary, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: goldPrimary,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: backgroundLight,
        hintStyle: TextStyle(color: textMuted),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(color: Colors.white.withAlpha(25)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: goldPrimary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: error, width: 1.5),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: backgroundMid,
        indicatorColor: goldPrimary.withAlpha(38),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(
              color: goldPrimary,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            );
          }
          return TextStyle(color: textSecondary, fontSize: 11);
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: goldPrimary, size: 24);
          }
          return IconThemeData(color: textSecondary, size: 24);
        }),
      ),
      dividerTheme: DividerThemeData(
        color: Colors.white.withAlpha(13),
        thickness: 1,
        space: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: backgroundLight,
        contentTextStyle: const TextStyle(color: textPrimary),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: backgroundMid,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
        ),
        titleTextStyle: const TextStyle(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        contentTextStyle: TextStyle(color: textSecondary, fontSize: 14),
      ),
    );
  }

  // === Five Elements Helpers ===
  static Color getWuXingColor(String wuxing) {
    switch (wuxing) {
      case '木': return wuXingWood;
      case '火': return wuXingFire;
      case '土': return wuXingEarth;
      case '金': return wuXingMetal;
      case '水': return wuXingWater;
      default: return textMuted;
    }
  }

  static IconData getWuXingIcon(String wuxing) {
    switch (wuxing) {
      case '木': return Icons.park;
      case '火': return Icons.local_fire_department;
      case '土': return Icons.landscape;
      case '金': return Icons.star;
      case '水': return Icons.water_drop;
      default: return Icons.circle;
    }
  }

  // === Decorative Elements ===
  // 八卦装饰线
  static Widget baguaDivider({double height = 1, Color? color}) {
    return Container(
      height: height,
      margin: const EdgeInsets.symmetric(vertical: space4),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.transparent,
            (color ?? goldPrimary).withAlpha(76),
            goldPrimary.withAlpha(127),
            (color ?? goldPrimary).withAlpha(76),
            Colors.transparent,
          ],
          stops: const [0.0, 0.2, 0.5, 0.8, 1.0],
        ),
      ),
    );
  }

  // 金色边框卡片
  static BoxDecoration cardDecoration({
    Color? borderColor,
    List<BoxShadow>? boxShadow,
  }) {
    return BoxDecoration(
      color: backgroundLight,
      borderRadius: BorderRadius.circular(radiusLg),
      border: Border.all(
        color: borderColor ?? Colors.white.withAlpha(13),
        width: 1,
      ),
      boxShadow: boxShadow ?? shadowSm(purpleMystic),
    );
  }

  // 金色渐变卡片
  static BoxDecoration goldCardDecoration() {
    return BoxDecoration(
      gradient: LinearGradient(
        colors: [
          goldPrimary.withAlpha(25),
          backgroundLight,
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      borderRadius: BorderRadius.circular(radiusLg),
      border: Border.all(color: goldPrimary.withAlpha(51), width: 1),
      boxShadow: shadowMd(goldPrimary),
    );
  }

  // 五行相生相克顺时针排列
  static const List<String> wuXingCycle = ['木', '火', '土', '金', '水'];
  static const Map<String, String> wuXingSheng = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
  };
  static const Map<String, String> wuXingKe = {
    '金': '木', '木': '土', '土': '水', '水': '火', '火': '金',
  };
}