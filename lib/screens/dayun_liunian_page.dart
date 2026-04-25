import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../utils/theme.dart';

/// 大运流年页面 - Fortune Cycles Timeline
/// 大运推演算法 + 时间轴视图展示 + 流年分析
class DaYunLiuNianPage extends StatefulWidget {
  final Map<String, dynamic> baziResult;

  const DaYunLiuNianPage({super.key, required this.baziResult});

  @override
  State<DaYunLiuNianPage> createState() => _DaYunLiuNianPageState();
}

class _DaYunLiuNianPageState extends State<DaYunLiuNianPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _selectedDaYunIndex = 0;
  int _selectedLiuNianIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final daYun = widget.baziResult['da_yun'] as List? ?? [];
    final liuNian = widget.baziResult['liu_nian'] as List? ?? [];

    return Scaffold(
      backgroundColor: YiShunTheme.backgroundDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: YiShunTheme.backgroundGradient,
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
                      '大运流年',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
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
                  indicatorColor: YiShunTheme.goldPrimary,
                  indicatorWeight: 3,
                  indicatorSize: TabBarIndicatorSize.tab,
                  labelColor: YiShunTheme.goldPrimary,
                  unselectedLabelColor: Colors.white54,
                  dividerColor: Colors.transparent,
                  tabs: const [
                    Tab(text: '大运'),
                    Tab(text: '流年'),
                  ],
                ),
              ),

              // Tab Content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildDaYunTab(daYun),
                    _buildLiuNianTab(liuNian),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ==================== 大运 Tab ====================
  Widget _buildDaYunTab(List daYun) {
    if (daYun.isEmpty) {
      return _buildEmptyState('大运数据加载中...');
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline Overview
          _buildTimelineCard(daYun),
          const SizedBox(height: 16),

          // Selected Decade Detail
          _buildDaYunDetail(daYun),
        ],
      ),
    );
  }

  Widget _buildTimelineCard(List daYun) {
    return Container(
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
              Text('✦', style: TextStyle(color: YiShunTheme.goldPrimary, fontSize: 16)),
              SizedBox(width: 8),
              Text(
                '大运周期图',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Timeline
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: daYun.length,
              itemBuilder: (context, index) {
                final dayun = daYun[index] as Map<String, dynamic>;
                final isSelected = index == _selectedDaYunIndex;
                final wuxing = dayun['wuxing'] ?? '土';
                final color = YiShunTheme.getWuXingColor(wuxing);

                return GestureDetector(
                  onTap: () => setState(() => _selectedDaYunIndex = index),
                  child: Container(
                    width: 80,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? color.withAlpha(76)
                          : color.withAlpha(25),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? color : color.withAlpha(76),
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '${dayun['gan']}${dayun['zhi']}',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : color,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${dayun['start_age']}-${dayun['end_age']}岁',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.white.withAlpha(153),
                          ),
                        ),
                        Container(
                          margin: const EdgeInsets.only(top: 4),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: color.withAlpha(51),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            wuxing,
                            style: TextStyle(fontSize: 10, color: color),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDaYunDetail(List daYun) {
    if (_selectedDaYunIndex >= daYun.length) return const SizedBox.shrink();

    final dayun = daYun[_selectedDaYunIndex] as Map<String, dynamic>;
    final wuxing = dayun['wuxing'] ?? '土';
    final color = YiShunTheme.getWuXingColor(wuxing);
    final gan = dayun['gan'] ?? '甲';
    final zhi = dayun['zhi'] ?? '子';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withAlpha(76)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withAlpha(51),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Text(
                      '$gan$zhi',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                    Text(
                      '${dayun['start_age']}-${dayun['end_age']}岁',
                      style: TextStyle(fontSize: 10, color: Colors.white54),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '第${_selectedDaYunIndex + 1}步大运',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                    Text(
                      '五行属$wuxing',
                      style: const TextStyle(fontSize: 12, color: Colors.white54),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Fortune Chart
          _buildFortuneChart(color),
          const SizedBox(height: 20),

          // Analysis Text
          _buildDaYunAnalysis(dayun, color),
        ],
      ),
    );
  }

  Widget _buildFortuneChart(Color color) {
    // Simulated fortune data for the decade
    final spots = [
      const FlSpot(0, 3),
      const FlSpot(1, 4),
      const FlSpot(2, 3),
      const FlSpot(3, 5),
      const FlSpot(4, 4),
      const FlSpot(5, 6),
      const FlSpot(6, 5),
      const FlSpot(7, 7),
      const FlSpot(8, 6),
      const FlSpot(9, 8),
    ];

    return SizedBox(
      height: 120,
      child: LineChart(
        LineChartData(
          gridData: FlGridData(show: false),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 30,
                getTitlesWidget: (value, meta) {
                  final labels = ['', '差', '平', '中', '良', '好'];
                  if (value >= 0 && value < labels.length) {
                    return Text(
                      labels[value.toInt()],
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 10,
                      ),
                    );
                  }
                  return const Text('');
                },
              ),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  final year = DateTime.now().year + value.toInt();
                  return Text(
                    '${year.toString().substring(2)}年',
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 9,
                    ),
                  );
                },
              ),
            ),
            rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
          ),
          minY: 0,
          maxY: 10,
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              color: color,
              barWidth: 3,
              dotData: FlDotData(
                show: true,
                getDotPainter: (spot, percent, barData, index) {
                  return FlDotCirclePainter(
                    radius: 4,
                    color: color,
                    strokeWidth: 2,
                    strokeColor: Colors.white,
                  );
                },
              ),
              belowBarData: BarAreaData(
                show: true,
                color: color.withAlpha(51),
              ),
            ),
          ],
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipColor: (spot) => YiShunTheme.backgroundDark,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDaYunAnalysis(Map dayun, Color color) {
    final gan = dayun['gan'] ?? '甲';
    final zhi = dayun['zhi'] ?? '子';
    final wuxing = dayun['wuxing'] ?? '土';

    // Generate analysis based on the pillars
    final analysis = _generateDaYunAnalysis(gan, zhi, wuxing);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.analytics, size: 16, color: color),
            const SizedBox(width: 8),
            Text(
              '运势分析',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          analysis,
          style: TextStyle(
            color: Colors.white.withAlpha(179),
            fontSize: 13,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 16),

        // Tips
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: YiShunTheme.goldPrimary.withAlpha(25),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.lightbulb_outline, color: YiShunTheme.goldPrimary, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '此大运五行$wuxing较旺，适合发展与$wuxing相关的事业',
                  style: TextStyle(
                    color: Colors.white.withAlpha(179),
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

  String _generateDaYunAnalysis(String gan, String zhi, String wuxing) {
    // Simple analysis based on wuxing
    final analyses = {
      '木': '此大运木气旺盛，是积累和发展的大好时机。适合学习新知识、建立人脉、稳扎稳打推进事业。木旺之人思维活跃，创造力强，容易获得他人的认可和支持。',
      '火': '此大运火气旺盛，是展现才华的大好时机。适合主动出击、拓展业务、提升影响力。但需注意控制情绪，避免冲动决策。火旺之时，适合教育培训、媒体传播等行业。',
      '土': '此大运土气旺盛，是沉淀和收获的时期。适合巩固现有成果、积累财富、注重健康管理。土主稳重，此运利于不动产投资和长期规划。',
      '金': '此大运金气旺盛，是改革和突破的时期。适合调整策略、开创新局、结识贵人。金旺之运利于金融、法律、矿产等相关行业的发展。',
      '水': '此大运水气旺盛，是智慧和灵性提升的时期。适合深入学习、冥想修行、发展直觉。水旺之运利于贸易、物流、水产等相关行业。',
    };

    return analyses[wuxing] ?? '此大运整体运势平稳，需要稳扎稳打，把握机遇。';
  }

  // ==================== 流年 Tab ====================
  Widget _buildLiuNianTab(List liuNian) {
    if (liuNian.isEmpty) {
      return _buildEmptyState('流年数据加载中...');
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 流年列表
          ...liuNian.asMap().entries.map((entry) {
            final index = entry.key;
            final year = entry.value as Map<String, dynamic>;
            return _buildLiuNianCard(index, year);
          }),
        ],
      ),
    );
  }

  Widget _buildLiuNianCard(int index, Map year) {
    final isSelected = index == _selectedLiuNianIndex;
    final yearStr = year['year'] ?? DateTime.now().year.toString();
    final gan = year['gan'] ?? '甲';
    final zhi = year['zhi'] ?? '子';
    final wuxing = year['wuxing'] ?? '土';
    final shengxiao = year['shengxiao'] ?? '鼠';
    final color = YiShunTheme.getWuXingColor(wuxing);

    return GestureDetector(
      onTap: () => setState(() => _selectedLiuNianIndex = index),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? color.withAlpha(51)
              : Colors.white.withAlpha(13),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? color : Colors.white.withAlpha(25),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            // Year indicator
            Container(
              width: 60,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: color.withAlpha(38),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Text(
                    yearStr.toString().substring(2),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  Text(
                    '年',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.white.withAlpha(153),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),

            // Pillars info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        '$gan$zhi',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: color,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: color.withAlpha(51),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '$wuxing · $shengxiao',
                          style: TextStyle(fontSize: 11, color: color),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _generateLiuNianAnalysis(gan, zhi, wuxing),
                    style: TextStyle(
                      color: Colors.white.withAlpha(153),
                      fontSize: 12,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            // Arrow
            Icon(
              Icons.chevron_right,
              color: Colors.white.withAlpha(76),
            ),
          ],
        ),
      ),
    );
  }

  String _generateLiuNianAnalysis(String gan, String zhi, String wuxing) {
    // Generate simple analysis based on wuxing
    final analyses = {
      '木': '流年木旺，利学业考试、人际交往。',
      '火': '流年火旺，利展示才华、拓展人脉。',
      '土': '流年土旺，利积累沉淀、稳扎稳打。',
      '金': '流年金旺，利改革创新、结识贵人。',
      '水': '流年水旺，利智慧思考、灵活应变。',
    };

    return analyses[wuxing] ?? '流年运势平稳，需顺势而为。';
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.timeline, size: 64, color: Colors.white54),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(color: Colors.white54),
          ),
        ],
      ),
    );
  }
}

