import 'package:flutter/material.dart';
import '../utils/theme.dart';

/// ============================================
/// 神秘东方装饰组件库
/// Mystical Eastern Decoration Widgets
/// ============================================

/// 页面顶部装饰 - 抽象八卦图案
class MysticTopDecoration extends StatelessWidget {
  final double height;
  final bool showBagua;
  final bool showLines;

  const MysticTopDecoration({
    super.key,
    this.height = 120,
    this.showBagua = true,
    this.showLines = true,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: Stack(
        children: [
          // 渐变背景
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    YiShunTheme.goldPrimary.withAlpha(13),
                    Colors.transparent,
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),

          // 八卦符号 - 左
          if (showBagua)
            Positioned(
              left: -20,
              top: 10,
              child: Opacity(
                opacity: 0.06,
                child: Transform.rotate(
                  angle: 0.3,
                  child: Text(
                    '☯',
                    style: TextStyle(
                      fontSize: 120,
                      color: YiShunTheme.goldPrimary,
                    ),
                  ),
                ),
              ),
            ),

          // 八卦符号 - 右
          if (showBagua)
            Positioned(
              right: -30,
              top: 20,
              child: Opacity(
                opacity: 0.05,
                child: Transform.rotate(
                  angle: -0.2,
                  child: Text(
                    '☰☷',
                    style: TextStyle(
                      fontSize: 80,
                      color: YiShunTheme.goldPrimary,
                    ),
                  ),
                ),
              ),
            ),

          // 装饰线条
          if (showLines)
            Positioned(
              left: 40,
              right: 40,
              top: height * 0.6,
              child: Container(
                height: 1,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.transparent,
                      YiShunTheme.goldPrimary.withAlpha(76),
                      YiShunTheme.goldPrimary.withAlpha(127),
                      YiShunTheme.goldPrimary.withAlpha(76),
                      Colors.transparent,
                    ],
                    stops: const [0.0, 0.2, 0.5, 0.8, 1.0],
                  ),
                ),
              ),
            ),

