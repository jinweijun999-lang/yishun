import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/analytics_service.dart';
import '../models/user_model.dart';
import '../utils/theme.dart';

/// 八字排盘主界面 - 首页
/// 神秘东方色彩，玄学风格
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
      backgroundColor: YiShunTheme.backgroundDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: YiShunTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: CustomScrollView(
              slivers: [
                // === App Bar ===
                SliverAppBar(
                  floating: true,
                  backgroundColor: Colors.transparent,
                  title: Row(
                    children: [
                      // 太极图标
                      Container(
                        padding: const EdgeInsets.all(YiShunTheme.space2),
                        decoration: BoxDecoration(
                          color: YiShunTheme.goldPrimary.withAlpha(25),
                          borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                          border: Border.all(
                            color: YiShunTheme.goldPrimary.withAlpha(51),
                          ),
                        ),
                        child: const Text('☯️', style: TextStyle(fontSize: 18)),
                      ),
                      const SizedBox(width: YiShunTheme.space3),
                      const Text(
                        '易顺',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: YiShunTheme.textPrimary,
                          fontSize: 20,
                          letterSpacing: 2,
                        ),
                      ),
                    ],
                  ),
                  actions: [
                    _IconBtn(
                      icon: Icons.notifications_outlined,
                      onTap: () {},
                    ),
                    _IconBtn(
                      icon: Icons.settings_outlined,
                      onTap: () {},
                    ),
                    const SizedBox(width: YiShunTheme.space2),
                  ],
                ),

                // === Content ===
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(YiShunTheme.space4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 今日运势卡片
                        _DailyFortuneCard(
                          fortune: _dailyFortune,
                          isLoading: _isLoadingFortune,
                        ),
                        const SizedBox(height: YiShunTheme.space6),

                        // 功能入口标题
                        _SectionTitle(
                          icon: '⚡',
                          title: '命理服务',
                          subtitle: '探索命运的奥秘',
                        ),
                        const SizedBox(height: YiShunTheme.space3),

                        // 功能网格
                        _FeatureGrid(),
                        const SizedBox(height: YiShunTheme.space6),

                        // 五行相生相克
                        _WuXingCycleCard(),
                        const SizedBox(height: YiShunTheme.space6),

                        // 高级会员 CTA
                        _PremiumCTA(),
                        const SizedBox(height: YiShunTheme.space8),
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
}

// === 小组件 ===

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _IconBtn({required this.icon, required this.onTap});

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
        child: Icon(icon, color: YiShunTheme.textSecondary, size: 22),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String icon;
  final String title;
  final String subtitle;

  const _SectionTitle({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(icon, style: const TextStyle(fontSize: 16)),
        const SizedBox(width: YiShunTheme.space2),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: YiShunTheme.textPrimary,
          ),
        ),
        const SizedBox(width: YiShunTheme.space2),
        Text(
          '·',
          style: TextStyle(
            color: YiShunTheme.goldPrimary.withAlpha(127),
            fontSize: 18,
          ),
        ),
        const SizedBox(width: YiShunTheme.space2),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 13,
            color: YiShunTheme.textMuted,
          ),
        ),
      ],
    );
  }
}

// === 今日运势卡片 ===
class _DailyFortuneCard extends StatelessWidget {
  final Map<String, dynamic>? fortune;
  final bool isLoading;

