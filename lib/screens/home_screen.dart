import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/analytics_service.dart';
import '../utils/theme.dart';
import '../../main.dart';

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
              // App Bar - 按code.html设计
              SliverAppBar(
                floating: true,
                pinned: true,
                backgroundColor: YiShunTheme.background.withAlpha(230),
                scrolledUnderElevation: 0,
                surfaceTintColor: Colors.transparent,
                elevation: 0,
                title: _buildAppTitle(),
                centerTitle: true,
                leading: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: GestureDetector(
                    onTap: () {
                      // Left icon action
                    },
                    child: Icon(
                      Icons.waves,
                      color: YiShunTheme.primary,
                      size: 24,
                    ),
                  ),
                ),
                actions: [
                  GestureDetector(
                    onTap: () {
                      // Navigate to profile
                      context.read<NavigationController>().navigateTo(3);
                    },
                    child: const Padding(
                      padding: EdgeInsets.all(12.0),
                      child: Icon(
                        Icons.account_circle,
                        color: YiShunTheme.primary,
                        size: 24,
                      ),
                    ),
                  ),
                ],
              ),

              // Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: YiShunTheme.pagePadding,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const SizedBox(height: YiShunTheme.spaceMd),
                      
                      // Hero区域 - 图片 + 标题
                      const _HeroSection(),
                      
                      const SizedBox(height: YiShunTheme.spaceXl),
                      
                      // 每日洞察卡片
                      _DailyInsightCard(
                        fortune: _dailyFortune,
                        isLoading: _isLoadingFortune,
                      ),
                      
                      const SizedBox(height: YiShunTheme.spaceXl),
                      
                      // 3个功能卡片
                      const _FeatureCards(),
                      
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
    return Text(
      'THE STILLNESS',
      style: GoogleFonts.notoSerif(
        fontWeight: FontWeight.w600,
        color: YiShunTheme.primary,
        fontSize: 16,
        letterSpacing: 0.2,
      ),
    );
  }
}

