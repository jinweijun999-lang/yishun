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

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _dailyFortune;
  bool _isLoadingFortune = true;

  @override
  void initState() {
    super.initState();
    _loadDailyFortune();
    _logScreenView();
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
      backgroundColor: YiShunTheme.surfaceLight,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // App Bar
            SliverAppBar(
              floating: true,
              backgroundColor: YiShunTheme.primaryColor,
              title: Row(
                children: [
                  const Text('☯️', style: TextStyle(fontSize: 24)),
                  const SizedBox(width: 8),
                  const Text(
                    'YiShun Fortune',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
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
                    // Daily Fortune Card
                    _buildDailyFortuneCard(),
                    const SizedBox(height: 24),

                    // Quick Actions
                    const Text(
                      'Features',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildFeatureGrid(),
                    const SizedBox(height: 24),

                    // Lucky Numbers
                    _buildLuckyNumbersCard(),
                    const SizedBox(height: 24),

                    // Premium CTA
                    _buildPremiumCTA(),
                  ],
                ),
              ),
            ),
          ],
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
          colors: [YiShunTheme.primaryColor, Color(0xFFFF8C5A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: YiShunTheme.primaryColor.withAlpha(76),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '☀️ 今日运势',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(51),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _dailyFortune?['god_of_day'] ?? '青龙',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isLoadingFortune)
            const Center(
              child: CircularProgressIndicator(color: Colors.white),
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
          Row(
            children: [
              _buildFortuneChip(
                '🎨',
                _dailyFortune?['lucky_color'] ?? '红色',
              ),
              const SizedBox(width: 8),
              _buildFortuneChip(
                '🔢',
                '${_dailyFortune?['lucky_number'] ?? 8}',
              ),
              const SizedBox(width: 8),
              _buildFortuneChip(
                '🧭',
                '${_dailyFortune?['lucky_direction'] ?? '东'}方',
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
        color: Colors.white.withAlpha(51),
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
      {'icon': '☯️', 'title': '八字排盘', 'desc': '四柱八字分析', 'color': Colors.blue, 'route': '/divination'},
      {'icon': '⚖️', 'title': '五行分析', 'desc': '五行旺缺分析', 'color': Colors.green, 'route': '/divination'},
      {'icon': '💑', 'title': '合盘配对', 'desc': '双人合盘分析', 'color': Colors.orange, 'route': '/compatibility'},
      {'icon': '📜', 'title': '历史记录', 'desc': '查看历史', 'color': Colors.purple, 'route': '/history'},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.3,
      ),
      itemCount: features.length,
      itemBuilder: (context, index) {
        final feature = features[index];
        return _buildFeatureCard(
          feature['icon'] as String,
          feature['title'] as String,
          feature['desc'] as String,
          feature['color'] as Color,
          feature['route'] as String,
        );
      },
    );
  }

  Widget _buildFeatureCard(String emoji, String title, String desc, Color color, String route) {
    return GestureDetector(
      onTap: () {
        if (route == '/divination') {
          // Navigate to divination tab
          DefaultTabController.of(context).animateTo(1);
        } else {
          Navigator.pushNamed(context, route);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withAlpha(25),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withAlpha(25),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(emoji, style: const TextStyle(fontSize: 24)),
            ),
            const Spacer(),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              desc,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLuckyNumbersCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withAlpha(25),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '🔢 幸运数字',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(5, (i) {
              final num = (_dailyFortune?['lucky_number'] ?? 8) + i;
              return Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: YiShunTheme.primaryColor.withAlpha(25),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    '${num % 10}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: YiShunTheme.primaryColor,
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
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
            YiShunTheme.secondaryColor,
            YiShunTheme.secondaryColor.withAlpha(204),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
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
                  'Unlock Premium',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '\$9.9/month - All features',
                  style: TextStyle(
                    color: Colors.white.withAlpha(179),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: YiShunTheme.accentColor,
              foregroundColor: Colors.black,
            ),
            child: const Text('Subscribe'),
          ),
        ],
      ),
    );
  }
}