          // 金色圆点装饰 - 左
          if (showLines)
            Positioned(
              left: 40,
              top: height * 0.6 - 3,
              child: Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: YiShunTheme.goldPrimary.withAlpha(127),
                ),
              ),
            ),

          // 金色圆点装饰 - 右
          if (showLines)
            Positioned(
              right: 40,
              top: height * 0.6 - 3,
              child: Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: YiShunTheme.goldPrimary.withAlpha(127),
                ),
              ),
            ),

          // 中央装饰符号
          if (showBagua)
            Center(
              child: Opacity(
                opacity: 0.08,
                child: Text(
                  '���',
                  style: TextStyle(
                    fontSize: 24,
                    color: YiShunTheme.goldPrimary,
                    letterSpacing: 16,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// 页面顶部装饰（简洁版）
class SimpleMysticTop extends StatelessWidget {
  const SimpleMysticTop({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 80,
      width: double.infinity,
      child: Stack(
        children: [
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    YiShunTheme.goldPrimary.withAlpha(8),
                    Colors.transparent,
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
          Positioned(
            left: 32,
            right: 32,
            bottom: 20,
            child: Container(
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    YiShunTheme.goldPrimary.withAlpha(51),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Center(
            child: Opacity(
              opacity: 0.07,
              child: Text(
                '☯',
                style: TextStyle(
                  fontSize: 60,
                  color: YiShunTheme.goldPrimary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// 金色分割线（带两端装饰）
class GoldenDivider extends StatelessWidget {
  final double height;
  final EdgeInsets? margin;

  const GoldenDivider({
    super.key,
    this.height = 1,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin ?? const EdgeInsets.symmetric(vertical: 16),
      height: height,
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    YiShunTheme.goldPrimary.withAlpha(76),
                  ],
                ),
              ),
            ),
          ),
          Container(
            width: 6,
            height: height == 1 ? 6 : height,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: YiShunTheme.goldPrimary.withAlpha(127),
            ),
          ),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    YiShunTheme.goldPrimary.withAlpha(76),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// 神秘感标题
class MysticTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;
  final bool showDivider;

  const MysticTitle({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: YiShunTheme.goldPrimary.withAlpha(25),
                  borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
                ),
                child: Icon(icon, color: YiShunTheme.goldPrimary, size: 16),
              ),
              const SizedBox(width: 8),
            ],
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: YiShunTheme.textPrimary,
                letterSpacing: 0.5,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(width: 8),
              Text(
                '·',
                style: TextStyle(
                  color: YiShunTheme.goldPrimary.withAlpha(127),
                  fontSize: 18,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                subtitle!,
                style: TextStyle(
                  fontSize: 13,
                  color: YiShunTheme.textMuted,
                ),
              ),
            ],
          ],
        ),
        if (showDivider) ...[
          const SizedBox(height: 12),
          Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  YiShunTheme.goldPrimary.withAlpha(51),
                  YiShunTheme.goldPrimary.withAlpha(127),
                  YiShunTheme.goldPrimary.withAlpha(51),
                ],
                stops: const [0.0, 0.5, 1.0],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// 神秘感卡片容器
class MysticCard extends StatelessWidget {
  final Widget child;
  final Color? borderColor;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final bool useGoldAccent;

  const MysticCard({
    super.key,
    required this.child,
    this.borderColor,
    this.padding,
    this.margin,
    this.useGoldAccent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding ?? const EdgeInsets.all(YiShunTheme.space5),
      decoration: BoxDecoration(
        color: YiShunTheme.backgroundLight,
        borderRadius: BorderRadius.circular(YiShunTheme.radiusLg),
        border: Border.all(
          color: useGoldAccent
              ? YiShunTheme.goldPrimary.withAlpha(76)
              : borderColor ?? Colors.white.withAlpha(13),
          width: 1,
        ),
        boxShadow: YiShunTheme.shadowSm(
          useGoldAccent ? YiShunTheme.goldPrimary : YiShunTheme.purpleMystic,
        ),
      ),
      child: child,
    );
  }
}

/// 神秘感金色渐变卡片
class MysticGoldCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final bool useGoldAccent;

  const MysticGoldCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.useGoldAccent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding ?? const EdgeInsets.all(YiShunTheme.space5),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: useGoldAccent
              ? [
                  YiShunTheme.goldPrimary.withAlpha(30),
                  YiShunTheme.backgroundLight,
                ]
              : [
                  YiShunTheme.goldPrimary.withAlpha(20),
                  YiShunTheme.backgroundLight,
                ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(YiShunTheme.radiusLg),
        border: Border.all(
          color: useGoldAccent
              ? YiShunTheme.goldPrimary.withAlpha(102)
              : YiShunTheme.goldPrimary.withAlpha(51),
          width: 1,
        ),
        boxShadow: YiShunTheme.shadowMd(YiShunTheme.goldPrimary),
      ),
      child: child,
    );
  }
}

/// 统一的神秘感 AppBar
class MysticAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final Widget? titleWidget;
  final VoidCallback? onBack;
  final List<Widget>? actions;
  final bool showBack;

  const MysticAppBar({
    super.key,
    this.title,
    this.titleWidget,
    this.onBack,
    this.actions,
    this.showBack = true,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      leading: showBack
          ? GestureDetector(
              onTap: onBack ?? () => Navigator.pop(context),
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(13),
                  borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
                ),
                child: const Icon(
                  Icons.arrow_back,
                  color: YiShunTheme.textPrimary,
                  size: 22,
                ),
              ),
            )
          : null,
      title: titleWidget ??
          (title != null
              ? Text(
                  title!,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: YiShunTheme.textPrimary,
                    letterSpacing: 1,
                  ),
                )
              : null),
      actions: actions,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          height: 1,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.transparent,
                YiShunTheme.goldPrimary.withAlpha(51),
                Colors.transparent,
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// 神秘感图标按钮
class MysticIconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final double size;

  const MysticIconBtn({
    super.key,
    required this.icon,
    required this.onTap,
    this.size = 22,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(YiShunTheme.space2),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(13),
          borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
        ),
        child: Icon(icon, color: YiShunTheme.textSecondary, size: size),
      ),
    );
  }
}

/// 五行状态指示器
class WuXingIndicator extends StatelessWidget {
  final String element;
  final String? label;
  final bool showColor;

  const WuXingIndicator({
    super.key,
    required this.element,
    this.label,
    this.showColor = true,
  });

  @override
  Widget build(BuildContext context) {
    final color = showColor ? YiShunTheme.getWuXingColor(element) : YiShunTheme.textMuted;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: YiShunTheme.space2,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: color.withAlpha(51),
        borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
        border: Border.all(color: color.withAlpha(102)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            YiShunTheme.getWuXingIcon(element),
            size: 10,
            color: color,
          ),
          if (label != null) ...[
            const SizedBox(width: 4),
            Text(
              label!,
              style: TextStyle(
                fontSize: 10,
                color: color,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// 统一的神秘感按钮
class MysticButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isOutlined;
  final IconData? icon;
  final Color? color;

  const MysticButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isOutlined = false,
    this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final buttonColor = color ?? YiShunTheme.goldPrimary;

    if (isOutlined) {
      return SizedBox(
        height: 52,
        child: OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: buttonColor,
            side: BorderSide(color: buttonColor, width: 1.5),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
            ),
          ),
          child: _buildChild(buttonColor),
        ),
      );
    }

    return SizedBox(
      height: 52,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: buttonColor,
          foregroundColor: YiShunTheme.backgroundDark,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
          ),
        ),
        child: _buildChild(YiShunTheme.backgroundDark),
      ),
    );
  }

  Widget _buildChild(Color textColor) {
    if (isLoading) {
      return SizedBox(
        width: 24,
        height: 24,
        child: CircularProgressIndicator(
          color: textColor,
          strokeWidth: 2.5,
        ),
      );
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 20),
          const SizedBox(width: 8),
        ],
        Text(
          text,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ],
    );
  }
}
