import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user_model.dart';
import '../services/analytics_service.dart';
import '../utils/theme.dart';

/// 订阅墙 (Paywall)
/// 神秘东方色彩，玄学风格
class PaywallScreen extends StatefulWidget {
  const PaywallScreen({super.key});

  @override
  State<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends State<PaywallScreen> {
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    context.read<AnalyticsService>().logScreenView(screenName: 'PaywallScreen');
  }

  Future<void> _subscribe() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      context.read<UserModel>().setMemberStatus(MemberStatus.premium);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🎉 订阅成功！欢迎成为会员！'),
          backgroundColor: YiShunTheme.success,
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: YiShunTheme.backgroundDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: YiShunTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // App Bar
              _PaywallAppBar(onBack: () => Navigator.pop(context)),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(YiShunTheme.space4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _PremiumHeaderCard(),
                      const SizedBox(height: YiShunTheme.space5),
                      _ComparisonSection(),
                      const SizedBox(height: YiShunTheme.space5),
                      _PricingSection(),
                      const SizedBox(height: YiShunTheme.space5),
                      _CTAButton(
                        isLoading: _isLoading,
                        onPressed: _subscribe,
                      ),
                      const SizedBox(height: YiShunTheme.space3),
                      Center(
                        child: Text(
                          '订阅即表示同意《会员协议》。订阅自动续费，\n如需取消请在到期前24小时操作。',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11,
                            color: YiShunTheme.textMuted,
                          ),
                        ),
                      ),
                      const SizedBox(height: YiShunTheme.space8),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// === App Bar ===
class _PaywallAppBar extends StatelessWidget {
  final VoidCallback onBack;

