import 'package:flutter/material.dart';
import '../utils/theme.dart';

/// ============================================
/// 装饰组件库 - Modern Orientalism
/// "The Stillness of Insight"
/// ============================================

// === Divider ===

class ThinDivider extends StatelessWidget {
  final EdgeInsets? margin;
  final Color? color;

  const ThinDivider({super.key, this.margin, this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin ?? const EdgeInsets.symmetric(vertical: YiShunTheme.spaceLg),
      height: 1,
      color: color ?? YiShunTheme.outlineVariant,
    );
  }
}

// === YiShunCard ===

/// YiShunCard - 核心卡片组件
/// 白色底 + 1px细边框, border-radius: 8px, padding: 24px
/// Hover效果: border变绿色 + 柔和阴影
class YiShunCard extends StatefulWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? borderColor;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final bool enableHoverEffect;

  const YiShunCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderColor,
    this.onTap,
    this.backgroundColor,
    this.enableHoverEffect = false,
  });

  @override
  State<YiShunCard> createState() => _YiShunCardState();
}

class _YiShunCardState extends State<YiShunCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isHovered = widget.enableHoverEffect && _isHovered;
    final effectiveBorderColor = isHovered
        ? YiShunTheme.primary.withAlpha(77) // primary/30
        : (widget.borderColor ?? YiShunTheme.cardBorder);

    final card = MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: YiShunTheme.animNormal,
        margin: widget.margin,
        decoration: BoxDecoration(
          color: widget.backgroundColor ?? YiShunTheme.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
          border: Border.all(
            color: effectiveBorderColor,
            width: 1,
          ),
          boxShadow: isHovered
              ? [
                  BoxShadow(
                    color: const Color(0x144F7942).withAlpha(20),
                    blurRadius: 30,
                    offset: const Offset(0, 10),
                  ),
                ]
              : null,
        ),
        padding: widget.padding ?? const EdgeInsets.all(YiShunTheme.spaceLg),
        child: widget.child,
      ),
    );

    return widget.onTap != null
        ? GestureDetector(onTap: widget.onTap, child: card)
        : card;
  }
}

// === YiShunButton ===

/// YiShunPrimaryButton - 主按钮
/// background: #37602c, color: #ffffff, 无渐变
class YiShunPrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final double? width;
  final bool fullWidth;

  const YiShunPrimaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.width,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? const SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: YiShunTheme.onPrimary,
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18, color: YiShunTheme.onPrimary),
                const SizedBox(width: 6),
              ],
              Text(
                text,
                style: const TextStyle(
                  color: YiShunTheme.onPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          );

    Widget button = ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: YiShunTheme.primary,
        foregroundColor: YiShunTheme.onPrimary,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
        ),
      ),
      child: child,
    );

    if (fullWidth) {
      return SizedBox(width: double.infinity, height: 48, child: button);
    }
    if (width != null) {
      return SizedBox(width: width, height: 48, child: button);
    }
    return button;
  }
}

/// YiShunSecondaryButton - 次要按钮
/// 透明背景 + #37602c 边框
class YiShunSecondaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final double? width;
  final bool fullWidth;

  const YiShunSecondaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.width,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: YiShunTheme.primary,
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18, color: YiShunTheme.primary),
                const SizedBox(width: 6),
              ],
              Text(
                text,
                style: const TextStyle(
                  color: YiShunTheme.primary,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          );

    Widget button = OutlinedButton(
      onPressed: isLoading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: YiShunTheme.primary,
        side: const BorderSide(color: YiShunTheme.primary, width: 1.2),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
        ),
        elevation: 0,
      ),
      child: child,
    );

    if (fullWidth) {
      return SizedBox(width: double.infinity, height: 48, child: button);
    }
    if (width != null) {
      return SizedBox(width: width, height: 48, child: button);
    }
    return button;
  }
}

// === YiShunBottomNav ===

