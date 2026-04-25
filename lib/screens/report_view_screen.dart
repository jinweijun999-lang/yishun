import 'package:flutter/material.dart';
import '../utils/theme.dart';

class PurchasedReport {
  final String id;
  final String type;
  final String title;
  final DateTime purchasedAt;
  final String? content;

  PurchasedReport({
    required this.id,
    required this.type,
    required this.title,
    required this.purchasedAt,
    this.content,
  });
}

class ReportViewScreen extends StatefulWidget {
  const ReportViewScreen({super.key});

  @override
  State<ReportViewScreen> createState() => _ReportViewScreenState();
}

class _ReportViewScreenState extends State<ReportViewScreen> {
  List<PurchasedReport> _reports = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    // Stub: load purchased reports
    // In production, this would fetch from API/storage
    await Future.delayed(const Duration(milliseconds: 500));

    if (!mounted) return;

    setState(() {
      _reports = [
        PurchasedReport(
          id: '1',
          type: '流年',
          title: '2026流年运势深度报告',
          purchasedAt: DateTime.now().subtract(const Duration(days: 2)),
        ),
        PurchasedReport(
          id: '2',
          type: '姻缘',
          title: '姻缘深度分析报告',
          purchasedAt: DateTime.now().subtract(const Duration(days: 5)),
        ),
      ];
      _isLoading = false;
    });
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
                      '我的报告',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => Navigator.pushNamed(context, '/report_purchase'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: YiShunTheme.brandAmber.withAlpha(51),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.add, color: YiShunTheme.brandAmber, size: 16),
                            SizedBox(width: 4),
                            Text(
                              '购买',
                              style: TextStyle(
                                color: YiShunTheme.brandAmber,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(color: YiShunTheme.brandAmber),
                      )
                    : _reports.isEmpty
                        ? _buildEmptyState()
                        : _buildReportList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(13),
              borderRadius: BorderRadius.circular(50),
            ),
            child: const Text('📜', style: TextStyle(fontSize: 60)),
          ),
          const SizedBox(height: 24),
          const Text(
            '暂无报告',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '购买深度报告后可在此处查看',
            style: TextStyle(
              fontSize: 13,
              color: Colors.white.withAlpha(153),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/report_purchase'),
            style: ElevatedButton.styleFrom(
              backgroundColor: YiShunTheme.brandAmber,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: const Text('购买报告', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildReportList() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _reports.length,
      itemBuilder: (context, index) {
        final report = _reports[index];
        return _buildReportCard(report);
      },
    );
  }

  Widget _buildReportCard(PurchasedReport report) {
    final typeEmoji = _getTypeEmoji(report.type);
    final typeColor = _getTypeColor(report.type);

    return GestureDetector(
      onTap: () => _showReportDetail(report),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
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
                color: typeColor.withAlpha(51),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(typeEmoji, style: const TextStyle(fontSize: 24)),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    report.title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: typeColor.withAlpha(51),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          report.type,
                          style: TextStyle(
                            fontSize: 11,
                            color: typeColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatDate(report.purchasedAt),
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.white.withAlpha(102),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.chevron_right,
                color: Colors.white54,
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReportDetail(PurchasedReport report) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Text(
                _getTypeEmoji(report.type),
                style: const TextStyle(fontSize: 32),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      report.title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '购买于 ${_formatDate(report.purchasedAt)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withAlpha(153),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Colors.white24),
          const SizedBox(height: 20),
          // Stub content - in production would show actual report content
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(8),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '📋 报告概要',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  report.content ?? '报告内容生成中，请稍候...\n\n深度报告涵盖五行分析、十神关系、大运流年等全方位解读。',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withAlpha(179),
                    height: 1.6,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.share, size: 18),
              label: const Text('分享报告'),
              style: ElevatedButton.styleFrom(
                backgroundColor: YiShunTheme.brandInkBlue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showReportDetail(PurchasedReport report) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Container(
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: YiShunTheme.surfaceDark,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withAlpha(25)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(51),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: _buildReportDetail(report),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getTypeEmoji(String type) {
    switch (type) {
      case '流年':
        return '🌊';
      case '姻缘':
        return '💑';
      case '事业':
        return '💼';
      case '财富':
        return '💰';
      default:
        return '📜';
    }
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case '流年':
        return YiShunTheme.waterColor;
      case '姻缘':
        return YiShunTheme.fireColor;
      case '事业':
        return YiShunTheme.brandInkBlue;
      case '财富':
        return YiShunTheme.brandAmber;
      default:
        return YiShunTheme.brandInkBlue;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date).inDays;
    if (diff == 0) return '今天';
    if (diff == 1) return '昨天';
    if (diff < 7) return '$diff天前';
    return '${date.month}/${date.day}/${date.year}';
  }
}
