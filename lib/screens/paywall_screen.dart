import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user_model.dart';
import '../services/analytics_service.dart';
import '../utils/theme.dart';
import '../widgets/decorations.dart';

class PaywallScreen extends StatefulWidget {
  const PaywallScreen({super.key});

  @override
  State<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends State<PaywallScreen> {
  bool _isLoading = false;
  int _selectedPlan = 1;

  final _plans = const [
    {
      'name': '月卡',
      'price': '¥28',
      'period': '/月',
      'desc': '随时取消',
    },
    {
      'name': '年卡',
      'price': '¥68',
      'period': '/年',
      'desc': '省 ¥268',
      'badge': '推荐',
    },
  ];

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
        SnackBar(
          content: const Text('🎉 订阅成功！欢迎成为会员'),
          backgroundColor: YiShunTheme.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
          ),
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: YiShunTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: YiShunTheme.spaceMd,
                vertical: YiShunTheme.spaceSm,
              ),
              child: Row(
                children: [
                  AppIconBtn(
                    icon: Icons.arrow_back,
                    onTap: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: YiShunTheme.spaceSm),
                  const Text(
                    '开通会员',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: YiShunTheme.onSurface,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),

            const ThinDivider(),

            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: YiShunTheme.pagePadding,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: YiShunTheme.spaceLg),

                    // Crown icon
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: YiShunTheme.primary.withAlpha(20),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: YiShunTheme.primary.withAlpha(51),
                        ),
                      ),
                      child: const Center(
                        child: Text('👑', style: TextStyle(fontSize: 36)),
                      ),
                    ),
                    const SizedBox(height: YiShunTheme.spaceLg),

                    // Title
                    const Text(
                      '易顺高级会员',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: YiShunTheme.primary,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '解锁全部高级功能',
                      style: TextStyle(
                        fontSize: 14,
                        color: YiShunTheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: YiShunTheme.spaceXl),

                    // Plan Cards
                    Row(
                      children: _plans.asMap().entries.map((entry) {
                        final i = entry.key;
                        final plan = entry.value;
                        final isSelected = _selectedPlan == i;

                        return Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _selectedPlan = i),
                            child: Container(
                              margin: EdgeInsets.only(left: i == 0 ? 0 : 8),
                              padding: const EdgeInsets.all(YiShunTheme.spaceMd),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? YiShunTheme.primary.withAlpha(15)
                                    : YiShunTheme.surfaceContainerLowest,
                                borderRadius:
                                    BorderRadius.circular(YiShunTheme.radiusMd),
                                border: Border.all(
                                  color: isSelected
                                      ? YiShunTheme.primary
                                      : YiShunTheme.cardBorder,
                                  width: isSelected ? 1.5 : 1,
                                ),
                              ),
                              child: Column(
                                children: [
                                  if (plan['badge'] != null) ...[
                                    Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: YiShunTheme.primary,
                                        borderRadius: BorderRadius.circular(
                                          YiShunTheme.radiusSm,
                                        ),
                                      ),
                                      child: Text(
                                        plan['badge']!,
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: YiShunTheme.onPrimary,
                                        ),
                                      ),
                                    ),
                                  ],
                                  Text(
                                    plan['name']!,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: YiShunTheme.onSurface,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    plan['price']!,
                                    style: const TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.bold,
                                      color: YiShunTheme.primary,
                                    ),
                                  ),
                                  Text(
                                    plan['period']!,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: YiShunTheme.onSurfaceVariant,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    plan['desc']!,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: YiShunTheme.outline,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: YiShunTheme.spaceXl),

                    // Privileges
                    OriCard(
                      padding: const EdgeInsets.all(YiShunTheme.cardPadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            '会员特权',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: YiShunTheme.onSurface,
                            ),
                          ),
                          SizedBox(height: YiShunTheme.spaceMd),
                          _PrivilegeItem(text: '无限次八字分析'),
                          _PrivilegeItem(text: '双人合盘无限次'),
                          _PrivilegeItem(text: '大运流年完整解读'),
                          _PrivilegeItem(text: '十神详解深度分析'),
                          _PrivilegeItem(text: '无广告干扰'),
                        ],
                      ),
                    ),
                    const SizedBox(height: YiShunTheme.spaceXl),

                    // Subscribe Button
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _subscribe,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: YiShunTheme.primary,
                          foregroundColor: YiShunTheme.onPrimary,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(YiShunTheme.radiusSm),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  color: YiShunTheme.onPrimary,
                                  strokeWidth: 2.5,
                                ),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: const [
                                  Text(
                                    '立即订阅',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  SizedBox(width: 8),
                                  Icon(Icons.arrow_forward_rounded, size: 20),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: YiShunTheme.spaceMd),

                    // Disclaimer
                    const Text(
                      '订阅即表示同意《会员协议》，自动续费，\n如需取消请在到期前24小时操作。',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11,
                        color: YiShunTheme.outline,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: YiShunTheme.spaceXl),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PrivilegeItem extends StatelessWidget {
  final String text;

  const _PrivilegeItem({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              color: YiShunTheme.primary.withAlpha(25),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Icon(
                Icons.check,
                size: 12,
                color: YiShunTheme.primary,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              color: YiShunTheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