/// YiShunBottomNav - 底部导航
/// 4个按钮: Home | Chart | Consult | Profile
/// 高度 64px, 选中图标填充 + 绿色, 未选中灰色
class YiShunBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const YiShunBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
      decoration: const BoxDecoration(
        color: YiShunTheme.surfaceContainerLowest,
        border: Border(
          top: BorderSide(color: YiShunTheme.cardBorder, width: 1),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _NavItem(
              icon: Icons.home_outlined,
              selectedIcon: Icons.home,
              label: 'Home',
              isSelected: currentIndex == 0,
              onTap: () => onTap(0),
            ),
            _NavItem(
              icon: Icons.auto_awesome_outlined,
              selectedIcon: Icons.auto_awesome,
              label: 'Chart',
              isSelected: currentIndex == 1,
              onTap: () => onTap(1),
            ),
            _NavItem(
              icon: Icons.group_outlined,
              selectedIcon: Icons.group,
              label: 'Consult',
              isSelected: currentIndex == 2,
              onTap: () => onTap(2),
            ),
            _NavItem(
              icon: Icons.person_outline,
              selectedIcon: Icons.person,
              label: 'Profile',
              isSelected: currentIndex == 3,
              onTap: () => onTap(3),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isSelected ? selectedIcon : icon,
              size: 24,
              color: isSelected
                  ? YiShunTheme.primary
                  : YiShunTheme.onSurfaceVariant,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected
                    ? YiShunTheme.primary
                    : YiShunTheme.onSurfaceVariant,
                letterSpacing: 0.05,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// === OriCard (original) ===
class OriCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? borderColor;
  final double? borderRadius;
  final VoidCallback? onTap;
  final Color? backgroundColor;

  const OriCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderColor,
    this.borderRadius,
    this.onTap,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      margin: margin,
      decoration: BoxDecoration(
        color: backgroundColor ?? YiShunTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(borderRadius ?? YiShunTheme.radiusMd),
        border: Border.all(
          color: borderColor ?? YiShunTheme.cardBorder,
          width: 1,
        ),
      ),
      padding: padding ?? const EdgeInsets.all(YiShunTheme.spaceMd),
      child: child,
    );
    return onTap != null
        ? GestureDetector(onTap: onTap, child: card)
        : card;
  }
}

/// SurfaceCard - 浅米色背景卡片
class SurfaceCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;

  const SurfaceCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      margin: margin,
      decoration: BoxDecoration(
        color: YiShunTheme.surfaceContainer,
        borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
        border: Border.all(color: YiShunTheme.outlineVariant, width: 1),
      ),
      padding: padding ?? const EdgeInsets.all(YiShunTheme.spaceMd),
      child: child,
    );
    return onTap != null
        ? GestureDetector(onTap: onTap, child: card)
        : card;
  }
}

/// BorderedCard - 强调边框卡片
class BorderedCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? borderColor;
  final double borderWidth;
  final VoidCallback? onTap;

  const BorderedCard({
    super.key,
    required this.child,
    this.padding,
    this.borderColor,
    this.borderWidth = 1.5,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      decoration: BoxDecoration(
        color: YiShunTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
        border: Border.all(
          color: borderColor ?? YiShunTheme.primary,
          width: borderWidth,
        ),
      ),
      padding: padding ?? const EdgeInsets.all(YiShunTheme.spaceMd),
      child: child,
    );
    return onTap != null
        ? GestureDetector(onTap: onTap, child: card)
        : card;
  }
}

/// PrimaryButton (original) - 主按钮
class PrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final double? width;
  final bool fullWidth;

  const PrimaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.width,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? const SizedBox(
            width: 18, height: 18,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 6)],
              Text(text),
            ],
          );

    Widget button = ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: YiShunTheme.primary,
        foregroundColor: YiShunTheme.onPrimary,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
        ),
        elevation: 0,
      ),
      child: child,
    );

    if (fullWidth) return SizedBox(width: double.infinity, height: 48, child: button);
    if (width != null) return SizedBox(width: width, height: 48, child: button);
    return button;
  }
}

/// SecondaryButton (original) - 次要按钮
class SecondaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final double? width;
  final bool fullWidth;

  const SecondaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.icon,
    this.width,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? SizedBox(
            width: 18, height: 18,
            child: CircularProgressIndicator(strokeWidth: 2, color: YiShunTheme.primary),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 6)],
              Text(text),
            ],
          );

    Widget button = OutlinedButton(
      onPressed: isLoading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: YiShunTheme.primary,
        side: const BorderSide(color: YiShunTheme.primary, width: 1.2),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
        ),
        elevation: 0,
      ),
      child: child,
    );

    if (fullWidth) return SizedBox(width: double.infinity, height: 48, child: button);
    if (width != null) return SizedBox(width: width, height: 48, child: button);
    return button;
  }
}

/// TertiaryButton - 文字按钮
class TertiaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Color? color;

  const TertiaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = color ?? YiShunTheme.secondary;
    return TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        foregroundColor: textColor,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        textStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          decoration: TextDecoration.underline,
          decorationColor: Colors.transparent,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(text, style: TextStyle(color: textColor)),
        ],
      ),
    );
  }
}

