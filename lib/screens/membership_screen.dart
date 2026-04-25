import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user_model.dart';
import '../services/analytics_service.dart';
import '../utils/theme.dart';
import '../widgets/decorations.dart';

/// 会员管理界面
/// 神秘东方色彩，玄学风格
class MembershipScreen extends StatefulWidget {
  const MembershipScreen({super.key});

  @override
  State<MembershipScreen> createState() => _MembershipScreenState();
}

class _MembershipScreenState extends State<MembershipScreen> {
  bool _isLoading = false;

  final List<Map<String, String>> _subscriptionHistory = [
    {'date': '2026-03-25', 'plan': '年卡会员', 'amount': '¥68', 'status': '已完成'},
    {'date': '2025-03-25', 'plan': '年卡会员', 'amount': '¥68', 'status': '已完成'},
    {'date': '2024-03-25', 'plan': '月卡会员', 'amount': '¥28', 'status': '已完成'},
  ];

  @override
  void initState() {
    super.initState();
    context.read<AnalyticsService>().logScreenView(screenName: 'MembershipScreen');
  }

  Future<void> _renewSubscription() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('✅ 续费成功！'),
          backgroundColor: YiShunTheme.success,
        ),
      );
    }
  }

  Future<void> _cancelSubscription() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: YiShunTheme.backgroundMid,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(YiShunTheme.radiusLg),
        ),
        title: const Text(
          '取消订阅',
          style: TextStyle(color: YiShunTheme.textPrimary),
        ),
        content: const Text(
          '确定要取消订阅吗？取消后您将无法享受会员特权。',
          style: TextStyle(color: YiShunTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('继续订阅'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              '确认取消',
              style: TextStyle(color: YiShunTheme.error),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _isLoading = true);
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        context.read<UserModel>().setMemberStatus(MemberStatus.free);
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('订阅已取消'),
            backgroundColor: YiShunTheme.warning,
          ),
        );
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<UserModel>();
    final isPremium = user.isPremium;

    return Scaffold(
      backgroundColor: YiShunTheme.backgroundDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: YiShunTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // 顶部装饰
              const MysticTopDecoration(height: 80),

              // App Bar
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: YiShunTheme.space4,
                ),
                child: Row(
                  children: [
                    MysticIconBtn(
                      icon: Icons.arrow_back,
                      onTap: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: YiShunTheme.space4),
                    const Expanded(
                      child: Text(
                        '会员中心',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: YiShunTheme.textPrimary,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: YiShunTheme.space4),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(YiShunTheme.space4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Status Card
                      _StatusCard(isPremium: isPremium, user: user),
                      const SizedBox(height: YiShunTheme.space5),

                      if (isPremium) ...[
                        _SubscriptionInfoCard(),
                        const SizedBox(height: YiShunTheme.space5),
                        _ActionButtons(
                          isLoading: _isLoading,
                          onRenew: _renewSubscription,
                          onCancel: _cancelSubscription,
                        ),
                        const SizedBox(height: YiShunTheme.space5),
                      ],

                      // History Section
                      _HistorySection(history: _subscriptionHistory),
                      const SizedBox(height: YiShunTheme.space5),

                      // Family Plan Entry
                      _FamilyPlanEntry(
                        onTap: () => Navigator.pushNamed(context, '/family'),
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

// === Status Card ===
class _StatusCard extends StatelessWidget {
  final bool isPremium;
  final UserModel user;

  const _StatusCard({required this.isPremium, required this.user});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(YiShunTheme.space6),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isPremium
              ? [
                  YiShunTheme.goldPrimary,
                  YiShunTheme.goldPrimary.withAlpha(204),
                ]
              : [
                  YiShunTheme.purpleMystic,
                  YiShunTheme.backgroundLight,
                ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(YiShunTheme.radiusXl),
        border: Border.all(color: Colors.white.withAlpha(25)),
        boxShadow: YiShunTheme.shadowLg(
          isPremium ? YiShunTheme.goldPrimary : YiShunTheme.purpleMystic,
        ),
      ),
      child: Column(
        children: [
          // 光晕效果
          Container(
            padding: const EdgeInsets.all(YiShunTheme.space4),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(38),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.white.withAlpha(25),
                  blurRadius: 20,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Text(
              isPremium ? '👑' : '🆓',
              style: const TextStyle(fontSize: 52),
            ),
          ),
          const SizedBox(height: YiShunTheme.space4),

          Text(
            isPremium ? '高级会员' : '免费用户',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: isPremium
                  ? YiShunTheme.backgroundDark
                  : YiShunTheme.textPrimary,
              letterSpacing: 3,
            ),
          ),
          const SizedBox(height: YiShunTheme.space2),

          Text(
            isPremium ? '您正在享受会员特权' : '升级到高级版解锁全部功能',
            style: TextStyle(
              fontSize: 13,
              color: isPremium
                  ? YiShunTheme.backgroundDark.withAlpha(179)
                  : YiShunTheme.textSecondary,
            ),
          ),

          if (!isPremium) ...[
            const SizedBox(height: YiShunTheme.space5),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/paywall'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: YiShunTheme.goldPrimary,
                  foregroundColor: YiShunTheme.backgroundDark,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                  ),
                ),
                child: const Text(
                  '立即升级',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// === Subscription Info Card ===
class _SubscriptionInfoCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MysticCard(
      padding: const EdgeInsets.all(YiShunTheme.space5),
      child: Column(
        children: [
          _InfoRow(label: '当前计划', value: '年卡会员'),
          Container(
            height: 1,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  Colors.white.withAlpha(25),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          _InfoRow(label: '到期时间', value: '2027-03-25'),
          Container(
            height: 1,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  Colors.white.withAlpha(25),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          _InfoRow(label: '续费方式', value: '自动续费'),
          Container(
            height: 1,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  Colors.white.withAlpha(25),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          _InfoRow(
            label: '下次扣款',
            value: '\$28.00',
            valueColor: YiShunTheme.goldPrimary,
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: YiShunTheme.space1),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(
                Icons.circle,
                size: 6,
                color: YiShunTheme.textMuted.withAlpha(127),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: YiShunTheme.textMuted,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          Text(
            value,
            style: TextStyle(
              color: valueColor ?? YiShunTheme.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// === Action Buttons ===
class _ActionButtons extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onRenew;
  final VoidCallback onCancel;

  const _ActionButtons({
    required this.isLoading,
    required this.onRenew,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: isLoading ? null : onRenew,
              style: ElevatedButton.styleFrom(
                backgroundColor: YiShunTheme.goldPrimary,
                foregroundColor: YiShunTheme.backgroundDark,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                ),
              ),
              child: isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: YiShunTheme.backgroundDark,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      '立即续费',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
            ),
          ),
        ),
        const SizedBox(width: YiShunTheme.space3),
        Expanded(
          child: SizedBox(
            height: 52,
            child: OutlinedButton(
              onPressed: isLoading ? null : onCancel,
              style: OutlinedButton.styleFrom(
                foregroundColor: YiShunTheme.textSecondary,
                side: BorderSide(color: YiShunTheme.textMuted),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                ),
              ),
              child: const Text('取消订阅'),
            ),
          ),
        ),
      ],
    );
  }
}

// === History Section ===
class _HistorySection extends StatelessWidget {
  final List<Map<String, String>> history;

  const _HistorySection({required this.history});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MysticTitle(
          title: '订阅历史',
          subtitle: '',
          icon: Icons.history,
          showDivider: true,
        ),
        const SizedBox(height: YiShunTheme.space3),

        MysticCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: history.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return Column(
                children: [
                  if (index > 0)
                    Container(
                      height: 1,
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Colors.white.withAlpha(13),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  _HistoryItem(item: item),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _HistoryItem extends StatelessWidget {
  final Map<String, String> item;

  const _HistoryItem({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(YiShunTheme.space4),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(YiShunTheme.space3),
            decoration: BoxDecoration(
              color: YiShunTheme.purpleMystic.withAlpha(38),
              borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
            ),
            child: Icon(
              Icons.receipt_long,
              color: YiShunTheme.purpleMystic.withAlpha(179),
              size: 20,
            ),
          ),
          const SizedBox(width: YiShunTheme.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['plan']!,
                  style: const TextStyle(
                    color: YiShunTheme.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item['date']!,
                  style: TextStyle(
                    color: YiShunTheme.textMuted,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                item['amount']!,
                style: TextStyle(
                  color: YiShunTheme.goldPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: YiShunTheme.space2,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: YiShunTheme.success.withAlpha(38),
                  borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
                ),
                child: Text(
                  item['status']!,
                  style: const TextStyle(
                    color: YiShunTheme.success,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// === Family Plan Entry ===
class _FamilyPlanEntry extends StatelessWidget {
  final VoidCallback onTap;

  const _FamilyPlanEntry({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: MysticCard(
        borderColor: YiShunTheme.goldPrimary.withAlpha(38),
        padding: const EdgeInsets.all(YiShunTheme.space5),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(YiShunTheme.space3),
              decoration: BoxDecoration(
                color: YiShunTheme.goldPrimary.withAlpha(38),
                borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                border: Border.all(
                  color: YiShunTheme.goldPrimary.withAlpha(76),
                ),
              ),
              child: Icon(
                Icons.family_restroom,
                color: YiShunTheme.goldPrimary,
                size: 24,
              ),
            ),
            const SizedBox(width: YiShunTheme.space4),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '家庭计划',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: YiShunTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '邀请家人共享高级功能',
                    style: TextStyle(
                      fontSize: 13,
                      color: YiShunTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: YiShunTheme.textMuted,
            ),
          ],
        ),
      ),
    );
  }
}
