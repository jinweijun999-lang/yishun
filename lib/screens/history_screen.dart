import 'package:flutter/material.dart';
import '../services/history_service.dart';
import '../utils/theme.dart';
import 'compatibility_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final HistoryService _historyService = HistoryService();
  
  List<HistoryEntry> _baziHistory = [];
  List<HistoryEntry> _compatibilityHistory = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadHistory();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoading = true);
    
    final bazi = await _historyService.getHistoryByType(HistoryType.bazi);
    final compatibility = await _historyService.getHistoryByType(HistoryType.compatibility);
    
    setState(() {
      _baziHistory = bazi;
      _compatibilityHistory = compatibility;
      _isLoading = false;
    });
  }

  Future<void> _clearAll(HistoryType type) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认清空'),
        content: Text('确定要清空所有${type == HistoryType.bazi ? '八字排盘' : '合盘分析'}记录吗？此操作不可恢复。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('清空', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _historyService.clearHistoryByType(type);
      _loadHistory();
    }
  }

  void _viewEntry(HistoryEntry entry) {
    if (entry.type == HistoryType.bazi && entry.baziData != null) {
      Navigator.pushNamed(
        context,
        '/result',
        arguments: entry.baziData,
      );
    } else if (entry.type == HistoryType.compatibility) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const CompatibilityScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: YiShunTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: YiShunTheme.goldPrimary,
        title: const Text('历史记录', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: '八字排盘'),
            Tab(text: '合盘分析'),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (value) {
              if (value == 'clear_bazi') {
                _clearAll(HistoryType.bazi);
              } else if (value == 'clear_compat') {
                _clearAll(HistoryType.compatibility);
              } else if (value == 'clear_all') {
                _clearAll(HistoryType.bazi);
                _clearAll(HistoryType.compatibility);
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'clear_bazi',
                child: Text('清空八字记录'),
              ),
              const PopupMenuItem(
                value: 'clear_compat',
                child: Text('清空合盘记录'),
              ),
              const PopupMenuItem(
                value: 'clear_all',
                child: Text('清空全部', style: TextStyle(color: Colors.red)),
              ),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildBaziHistoryList(),
                _buildCompatibilityHistoryList(),
              ],
            ),
    );
  }

  Widget _buildBaziHistoryList() {
    if (_baziHistory.isEmpty) {
      return _buildEmptyState(
        icon: Icons.history,
        title: '暂无排盘记录',
        subtitle: '开始你的第一次八字分析吧',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadHistory,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _baziHistory.length,
        itemBuilder: (context, index) {
          final entry = _baziHistory[index];
          return _buildBaziHistoryCard(entry);
        },
      ),
    );
  }

  Widget _buildCompatibilityHistoryList() {
    if (_compatibilityHistory.isEmpty) {
      return _buildEmptyState(
        icon: Icons.favorite_border,
        title: '暂无合盘记录',
        subtitle: '开始分析你们的缘分吧',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadHistory,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _compatibilityHistory.length,
        itemBuilder: (context, index) {
          final entry = _compatibilityHistory[index];
          return _buildCompatibilityHistoryCard(entry);
        },
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 80, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyle(color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }

  Widget _buildBaziHistoryCard(HistoryEntry entry) {
    final bazi = entry.baziData;
    final year = bazi?['year'];
    final month = bazi?['month'];
    final day = bazi?['day'];

    return Dismissible(
      key: Key(entry.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.red,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) async {
        await _historyService.deleteHistoryEntry(entry.id);
        _loadHistory();
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: InkWell(
          onTap: () => _viewEntry(entry),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: YiShunTheme.goldPrimary.withAlpha(26),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text('☯️', style: TextStyle(fontSize: 24)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            entry.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            entry.birthDateStr,
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right, color: Colors.grey.shade400),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildPillarChip('年', '${year?['gan']}${year?['zhi']}'),
                      _buildPillarChip('月', '${month?['gan']}${month?['zhi']}'),
                      _buildPillarChip('日', '${day?['gan']}${day?['zhi']}'),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _formatDate(entry.createdAt),
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCompatibilityHistoryCard(HistoryEntry entry) {
    final compatResult = entry.compatibilityResult;
    final score = compatResult?['score'] ?? 0;
    final level = compatResult?['level'] ?? '一般';

    return Dismissible(
      key: Key(entry.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.red,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) async {
        await _historyService.deleteHistoryEntry(entry.id);
        _loadHistory();
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: InkWell(
          onTap: () => _viewEntry(entry),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: YiShunTheme.purpleMystic.withAlpha(26),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text('💑', style: TextStyle(fontSize: 24)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${entry.name} & ${entry.name2}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${entry.birthDateStr} · ${entry.birthDate2Str}',
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getScoreColor(score).withAlpha(26),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '$score分',
                        style: TextStyle(
                          color: _getScoreColor(score),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    level,
                    style: TextStyle(
                      color: Colors.grey.shade700,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _formatDate(entry.createdAt),
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPillarChip(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey.shade500,
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Color _getScoreColor(int score) {
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.orange;
    return Colors.red;
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    
    if (diff.inDays == 0) {
      return '今天 ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else if (diff.inDays == 1) {
      return '昨天 ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}天前';
    } else {
      return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    }
  }
}
