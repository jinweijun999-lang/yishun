import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/analytics_service.dart';
import '../models/user_model.dart';
import '../utils/theme.dart';
import '../widgets/decorations.dart';

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
      if (mounted) {
        setState(() {
          _dailyFortune = fortune;
          _isLoadingFortune = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingFortune = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: YiShunTheme.background,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                floating: true,
                pinned: false,
                backgroundColor: YiShunTheme.background,
                scrolledUnderElevation: 0,
                title: _buildAppTitle(),
                actions: [
                  AppIconBtn(
                    icon: Icons.notifications_outlined,
                    onTap: () {},
                  ),
                  const SizedBox(width: YiShunTheme.spaceSm),
                  AppIconBtn(
                    icon: Icons.settings_outlined,
                    onTap: () {},
                  ),
                  const SizedBox(width: YiShunTheme.spaceMd),
                ],
              ),

              // Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: YiShunTheme.pagePadding,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: YiShunTheme.spaceMd),
                      _BaziInputCard(),
                      const SizedBox(height: YiShunTheme.spaceXl),
                      _DailyFortuneCard(
                        fortune: _dailyFortune,
                        isLoading: _isLoadingFortune,
                      ),
                      const SizedBox(height: YiShunTheme.spaceXl),
                      const SectionTitle(
                        title: '命理服务',
                        subtitle: '探索命运',
                      ),
                      const SizedBox(height: YiShunTheme.spaceMd),
                      _FeatureGrid(),
                      const SizedBox(height: YiShunTheme.spaceXl),
                      _PremiumBanner(),
                      const SizedBox(height: YiShunTheme.spaceXxl),
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

  Widget _buildAppTitle() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: YiShunTheme.primary.withAlpha(20),
            borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
            border: Border.all(
              color: YiShunTheme.primary.withAlpha(51),
            ),
          ),
          child: const Center(
            child: Text(
              '☯',
              style: TextStyle(fontSize: 18),
            ),
          ),
        ),
        const SizedBox(width: 10),
        const Text(
          '易顺',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: YiShunTheme.onSurface,
            fontSize: 20,
            letterSpacing: 3,
          ),
        ),
        const SizedBox(width: 4),
        const Text(
          '命理',
          style: TextStyle(
            fontWeight: FontWeight.w400,
            color: YiShunTheme.primary,
            fontSize: 14,
            letterSpacing: 2,
          ),
        ),
      ],
    );
  }
}

