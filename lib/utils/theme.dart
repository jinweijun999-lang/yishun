import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// ============================================
/// YiShun Theme - Modern Orientalism
/// "The Stillness of Insight"
/// ============================================
class YiShunTheme {
  // === Color Palette ===
  // Background - Rice Paper
  static const Color background      = Color(0xFFF9FAF2);

  // Backward compat aliases (old dark theme)
  static const Color backgroundDark  = Color(0xFF1A1C18);
  static const Color backgroundCard  = Color(0xFFF9FAF2);
  static const Color backgroundLight = Color(0xFFF3F4EC);
  static const Color backgroundMid   = Color(0xFFF9FAF2);
  static const Color goldPrimary    = Color(0xFFC9A227);
  static const Color goldAccent     = Color(0xFFFFD700);
  static const Color gold           = Color(0xFFC9A227);
  static const Color goldSubtle     = Color(0x33C9A227);
  static const Color goldBorder     = Color(0x4DC9A227);
  static const Color purpleMystic   = Color(0xFF6B5B95);
  static const Color purpleDeep     = Color(0xFF4A3F6B);
  static const Color purpleSubtle   = Color(0xFF4A3F6B);
  static const Color textPrimary    = Color(0xFFFFFFFF);
  static const Color textSecondary  = Color(0xFFA0A0B0);
  static const Color textMuted      = Color(0xFF6B6B7B);
  static const Color textLight      = Color(0xFFA0A0B0);
  static const Color surfaceContainerLowest  = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow    = Color(0xFFF3F4EC);
  static const Color surfaceContainer       = Color(0xFFEDEFE7);
  static const Color surfaceContainerHigh    = Color(0xFFE8E9E1);
  static const Color surfaceContainerHighest = Color(0xFFE2E3DC);

