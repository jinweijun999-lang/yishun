import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user_model.dart';
import '../services/analytics_service.dart';
import '../utils/theme.dart';

class MembershipScreen extends StatefulWidget {
  const MembershipScreen({super.key});

  @override
  State<MembershipScreen> createState() => _MembershipScreenState();
}

class _MembershipScreenState extends State<MembershipScreen> {
  bool _isLoading = false;

  // Mock subscription history
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

    // Simulate renewal process
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ 续费成功！'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _cancelSubscription() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: YiShunTheme.surfaceDark,
        title: const Text('取消订阅', style: TextStyle(color: Colors.white)),
        content: const Text(
          '确定要取消订阅吗？取消后您将无法享受会员特权。',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('继续订阅'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('确认取消', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _isLoading = true);

      // Simulate cancellation process
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        final user = context.read<UserModel>();
        user.setMemberStatus(MemberStatus.free);

        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('订阅已取消'),
            backgroundColor: Colors.orange,
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
      backgroundColor: YiShunTheme.surfaceDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: YiShunTheme.primaryGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // App Bar
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(25),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.arrow_back, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Text(
                        '会员中心',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Membership Status Card
                      _buildStatusCard(isPremium, user),
                      const SizedBox(height: 24),

                      // Subscription Info
                      if (isPremium) ...[
                        _buildSubscriptionInfoCard(user),
                        const SizedBox(height: 24),

                        // Action Buttons
                        _buildActionButtons(),
                        const SizedBox(height: 24),
                      ],

                      // Subscription History
                      _buildHistorySection(),
                      const SizedBox(height: 32),
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

  Widget _buildStatusCard(bool isPremium, UserModel user) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isPremium
              ? [YiShunTheme.brandAmber, YiShunTheme.brandAmber.withAlpha(204)]
              : [YiShunTheme.brandInkBlue, const Color(0xFF2D5280)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withAlpha(25)),
        boxShadow: [
          BoxShadow(
            color: (isPremium ? YiShunTheme.brandAmber : YiShunTheme.brandInkBlue)
                .withAlpha(128),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(51),
              borderRadius: BorderRadius.circular(50),
            ),
            child: Text(
              isPremium ? '👑' : '🆓',
              style: const TextStyle(fontSize: 50),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isPremium ? '高级会员' : '免费用户',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isPremium
                ? '您正在享受会员特权'
                : '升级到高级版解锁全部功能',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withAlpha(179),
            ),
          ),
          if (!isPremium) ...[
            const SizedBox(height: 20),
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/paywall'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: YiShunTheme.brandAmber,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  '立即升级',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSubscriptionInfoCard(UserModel user) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Column(
        children: [
          _buildInfoRow('当前计划', '年卡会员'),
          const Divider(color: Colors.white24),
          _buildInfoRow('到期时间', '2027-03-25'),
          const Divider(color: Colors.white24),
          _buildInfoRow('续费方式', '自动续费'),
          const Divider(color: Colors.white24),
          _buildInfoRow('下次扣款', '\$28.00'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withAlpha(153),
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _renewSubscription,
              style: ElevatedButton.styleFrom(
                backgroundColor: YiShunTheme.brandAmber,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.black,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      '立即续费',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: SizedBox(
            height: 48,
            child: OutlinedButton(
              onPressed: _isLoading ? null : _cancelSubscription,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white38),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('取消订阅'),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHistorySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.history, color: Colors.white70, size: 20),
            SizedBox(width: 8),
            Text(
              '订阅历史',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(13),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withAlpha(25)),
          ),
          child: Column(
            children: _subscriptionHistory.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return Column(
                children: [
                  if (index > 0) const Divider(color: Colors.white24, height: 1),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: YiShunTheme.brandInkBlue.withAlpha(51),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.receipt_long,
                            color: Colors.white70,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['plan']!,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                item['date']!,
                                style: TextStyle(
                                  color: Colors.white.withAlpha(102),
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
                              style: const TextStyle(
                                color: YiShunTheme.brandAmber,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.green.withAlpha(51),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                item['status']!,
                                style: const TextStyle(
                                  color: Colors.green,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