/// AppButton - 统一按钮入口
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool outlined;
  final bool fullWidth;
  final IconData? icon;
  final ButtonType type;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.outlined = false,
    this.fullWidth = false,
    this.icon,
    this.type = ButtonType.primary,
  });

  @override
  Widget build(BuildContext context) {
    if (outlined || type == ButtonType.secondary) {
      return SecondaryButton(
        text: text, onPressed: onPressed, isLoading: isLoading, icon: icon,
        fullWidth: fullWidth,
      );
    }
    if (type == ButtonType.tertiary) {
      return TertiaryButton(text: text, onPressed: onPressed, icon: icon);
    }
    return PrimaryButton(
      text: text, onPressed: onPressed, isLoading: isLoading, icon: icon,
      fullWidth: fullWidth,
    );
  }
}

enum ButtonType { primary, secondary, tertiary }

/// AppIconBtn - 图标按钮
class AppIconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final double size;
  final Color? color;

  const AppIconBtn({
    super.key, required this.icon, this.onTap,
    this.size = 24, this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          color: YiShunTheme.surfaceContainer,
          borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
          border: Border.all(color: YiShunTheme.outlineVariant),
        ),
        child: Center(
          child: Icon(
            icon, size: size,
            color: color ?? YiShunTheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

/// IconBtn - 简洁图标按钮
class IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final double size;
  final Color? color;

  const IconBtn({
    super.key, required this.icon, this.onTap,
    this.size = 24, this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(
          icon, size: size,
          color: color ?? YiShunTheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

/// WuXingBadge - 五行徽章
class WuXingBadge extends StatelessWidget {
  final String element;
  final bool small;
  final bool showLabel;

  const WuXingBadge({
    super.key, required this.element,
    this.small = false, this.showLabel = true,
  });

  @override
  Widget build(BuildContext context) {
    final color = YiShunTheme.getWuXingColor(element);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 6 : 8,
        vertical: small ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: color.withAlpha(25),
        borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
        border: Border.all(color: color.withAlpha(76)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            YiShunTheme.getWuXingIcon(element),
            size: small ? 10 : 12, color: color,
          ),
          if (showLabel) ...[
            const SizedBox(width: 4),
            Text(
              element,
              style: TextStyle(
                fontSize: small ? 10 : 11,
                color: color, fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// SectionTitle - 区块标题
class SectionTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;

  const SectionTitle({
    super.key, required this.title,
    this.subtitle, this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20, fontWeight: FontWeight.w600,
                  color: YiShunTheme.onSurface, height: 1.3,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  subtitle!,
                  style: const TextStyle(
                    fontSize: 13, color: YiShunTheme.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

/// OriChip - 标签芯片
class OriChip extends StatelessWidget {
  final String label;
  final Color? backgroundColor;
  final Color? textColor;
  final Color? borderColor;
  final IconData? icon;

  const OriChip({
    super.key, required this.label,
    this.backgroundColor, this.textColor, this.borderColor, this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: backgroundColor ?? YiShunTheme.surfaceContainer,
        borderRadius: BorderRadius.circular(YiShunTheme.radiusFull),
        border: Border.all(color: borderColor ?? YiShunTheme.outlineVariant),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: textColor ?? YiShunTheme.onSurface),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 12, fontWeight: FontWeight.w500,
              color: textColor ?? YiShunTheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}

/// OriInput - 统一输入框
class OriInput extends StatelessWidget {
  final String? label;
  final String? hint;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? errorText;
  final int maxLines;
  final bool readOnly;
  final VoidCallback? onTap;

  const OriInput({
    super.key,
    this.label, this.hint, this.controller, this.onChanged,
    this.obscureText = false, this.keyboardType, this.errorText,
    this.maxLines = 1, this.readOnly = false, this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: const TextStyle(
              fontSize: 13, fontWeight: FontWeight.w500,
              color: YiShunTheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 6),
        ],
        TextField(
          controller: controller, onChanged: onChanged,
          obscureText: obscureText, keyboardType: keyboardType,
          maxLines: maxLines, readOnly: readOnly, onTap: onTap,
          decoration: InputDecoration(hintText: hint, errorText: errorText),
          style: const TextStyle(fontSize: 15, color: YiShunTheme.onSurface),
        ),
      ],
    );
  }
}

/// LoadingIndicator - 加载指示器
class LoadingIndicator extends StatelessWidget {
  final double size;
  final Color? color;

  const LoadingIndicator({super.key, this.size = 24, this.color});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size, height: size,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: color ?? YiShunTheme.primary,
      ),
    );
  }
}

/// EmptyState - 空状态
class EmptyState extends StatelessWidget {
  final String message;
  final IconData? icon;
  final Widget? action;

  const EmptyState({
    super.key, required this.message,
    this.icon, this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(YiShunTheme.spaceXl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon ?? Icons.inbox_outlined,
              size: 56, color: YiShunTheme.outline,
            ),
            const SizedBox(height: YiShunTheme.spaceMd),
            Text(
              message,
              style: const TextStyle(fontSize: 15, color: YiShunTheme.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            if (action != null) ...[
              const SizedBox(height: YiShunTheme.spaceLg),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

// ============================================
// BACKWARD COMPATIBILITY ALIASES
// For screens still using old class names
// ============================================

/// NanoCard - alias for OriCard (old NanoCard = light card)
class NanoCard extends OriCard {
  final bool showGoldBorder;
  const NanoCard({
    super.key,
    required Widget super.child,
    super.padding,
    super.borderColor,
    super.onTap,
    this.showGoldBorder = false,
  });

  @override
  Widget build(BuildContext context) {
    return OriCard(
      child: super.child,
      padding: padding,
      borderColor: showGoldBorder
          ? (borderColor ?? YiShunTheme.goldPrimary)
          : borderColor,
      onTap: onTap,
    );
  }
}

/// GoldCard - alias for OriCard with gold border
class GoldCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? borderColor;
  const GoldCard({
    super.key,
    required this.child,
    this.padding,
    this.borderColor,
  });
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: YiShunTheme.surfaceContainerLowest,
      borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
      border: Border.all(
        color: borderColor ?? YiShunTheme.goldPrimary,
        width: 1,
      ),
    ),
    padding: padding ?? const EdgeInsets.all(YiShunTheme.spaceMd),
    child: child,
  );
}

/// GoldCardLegacy - alias for GoldCard
class GoldCardLegacy extends GoldCard {
  const GoldCardLegacy({
    super.key,
    required Widget super.child,
    super.padding,
  });
}

/// AppCard - alias for OriCard
class AppCard extends OriCard {
  const AppCard({
    super.key,
    required Widget super.child,
    super.padding,
    super.borderColor,
    super.onTap,
  });
}

/// MysticIconBtn - alias for AppIconBtn
class MysticIconBtn extends AppIconBtn {
  const MysticIconBtn({
    super.key,
    required IconData super.icon,
    super.onTap,
    super.size,
    super.color,
  });
}

/// MysticTopDecoration - placeholder (transparent top decoration)
class MysticTopDecoration extends StatelessWidget {
  final double height;
  const MysticTopDecoration({super.key, this.height = 80});
  @override
  Widget build(BuildContext context) => SizedBox(height: height);
}

/// MysticGoldCard - alias for GoldCard
class MysticGoldCard extends GoldCard {
  const MysticGoldCard({
    super.key,
    required Widget super.child,
    super.padding,
  });
}

/// MysticCard - alias for OriCard
class MysticCard extends OriCard {
  const MysticCard({
    super.key,
    required Widget super.child,
    super.padding,
    super.borderColor,
    super.onTap,
  });
}

/// MysticTitle - simple styled title text
class MysticTitle extends StatelessWidget {
  final String? title;
  final String? subtitle;
  final IconData? icon;
  final bool showDivider;
  final String text;
  final double fontSize;
  final Color? color;
  const MysticTitle({
    super.key,
    this.title,
    this.subtitle,
    this.icon,
    this.showDivider = false,
    this.text = '',
    this.fontSize = 18,
    this.color,
  });
  @override
  Widget build(BuildContext context) {
    final displayTitle = title ?? text;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 18, color: YiShunTheme.primary),
              const SizedBox(width: 8),
            ],
            Expanded(
              child: Text(
                displayTitle,
                style: TextStyle(
                  fontSize: fontSize,
                  fontWeight: FontWeight.w600,
                  color: color ?? YiShunTheme.onSurface,
                ),
              ),
            ),
          ],
        ),
        if (subtitle != null && subtitle!.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: TextStyle(
              fontSize: 13,
              color: YiShunTheme.onSurfaceVariant,
            ),
          ),
        ],
        if (showDivider) ...[
          const SizedBox(height: 12),
          Container(
            height: 1,
            color: YiShunTheme.outlineVariant,
          ),
        ],
      ],
    );
  }
}
