import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/analytics_service.dart';
import '../models/user_model.dart';
import '../utils/theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  Map<String, dynamic>? _dailyFortune;
  bool _isLoadingFortune = true;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: YiShunTheme.animSlow,
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _fadeController.forward();
    _loadDailyFortune();
    _logScreenView();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  void _logScreenView() {
    context.read<AnalyticsService>().logScreenView(screenName: 'HomeScreen');
  }

  Future<void> _loadDailyFortune() async {
    final authService = context.read<AuthService>();
    final apiService = ApiService(authService);

    try {
      final fortune = await apiService.getDailyFortune();
      setState(() {
        _dailyFortune = fortune;
        _isLoadingFortune = false;
      });
    } catch (e) {
      setState(() => _isLoadingFortune = false);
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
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: CustomScrollView(
              slivers: [
                // App Bar
                SliverAppBar(
                  floating: true,
                  backgroundColor: Colors.transparent,
                  title: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(25),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text('☯️', style: TextStyle(fontSize: 20)),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'YiShun 易顺',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                  actions: [
                    IconButton(
                      icon: const Icon(Icons.notifications_outlined, color: Colors.white70),
                      onPressed: () {},
                    ),
                    IconButton(
                      icon: const Icon(Icons.settings_outlined, color: Colors.white70),
                      onPressed: () {},
                    ),
                  ],
                ),

                // Content
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Daily Fortune Card - 新东方美学风格
                        _buildDailyFortuneCard(),
                        const SizedBox(height: 24),

                        // Section title
                        const Text(
                          '功能入口',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Feature Grid
                        _buildFeatureGrid(),
                        const SizedBox(height: 24),

                        // 五行相生相克 Quick View
                        _buildWuxingCycleCard(),
                        const SizedBox(height: 24),

                        // Premium CTA
                        _buildPremiumCTA(),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDailyFortuneCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [YiShunTheme.brandInkBlue, Color(0xFF2D5280)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Text('🌙', style: TextStyle(fontSize: 18)),
                  SizedBox(width: 8),
                  Text(
                    '今日运势',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(25),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _dailyFortune?['god_of_day'] ?? '青龙',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // 农历日期
          Text(
            _dailyFortune?['lunar_date'] ?? '甲辰年 · 三月初五',
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 16),
          if (_isLoadingFortune)
            const Center(
              child: SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              ),
            )
          else
            Text(
              _dailyFortune?['summary'] ?? '今日运势较好，适合做重要决定',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                height: 1.5,
              ),
            ),
          const SizedBox(height: 16),
          // 五行标签
          Row(
            children: [
              _buildFortuneChip('🎨', _dailyFortune?['lucky_color'] ?? '青'),
              const SizedBox(width: 8),
              _buildFortuneChip('🔢', '${_dailyFortune?['lucky_number'] ?? 8}'),
              const SizedBox(width: 8),
              _buildFortuneChip('🧭', '东方'),
            ],
          ),
          const SizedBox(height: 12),
          // 宜忌
          Row(
            children: [
              const Text('宜', style: TextStyle(color: YiShunTheme.woodColor, fontSize: 12)),
              const SizedBox(width: 8),
              Text(
                _dailyFortune?['yi'] ?? '出行·求财',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(width: 16),
              const Text('忌', style: TextStyle(color: YiShunTheme.fireColor, fontSize: 12)),
              const SizedBox(width: 8),
              Text(
                _dailyFortune?['ji'] ?? '搬家·动土',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFortuneChip(String emoji, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(25),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 12)),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureGrid() {
    final features = [
      {
        'icon': '☯️', 'title': '四柱排盘', 'desc': '完整八字分析',
        'color': YiShunTheme.brandInkBlue, 'wuxing': '水',
        'route': '/divination'
      },
      {
        'icon': '⚖️', 'title': '五行分析', 'desc': '五行旺缺雷达',
        'color': YiShunTheme.woodColor, 'wuxing': '木',
        'route': '/divination'
      },
      {
        'icon': '💑', 'title': '双人合盘', 'desc': '姻缘事业契合',
        'color': YiShunTheme.fireColor, 'wuxing': '火',
        'route': '/compatibility'
      },
      {
        'icon': '📜', 'title': '大运流年', 'desc': '十年运势走向',
        'color': YiShunTheme.earthColor, 'wuxing': '土',
        'route': '/divination'
      },
      {
        'icon': '🔮', 'title': '十神详解', 'desc': '关系图谱分析',
        'color': YiShunTheme.metalColor, 'wuxing': '金',
        'route': '/ten_gods_guide'
      },
      {
        'icon': '📚', 'title': '命理知识', 'desc': '了解五行十神',
        'color': YiShunTheme.waterColor, 'wuxing': '水',
        'route': '/ten_gods_guide'
      },
      {
        'icon': '🗓', 'title': '深度报告', 'desc': '流年姻缘事业',
        'color': YiShunTheme.brandCinnabar, 'wuxing': '火',
        'route': '/report_purchase'
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.2,
      ),
      itemCount: features.length,
      itemBuilder: (context, index) {
        final feature = features[index];
        return _buildFeatureCard(
          feature['icon'] as String,
          feature['title'] as String,
          feature['desc'] as String,
          feature['color'] as Color,
          feature['wuxing'] as String,
          feature['route'] as String,
        );
      },
    );
  }

  Widget _buildFeatureCard(String emoji, String title, String desc, Color color, String wuxing, String route) {
    return GestureDetector(
      onTap: () {
        // Check if this is a premium feature
        final isPremiumFeature = ['☯️', '⚖️', '💑', '📜', '🔮'].contains(emoji);
        final user = context.read<UserModel>();
        
        // Redirect free users to paywall for premium features
        if (isPremiumFeature && !user.isPremium) {
          Navigator.pushNamed(context, '/paywall');
          return;
        }
        
        if (route == '/divination') {
          DefaultTabController.of(context).animateTo(1);
        } else {
          Navigator.pushNamed(context, route);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withAlpha(25),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withAlpha(76)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withAlpha(38),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(emoji, style: const TextStyle(fontSize: 22)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withAlpha(51),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    wuxing,
                    style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              desc,
              style: TextStyle(
                color: Colors.white.withAlpha(153),
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWuxingCycleCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text('✦', style: TextStyle(fontSize: 16, color: YiShunTheme.brandAmber)),
              SizedBox(width: 8),
              Text(
                '五行相生相克',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // 相生
          Row(
            children: [
              const Text('相生', style: TextStyle(color: YiShunTheme.woodColor, fontSize: 12)),
              const SizedBox(width: 8),
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: YiShunTheme.wuxingCycle.map((w) {
                    return Column(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: YiShunTheme.getWuxingColor(w).withAlpha(51),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: YiShunTheme.getWuxingColor(w).withAlpha(128),
                            ),
                          ),
                          child: Center(
                            child: Text(
                              w,
                              style: TextStyle(
                                color: YiShunTheme.getWuxingColor(w),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        if (w != '水')
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Icon(
                              Icons.arrow_forward,
                              size: 12,
                              color: Colors.white.withAlpha(76),
                            ),
                          ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // 相克
          Row(
            children: [
              const Text('相克', style: TextStyle(color: YiShunTheme.fireColor, fontSize: 12)),
              const SizedBox(width: 8),
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildWuXingKeItem('金', '木'),
                    _buildWuXingKeItem('木', '土'),
                    _buildWuXingKeItem('土', '水'),
                    _buildWuXingKeItem('水', '火'),
                    _buildWuXingKeItem('火', '金'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWuXingKeItem(String from, String to) {
    return Column(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: YiShunTheme.getWuxingColor(from).withAlpha(51),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: YiShunTheme.getWuxingColor(from).withAlpha(128),
            ),
          ),
          child: Center(
            child: Text(
              from,
              style: TextStyle(
                color: YiShunTheme.getWuxingColor(from),
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Icon(
            Icons.remove,
            size: 12,
            color: Colors.white.withAlpha(76),
          ),
        ),
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: YiShunTheme.getWuxingColor(to).withAlpha(51),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: YiShunTheme.getWuxingColor(to).withAlpha(128),
            ),
          ),
          child: Center(
            child: Text(
              to,
              style: TextStyle(
                color: YiShunTheme.getWuxingColor(to),
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPremiumCTA() {
    final user = context.watch<UserModel>();
    if (user.isPremium) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            YiShunTheme.brandCinnabar,
            YiShunTheme.brandCinnabar.withAlpha(204),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: YiShunTheme.brandCinnabar.withAlpha(76),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          const Text('👑', style: TextStyle(fontSize: 40)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '解锁完整功能',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '\$9.9/月起 - 无限八字分析',
                  style: TextStyle(
                    color: Colors.white.withAlpha(179),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/paywall'),
            style: ElevatedButton.styleFrom(
              backgroundColor: YiShunTheme.brandAmber,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            child: const Text('开通会员', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}