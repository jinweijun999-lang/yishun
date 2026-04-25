import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../utils/theme.dart';
import '../widgets/decorations.dart';
import 'ad_unlock_screen.dart';

/// 命盘分析结果页 - Modern Orientalism
class ResultScreen extends StatefulWidget {
  const ResultScreen({super.key});

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? _baziResult;
  Map<String, dynamic>? _fortuneResult;
  bool _isLoadingFortune = false;
  bool _reportUnlocked = false;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;
  late AnimationController _radarAnimationController;
  late Animation<double> _radarAnimation;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadResults();

    _fadeController = AnimationController(
      duration: YiShunTheme.animSlow,
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _fadeController.forward();

    _radarAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _radarAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _radarAnimationController,
        curve: Curves.easeOutCubic,
      ),
    );

    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) _radarAnimationController.forward();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _fadeController.dispose();
    _radarAnimationController.dispose();
    super.dispose();
  }

  void _loadResults() {
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map<String, dynamic>) {
      _baziResult = args;
      _loadFortune();
    }
  }

  Future<void> _loadFortune() async {
    if (_baziResult == null) return;

    setState(() => _isLoadingFortune = true);

    try {
      final authService = context.read<AuthService>();
      final apiService = ApiService(authService);
      final fortune = await apiService.getFortune(bazi: _baziResult!);
      setState(() {
        _fortuneResult = fortune;
        _isLoadingFortune = false;
      });
    } catch (e) {
      setState(() => _isLoadingFortune = false);
    }
  }

  void _navigateToAdUnlock() async {
    final result = await Navigator.of(context).push<Map<String, dynamic>>(
      MaterialPageRoute(
        builder: (context) => AdUnlockScreen(
          fullReportData: _baziResult!,
        ),
      ),
    );

    if (result != null && result['unlocked'] == true && mounted) {
      setState(() {
        _reportUnlocked = true;
        _fortuneResult = null;
        _isLoadingFortune = true;
      });
      _loadFortune();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_baziResult == null) {
      return Scaffold(
        backgroundColor: YiShunTheme.background,
        body: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: YiShunTheme.spaceXxl),
              const Expanded(
                child: EmptyState(
                  message: 'No data available',
                  icon: Icons.search_off,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: YiShunTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: YiShunTheme.spaceLg),

            // Custom App Bar
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: YiShunTheme.pagePadding,
              ),
              child: Row(
                children: [
                  AppIconBtn(
                    icon: Icons.arrow_back,
                    onTap: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: YiShunTheme.spaceMd),
                  Expanded(
                    child: Text(
                      '命盘分析',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: YiShunTheme.onSurface,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  // 日主标签
                  OriChip(
                    label: _baziResult!['day_master'] ?? '甲',
                    backgroundColor: YiShunTheme.wuXingFire.withAlpha(25),
                    textColor: YiShunTheme.wuXingFire,
                    borderColor: YiShunTheme.wuXingFire.withAlpha(76),
                    icon: Icons.auto_awesome,
                  ),
                ],
              ),
            ),

            const SizedBox(height: YiShunTheme.spaceLg),

            // Tab Bar
            Container(
              margin: const EdgeInsets.symmetric(
                horizontal: YiShunTheme.pagePadding,
              ),
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: YiShunTheme.surfaceContainer,
                borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                border: Border.all(
                  color: YiShunTheme.outlineVariant,
                ),
              ),
              child: TabBar(
                controller: _tabController,
                indicatorColor: YiShunTheme.primary,
                indicatorWeight: 2,
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: YiShunTheme.primary,
                unselectedLabelColor: YiShunTheme.onSurfaceVariant,
                dividerColor: Colors.transparent,
                tabs: const [
                  Tab(text: '四柱'),
                  Tab(text: '五行'),
                  Tab(text: '十神'),
                  Tab(text: '运势'),
                ],
              ),
            ),

            const SizedBox(height: YiShunTheme.spaceMd),

            // Tab content
            Expanded(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildFourPillarsTab(),
                    _buildFiveElementsTab(),
                    _buildTenGodsTab(),
                    _buildFortuneTab(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==================== 四柱 Tab ====================
  Widget _buildFourPillarsTab() {
    final pillars = ['year', 'month', 'day', 'hour'];
    final pillarNames = ['年柱', '月柱', '日柱', '时柱'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(YiShunTheme.pagePadding),
      child: Column(
        children: [
          // 命盘概览
          OriCard(
            padding: const EdgeInsets.all(YiShunTheme.cardPadding),
            borderColor: YiShunTheme.primary.withAlpha(76),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.auto_awesome,
                      color: YiShunTheme.primary.withAlpha(179),
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      '八字命盘',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: YiShunTheme.primary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      Icons.auto_awesome,
                      color: YiShunTheme.primary.withAlpha(179),
                      size: 16,
                    ),
                  ],
                ),
                const SizedBox(height: YiShunTheme.spaceLg),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: List.generate(4, (i) {
                    final pillar =
                        _baziResult![pillars[i]] as Map<String, dynamic>? ?? {};
                    return _buildPillarColumn(
                      pillarNames[i],
                      pillar['gan'] ?? '',
                      pillar['zhi'] ?? '',
                      pillar['wuxing'] ?? '',
                    );
                  }),
                ),
                const SizedBox(height: YiShunTheme.spaceMd),
                if (_baziResult!['solar_time'] != null)
                  OriChip(
                    label: '真太阳时: ${_baziResult!['solar_time']}',
                    backgroundColor: YiShunTheme.primary.withAlpha(20),
                    textColor: YiShunTheme.primary,
                    borderColor: YiShunTheme.primary.withAlpha(51),
                  ),
              ],
            ),
          ),
          const SizedBox(height: YiShunTheme.spaceLg),

          // 日主信息
          OriCard(
            padding: const EdgeInsets.all(YiShunTheme.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: YiShunTheme.wuXingFire.withAlpha(25),
                        borderRadius:
                            BorderRadius.circular(YiShunTheme.radiusSm),
                        border: Border.all(
                          color: YiShunTheme.wuXingFire.withAlpha(76),
                        ),
                      ),
                      child: Icon(
                        Icons.person,
                        color: YiShunTheme.wuXingFire,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: YiShunTheme.spaceMd),
                    const Text(
                      '日主',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: YiShunTheme.onSurface,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: YiShunTheme.spaceMd),
                Text(
                  '${_baziResult!['day_master'] ?? '甲'}${_baziResult!['day_master_wuxing'] ?? '木'}之人',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: YiShunTheme.onSurface,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '日主代表自己，是八字的核心。日主天干为你的人生主旋律。',
                  style: TextStyle(
                    color: YiShunTheme.onSurfaceVariant,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: YiShunTheme.spaceLg),

          // 十神概览
          _buildShishenOverview(),
        ],
      ),
    );
  }

  Widget _buildPillarColumn(
      String label, String gan, String zhi, String wuxing) {
    final color = YiShunTheme.getWuXingColor(wuxing);
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: YiShunTheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withAlpha(25),
            borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
            border: Border.all(color: color.withAlpha(76)),
          ),
          child: Column(
            children: [
              Text(
                gan,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                zhi,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: color.withAlpha(51),
                  borderRadius: BorderRadius.circular(
                    YiShunTheme.radiusFull,
                  ),
                ),
                child: Text(
                  wuxing,
                  style: TextStyle(fontSize: 11, color: color),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildShishenOverview() {
    final shishenData =
        _baziResult!['shishen'] as Map<String, dynamic>? ?? {};
    if (shishenData.isEmpty) return const SizedBox.shrink();

    return OriCard(
      padding: const EdgeInsets.all(YiShunTheme.cardPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: YiShunTheme.wuXingWater.withAlpha(25),
                  borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
                  border: Border.all(
                    color: YiShunTheme.wuXingWater.withAlpha(76),
                  ),
                ),
                child: Icon(
                  Icons.star,
                  color: YiShunTheme.wuXingWater,
                  size: 22,
                ),
              ),
              const SizedBox(width: YiShunTheme.spaceMd),
              const Text(
                '十神一览',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: YiShunTheme.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: YiShunTheme.spaceMd),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: shishenData.entries.map((e) {
              final color = _getShishenColor(e.value.toString());
              return OriChip(
                label: e.value.toString(),
                backgroundColor: color.withAlpha(25),
                textColor: color,
                borderColor: color.withAlpha(76),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Color _getShishenColor(String shishen) {
    switch (shishen) {
      case '正官':
        return YiShunTheme.wuXingWater;
      case '七杀':
        return YiShunTheme.wuXingFire;
      case '正财':
        return YiShunTheme.wuXingEarth;
      case '偏财':
        return const Color(0xFF8D6E63);
      case '正印':
        return YiShunTheme.wuXingMetal;
      case '偏印':
        return const Color(0xFF9E9E9E);
      case '食神':
        return YiShunTheme.wuXingWood;
      case '伤官':
        return YiShunTheme.wuXingFire;
      case '比肩':
        return YiShunTheme.wuXingWood;
      case '劫财':
        return YiShunTheme.wuXingFire;
      default:
        return YiShunTheme.onSurfaceVariant;
    }
  }

  // ==================== 五行 Tab ====================
  Widget _buildFiveElementsTab() {
    final wuxingCount =
        _baziResult!['wuxing_count'] as Map<String, dynamic>? ?? {};
    final elements = ['木', '火', '土', '金', '水'];
    final total =
        wuxingCount.values.fold<int>(0, (sum, v) => sum + (v as int));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(YiShunTheme.pagePadding),
      child: Column(
        children: [
          // 五行雷达图
          OriCard(
            padding: const EdgeInsets.all(YiShunTheme.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.radar, color: YiShunTheme.primary, size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      '五行分布雷达图',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: YiShunTheme.onSurface,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: YiShunTheme.spaceMd),
                SizedBox(
                  height: 240,
                  child: _buildRadarChart(wuxingCount, total),
                ),
              ],
            ),
          ),
          const SizedBox(height: YiShunTheme.spaceLg),

          // 五行柱状图
          OriCard(
            padding: const EdgeInsets.all(YiShunTheme.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.bar_chart,
                        color: YiShunTheme.primary, size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      '五行数量',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: YiShunTheme.onSurface,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: YiShunTheme.spaceMd),
                ...elements.map((e) {
                  final count = wuxingCount[e] as int? ?? 0;
                  final percentage = total > 0 ? count / total : 0.0;
                  final color = YiShunTheme.getWuXingColor(e);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildWuxingBar(e, count, percentage, color),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: YiShunTheme.spaceLg),

          // 五行分析
          OriCard(
            padding: const EdgeInsets.all(YiShunTheme.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: YiShunTheme.wuXingFire.withAlpha(25),
                        borderRadius:
                            BorderRadius.circular(YiShunTheme.radiusSm),
                        border: Border.all(
                          color: YiShunTheme.wuXingFire.withAlpha(76),
                        ),
                      ),
                      child: Icon(
                        Icons.analytics,
                        color: YiShunTheme.wuXingFire,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: YiShunTheme.spaceMd),
                    const Text(
                      '五行分析',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: YiShunTheme.onSurface,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: YiShunTheme.spaceMd),
                _buildWuxingAnalysis(wuxingCount),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRadarChart(Map<String, dynamic> wuxingCount, int total) {
    final elements = ['木', '火', '土', '金', '水'];
    final values = elements.map((e) {
      final count = wuxingCount[e] as int? ?? 0;
      return total > 0 ? (count / total * 100).roundToDouble() : 0.0;
    }).toList();

    return AnimatedBuilder(
      animation: _radarAnimation,
      builder: (context, child) {
        final currentValues =
            values.map((v) => _radarAnimation.value * v).toList();

        return RadarChart(
          RadarChartData(
            radarShape: RadarShape.polygon,
            radarBorderData:
                const BorderSide(color: Color(0xFFE2E3DC), width: 1),
            gridBorderData:
                const BorderSide(color: Color(0xFFE2E3DC), width: 1),
            tickBorderData: const BorderSide(color: Colors.transparent),
            ticksTextStyle:
                const TextStyle(color: Colors.transparent, fontSize: 0),
            tickCount: 4,
            titlePositionPercentageOffset: 0.15,
            titleTextStyle: TextStyle(
              color: YiShunTheme.onSurfaceVariant,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
            getTitle: (index, angle) {
              final labels = ['木', '火', '土', '金', '水'];
              return RadarChartTitle(
                text: labels[index],
                angle: angle,
              );
            },
            dataSets: [
              RadarDataSet(
                fillColor: YiShunTheme.tertiary.withAlpha(76),
                borderColor: YiShunTheme.primary,
                borderWidth: 2,
                entryRadius: 4,
                dataEntries:
                    currentValues.map((v) => RadarEntry(value: v)).toList(),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWuxingBar(
    String element,
    int count,
    double percentage,
    Color color,
  ) {
    return Row(
      children: [
        SizedBox(
          width: 30,
          child: Text(
            element,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
        Expanded(
          child: Stack(
            children: [
              Container(
                height: 20,
                decoration: BoxDecoration(
                  color: YiShunTheme.surfaceContainer,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              FractionallySizedBox(
                widthFactor: percentage.clamp(0.0, 1.0),
                child: Container(
                  height: 20,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        SizedBox(
          width: 24,
          child: Text(
            '$count',
            textAlign: TextAlign.end,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: YiShunTheme.onSurface,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildWuxingAnalysis(Map<String, dynamic> wuxingCount) {
    final elements = ['木', '火', '土', '金', '水'];
    int maxCount = 0;
    String? strongest;
    int minCount = 10;
    String? weakest;

    for (final e in elements) {
      final count = wuxingCount[e] as int? ?? 0;
      if (count > maxCount) {
        maxCount = count;
        strongest = e;
      }
      if (count < minCount) {
        minCount = count;
        weakest = e;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (strongest != null)
          _buildAnalysisItem(
            '$strongest 行最旺',
            '$strongest元素最为旺盛，代表命主在该方面的特质明显',
            YiShunTheme.getWuXingColor(strongest),
          ),
        if (weakest != null && strongest != weakest)
          _buildAnalysisItem(
            '$weakest 行最弱',
            '$weakest元素相对缺乏，需要后天补足',
            YiShunTheme.getWuXingColor(weakest),
          ),
        const SizedBox(height: YiShunTheme.spaceMd),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: YiShunTheme.surfaceContainer,
            borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
            border: Border.all(
              color: YiShunTheme.outlineVariant,
            ),
          ),
          child: Row(
            children: [
              Icon(
                Icons.info_outline,
                color: YiShunTheme.primary,
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '五行平衡为最佳，过旺或过弱都可能影响运势',
                  style: TextStyle(
                    color: YiShunTheme.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAnalysisItem(String title, String desc, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(25),
        borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
        border: Border.all(color: color.withAlpha(76)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: color,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            desc,
            style: TextStyle(
              color: YiShunTheme.onSurfaceVariant,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  // ==================== 十神 Tab ====================
  Widget _buildTenGodsTab() {
    final shishenData =
        _baziResult!['shishen'] as Map<String, dynamic>? ?? {};

    return SingleChildScrollView(
      padding: const EdgeInsets.all(YiShunTheme.pagePadding),
      child: Column(
        children: [
          // 十神关系图
          OriCard(
            padding: const EdgeInsets.all(YiShunTheme.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.hub, color: YiShunTheme.primary, size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      '十神关系图',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: YiShunTheme.onSurface,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: YiShunTheme.spaceMd),
                SizedBox(
                  height: 280,
                  child: _buildTenGodsDiagram(shishenData),
                ),
              ],
            ),
          ),
          const SizedBox(height: YiShunTheme.spaceLg),

          // 十神详解列表
          ...shishenData.entries.map((e) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildShishenCard(e.key, e.value.toString()),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildTenGodsDiagram(Map<String, dynamic> shishenData) {
    final dayMaster = _baziResult!['day_master'] ?? '甲';
    final positions = [
      {'label': '正官', 'angle': 270.0},
      {'label': '七杀', 'angle': 315.0},
      {'label': '正印', 'angle': 0.0},
      {'label': '偏印', 'angle': 45.0},
      {'label': '正财', 'angle': 180.0},
      {'label': '偏财', 'angle': 225.0},
      {'label': '食神', 'angle': 90.0},
      {'label': '伤官', 'angle': 135.0},
    ];

    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 200,
          height: 200,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: YiShunTheme.outlineVariant,
              width: 1,
            ),
          ),
        ),
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: YiShunTheme.primary.withAlpha(20),
            border: Border.all(
              color: YiShunTheme.primary,
              width: 2,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                dayMaster,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: YiShunTheme.primary,
                ),
              ),
              const Text(
                '日主',
                style: TextStyle(
                  fontSize: 10,
                  color: YiShunTheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        ...positions.map((pos) {
          final label = pos['label'] as String;
          final angle = pos['angle'] as double;

          String? value;
          shishenData.forEach((key, v) {
            if (v.toString() == label) value = key;
          });

          final rad = angle * 3.14159 / 180;
          final x = 100 * _cosApprox(rad);
          final y = 100 * _sinApprox(rad);

          return Positioned(
            left: 140 + x - 22,
            top: 140 - y - 22,
            child: Column(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _getShishenColor(label).withAlpha(51),
                    border: Border.all(
                      color: _getShishenColor(label),
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      label.substring(0, 1),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: _getShishenColor(label),
                      ),
                    ),
                  ),
                ),
                if (value != null)
                  Text(
                    value.toString(),
                    style: const TextStyle(
                      fontSize: 9,
                      color: YiShunTheme.onSurfaceVariant,
                    ),
                  ),
              ],
            ),
          );
        }),
      ],
    );
  }

  double _sinApprox(double x) {
    x = x % (2 * 3.14159);
    if (x > 3.14159) x -= 2 * 3.14159;
    return x -
        (x * x * x) / 6 +
        (x * x * x * x * x) / 120;
  }

  double _cosApprox(double x) {
    x = x % (2 * 3.14159);
    return _sinApprox(x + 1.5708);
  }

  Widget _buildShishenCard(String pillar, String shishen) {
    final color = _getShishenColor(shishen);
    final desc = _getShishenDesc(shishen);

    return OriCard(
      padding: const EdgeInsets.all(YiShunTheme.spaceMd),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: color.withAlpha(51),
              borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
              border: Border.all(color: color.withAlpha(128)),
            ),
            child: Center(
              child: Text(
                shishen.substring(0, 1),
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ),
          ),
          const SizedBox(width: YiShunTheme.spaceMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$pillar · $shishen',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: YiShunTheme.onSurface,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: TextStyle(
                    color: YiShunTheme.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.chevron_right,
            color: YiShunTheme.outline,
          ),
        ],
      ),
    );
  }

  String _getShishenDesc(String shishen) {
    switch (shishen) {
      case '正官':
        return '代表地位、权力、约束力';
      case '七杀':
        return '代表挑战、压力、果断';
      case '正印':
        return '代表学业、智慧、庇护';
      case '偏印':
        return '代表独创、思考、孤僻';
      case '正财':
        return '代表收入、理财、务实';
      case '偏财':
        return '代表意外之财、投资、冒险';
      case '食神':
        return '代表表达、创意、食禄';
      case '伤官':
        return '代表才华、叛逆、口才';
      case '比肩':
        return '代表自信、伙伴、独立';
      case '劫财':
        return '代表竞争、果断、冲动';
      default:
        return '十神之一';
    }
  }

  // ==================== 运势 Tab ====================
  Widget _buildFortuneTab() {
    if (_isLoadingFortune) {
      return Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: YiShunTheme.pagePadding,
            ),
            child: _buildAdUnlockBanner(),
          ),
          const Expanded(
            child: Center(
              child: LoadingIndicator(),
            ),
          ),
        ],
      );
    }

    if (_fortuneResult == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.cloud_off,
              size: 64,
              color: YiShunTheme.outline,
            ),
            const SizedBox(height: YiShunTheme.spaceMd),
            Text(
              'Failed to load fortune',
              style: TextStyle(color: YiShunTheme.onSurfaceVariant),
            ),
            const SizedBox(height: YiShunTheme.spaceMd),
            PrimaryButton(
              text: '看广告解锁',
              icon: Icons.play_circle_outline,
              onPressed: _navigateToAdUnlock,
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(YiShunTheme.pagePadding),
      child: Column(
        children: [
          if (!_reportUnlocked) ...[
            _buildAdUnlockBanner(),
            const SizedBox(height: YiShunTheme.spaceLg),
          ],

          // 综合运势
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(YiShunTheme.cardPadding),
            decoration: BoxDecoration(
              color: YiShunTheme.surfaceContainer,
              borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
              border: Border.all(
                color: YiShunTheme.primary.withAlpha(76),
                width: 1.5,
              ),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.auto_awesome,
                      color: YiShunTheme.primary,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      '综合运势',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: YiShunTheme.onSurface,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      Icons.auto_awesome,
                      color: YiShunTheme.primary,
                      size: 18,
                    ),
                  ],
                ),
                const SizedBox(height: YiShunTheme.spaceMd),
                Text(
                  _fortuneResult!['fortune'] ?? '运势平稳',
                  style: TextStyle(
                    fontSize: 16,
                    color: YiShunTheme.onSurfaceVariant,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: YiShunTheme.spaceLg),

          // 运势分类
          ...['career', 'love', 'health', 'wealth'].map((aspect) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildFortuneCard(
                aspect,
                _fortuneResult![aspect] ?? '一般',
              ),
            );
          }),

          // 建议
          if (_fortuneResult!['tips'] != null)
            OriCard(
              padding: const EdgeInsets.all(YiShunTheme.cardPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.lightbulb_outline,
                        color: YiShunTheme.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        '建议',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: YiShunTheme.onSurface,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: YiShunTheme.spaceMd),
                  ...((_fortuneResult!['tips'] as List)
                      .take(3)
                      .map((tip) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '✦ ',
                                  style: TextStyle(
                                    color: YiShunTheme.primary,
                                    fontSize: 12,
                                  ),
                                ),
                                Expanded(
                                  child: Text(
                                    tip.toString(),
                                    style: TextStyle(
                                      color: YiShunTheme.onSurfaceVariant,
                                      fontSize: 13,
                                      height: 1.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ))),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildAdUnlockBanner() {
    return GestureDetector(
      onTap: _navigateToAdUnlock,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(YiShunTheme.spaceMd),
        decoration: BoxDecoration(
          color: YiShunTheme.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
          border: Border.all(
            color: YiShunTheme.secondary.withAlpha(127),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: YiShunTheme.secondary.withAlpha(20),
                borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
              ),
              child: Icon(
                Icons.play_circle_fill,
                color: YiShunTheme.secondary,
                size: 24,
              ),
            ),
            const SizedBox(width: YiShunTheme.spaceMd),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '看广告解锁完整报告',
                    style: TextStyle(
                      color: YiShunTheme.onSurface,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '观看 20 秒广告，解锁详细运势分析',
                    style: TextStyle(
                      color: YiShunTheme.onSurfaceVariant,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              color: YiShunTheme.onSurfaceVariant,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFortuneCard(String aspect, String content) {
    final icons = {
      'career': '💼',
      'love': '💕',
      'health': '🏥',
      'wealth': '💰',
    };
    final labels = {
      'career': '事业',
      'love': '感情',
      'health': '健康',
      'wealth': '财运',
    };
    final colors = {
      'career': YiShunTheme.wuXingFire,
      'love': YiShunTheme.tertiary,
      'health': YiShunTheme.wuXingWood,
      'wealth': YiShunTheme.wuXingEarth,
    };

    final color = colors[aspect] ?? YiShunTheme.onSurfaceVariant;

    return OriCard(
      padding: const EdgeInsets.all(YiShunTheme.spaceMd),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withAlpha(25),
              borderRadius: BorderRadius.circular(YiShunTheme.radiusSm),
              border: Border.all(color: color.withAlpha(51)),
            ),
            child: Text(
              icons[aspect] ?? '📌',
              style: const TextStyle(fontSize: 24),
            ),
          ),
          const SizedBox(width: YiShunTheme.spaceMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  labels[aspect] ?? aspect,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: YiShunTheme.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  content,
                  style: TextStyle(
                    color: YiShunTheme.onSurfaceVariant,
                    fontSize: 13,
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