  const _PaywallAppBar({required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(YiShunTheme.space4),
      child: Row(
        children: [
          _BackButton(onTap: onBack),
          const SizedBox(width: YiShunTheme.space4),
          const Expanded(
            child: Text(
              '解锁高级功能',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: YiShunTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BackButton extends StatelessWidget {
  final VoidCallback onTap;

  const _BackButton({required this.onTap});

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
        child: const Icon(Icons.arrow_back, color: YiShunTheme.textPrimary, size: 22),
      ),
    );
  }
}

// === Premium Header Card ===
class _PremiumHeaderCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(YiShunTheme.space6),
      decoration: YiShunTheme.goldCardDecoration(),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(YiShunTheme.space4),
            decoration: BoxDecoration(
              color: YiShunTheme.goldPrimary.withAlpha(38),
              shape: BoxShape.circle,
            ),
            child: const Text('👑', style: TextStyle(fontSize: 48)),
          ),
          const SizedBox(height: YiShunTheme.space4),
          const Text(
            '易顺高级会员',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: YiShunTheme.goldPrimary,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: YiShunTheme.space2),
          Text(
            '解锁全部高级功能，开启完整命理之旅',
            style: TextStyle(
              fontSize: 13,
              color: YiShunTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

// === Comparison Section ===
class _ComparisonSection extends StatelessWidget {
  final List<Map<String, String>> freeFeatures = const [
    {'icon': '☯️', 'title': '四柱排盘', 'desc': '每日1次'},
    {'icon': '📜', 'title': '基础命理', 'desc': '3项分析'},
    {'icon': '📚', 'title': '命理知识', 'desc': '免费阅读'},
  ];

  final List<Map<String, String>> premiumFeatures = const [
    {'icon': '☯️', 'title': '无限八字分析', 'desc': '无限制'},
    {'icon': '💑', 'title': '双人合盘', 'desc': '无限次'},
    {'icon': '📜', 'title': '大运流年', 'desc': '完整解读'},
    {'icon': '🔮', 'title': '十神详解', 'desc': '深度分析'},
    {'icon': '⚖️', 'title': '五行分析', 'desc': '完整雷达'},
    {'icon': '👑', 'title': '专属客服', 'desc': '优先响应'},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: YiShunTheme.cardDecoration(
        borderColor: Colors.white.withAlpha(25),
      ),
      child: Column(
        children: [
          // Free tier header
          _TierHeader(
            label: '免费版',
            color: YiShunTheme.textMuted,
            isFree: true,
          ),
          Padding(
            padding: const EdgeInsets.all(YiShunTheme.space4),
            child: Column(
              children: freeFeatures.map((f) => _FeatureRow(
                icon: f['icon']!,
                title: f['title']!,
                desc: f['desc']!,
                isPremium: false,
              )).toList(),
            ),
          ),

          const Divider(color: Colors.white12),

          // Premium tier header
          _TierHeader(
            label: '高级版',
            color: YiShunTheme.goldPrimary,
            badge: 'PRO',
            badgeColor: YiShunTheme.wuXingFire,
          ),
          Padding(
            padding: const EdgeInsets.all(YiShunTheme.space4),
            child: Column(
              children: premiumFeatures.map((f) => _FeatureRow(
                icon: f['icon']!,
                title: f['title']!,
                desc: f['desc']!,
                isPremium: true,
              )).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _TierHeader extends StatelessWidget {
  final String label;
  final Color color;
  final bool isFree;
  final String? badge;
  final Color? badgeColor;

  const _TierHeader({
    required this.label,
    required this.color,
    this.isFree = false,
    this.badge,
    this.badgeColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: YiShunTheme.space3),
      decoration: BoxDecoration(
        color: isFree ? Colors.white.withAlpha(8) : YiShunTheme.goldPrimary.withAlpha(13),
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(YiShunTheme.radiusLg - 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (badge != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: YiShunTheme.space2,
                vertical: 2,
              ),
              decoration: BoxDecoration(
                color: badgeColor ?? YiShunTheme.goldPrimary,
                borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
              ),
              child: Text(
                badge!,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: YiShunTheme.space2),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  final String icon;
  final String title;
  final String desc;
  final bool isPremium;

  const _FeatureRow({
    required this.icon,
    required this.title,
    required this.desc,
    required this.isPremium,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: YiShunTheme.space3),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(YiShunTheme.space2),
            decoration: BoxDecoration(
              color: isPremium
                  ? YiShunTheme.goldPrimary.withAlpha(25)
                  : Colors.white.withAlpha(13),
              borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
            ),
            child: Text(icon, style: const TextStyle(fontSize: 18)),
          ),
          const SizedBox(width: YiShunTheme.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: isPremium ? YiShunTheme.textPrimary : YiShunTheme.textSecondary,
                  ),
                ),
                Text(
                  desc,
                  style: TextStyle(
                    fontSize: 11,
                    color: isPremium
                        ? YiShunTheme.goldPrimary.withAlpha(153)
                        : YiShunTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            isPremium ? Icons.lock_open : Icons.lock,
            size: 16,
            color: isPremium ? YiShunTheme.wuXingWood : YiShunTheme.textMuted,
          ),
        ],
      ),
    );
  }
}

// === Pricing Section ===
class _PricingSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(YiShunTheme.space5),
      decoration: YiShunTheme.cardDecoration(
        borderColor: YiShunTheme.goldPrimary.withAlpha(76),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text(
                '\$9.9',
                style: TextStyle(
                  fontSize: 44,
                  fontWeight: FontWeight.bold,
                  color: YiShunTheme.goldPrimary,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  '/月',
                  style: TextStyle(
                    fontSize: 16,
                    color: YiShunTheme.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: YiShunTheme.space2),
          Text(
            '首月体验价，之后 \$28/月',
            style: TextStyle(
              fontSize: 12,
              color: YiShunTheme.textMuted,
            ),
          ),
          const SizedBox(height: YiShunTheme.space4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _PriceTag('无限分析', YiShunTheme.wuXingWood),
              const SizedBox(width: YiShunTheme.space2),
              _PriceTag('无广告', YiShunTheme.purpleMystic),
              const SizedBox(width: YiShunTheme.space2),
              _PriceTag('年省\$268', YiShunTheme.wuXingFire),
            ],
          ),
        ],
      ),
    );
  }
}

class _PriceTag extends StatelessWidget {
  final String text;
  final Color color;

  const _PriceTag(this.text, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: YiShunTheme.space3,
        vertical: YiShunTheme.space1,
      ),
      decoration: BoxDecoration(
        color: color.withAlpha(38),
        borderRadius: BorderRadius.circular(YiShunTheme.radiusFull),
        border: Border.all(color: color.withAlpha(76)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

// === CTA Button ===
class _CTAButton extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onPressed;

  const _CTAButton({
    required this.isLoading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: YiShunTheme.goldPrimary,
          foregroundColor: YiShunTheme.backgroundDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(YiShunTheme.radiusLg),
          ),
          elevation: 0,
        ),
        child: isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: YiShunTheme.backgroundDark,
                  strokeWidth: 2.5,
                ),
              )
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '立即订阅',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(width: YiShunTheme.space2),
                  Icon(Icons.arrow_forward_rounded, size: 20),
                ],
              ),
      ),
    );
  }
}