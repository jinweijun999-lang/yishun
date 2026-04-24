import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user_model.dart';
import '../services/analytics_service.dart';
import '../utils/theme.dart';

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

    // Simulate subscription process
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      final user = context.read<UserModel>();
      user.setMemberStatus(MemberStatus.premium);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🎉 订阅成功！欢迎成为会员！'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
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
                    const Expanded(
                      child: Text(
                        '解锁高级功能',
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
                      // Header Card
                      _buildHeaderCard(),
                      const SizedBox(height: 24),

                      // Free vs Premium Comparison
                      _buildComparisonSection(),
                      const SizedBox(height: 24),

                      // Pricing Section
                      _buildPricingSection(),
                      const SizedBox(height: 24),

                      // CTA Button
                      _buildCTAButton(),
                      const SizedBox(height: 16),

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

  Widget _buildHeaderCard() {
    return Container(
      padding: const EdgeInsets.all(24),
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
            child: const Text('👑', style: TextStyle(fontSize: 50)),
          ),
          const SizedBox(height: 16),
          const Text(
            'YiShun 高级会员',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '解锁全部高级功能，开启完整命理之旅',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withAlpha(179),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComparisonSection() {
    final freeFeatures = [
      {'icon': '☯️', 'title': '四柱排盘', 'desc': '每日1次'},
      {'icon': '📜', 'title': '基础命理', 'desc': '3项分析'},
      {'icon': '📚', 'title': '命理知识', 'desc': '免费阅读'},
    ];

    final premiumFeatures = [
      {'icon': '☯️', 'title': '无限八字分析', 'desc': '无限制'},
      {'icon': '💑', 'title': '双人合盘', 'desc': '无限次'},
      {'icon': '📜', 'title': '大运流年', 'desc': '完整解读'},
      {'icon': '🔮', 'title': '十神详解', 'desc': '深度分析'},
      {'icon': '⚖️', 'title': '五行分析', 'desc': '完整雷达'},
      {'icon': '👑', 'title': '专属客服', 'desc': '优先响应'},
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Column(
        children: [
          // Free tier header
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(13),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            ),
            child: const Center(
              child: Text(
                '免费版',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: freeFeatures.map((f) => _buildFeatureRow(
                f['icon'] as String,
                f['title'] as String,
                f['desc'] as String,
                false,
              )).toList(),
            ),
          ),
          const Divider(color: Colors.white24),
          // Premium tier header
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: YiShunTheme.brandAmber.withAlpha(25),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            ),
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: YiShunTheme.brandCinnabar,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'PRO',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    '高级版',
                    style: TextStyle(
                      color: YiShunTheme.brandAmber,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: premiumFeatures.map((f) => _buildFeatureRow(
                f['icon'] as String,
                f['title'] as String,
                f['desc'] as String,
                true,
              )).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureRow(String icon, String title, String desc, bool isPremium) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isPremium
                  ? YiShunTheme.brandAmber.withAlpha(25)
                  : Colors.white.withAlpha(13),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(icon, style: const TextStyle(fontSize: 18)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isPremium ? Colors.white : Colors.white70,
                  ),
                ),
                Text(
                  desc,
                  style: TextStyle(
                    fontSize: 11,
                    color: isPremium
                        ? YiShunTheme.brandAmber.withAlpha(179)
                        : Colors.white.withAlpha(102),
                  ),
                ),
              ],
            ),
          ),
          Icon(
            isPremium ? Icons.lock_open : Icons.lock,
            size: 16,
            color: isPremium ? YiShunTheme.woodColor : Colors.white38,
          ),
        ],
      ),
    );
  }

  Widget _buildPricingSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: YiShunTheme.brandAmber.withAlpha(76)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '\$9.9',
                style: const TextStyle(
                  fontSize: 42,
                  fontWeight: FontWeight.bold,
                  color: YiShunTheme.brandAmber,
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(bottom: 6),
                child: Text(
                  '/月',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '首月体验价，之后 \$28/月',
            style: TextStyle(
              fontSize: 12,
              color: Colors.white.withAlpha(153),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildPricingTag('无限分析', YiShunTheme.woodColor),
              const SizedBox(width: 8),
              _buildPricingTag('无广告', YiShunTheme.brandInkBlue),
              const SizedBox(width: 8),
              _buildPricingTag('年省\$268', YiShunTheme.brandCinnabar),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPricingTag(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(51),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(76)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildCTAButton() {
    return SizedBox(
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _subscribe,
        style: ElevatedButton.styleFrom(
          backgroundColor: YiShunTheme.brandAmber,
          foregroundColor: Colors.black,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 8,
          shadowColor: YiShunTheme.brandAmber.withAlpha(128),
        ),
        child: _isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: Colors.black,
                  strokeWidth: 2,
                ),
              )
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '立即订阅',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward_rounded),
                ],
              ),
      ),
    );
  }
}