// === Hero区域 ===
class _HeroSection extends StatelessWidget {
  const _HeroSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // 图片区域
        AspectRatio(
          aspectRatio: 2 / 1,
          child: Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: YiShunTheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
              border: Border.all(
                color: YiShunTheme.cardBorder,
                width: 1,
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(YiShunTheme.radiusMd - 1),
              child: Stack(
                children: [
                  // 抽象几何背景
                  Positioned.fill(
                    child: CustomPaint(
                      painter: _CosmicFlowPainter(),
                    ),
                  ),
                  // 标题叠加
                  Positioned.fill(
                    child: Container(
                      alignment: Alignment.center,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.auto_awesome,
                            size: 48,
                            color: YiShunTheme.primary.withAlpha(128),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'COSMIC FLOW',
                            style: GoogleFonts.notoSerif(
                              fontSize: 14,
                              letterSpacing: 0.3,
                              color: YiShunTheme.onSurface.withAlpha(128),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        
        const SizedBox(height: YiShunTheme.spaceMd),
        
        // 标题
        Text(
          'Align with the Flow of Time',
          style: GoogleFonts.notoSerif(
            fontSize: 28,
            fontWeight: FontWeight.w500,
            color: YiShunTheme.onSurface,
            height: 1.3,
          ),
          textAlign: TextAlign.center,
        ),
        
        const SizedBox(height: YiShunTheme.spaceSm),
        
        // 描述
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Discover clarity through ancient wisdom, refined for the modern mind.',
            style: GoogleFonts.inter(
              fontSize: 16,
              color: YiShunTheme.onSurfaceVariant,
              height: 1.6,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }
}

// 抽象几何画家 - 宇宙流动背景
class _CosmicFlowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = YiShunTheme.primary.withAlpha(25)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    final center = Offset(size.width / 2, size.height / 2);
    
    // 绘制弧线
    for (var i = 0; i < 5; i++) {
      final radius = 30.0 + i * 20.0;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -1.5 + i * 0.2,
        3.0,
        false,
        paint,
      );
    }
    
    // 绘制中心点
    final dotPaint = Paint()
      ..color = YiShunTheme.primary.withAlpha(77)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 4, dotPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// === 每日洞察卡片 ===
class _DailyInsightCard extends StatelessWidget {
  final Map<String, dynamic>? fortune;
  final bool isLoading;

  const _DailyInsightCard({
    this.fortune,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 600),
      padding: const EdgeInsets.all(YiShunTheme.spaceLg),
      decoration: BoxDecoration(
        color: YiShunTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
        border: Border.all(
          color: YiShunTheme.outlineVariant,
          width: 1,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 图标
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: YiShunTheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
              border: Border.all(
                color: YiShunTheme.outlineVariant,
                width: 1,
              ),
            ),
            child: const Icon(
              Icons.auto_awesome,
              color: YiShunTheme.primary,
              size: 24,
            ),
          ),
          
          const SizedBox(width: YiShunTheme.spaceMd),
          
          // 文本内容
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Daily Insight',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: YiShunTheme.onSurfaceVariant,
                    letterSpacing: 0.1,
                  ),
                ),
                const SizedBox(height: 4),
                if (isLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(8),
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: YiShunTheme.primary,
                        ),
                      ),
                    ),
                  )
                else
                  Text(
                    fortune?['summary'] ?? 'The dominant energy today favors steady growth over sudden shifts. Cultivate patience in your primary endeavors.',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      color: YiShunTheme.onSurface,
                      height: 1.6,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// === 3个功能卡片 ===
class _FeatureCards extends StatelessWidget {
  const _FeatureCards({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 500;
        
        if (isWide) {
          // 横排布局
          return Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _FeatureCard(
                  icon: Icons.donut_large,
                  title: 'Natal Chart',
                  desc: 'Explore your foundational elemental balance.',
                  onTap: () {
                    context.read<NavigationController>().navigateToDivination();
                  },
                ),
              ),
              const SizedBox(width: YiShunTheme.spaceMd),
              Expanded(
                child: _FeatureCard(
                  icon: Icons.view_timeline,
                  title: 'Daily Forecast',
                  desc: 'Navigate the shifting currents of today.',
                  onTap: () {},
                ),
              ),
              const SizedBox(width: YiShunTheme.spaceMd),
              Expanded(
                child: _FeatureCard(
                  icon: Icons.forum,
                  title: 'Consultation',
                  desc: 'Seek guided clarity from a master.',
                  onTap: () {
                    Navigator.pushNamed(context, '/ten_gods_guide');
                  },
                ),
              ),
            ],
          );
        } else {
          // 单列布局
          return Column(
            children: [
              _FeatureCard(
                icon: Icons.donut_large,
                title: 'Natal Chart',
                desc: 'Explore your foundational elemental balance.',
                onTap: () {
                  context.read<NavigationController>().navigateToDivination();
                },
              ),
              const SizedBox(height: YiShunTheme.spaceMd),
              _FeatureCard(
                icon: Icons.view_timeline,
                title: 'Daily Forecast',
                desc: 'Navigate the shifting currents of today.',
                onTap: () {},
              ),
              const SizedBox(height: YiShunTheme.spaceMd),
              _FeatureCard(
                icon: Icons.forum,
                title: 'Consultation',
                desc: 'Seek guided clarity from a master.',
                onTap: () {
                  Navigator.pushNamed(context, '/ten_gods_guide');
                },
              ),
            ],
          );
        }
      },
    );
  }
}

class _FeatureCard extends StatefulWidget {
  final IconData icon;
  final String title;
  final String desc;
  final VoidCallback? onTap;

  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.desc,
    this.onTap,
  });

  @override
  State<_FeatureCard> createState() => _FeatureCardState();
}

class _FeatureCardState extends State<_FeatureCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onTap?.call();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.98 : 1.0,
        duration: YiShunTheme.animFast,
        child: Container(
          padding: const EdgeInsets.all(YiShunTheme.spaceLg),
          decoration: BoxDecoration(
            color: YiShunTheme.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
            border: Border.all(
              color: _isPressed 
                  ? YiShunTheme.primary.withAlpha(77)
                  : YiShunTheme.outlineVariant,
              width: 1,
            ),
            boxShadow: _isPressed
                ? [
                    BoxShadow(
                      color: const Color(0x144F7942).withAlpha(20),
                      blurRadius: 30,
                      offset: const Offset(0, 10),
                    ),
                  ]
                : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // 图标
              Icon(
                widget.icon,
                size: 32,
                color: YiShunTheme.primary,
              ),
              
              const SizedBox(height: YiShunTheme.spaceMd),
              
              // 标题
              Text(
                widget.title,
                style: GoogleFonts.notoSerif(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                  color: YiShunTheme.onSurface,
                ),
              ),
              
              const SizedBox(height: 4),
              
              // 描述
              Text(
                widget.desc,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: YiShunTheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}