/// 流年详情弹窗
class LiuNianDetailDialog extends StatelessWidget {
  final Map<String, dynamic> yearData;

  const LiuNianDetailDialog({super.key, required this.yearData});

  @override
  Widget build(BuildContext context) {
    final year = yearData['year'] ?? '';
    final gan = yearData['gan'] ?? '';
    final zhi = yearData['zhi'] ?? '';
    final wuxing = yearData['wuxing'] ?? '';
    final shengxiao = yearData['shengxiao'] ?? '';
    final color = YiShunTheme.getWuXingColor(wuxing);

    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400),
        decoration: BoxDecoration(
          color: YiShunTheme.backgroundDark,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withAlpha(128)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withAlpha(51),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '$gan$zhi',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$year年流年',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: color.withAlpha(51),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '$wuxing行 · $shengxiao',
                              style: TextStyle(fontSize: 11, color: color),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: Colors.white54),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Analysis
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: color.withAlpha(25),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _generateYearAnalysis(gan, zhi, wuxing),
                style: TextStyle(
                  color: Colors.white.withAlpha(204),
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Tips
            Text(
              '💡 建议：流年$wuxing旺，${_getYearTip(wuxing)}',
              style: TextStyle(
                color: Colors.white.withAlpha(179),
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 20),

            // Close Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: color.withAlpha(51),
                  foregroundColor: color,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('关闭'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _generateYearAnalysis(String gan, String zhi, String wuxing) {
    // Simple year analysis based on pillars
    return '此年$gan$zhi流年，五行$wuxing主事。'
        '整体运势较为平稳，需要把握机遇，规避风险。'
        '在事业上可能会有突破，但需注意人际关系。'
        '财运方面需谨慎理财，避免大额投资。'
        '感情方面可能有新的遇见，已婚者需注意沟通。';
  }

  String _getYearTip(String wuxing) {
    final tips = {
      '木': '适合学习新知识，拓展人际关系',
      '火': '适合主动出击，展现个人才华',
      '土': '适合积累沉淀，稳健发展',
      '金': '适合改革创新，把握机遇',
      '水': '适合灵活变通，智慧决策',
    };
    return tips[wuxing] ?? '顺势而为，稳扎稳打';
  }
}
