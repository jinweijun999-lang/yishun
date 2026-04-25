import 'package:flutter/material.dart';
import '../utils/theme.dart';

enum ReportType {
  liunian,
  marriage,
  career,
  wealth,
}

extension ReportTypeExt on ReportType {
  String get label {
    switch (this) {
      case ReportType.liunian:
        return '流年';
      case ReportType.marriage:
        return '姻缘';
      case ReportType.career:
        return '事业';
      case ReportType.wealth:
        return '财富';
    }
  }

  String get emoji {
    switch (this) {
      case ReportType.liunian:
        return '🌊';
      case ReportType.marriage:
        return '💑';
      case ReportType.career:
        return '💼';
      case ReportType.wealth:
        return '💰';
    }
  }

  String get description {
    switch (this) {
      case ReportType.liunian:
        return '逐月解析全年运势起伏，把握每一个机遇';
      case ReportType.marriage:
        return '深度剖析情感缘分，指引婚姻方向';
      case ReportType.career:
        return '事业发展规划，职场晋升指南';
      case ReportType.wealth:
        return '财富运势解读，理财投资建议';
    }
  }
}

class ReportPurchaseScreen extends StatefulWidget {
  const ReportPurchaseScreen({super.key});

  @override
  State<ReportPurchaseScreen> createState() => _ReportPurchaseScreenState();
}

class _ReportPurchaseScreenState extends State<ReportPurchaseScreen> {
  ReportType? _selectedType;
  bool _isPurchasing = false;
  String? _error;

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
                      '深度报告',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [YiShunTheme.brandInkBlue, Color(0xFF2D5280)],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withAlpha(25)),
                          boxShadow: [
                            BoxShadow(
                              color: YiShunTheme.brandInkBlue.withAlpha(128),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            const Text('📜', style: TextStyle(fontSize: 48)),
                            const SizedBox(height: 12),
                            const Text(
                              '单次深度报告',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '专业命理师深度解读，精准把握人生方向',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.white.withAlpha(179),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Report type selection
                      const Text(
                        '选择报告类型',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 12),

                      ...ReportType.values.map((type) => _buildReportTypeCard(type)),

                      const SizedBox(height: 24),

                      // Price & Purchase
                      if (_selectedType != null) ...[
                        _buildPurchaseCard(),
                      ],

                      if (_error != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.withAlpha(51),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.red.withAlpha(76)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline, color: Colors.red),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _error!,
                                  style: const TextStyle(color: Colors.red),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      const SizedBox(height: 32),
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

  Widget _buildReportTypeCard(ReportType type) {
    final isSelected = _selectedType == type;
    return GestureDetector(
      onTap: () => setState(() => _selectedType = type),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? YiShunTheme.brandAmber.withAlpha(25)
              : Colors.white.withAlpha(13),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? YiShunTheme.brandAmber
                : Colors.white.withAlpha(25),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected
                    ? YiShunTheme.brandAmber.withAlpha(51)
                    : Colors.white.withAlpha(25),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(type.emoji, style: const TextStyle(fontSize: 28)),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    type.label,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? YiShunTheme.brandAmber : Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    type.description,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withAlpha(153),
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: YiShunTheme.brandAmber,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.black87, size: 16),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPurchaseCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '报告费用',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white70,
                ),
              ),
              Row(
                children: [
                  Text(
                    '💵 ',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withAlpha(153),
                    ),
                  ),
                  const Text(
                    '\$2.99',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: YiShunTheme.brandAmber,
                    ),
                  ),
                  Text(
                    ' / 次',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withAlpha(153),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isPurchasing ? null : _handlePurchase,
              style: ElevatedButton.styleFrom(
                backgroundColor: YiShunTheme.brandAmber,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: _isPurchasing
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.black,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      '立即购买',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '购买后可在"我的报告"中查看',
            style: TextStyle(
              fontSize: 11,
              color: Colors.white.withAlpha(102),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handlePurchase() async {
    if (_selectedType == null) return;

    setState(() {
      _isPurchasing = true;
      _error = null;
    });

    try {
      // Stub: simulate purchase
      await Future.delayed(const Duration(seconds: 2));

      if (!mounted) return;

      // TODO: Integrate with subscription_service for actual payment in production
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ ${_selectedType!.label}报告购买成功！'),
          backgroundColor: Colors.green,
        ),
      );

      // Navigate to report view
      Navigator.pushReplacementNamed(context, '/report_view');
    } catch (e) {
      setState(() {
        _error = '购买失败: $e';
        _isPurchasing = false;
      });
    }
  }
}