  const _DailyFortuneCard({this.fortune, required this.isLoading});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(YiShunTheme.space5),
      decoration: YiShunTheme.goldCardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 标题行
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(YiShunTheme.space2),
                    decoration: BoxDecoration(
                      color: YiShunTheme.goldPrimary.withAlpha(38),
                      borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
                    ),
                    child: const Text('🌙', style: TextStyle(fontSize: 14)),
                  ),
                  const SizedBox(width: YiShunTheme.space2),
                  const Text(
                    '今日运势',
                    style: TextStyle(
                      color: YiShunTheme.goldPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: YiShunTheme.space3,
                  vertical: YiShunTheme.space1,
                ),
                decoration: BoxDecoration(
                  color: YiShunTheme.purpleMystic.withAlpha(51),
                  borderRadius: BorderRadius.circular(YiShunTheme.radiusFull),
                ),
                child: Text(
                  fortune?['god_of_day'] ?? '青龙',
                  style: TextStyle(
                    color: YiShunTheme.purpleMystic.withAlpha(204),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: YiShunTheme.space2),

          // 农历日期
          Text(
            fortune?['lunar_date'] ?? '甲辰年 · 三月初五',
            style: TextStyle(
              color: YiShunTheme.textMuted,
              fontSize: 12,
            ),
          ),

          YiShunTheme.baguaDivider(color: YiShunTheme.goldPrimary.withAlpha(38)),

          // 运势摘要
          if (isLoading)
            _LoadingIndicator()
          else
            Text(
              fortune?['summary'] ?? '今日运势较好，适合做重要决定',
              style: const TextStyle(
                color: YiShunTheme.textPrimary,
                fontSize: 14,
                height: 1.6,
              ),
            ),

          const SizedBox(height: YiShunTheme.space4),

          // 五行幸运标签
          Row(
            children: [
              _LuckyChip(
                emoji: '🎨',
                text: fortune?['lucky_color'] ?? '青',
              ),
              const SizedBox(width: YiShunTheme.space2),
              _LuckyChip(
                emoji: '🔢',
                text: '${fortune?['lucky_number'] ?? 8}',
              ),
              const SizedBox(width: YiShunTheme.space2),
              _LuckyChip(
                emoji: '🧭',
                text: '东方',
              ),
            ],
          ),

          const SizedBox(height: YiShunTheme.space3),

          // 宜忌
          Row(
            children: [
              _YiJiTag(
                label: '宜',
                color: YiShunTheme.wuXingWood,
                text: fortune?['yi'] ?? '出行·求财',
              ),
              const SizedBox(width: YiShunTheme.space4),
              _YiJiTag(
                label: '忌',
                color: YiShunTheme.wuXingFire,
                text: fortune?['ji'] ?? '搬家·动土',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LuckyChip extends StatelessWidget {
  final String emoji;
  final String text;

  const _LuckyChip({required this.emoji, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: YiShunTheme.space3,
        vertical: YiShunTheme.space2,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(YiShunTheme.radiusFull),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 12)),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              color: YiShunTheme.textPrimary,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _YiJiTag extends StatelessWidget {
  final String label;
  final Color color;
  final String text;

  const _YiJiTag({
    required this.label,
    required this.color,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: YiShunTheme.space2,
            vertical: 2,
          ),
          decoration: BoxDecoration(
            color: color.withAlpha(38),
            borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(width: YiShunTheme.space2),
        Text(
          text,
          style: TextStyle(
            color: YiShunTheme.textSecondary,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

class _LoadingIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(
          color: YiShunTheme.goldPrimary,
          strokeWidth: 2,
        ),
      ),
    );
  }
}

// === 功能网格 ===
class _FeatureGrid extends StatelessWidget {
  final List<Map<String, dynamic>> features = const [
    {'icon': '☯️', 'title': '四柱排盘', 'desc': '完整八字分析', 'color': YiShunTheme.purpleMystic, 'wuxing': '水', 'route': '/divination'},
    {'icon': '⚖️', 'title': '五行分析', 'desc': '五行旺缺雷达', 'color': YiShunTheme.wuXingWood, 'wuxing': '木', 'route': '/divination'},
    {'icon': '💑', 'title': '双人合盘', 'desc': '姻缘事业契合', 'color': YiShunTheme.wuXingFire, 'wuxing': '火', 'route': '/compatibility'},
    {'icon': '📜', 'title': '大运流年', 'desc': '十年运势走向', 'color': YiShunTheme.wuXingEarth, 'wuxing': '土', 'route': '/divination'},
    {'icon': '🔮', 'title': '十神详解', 'desc': '关系图谱分析', 'color': YiShunTheme.wuXingMetal, 'wuxing': '金', 'route': '/ten_gods_guide'},
    {'icon': '📚', 'title': '命理知识', 'desc': '了解五行十神', 'color': YiShunTheme.wuXingWater, 'wuxing': '水', 'route': '/ten_gods_guide'},
    {'icon': '🗓', 'title': '深度报告', 'desc': '流年姻缘事业', 'color': YiShunTheme.wuXingFire, 'wuxing': '火', 'route': '/report_purchase'},
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: YiShunTheme.space3,
        crossAxisSpacing: YiShunTheme.space3,
        childAspectRatio: 1.15,
      ),
      itemCount: features.length,
      itemBuilder: (context, index) {
        final f = features[index];
        return _FeatureCard(
          icon: f['icon'] as String,
          title: f['title'] as String,
          desc: f['desc'] as String,
          color: f['color'] as Color,
          wuxing: f['wuxing'] as String,
          route: f['route'] as String,
        );
      },
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final String icon;
  final String title;
  final String desc;
  final Color color;
  final String wuxing;
  final String route;

  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.desc,
    required this.color,
    required this.wuxing,
    required this.route,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        final isPremiumFeature = ['☯️', '⚖️', '💑', '📜', '🔮'].contains(icon);
        final user = context.read<UserModel>();

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
        padding: const EdgeInsets.all(YiShunTheme.space4),
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(YiShunTheme.radiusLg),
          border: Border.all(color: color.withAlpha(51)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(YiShunTheme.space2 + 2),
                  decoration: BoxDecoration(
                    color: color.withAlpha(38),
                    borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                  ),
                  child: Text(icon, style: const TextStyle(fontSize: 22)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: YiShunTheme.space2,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: color.withAlpha(51),
                    borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
                  ),
                  child: Text(
                    wuxing,
                    style: TextStyle(
                      fontSize: 11,
                      color: color,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: YiShunTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              desc,
              style: TextStyle(
                color: YiShunTheme.textMuted,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// === 五行相生相克卡片 ===
class _WuXingCycleCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(YiShunTheme.space5),
      decoration: YiShunTheme.cardDecoration(
        borderColor: YiShunTheme.goldPrimary.withAlpha(38),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 标题
          Row(
            children: [
              Text(
                '✦',
                style: TextStyle(
                  fontSize: 14,
                  color: YiShunTheme.goldPrimary.withAlpha(179),
                ),
              ),
              const SizedBox(width: YiShunTheme.space2),
              const Text(
                '五行相生相克',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: YiShunTheme.textPrimary,
                ),
              ),
            ],
          ),

          const SizedBox(height: YiShunTheme.space4),

          // 相生
          Row(
            children: [
              _WuXingLabel('相生', YiShunTheme.wuXingWood),
              const SizedBox(width: YiShunTheme.space3),
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: YiShunTheme.wuXingCycle.map((w) {
                    return _WuXingNode(w, isSheng: true, isLast: w == '水');
                  }).toList(),
                ),
              ),
            ],
          ),

          const SizedBox(height: YiShunTheme.space3),

          // 相克
          Row(
            children: [
              _WuXingLabel('相克', YiShunTheme.wuXingFire),
              const SizedBox(width: YiShunTheme.space3),
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _WuXingKeItem('金', '木'),
                    _WuXingKeItem('木', '土'),
                    _WuXingKeItem('土', '水'),
                    _WuXingKeItem('水', '火'),
                    _WuXingKeItem('火', '金'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _WuXingLabel extends StatelessWidget {
  final String text;
  final Color color;

  const _WuXingLabel(this.text, this.color);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 32,
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _WuXingNode extends StatelessWidget {
  final String w;
  final bool isSheng;
  final bool isLast;

  const _WuXingNode(this.w, {required this.isSheng, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final color = YiShunTheme.getWuXingColor(w);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Column(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: color.withAlpha(38),
                borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
                border: Border.all(color: color.withAlpha(102)),
              ),
              child: Center(
                child: Text(
                  w,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
            if (!isLast)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Icon(
                  Icons.arrow_forward,
                  size: 10,
                  color: YiShunTheme.textMuted,
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _WuXingKeItem extends StatelessWidget {
  final String from;
  final String to;

  const _WuXingKeItem(this.from, this.to);

  @override
  Widget build(BuildContext context) {
    final fromColor = YiShunTheme.getWuXingColor(from);
    final toColor = YiShunTheme.getWuXingColor(to);

    return Column(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: fromColor.withAlpha(38),
            borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
            border: Border.all(color: fromColor.withAlpha(102)),
          ),
          child: Center(
            child: Text(
              from,
              style: TextStyle(
                color: fromColor,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Icon(
            Icons.remove,
            size: 10,
            color: YiShunTheme.textMuted,
          ),
        ),
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: toColor.withAlpha(38),
            borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
            border: Border.all(color: toColor.withAlpha(102)),
          ),
          child: Center(
            child: Text(
              to,
              style: TextStyle(
                color: toColor,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// === 高级会员 CTA ===
class _PremiumCTA extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final user = context.watch<UserModel>();
    if (user.isPremium) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(YiShunTheme.space5),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            YiShunTheme.wuXingFire.withAlpha(204),
            YiShunTheme.wuXingFire.withAlpha(153),
          ],
        ),
        borderRadius: BorderRadius.circular(YiShunTheme.radiusLg),
        boxShadow: YiShunTheme.shadowMd(YiShunTheme.wuXingFire),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(YiShunTheme.space3),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(38),
              borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
            ),
            child: const Text('👑', style: TextStyle(fontSize: 32)),
          ),
          const SizedBox(width: YiShunTheme.space4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '解锁完整功能',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
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
              backgroundColor: YiShunTheme.goldPrimary,
              foregroundColor: YiShunTheme.backgroundDark,
              padding: const EdgeInsets.symmetric(
                horizontal: YiShunTheme.space4,
                vertical: YiShunTheme.space3,
              ),
            ),
            child: const Text(
              '开通会员',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}