// === 四柱输入卡片 ===
class _BaziInputCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return OriCard(
      padding: const EdgeInsets.all(YiShunTheme.cardPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '四柱排盘',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: YiShunTheme.onSurface,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            '输入出生信息，获取命理分析',
            style: TextStyle(
              fontSize: 13,
              color: YiShunTheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: YiShunTheme.spaceLg),
          _BaziInputField(
            label: '姓名',
            hint: '张三',
            icon: Icons.person_outline,
          ),
          const SizedBox(height: YiShunTheme.spaceMd),
          _BaziInputField(
            label: '出生日期',
            hint: '1990-01-01',
            icon: Icons.calendar_today_outlined,
          ),
          const SizedBox(height: YiShunTheme.spaceMd),
          _BaziInputField(
            label: '出生时辰',
            hint: '子时 (23:00-01:00)',
            icon: Icons.access_time_outlined,
          ),
          const SizedBox(height: YiShunTheme.spaceLg),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () {
                // Navigate to divination tab
                DefaultTabController.of(context).animateTo(1);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: YiShunTheme.primary,
                foregroundColor: YiShunTheme.onPrimary,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '开始分析',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(width: 8),
                  Icon(Icons.arrow_forward_rounded, size: 18),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BaziInputField extends StatelessWidget {
  final String label;
  final String hint;
  final IconData icon;

  const _BaziInputField({
    required this.label,
    required this.hint,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: YiShunTheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: YiShunTheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
            border: Border.all(
              color: YiShunTheme.outlineVariant,
              width: 1,
            ),
          ),
          child: TextField(
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(
                color: YiShunTheme.outline,
                fontSize: 14,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 12,
              ),
              border: InputBorder.none,
              filled: false,
              prefixIcon: Icon(
                icon,
                size: 18,
                color: YiShunTheme.onSurfaceVariant,
              ),
            ),
            style: const TextStyle(
              fontSize: 14,
              color: YiShunTheme.onSurface,
            ),
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

  const _DailyFortuneCard({
    this.fortune,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    return OriCard(
      padding: const EdgeInsets.all(YiShunTheme.cardPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                '今日运势',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: YiShunTheme.onSurface,
                ),
              ),
              const Spacer(),
              OriChip(
                label: fortune?['god_of_day'] ?? '青龙',
                backgroundColor: YiShunTheme.tertiary.withAlpha(25),
                textColor: YiShunTheme.tertiary,
                borderColor: YiShunTheme.tertiary.withAlpha(76),
              ),
            ],
          ),
          const SizedBox(height: YiShunTheme.spaceMd),
          if (isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: LoadingIndicator(size: 20),
              ),
            )
          else
            Text(
              fortune?['summary'] ?? '今日运势平稳，适合静心思考。',
              style: const TextStyle(
                fontSize: 14,
                color: YiShunTheme.onSurfaceVariant,
                height: 1.5,
              ),
            ),
          const SizedBox(height: YiShunTheme.spaceMd),
          Row(
            children: [
              _YiJiTag(
                label: '宜',
                text: fortune?['yi'] ?? '出行·求财',
                color: YiShunTheme.wuXingWood,
              ),
              const SizedBox(width: YiShunTheme.spaceMd),
              _YiJiTag(
                label: '忌',
                text: fortune?['ji'] ?? '搬家·动土',
                color: YiShunTheme.wuXingFire,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _YiJiTag extends StatelessWidget {
  final String label;
  final String text;
  final Color color;

  const _YiJiTag({
    required this.label,
    required this.text,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color.withAlpha(25),
            borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
            border: Border.all(color: color.withAlpha(76)),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              color: YiShunTheme.onSurfaceVariant,
            ),
          ),
        ),
      ],
    );
  }
}

// === 功能网格 ===
class _FeatureGrid extends StatelessWidget {
  final List<Map<String, dynamic>> features = const [
    {
      'icon': '☯',
      'title': '四柱排盘',
      'desc': '完整八字分析',
      'color': YiShunTheme.tertiary,
      'wuxing': '水',
    },
    {
      'icon': '⚖',
      'title': '五行分析',
      'desc': '五行旺缺',
      'color': YiShunTheme.wuXingWood,
      'wuxing': '木',
    },
    {
      'icon': '💑',
      'title': '双人合盘',
      'desc': '姻缘契合',
      'color': YiShunTheme.wuXingFire,
      'wuxing': '火',
    },
    {
      'icon': '📜',
      'title': '大运流年',
      'desc': '十年运势',
      'color': YiShunTheme.wuXingEarth,
      'wuxing': '土',
    },
    {
      'icon': '🔮',
      'title': '十神详解',
      'desc': '关系图谱',
      'color': YiShunTheme.wuXingMetal,
      'wuxing': '金',
    },
    {
      'icon': '📚',
      'title': '命理知识',
      'desc': '五行十神',
      'color': YiShunTheme.wuXingWater,
      'wuxing': '水',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: YiShunTheme.spaceMd,
        crossAxisSpacing: YiShunTheme.spaceMd,
        childAspectRatio: 0.88,
      ),
      itemCount: features.length,
      itemBuilder: (context, index) {
        final f = features[index];
        return _FeatureItem(
          icon: f['icon'] as String,
          title: f['title'] as String,
          desc: f['desc'] as String,
          color: f['color'] as Color,
          wuxing: f['wuxing'] as String,
        );
      },
    );
  }
}

class _FeatureItem extends StatelessWidget {
  final String icon;
  final String title;
  final String desc;
  final Color color;
  final String wuxing;

  const _FeatureItem({
    required this.icon,
    required this.title,
    required this.desc,
    required this.color,
    required this.wuxing,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        final isPremiumFeature = ['☯', '⚖', '💑', '📜', '🔮'].contains(icon);
        final user = context.read<UserModel>();
        if (isPremiumFeature && !user.isPremium) {
          Navigator.pushNamed(context, '/paywall');
          return;
        }
        if ('☯⚖📜🔮'.contains(icon)) {
          DefaultTabController.of(context).animateTo(1);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: YiShunTheme.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
          border: Border.all(
            color: color.withAlpha(38),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(icon, style: const TextStyle(fontSize: 24)),
            const Spacer(),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: YiShunTheme.onSurface,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              desc,
              style: const TextStyle(
                fontSize: 11,
                color: YiShunTheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// === Premium Banner ===
class _PremiumBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final user = context.watch<UserModel>();
    if (user.isPremium) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/paywall'),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(YiShunTheme.cardPadding),
        decoration: BoxDecoration(
          color: YiShunTheme.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(YiShunTheme.radiusLg),
          border: Border.all(
            color: YiShunTheme.primary.withAlpha(76),
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: YiShunTheme.primary.withAlpha(20),
                borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
              ),
              child: const Center(
                child: Text('👑', style: TextStyle(fontSize: 24)),
              ),
            ),
            const SizedBox(width: YiShunTheme.spaceMd),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '解锁完整功能',
                    style: TextStyle(
                      color: YiShunTheme.onSurface,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '无限八字分析 · 高级会员专属',
                    style: TextStyle(
                      color: YiShunTheme.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color: YiShunTheme.primary,
                borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
              ),
              child: const Text(
                '开通',
                style: TextStyle(
                  color: YiShunTheme.onPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
