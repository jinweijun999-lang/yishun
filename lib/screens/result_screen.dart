import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../utils/theme.dart';

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

  // Animation controllers
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;
  late AnimationController _spinController;
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

    _spinController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    // Radar chart animation
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
  }

  @override
  void dispose() {
    _tabController.dispose();
    _fadeController.dispose();
    _spinController.dispose();
    _radarAnimationController.dispose();
    super.dispose();
  }

  void _loadResults() {
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map<String, dynamic>) {
      _baziResult = args;
      _loadFortune();
      // Start animations
      _spinController.forward();
      // Delay radar animation to let page load first
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) _radarAnimationController.forward();
      });
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

  @override
  Widget build(BuildContext context) {
    if (_baziResult == null) {
      return Scaffold(
        backgroundColor: YiShunTheme.surfaceDark,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          title: const Text('命盘分析'),
        ),
        body: const Center(
          child: Text('No data available', style: TextStyle(color: Colors.white)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: YiShunTheme.surfaceDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: YiShunTheme.primaryGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Custom App Bar
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
                      '命盘分析',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: YiShunTheme.brandCinnabar.withAlpha(51),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.auto_awesome, size: 14, color: YiShunTheme.brandCinnabar),
                          const SizedBox(width: 4),
                          Text(
                            _baziResult!['day_master'] ?? '甲',
                            style: const TextStyle(
                              color: YiShunTheme.brandCinnabar,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Tab Bar
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(13),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  controller: _tabController,
                  indicatorColor: YiShunTheme.brandAmber,
                  indicatorWeight: 3,
                  indicatorSize: TabBarIndicatorSize.tab,
                  labelColor: YiShunTheme.brandAmber,
                  unselectedLabelColor: Colors.white54,
                  dividerColor: Colors.transparent,
                  tabs: const [
                    Tab(text: '四柱'),
                    Tab(text: '五行'),
                    Tab(text: '十神'),
                    Tab(text: '运势'),
                  ],
                ),
              ),

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
      ),
    );
  }

  // ==================== 四柱 Tab ====================
  Widget _buildFourPillarsTab() {
    final pillars = ['year', 'month', 'day', 'hour'];
    final pillarNames = ['年柱', '月柱', '日柱', '时柱'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // 命盘概览
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(13),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withAlpha(25)),
            ),
            child: Column(
              children: [
                const Text(
                  '☯️ 八字命盘',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: List.generate(4, (i) {
                    final pillar = _baziResult![pillars[i]] as Map<String, dynamic>? ?? {};
                    return _buildPillarColumn(
                      pillarNames[i],
                      pillar['gan'] ?? '',
                      pillar['zhi'] ?? '',
                      pillar['wuxing'] ?? '',
                    );
                  }),
                ),
                const SizedBox(height: 16),
                if (_baziResult!['solar_time'] != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: YiShunTheme.brandAmber.withAlpha(51),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '真太阳时: ${_baziResult!['solar_time']}',
                      style: const TextStyle(
                        color: YiShunTheme.brandAmber,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 日主信息
          Container(
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
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: YiShunTheme.brandCinnabar.withAlpha(51),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.person, color: YiShunTheme.brandCinnabar),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      '日主',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  '${_baziResult!['day_master'] ?? '甲'}${_baziResult!['day_master_wuxing'] ?? '木'}之人',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '日主代表自己，是八字的核心。日主天干为你的人生主旋律。',
                  style: TextStyle(color: Colors.white.withAlpha(153), fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 十神概览
          _buildShishenOverview(),
        ],
      ),
    );
  }

  Widget _buildPillarColumn(String label, String gan, String zhi, String wuxing) {
    final color = YiShunTheme.getWuxingColor(wuxing);
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 11, color: Colors.white.withAlpha(153)),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withAlpha(25),
            borderRadius: BorderRadius.circular(12),
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
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withAlpha(51),
                  borderRadius: BorderRadius.circular(10),
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
    final shishenData = _baziResult!['shishen'] as Map<String, dynamic>? ?? {};
    if (shishenData.isEmpty) return const SizedBox.shrink();

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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: YiShunTheme.waterColor.withAlpha(51),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.star, color: YiShunTheme.waterColor),
              ),
              const SizedBox(width: 12),
              const Text(
                '十神一览',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: shishenData.entries.map((e) {
              final color = _getShishenColor(e.value.toString());
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: color.withAlpha(25),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: color.withAlpha(76)),
                ),
                child: Text(
                  e.value.toString(),
                  style: TextStyle(color: color, fontWeight: FontWeight.bold),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Color _getShishenColor(String shishen) {
    switch (shishen) {
      case '正官': return YiShunTheme.waterColor;
      case '七杀': return YiShunTheme.fireColor;
      case '正财': return YiShunTheme.earthColor;
      case '偏财': return const Color(0xFF8D6E63);
      case '正印': return YiShunTheme.metalColor;
      case '偏印': return const Color(0xFF9E9E9E);
      case '食神': return YiShunTheme.woodColor;
      case '伤官': return YiShunTheme.fireColor;
      case '比肩': return YiShunTheme.woodColor;
      case '劫财': return YiShunTheme.fireColor;
      default: return Colors.grey;
    }
  }

  // ==================== 五行 Tab ====================
  Widget _buildFiveElementsTab() {
    final wuxingCount = _baziResult!['wuxing_count'] as Map<String, dynamic>? ?? {};
    final elements = ['木', '火', '土', '金', '水'];
    final total = wuxingCount.values.fold<int>(0, (sum, v) => sum + (v as int));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // 五行雷达图
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(13),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withAlpha(25)),
            ),
            child: Column(
              children: [
                const Row(
                  children: [
                    Text('✦', style: TextStyle(color: YiShunTheme.brandAmber, fontSize: 16)),
                    SizedBox(width: 8),
                    Text(
                      '五行分布雷达图',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  height: 240,
                  child: _buildRadarChart(wuxingCount, total),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 五行柱状图
          Container(
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
                    Icon(Icons.bar_chart, color: YiShunTheme.brandAmber, size: 20),
                    SizedBox(width: 8),
                    Text(
                      '五行数量',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ...elements.map((e) {
                  final count = wuxingCount[e] as int? ?? 0;
                  final percentage = total > 0 ? count / total : 0.0;
                  final color = YiShunTheme.getWuxingColor(e);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildWuxingBar(e, count, percentage, color),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 五行分析
          Container(
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
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: YiShunTheme.brandCinnabar.withAlpha(51),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.analytics, color: YiShunTheme.brandCinnabar),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      '五行分析',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
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
        final currentValues = values.map((v) {
          return _radarAnimation.value * v;
        }).toList();


        return RadarChart(
          RadarChartData(
            radarShape: RadarShape.polygon,
            radarBorderData: const BorderSide(color: Colors.white24, width: 1),
            gridBorderData: const BorderSide(color: Colors.white12, width: 1),
            tickBorderData: const BorderSide(color: Colors.transparent),
            ticksTextStyle: const TextStyle(color: Colors.transparent),
            tickCount: 4,
            titlePositionPercentageOffset: 0.15,
            titleTextStyle: const TextStyle(
              color: Colors.white70,
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
                fillColor: YiShunTheme.brandInkBlue.withAlpha(76),
                borderColor: YiShunTheme.brandAmber,
                borderWidth: 2,
                entryRadius: 4,
                dataEntries: currentValues.map((v) => RadarEntry(value: v)).toList(),
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
                  color: Colors.white.withAlpha(13),
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
              color: Colors.white,
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
            '🔥 最旺: ${strongest}行',
            '$strongest元素最为旺盛，代表命主在该方面的特质明显',
            YiShunTheme.getWuxingColor(strongest),
          ),
        if (weakest != null && strongest != weakest)
          _buildAnalysisItem(
            '❄️ 最弱: ${weakest}行',
            '$weakest元素相对缺乏，需要后天补足',
            YiShunTheme.getWuxingColor(weakest),
          ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: YiShunTheme.brandAmber.withAlpha(25),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline, color: YiShunTheme.brandAmber, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '五行平衡为最佳，过旺或过弱都可能影响运势',
                  style: TextStyle(color: Colors.white.withAlpha(179), fontSize: 12),
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
        borderRadius: BorderRadius.circular(12),
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
            ),
          ),
          const SizedBox(height: 4),
          Text(
            desc,
            style: TextStyle(color: Colors.white.withAlpha(179), fontSize: 13),
          ),
        ],
      ),
    );
  }

  // ==================== 十神 Tab ====================
  Widget _buildTenGodsTab() {
    final shishenData = _baziResult!['shishen'] as Map<String, dynamic>? ?? {};

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // 十神关系图
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(13),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withAlpha(25)),
            ),
            child: Column(
              children: [
                const Row(
                  children: [
                    Text('✦', style: TextStyle(color: YiShunTheme.brandAmber, fontSize: 16)),
                    SizedBox(width: 8),
                    Text(
                      '十神关系图',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  height: 280,
                  child: _buildTenGodsDiagram(shishenData),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

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
    // 以日主为中心，十神围绕分布
    final dayMaster = _baziResult!['day_master'] ?? '甲';
    final positions = [
      {'label': '正官', 'angle': 270.0, 'dist': 0.8},
      {'label': '七杀', 'angle': 315.0, 'dist': 0.8},
      {'label': '正印', 'angle': 0.0, 'dist': 0.8},
      {'label': '偏印', 'angle': 45.0, 'dist': 0.8},
      {'label': '正财', 'angle': 180.0, 'dist': 0.8},
      {'label': '偏财', 'angle': 225.0, 'dist': 0.8},
      {'label': '食神', 'angle': 90.0, 'dist': 0.8},
      {'label': '伤官', 'angle': 135.0, 'dist': 0.8},
    ];

    return Stack(
      alignment: Alignment.center,
      children: [
        // 外圈
        Container(
          width: 200,
          height: 200,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withAlpha(25), width: 1),
          ),
        ),
        // 内圈
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: YiShunTheme.brandAmber.withAlpha(51),
            border: Border.all(color: YiShunTheme.brandAmber, width: 2),
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  dayMaster,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: YiShunTheme.brandAmber,
                  ),
                ),
                const Text(
                  '日主',
                  style: TextStyle(fontSize: 10, color: Colors.white54),
                ),
              ],
            ),
          ),
        ),
        // 十神位置
        ...positions.asMap().entries.map((entry) {
          final pos = entry.value;
          final label = pos['label'] as String;
          final angle = pos['angle'] as double;
          final dist = pos['dist'] as double;

          // 找到对应的值
          String? value;
          shishenData.forEach((key, v) {
            if (v.toString() == label) {
              value = key;
            }
          });

          final rad = angle * 3.14159 / 180;
          final x = 100 * dist * (angle < 180 ? 1 : -1) * _cos(rad).abs();
          final y = 100 * dist * _sin(rad);

          return Positioned(
            left: 140 + x - 30,
            top: 140 - y - 20,
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
                    style: const TextStyle(fontSize: 9, color: Colors.white54),
                  ),
              ],
            ),
          );
        }),
      ],
    );
  }

  double _sin(double rad) => _sinApprox(rad);
  double _cos(double rad) => _cosApprox(rad);
  double _sinApprox(double x) {
    // 简单近似
    x = x % (2 * 3.14159);
    if (x > 3.14159) x -= 2 * 3.14159;
    return x - (x * x * x) / 6 + (x * x * x * x * x) / 120;
  }
  double _cosApprox(double x) {
    x = x % (2 * 3.14159);
    return _sinApprox(x + 1.5708);
  }

  Widget _buildShishenCard(String pillar, String shishen) {
    final color = _getShishenColor(shishen);
    final desc = _getShishenDesc(shishen);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: color.withAlpha(51),
              borderRadius: BorderRadius.circular(12),
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
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$pillar · $shishen',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: TextStyle(
                    color: Colors.white.withAlpha(153),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: Colors.white.withAlpha(76)),
        ],
      ),
    );
  }

  String _getShishenDesc(String shishen) {
    switch (shishen) {
      case '正官': return '代表地位、权力、约束力';
      case '七杀': return '代表挑战、压力、果断';
      case '正印': return '代表学业、智慧、庇护';
      case '偏印': return '代表独创、思考、孤僻';
      case '正财': return '代表收入、理财、务实';
      case '偏财': return '代表意外之财、投资、冒险';
      case '食神': return '代表表达、创意、食禄';
      case '伤官': return '代表才华、叛逆、口才';
      case '比肩': return '代表自信、伙伴、独立';
      case '劫财': return '代表竞争、果断、冲动';
      default: return '十神之一';
    }
  }

  // ==================== 运势 Tab ====================
  Widget _buildFortuneTab() {
    if (_isLoadingFortune) {
      return const Center(
        child: CircularProgressIndicator(color: YiShunTheme.brandAmber),
      );
    }

    if (_fortuneResult == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 64, color: Colors.white54),
            const SizedBox(height: 16),
            const Text(
              'Failed to load fortune',
              style: TextStyle(color: Colors.white54),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadFortune,
              style: ElevatedButton.styleFrom(
                backgroundColor: YiShunTheme.brandCinnabar,
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // 综合运势
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  YiShunTheme.brandInkBlue,
                  YiShunTheme.brandInkBlue.withAlpha(204),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withAlpha(25)),
            ),
            child: Column(
              children: [
                const Text(
                  '🔮 综合运势',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  _fortuneResult!['fortune'] ?? '运势平稳',
                  style: const TextStyle(
                    fontSize: 16,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

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
            Container(
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
                      Icon(Icons.lightbulb_outline, color: YiShunTheme.brandAmber),
                      SizedBox(width: 8),
                      Text(
                        '建议',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...((_fortuneResult!['tips'] as List)
                      .take(3)
                      .map((tip) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('• ', style: TextStyle(color: YiShunTheme.brandAmber)),
                                Expanded(
                                  child: Text(
                                    tip.toString(),
                                    style: TextStyle(color: Colors.white.withAlpha(179)),
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
      'career': YiShunTheme.brandCinnabar,
      'love': YiShunTheme.fireColor,
      'health': YiShunTheme.woodColor,
      'wealth': YiShunTheme.earthColor,
    };

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: (colors[aspect] ?? Colors.grey).withAlpha(25),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              icons[aspect] ?? '📌',
              style: const TextStyle(fontSize: 24),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  labels[aspect] ?? aspect,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  content,
                  style: TextStyle(
                    color: Colors.white.withAlpha(179),
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