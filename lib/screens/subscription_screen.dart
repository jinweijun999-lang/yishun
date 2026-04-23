import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/subscription_service.dart';
import '../services/analytics_service.dart';
import '../models/user_model.dart';
import '../utils/theme.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _checkSubscriptionStatus();
  }

  Future<void> _checkSubscriptionStatus() async {
    final authService = context.read<AuthService>();
    final analytics = context.read<AnalyticsService>();
    final subscriptionService = SubscriptionService(authService, analytics);

    await subscriptionService.checkSubscriptionStatus();

    if (mounted && subscriptionService.isActive) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('您已是会员！'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _subscribeMonthly() async {
    await _processSubscription(SubscriptionPlan.monthly);
  }

  Future<void> _subscribeYearly() async {
    await _processSubscription(SubscriptionPlan.yearly);
  }

  Future<void> _processSubscription(SubscriptionPlan plan) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authService = context.read<AuthService>();
      final analytics = context.read<AnalyticsService>();
      final subscriptionService = SubscriptionService(authService, analytics);

      await subscriptionService.initialize(
        'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx',
      );

      final clientSecret = await subscriptionService.createPaymentIntent(plan);

      if (clientSecret == null) {
        setState(() {
          _error = subscriptionService.error ?? '创建支付失败';
          _isLoading = false;
        });
        return;
      }

      final success = await subscriptionService.processPayment(clientSecret);

      if (success && mounted) {
        final user = context.read<UserModel>();
        user.setMemberStatus(MemberStatus.premium);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 订阅成功！欢迎成为会员！'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else {
        setState(() {
          _error = subscriptionService.error ?? '支付失败';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = '订阅错误: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
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
                    const Text(
                      '开通会员',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
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
                      // Header
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [YiShunTheme.brandInkBlue, Color(0xFF2D5280)],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withAlpha(25)),
                          boxShadow: [
                            BoxShadow(
                              color: YiShunTheme.brandInkBlue.withAlpha(128),
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
                                color: YiShunTheme.brandAmber.withAlpha(51),
                                borderRadius: BorderRadius.circular(50),
                              ),
                              child: const Text('👑', style: TextStyle(fontSize: 60)),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'YiShun 会员',
                              style: TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '解锁无限八字分析，深度命理解读',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white.withAlpha(179),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Features
                      _buildFeatureItem(Icons.all_inclusive, '无限分析', '无每日次数限制'),
                      _buildFeatureItem(Icons.history, '完整历史', '查看所有命盘记录'),
                      _buildFeatureItem(Icons.insights, '深度解读', '五行、十神、大运详解'),
                      _buildFeatureItem(Icons.adb, '无广告', '纯净无干扰体验'),

                      const SizedBox(height: 24),

                      // Pricing cards
                      _buildPricingCard(
                        title: '月卡会员',
                        price: '¥28',
                        period: '/月',
                        features: ['无限八字分析', '十神详解', '月3次合盘', '无广告'],
                        isPopular: false,
                        onSubscribe: _isLoading ? null : _subscribeMonthly,
                      ),
                      const SizedBox(height: 12),
                      _buildPricingCard(
                        title: '年卡会员',
                        price: '¥68',
                        period: '/年',
                        features: ['月卡全部功能', '月10次合盘', '优先AI解读', '节省¥268'],
                        isPopular: true,
                        onSubscribe: _isLoading ? null : _subscribeYearly,
                      ),

                      // Error message
                      if (_error != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.withAlpha(51),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.red.withAlpha(76)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline, color: Colors.red),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _error!,
                                  style: const TextStyle(color: Colors.red),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      // Loading
                      if (_isLoading) ...[
                        const SizedBox(height: 16),
                        const Center(
                          child: CircularProgressIndicator(color: YiShunTheme.brandAmber),
                        ),
                      ],

                      const SizedBox(height: 16),

                      // Restore purchases
                      TextButton(
                        onPressed: _isLoading ? null : _restorePurchases,
                        child: const Text(
                          '恢复购买',
                          style: TextStyle(color: Colors.white54),
                        ),
                      ),

                      const SizedBox(height: 8),

                      // Terms
                      Text(
                        '订阅即表示同意《会员协议》。订阅自动续费，如需取消请在到期前24小时操作。',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.white.withAlpha(102),
                        ),
                      ),
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

  Widget _buildFeatureItem(IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: YiShunTheme.brandAmber.withAlpha(25),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: YiShunTheme.brandAmber, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withAlpha(153),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(
              color: Colors.green,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check, color: Colors.white, size: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildPricingCard({
    required String title,
    required String price,
    required String period,
    required List<String> features,
    required bool isPopular,
    required VoidCallback? onSubscribe,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPopular ? YiShunTheme.brandAmber : Colors.white.withAlpha(25),
          width: isPopular ? 2 : 1,
        ),
      ),
      child: Column(
        children: [
          if (isPopular)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 6),
              decoration: const BoxDecoration(
                color: YiShunTheme.brandAmber,
                borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
              ),
              child: const Text(
                '推荐',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      price,
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: YiShunTheme.brandAmber,
                      ),
                    ),
                    Text(
                      period,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withAlpha(153),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ...features.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      const Icon(Icons.check, color: YiShunTheme.woodColor, size: 16),
                      const SizedBox(width: 8),
                      Text(f, style: TextStyle(color: Colors.white.withAlpha(179))),
                    ],
                  ),
                )),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: onSubscribe,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isPopular
                          ? YiShunTheme.brandAmber
                          : YiShunTheme.brandCinnabar,
                      foregroundColor: isPopular ? Colors.black : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      '立即开通',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _restorePurchases() async {
    setState(() => _isLoading = true);

    try {
      final authService = context.read<AuthService>();
      final analytics = context.read<AnalyticsService>();
      final subscriptionService = SubscriptionService(authService, analytics);

      final success = await subscriptionService.restorePurchases();

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('购买恢复成功！'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else {
        setState(() {
          _error = '未找到之前的购买记录';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = '恢复失败: $e';
        _isLoading = false;
      });
    }
  }
}