  // Primary - Bamboo Green
  static const Color primary         = Color(0xFF37602C);
  static const Color onPrimary      = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFF4F7942);
  static const Color onPrimaryContainer = Color(0xFFD3FFC1);
  static const Color primaryFixed   = Color(0xFFC0F0AD);
  static const Color primaryFixedDim = Color(0xFFA4D393);
  static const Color surfaceTint    = Color(0xFF3F6833);

  // Secondary - Cinnabar Red
  static const Color secondary       = Color(0xFFB52424);
  static const Color onSecondary    = Color(0xFFFFFFFF);
  static const Color secondaryContainer = Color(0xFFFF5A52);
  static const Color onSecondaryContainer = Color(0xFF600006);

  // Tertiary - Muted Purple
  static const Color tertiary       = Color(0xFF814161);
  static const Color onTertiary     = Color(0xFFFFFFFF);
  static const Color tertiaryContainer = Color(0xFF9D597A);
  static const Color onTertiaryContainer = Color(0xFFFFEFF3);

  // Text
  static const Color onSurface      = Color(0xFF1A1C18);  // Ink Black
  static const Color onSurfaceVariant = Color(0xFF42493E);
  static const Color outline         = Color(0xFF73796D);
  static const Color outlineVariant  = Color(0xFFC2C9BB);

  // Surface variant
  static const Color surfaceVariant = Color(0xFFE2E3DC);

  // Inverse
  static const Color inverseSurface  = Color(0xFF2F312C);
  static const Color inverseOnSurface = Color(0xFFF0F1EA);
  static const Color inversePrimary  = Color(0xFFA4D393);

  // Error
  static const Color error          = Color(0xFFBA1A1A);
  static const Color onError        = Color(0xFFFFFFFF);
  static const Color errorContainer   = Color(0xFFFFDAD6);
  static const Color onErrorContainer = Color(0xFF93000A);

  // 五行 Colors
  static const Color wuXingWood   = Color(0xFF2D8B57);
  static const Color wuXingFire   = Color(0xFFD84A32);
  static const Color wuXingEarth  = Color(0xFFC9A227);
  static const Color wuXingMetal  = Color(0xFFB8C5D6);
  static const Color wuXingWater  = Color(0xFF3B7DD8);

  // Semantic
  static const Color success = primary;
  static const Color warning = Color(0xFFFFB300);

  // Card border
  static const Color cardBorder = Color(0xFFD1CDC0);

  // === Spacing (4px unit) ===
  static const double spaceXs  = 4;
  static const double spaceSm  = 8;
  static const double spaceMd  = 16;
  static const double spaceLg  = 24;
  static const double spaceXl  = 40;
  static const double spaceXxl = 64;
  // Backward compat spacing
  static const double space1  = 4;
  static const double space2  = 8;
  static const double space3  = 12;
  static const double space4  = 16;
  static const double space5  = 20;
  static const double space6  = 24;
  static const double space8  = 32;
  static const double space10 = 40;
  static const double space12 = 48;

  // === Border Radius ===
  static const double radiusSm   = 4;    // 0.25rem - soft corners
  static const double radiusMd   = 8;    // 0.5rem - cards
  static const double radiusLg   = 12;   // 0.75rem - large containers
  static const double radiusXl   = 16;   // buttons, inputs
  static const double radiusFull = 9999;

  // === Animation ===
  static const Duration animFast   = Duration(milliseconds: 150);
  static const Duration animNormal = Duration(milliseconds: 250);
  static const Duration animSlow   = Duration(milliseconds: 400);

  // === Layout ===
  static const double pagePadding = 24.0;
  static const double cardPadding = 20.0;

  // === Gradients (backward compat)
  static const LinearGradient backgroundGradient = LinearGradient(
    colors: [backgroundDark, backgroundCard],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  static const LinearGradient goldGradient = LinearGradient(
    colors: [goldPrimary, Color(0xFFE8B830)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // === Shadows (very subtle, used sparingly) ===
  static List<BoxShadow> shadowSm([Color? color]) => [
    BoxShadow(
      color: (color ?? primary).withAlpha(20),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> shadowMd([Color? color]) => [
    BoxShadow(
      color: (color ?? primary).withAlpha(30),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> shadowCard([Color? color]) => [
    BoxShadow(
      color: (color ?? primary).withAlpha(20),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  // === Theme Data (Light Theme) ===
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.light(
        primary: primary,
        onPrimary: onPrimary,
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        secondary: secondary,
        onSecondary: onSecondary,
        secondaryContainer: secondaryContainer,
        onSecondaryContainer: onSecondaryContainer,
        tertiary: tertiary,
        onTertiary: onTertiary,
        tertiaryContainer: tertiaryContainer,
        onTertiaryContainer: onTertiaryContainer,
        error: error,
        onError: onError,
        errorContainer: errorContainer,
        onErrorContainer: onErrorContainer,
        surface: background,
        onSurface: onSurface,
        onSurfaceVariant: onSurfaceVariant,
        outline: outline,
        outlineVariant: outlineVariant,
        inverseSurface: inverseSurface,
        inversePrimary: inversePrimary,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: onSurface,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: onSurface,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
        iconTheme: IconThemeData(color: onSurface),
      ),
      cardTheme: CardThemeData(
        color: surfaceContainerLowest,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          side: const BorderSide(color: cardBorder, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: onPrimary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusSm),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.3,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          side: const BorderSide(color: primary, width: 1.2),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusSm),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.3,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: secondary,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceContainerLow,
        hintStyle: const TextStyle(color: outline),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: const BorderSide(color: outlineVariant, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: const BorderSide(color: error, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusSm),
          borderSide: const BorderSide(color: error, width: 1.5),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surfaceContainerLowest,
        indicatorColor: primaryFixedDim.withAlpha(51),
        height: 64,
        elevation: 0,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const TextStyle(
              color: primary,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.05,
            );
          }
          return const TextStyle(
            color: onSurfaceVariant,
            fontSize: 11,
            fontWeight: FontWeight.w500,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: primary, size: 24);
          }
          return const IconThemeData(color: onSurfaceVariant, size: 24);
        }),
      ),
      dividerTheme: const DividerThemeData(
        color: outlineVariant,
        thickness: 1,
        space: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: inverseSurface,
        contentTextStyle: const TextStyle(color: inverseOnSurface),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusSm),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surfaceContainerLowest,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          side: const BorderSide(color: cardBorder, width: 1),
        ),
        titleTextStyle: const TextStyle(
          color: onSurface,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        contentTextStyle: const TextStyle(
          color: onSurfaceVariant,
          fontSize: 14,
          height: 1.5,
        ),
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: primary,
        unselectedLabelColor: onSurfaceVariant,
        indicatorColor: primary,
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        labelStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surfaceContainer,
        labelStyle: const TextStyle(
          color: onSurface,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
        side: const BorderSide(color: outlineVariant),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusFull),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      ),
      textTheme: _buildTextTheme(),
    );
  }

  static TextTheme _buildTextTheme() {
    final notoSerif = GoogleFonts.notoSerif();
    final inter = GoogleFonts.inter();

    return TextTheme(
      // Headlines - Noto Serif
      headlineLarge: TextStyle(
        fontFamily: notoSerif.fontFamily,
        color: onSurface, fontWeight: FontWeight.w600,
        fontSize: 40, height: 1.2, letterSpacing: -0.5,
      ),
      headlineMedium: TextStyle(
        fontFamily: notoSerif.fontFamily,
        color: onSurface, fontWeight: FontWeight.w500,
        fontSize: 32, height: 1.3,
      ),
      headlineSmall: TextStyle(
        fontFamily: notoSerif.fontFamily,
        color: onSurface, fontWeight: FontWeight.w500,
        fontSize: 24, height: 1.4,
      ),
      // Titles
      titleLarge: TextStyle(
        fontFamily: notoSerif.fontFamily,
        color: onSurface, fontWeight: FontWeight.w600,
        fontSize: 20, height: 1.4,
      ),
      titleMedium: TextStyle(
        fontFamily: inter.fontFamily,
        color: onSurface, fontWeight: FontWeight.w600,
        fontSize: 16, height: 1.4, letterSpacing: 0.1,
      ),
      titleSmall: TextStyle(
        fontFamily: inter.fontFamily,
        color: onSurface, fontWeight: FontWeight.w600,
        fontSize: 14, height: 1.4, letterSpacing: 0.1,
      ),
      // Body - Inter
      bodyLarge: TextStyle(
        fontFamily: inter.fontFamily,
        color: onSurface, fontWeight: FontWeight.w400,
        fontSize: 18, height: 1.6,
      ),
      bodyMedium: TextStyle(
        fontFamily: inter.fontFamily,
        color: onSurface, fontWeight: FontWeight.w400,
        fontSize: 16, height: 1.6,
      ),
      bodySmall: TextStyle(
        fontFamily: inter.fontFamily,
        color: onSurfaceVariant, fontWeight: FontWeight.w400,
        fontSize: 14, height: 1.5,
      ),
      // Labels
      labelLarge: TextStyle(
        fontFamily: inter.fontFamily,
        color: onSurface, fontWeight: FontWeight.w600,
        fontSize: 14, letterSpacing: 0.1,
      ),
      labelMedium: TextStyle(
        fontFamily: inter.fontFamily,
        color: onSurface, fontWeight: FontWeight.w500,
        fontSize: 12, letterSpacing: 0.5,
      ),
      labelSmall: TextStyle(
        fontFamily: inter.fontFamily,
        color: onSurfaceVariant, fontWeight: FontWeight.w500,
        fontSize: 11, letterSpacing: 0.5,
      ),
    );
  }

  // === WuXing Utilities ===
  static Color getWuXingColor(String wuxing) {
    switch (wuxing) {
      case '木': return wuXingWood;
      case '火': return wuXingFire;
      case '土': return wuXingEarth;
      case '金': return wuXingMetal;
      case '水': return wuXingWater;
      default: return onSurfaceVariant;
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

  static const List<String> wuXingCycle = ['木', '火', '土', '金', '水'];
}
