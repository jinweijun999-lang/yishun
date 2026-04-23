import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadResults();
  }

  @override
  void dispose() {
    _tabController.dispose();
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

  @override
  Widget build(BuildContext context) {
    if (_baziResult == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Result')),
        body: const Center(child: Text('No data available')),
      );
    }

    return Scaffold(
      backgroundColor: YiShunTheme.surfaceLight,
      appBar: AppBar(
        backgroundColor: YiShunTheme.primaryColor,
        title: const Text('分析结果'),
        centerTitle: true,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: '四柱', icon: Icon(Icons.grid_on)),
            Tab(text: '五行', icon: Icon(Icons.balance)),
            Tab(text: '运势', icon: Icon(Icons.auto_graph)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildFourPillarsTab(),
          _buildFiveElementsTab(),
          _buildFortuneTab(),
        ],
      ),
    );
  }

  Widget _buildFourPillarsTab() {
    final pillars = ['year', 'month', 'day', 'hour'];
    final pillarNames = ['年柱', '月柱', '日柱', '时柱'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Bazi display
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const Text(
                    '☯️ 八字',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: List.generate(4, (i) {
                      final pillar = _baziResult![pillars[i]];
                      return _buildPillarColumn(
                        pillarNames[i],
                        pillar['gan'] ?? '',
                        pillar['zhi'] ?? '',
                        pillar['wuxing'] ?? '',
                      );
                    }),
                  ),
                  const SizedBox(height: 20),
                  if (_baziResult!['solar_time'] != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: YiShunTheme.primaryColor.withAlpha(25),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '真太阳时: ${_baziResult!['solar_time']}',
                        style: const TextStyle(
                          color: YiShunTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Day master info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.person, color: YiShunTheme.primaryColor),
                      SizedBox(width: 8),
                      Text(
                        '日主',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '${_baziResult!['day_master'] ?? '甲'}木之人',
                    style: const TextStyle(fontSize: 18),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '日主代表自己，是八字的核心',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
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
          style: const TextStyle(fontSize: 12, color: Colors.grey),
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
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                zhi,
                style: TextStyle(
                  fontSize: 24,
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

  Widget _buildFiveElementsTab() {
    final wuxingCount = _baziResult!['wuxing_count'] as Map<String, dynamic>? ?? {};
    final elements = ['木', '火', '土', '金', '水'];
    final total = wuxingCount.values.fold<int>(0, (sum, v) => sum + (v as int));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Five elements distribution
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const Text(
                    '⚖️ 五行分布',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 20),
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
          ),
          const SizedBox(height: 16),

          // Analysis
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.analytics, color: YiShunTheme.primaryColor),
                      SizedBox(width: 8),
                      Text(
                        '五行分析',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildWuxingAnalysis(wuxingCount),
                ],
              ),
            ),
          ),
        ],
      ),
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
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
        Expanded(
          child: Stack(
            children: [
              Container(
                height: 24,
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              FractionallySizedBox(
                widthFactor: percentage,
                child: Container(
                  height: 24,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        SizedBox(
          width: 30,
          child: Text(
            '$count',
            textAlign: TextAlign.end,
            style: const TextStyle(fontWeight: FontWeight.bold),
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
            '最旺: ${strongest}行',
            '${strongest}元素最为旺盛，性格特征明显',
            YiShunTheme.getWuxingColor(strongest),
          ),
        if (weakest != null && strongest != weakest)
          _buildAnalysisItem(
            '最弱: ${weakest}行',
            '${weakest}元素相对缺乏，需要后天补足',
            YiShunTheme.getWuxingColor(weakest),
          ),
        const SizedBox(height: 12),
        Text(
          '注：五行平衡为最佳，过旺或过弱都可能影响运势',
          style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
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
            style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildFortuneTab() {
    if (_isLoadingFortune) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_fortuneResult == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text('Failed to load fortune'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadFortune,
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
          // Fortune overview
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const Text(
                    '🔮 综合运势',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _fortuneResult!['fortune'] ?? '运势平稳',
                    style: const TextStyle(fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Fortune categories
          ...['career', 'love', 'health', 'wealth'].map((aspect) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildFortuneCard(
                aspect,
                _fortuneResult![aspect] ?? '一般',
              ),
            );
          }),

          // Tips
          if (_fortuneResult!['tips'] != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.lightbulb_outline,
                            color: YiShunTheme.accentColor),
                        SizedBox(width: 8),
                        Text(
                          '建议',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold),
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
                                  const Text('• '),
                                  Expanded(child: Text(tip.toString())),
                                ],
                              ),
                            ))),
                  ],
                ),
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

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: YiShunTheme.primaryColor.withAlpha(25),
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
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    content,
                    style: TextStyle(
                      color: Colors.grey.shade700,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
