import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/gemini_service.dart';
import '../services/history_service.dart';
import '../utils/theme.dart';

class CompatibilityScreen extends StatefulWidget {
  const CompatibilityScreen({super.key});

  @override
  State<CompatibilityScreen> createState() => _CompatibilityScreenState();
}

class _CompatibilityScreenState extends State<CompatibilityScreen> {
  final _formKey1 = GlobalKey<FormState>();
  final _formKey2 = GlobalKey<FormState>();
  final _nameController1 = TextEditingController();
  final _nameController2 = TextEditingController();

  // Person 1 birth info
  int _birthYear1 = 1990;
  int _birthMonth1 = 1;
  int _birthDay1 = 1;
  int _birthHour1 = 12;

  // Person 2 birth info
  int _birthYear2 = 1990;
  int _birthMonth2 = 1;
  int _birthDay2 = 1;
  int _birthHour2 = 12;

  // State
  bool _isLoading = false;
  Map<String, dynamic>? _result;
  String? _error;
  int _currentStep = 0;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _birthYear1 = now.year - 25;
    _birthYear2 = now.year - 25;
  }

  @override
  void dispose() {
    _nameController1.dispose();
    _nameController2.dispose();
    super.dispose();
  }

  Future<void> _analyze() async {
    if (!_formKey1.currentState!.validate() || !_formKey2.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _currentStep = 1;
    });

    try {
      final authService = context.read<AuthService>();
      final apiService = ApiService(authService);
      final geminiService = GeminiService();
      final historyService = HistoryService();

      final bazi1Future = apiService.getBazi(
        year: _birthYear1,
        month: _birthMonth1,
        day: _birthDay1,
        hour: _birthHour1,
        name: _nameController1.text,
      );

      final bazi2Future = apiService.getBazi(
        year: _birthYear2,
        month: _birthMonth2,
        day: _birthDay2,
        hour: _birthHour2,
        name: _nameController2.text,
      );

      final results = await Future.wait([bazi1Future, bazi2Future]);
      final bazi1 = results[0];
      final bazi2 = results[1];

      final compatibility = await apiService.getCompatibility(
        bazi1: bazi1,
        bazi2: bazi2,
      );

      final aiResult = await geminiService.analyzeCompatibility(bazi1, bazi2);

      await historyService.saveCompatibilityToHistory(
        bazi1: bazi1,
        bazi2: bazi2,
        name1: _nameController1.text.isNotEmpty ? _nameController1.text : '用户1',
        name2: _nameController2.text.isNotEmpty ? _nameController2.text : '用户2',
        birthDate1: DateTime(_birthYear1, _birthMonth1, _birthDay1),
        birthDate2: DateTime(_birthYear2, _birthMonth2, _birthDay2),
        compatibilityResult: {
          ...compatibility,
          'ai_analysis': aiResult.success ? aiResult.content : null,
          'gemini_usage': aiResult.usage,
        },
        createdAt: DateTime.now(),
      );

      setState(() {
        _result = {
          'bazi1': bazi1,
          'bazi2': bazi2,
          'compatibility': compatibility,
          'ai_analysis': aiResult.success ? aiResult.content : null,
        };
        _isLoading = false;
        _currentStep = 2;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
        _currentStep = 0;
      });
    }
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
          child: _currentStep == 2 ? _buildResultView() : _buildInputView(),
        ),
      ),
    );
  }

  Widget _buildInputView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [YiShunTheme.brandInkBlue, Color(0xFF2D5280)],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withAlpha(25)),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: YiShunTheme.fireColor.withAlpha(51),
                    shape: BoxShape.circle,
                  ),
                  child: const Text('💑', style: TextStyle(fontSize: 48)),
                ),
                const SizedBox(height: 12),
                const Text(
                  '双人合盘分析',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '分析两人八字匹配度与缘分',
                  style: TextStyle(color: Colors.white.withAlpha(179), fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Person 1 Card
          _buildPersonCard(
            title: '甲方',
            icon: Icons.person,
            color: YiShunTheme.brandCinnabar,
            formKey: _formKey1,
            nameController: _nameController1,
            year: _birthYear1,
            month: _birthMonth1,
            day: _birthDay1,
            hour: _birthHour1,
            onYearChanged: (v) => setState(() => _birthYear1 = v),
            onMonthChanged: (v) => setState(() => _birthMonth1 = v),
            onDayChanged: (v) => setState(() => _birthDay1 = v),
            onHourChanged: (v) => setState(() => _birthHour1 = v),
          ),
          const SizedBox(height: 16),

          // Divider with heart
          Row(
            children: [
              Expanded(child: Divider(color: Colors.white.withAlpha(25))),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text('💕', style: TextStyle(fontSize: 24, color: Colors.white.withAlpha(128))),
              ),
              Expanded(child: Divider(color: Colors.white.withAlpha(25))),
            ],
          ),
          const SizedBox(height: 16),

          // Person 2 Card
          _buildPersonCard(
            title: '乙方',
            icon: Icons.person_outline,
            color: YiShunTheme.waterColor,
            formKey: _formKey2,
            nameController: _nameController2,
            year: _birthYear2,
            month: _birthMonth2,
            day: _birthDay2,
            hour: _birthHour2,
            onYearChanged: (v) => setState(() => _birthYear2 = v),
            onMonthChanged: (v) => setState(() => _birthMonth2 = v),
            onDayChanged: (v) => setState(() => _birthDay2 = v),
            onHourChanged: (v) => setState(() => _birthHour2 = v),
          ),
          const SizedBox(height: 24),

          // Error
          if (_error != null)
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
                    child: Text(_error!, style: const TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 16),

          // Analyze button
          SizedBox(
            height: 56,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _analyze,
              style: ElevatedButton.styleFrom(
                backgroundColor: YiShunTheme.brandCinnabar,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 8,
                shadowColor: YiShunTheme.brandCinnabar.withAlpha(128),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('💕', style: TextStyle(fontSize: 20)),
                        SizedBox(width: 8),
                        Text(
                          '开始合盘分析',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildPersonCard({
    required String title,
    required IconData icon,
    required Color color,
    required GlobalKey<FormState> formKey,
    required TextEditingController nameController,
    required int year,
    required int month,
    required int day,
    required int hour,
    required ValueChanged<int> onYearChanged,
    required ValueChanged<int> onMonthChanged,
    required ValueChanged<int> onDayChanged,
    required ValueChanged<int> onHourChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withAlpha(51),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Name input
            Container(
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(13),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withAlpha(51)),
              ),
              child: TextFormField(
                controller: nameController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: '姓名（可选）',
                  labelStyle: const TextStyle(color: Colors.white54),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Birth date
            Row(
              children: [
                Expanded(child: _buildYearPicker(year, onYearChanged)),
                const SizedBox(width: 8),
                Expanded(child: _buildMonthPicker(month, onMonthChanged)),
                const SizedBox(width: 8),
                Expanded(child: _buildDayPicker(day, onDayChanged)),
              ],
            ),
            const SizedBox(height: 16),

            // Birth hour
            Text(
              '出生时辰',
              style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(153)),
            ),
            const SizedBox(height: 8),
            _buildHourPicker(hour, onHourChanged),
          ],
        ),
      ),
    );
  }

  Widget _buildYearPicker(int value, ValueChanged<int> onChanged) {
    final currentYear = DateTime.now().year;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withAlpha(51)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: value,
          isExpanded: true,
          dropdownColor: YiShunTheme.surfaceDark,
          style: const TextStyle(color: Colors.white),
          items: List.generate(100, (i) => currentYear - 50 + i)
              .map((y) => DropdownMenuItem(value: y, child: Text('$y')))
              .toList(),
          onChanged: (v) => onChanged(v!),
        ),
      ),
    );
  }

  Widget _buildMonthPicker(int value, ValueChanged<int> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withAlpha(51)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: value,
          isExpanded: true,
          dropdownColor: YiShunTheme.surfaceDark,
          style: const TextStyle(color: Colors.white),
          items: List.generate(12, (i) => i + 1)
              .map((m) => DropdownMenuItem(value: m, child: Text('$m')))
              .toList(),
          onChanged: (v) => onChanged(v!),
        ),
      ),
    );
  }

  Widget _buildDayPicker(int value, ValueChanged<int> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withAlpha(51)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: value,
          isExpanded: true,
          dropdownColor: YiShunTheme.surfaceDark,
          style: const TextStyle(color: Colors.white),
          items: List.generate(31, (i) => i + 1)
              .map((d) => DropdownMenuItem(value: d, child: Text('$d')))
              .toList(),
          onChanged: (v) => onChanged(v!),
        ),
      ),
    );
  }

  Widget _buildHourPicker(int value, ValueChanged<int> onChanged) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: List.generate(24, (i) {
        final isSelected = value == i;
        return GestureDetector(
          onTap: () => onChanged(i),
          child: Container(
            width: 48,
            height: 36,
            decoration: BoxDecoration(
              color: isSelected
                  ? YiShunTheme.brandAmber.withAlpha(76)
                  : Colors.white.withAlpha(13),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected ? YiShunTheme.brandAmber : Colors.white.withAlpha(51),
              ),
            ),
            child: Center(
              child: Text(
                '$i',
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white54,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  fontSize: 12,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildResultView() {
    if (_result == null) return const SizedBox.shrink();

    final bazi1 = _result!['bazi1'];
    final bazi2 = _result!['bazi2'];
    final compatibility = _result!['compatibility'];
    final aiAnalysis = _result!['ai_analysis'];

    final score = compatibility['score'] ?? 75;
    final level = compatibility['level'] ?? '一般';
    final reasons = List<String>.from(compatibility['reasons'] ?? []);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Score Card
          _buildScoreCard(score, level),
          const SizedBox(height: 20),

          // Bazi Display
          _buildBaziComparisonCard(bazi1, bazi2),
          const SizedBox(height: 20),

          // Match Reasons
          if (reasons.isNotEmpty) ...[
            _buildReasonsCard(reasons),
            const SizedBox(height: 20),
          ],

          // AI Analysis
          if (aiAnalysis != null && aiAnalysis.isNotEmpty) ...[
            _buildAIAnalysisCard(aiAnalysis),
            const SizedBox(height: 20),
          ],

          // Compatibility Details
          _buildCompatibilityDetailsCard(compatibility),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildScoreCard(int score, String level) {
    Color scoreColor;
    if (score >= 80) {
      scoreColor = YiShunTheme.woodColor;
    } else if (score >= 60) {
      scoreColor = YiShunTheme.brandAmber;
    } else {
      scoreColor = YiShunTheme.fireColor;
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [scoreColor, scoreColor.withAlpha(204)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Column(
        children: [
          const Text('💕', style: TextStyle(fontSize: 50)),
          const SizedBox(height: 12),
          Text(
            '$score',
            style: const TextStyle(
              fontSize: 64,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          Text(
            '分',
            style: TextStyle(
              fontSize: 20,
              color: Colors.white.withAlpha(204),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(51),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              level,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBaziComparisonCard(Map<String, dynamic> bazi1, Map<String, dynamic> bazi2) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: YiShunTheme.brandAmber.withAlpha(51),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('☯️', style: TextStyle(fontSize: 18)),
              ),
              const SizedBox(width: 8),
              const Text(
                '八字对比',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Headers
          Row(
            children: [
              const Expanded(flex: 2, child: SizedBox()),
              Expanded(
                flex: 3,
                child: Text(
                  _nameController1.text.isNotEmpty ? _nameController1.text : '甲方',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
              Expanded(
                flex: 3,
                child: Text(
                  _nameController2.text.isNotEmpty ? _nameController2.text : '乙方',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ],
          ),
          Divider(color: Colors.white.withAlpha(25)),
          _buildBaziRow('年', bazi1['year'], bazi2['year']),
          _buildBaziRow('月', bazi1['month'], bazi2['month']),
          _buildBaziRow('日', bazi1['day'], bazi2['day']),
          _buildBaziRow('时', bazi1['hour'], bazi2['hour']),
          Divider(color: Colors.white.withAlpha(25)),
          Row(
            children: [
              const Expanded(flex: 2, child: Text('日主', style: TextStyle(color: Colors.white54))),
              Expanded(
                flex: 3,
                child: Text(
                  '${bazi1['day_master']}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
              Expanded(
                flex: 3,
                child: Text(
                  '${bazi2['day_master']}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBaziRow(String label, Map<String, dynamic> z1, Map<String, dynamic> z2) {
    final color1 = YiShunTheme.getWuxingColor(z1['wuxing'] ?? '');
    final color2 = YiShunTheme.getWuxingColor(z2['wuxing'] ?? '');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(label, style: const TextStyle(color: Colors.white54)),
          ),
          Expanded(
            flex: 3,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
              decoration: BoxDecoration(
                color: color1.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: color1.withAlpha(76)),
              ),
              child: Text(
                '${z1['gan']}${z1['zhi']}',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.bold, color: color1),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 3,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
              decoration: BoxDecoration(
                color: color2.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: color2.withAlpha(76)),
              ),
              child: Text(
                '${z2['gan']}${z2['zhi']}',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.bold, color: color2),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReasonsCard(List<String> reasons) {
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
          Row(
            children: [
              const Icon(Icons.star, color: YiShunTheme.brandAmber, size: 20),
              const SizedBox(width: 8),
              const Text(
                '合盘亮点',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...reasons.map((reason) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: YiShunTheme.woodColor, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(reason, style: TextStyle(color: Colors.white.withAlpha(179))),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildAIAnalysisCard(String aiAnalysis) {
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
          Row(
            children: [
              const Icon(Icons.auto_awesome, color: YiShunTheme.brandCinnabar, size: 20),
              const SizedBox(width: 8),
              const Text(
                'AI 深度分析',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            aiAnalysis,
            style: TextStyle(height: 1.6, color: Colors.white.withAlpha(179)),
          ),
        ],
      ),
    );
  }

  Widget _buildCompatibilityDetailsCard(Map<String, dynamic> compatibility) {
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
          Row(
            children: [
              const Icon(Icons.analytics, color: YiShunTheme.brandInkBlue, size: 20),
              const SizedBox(width: 8),
              const Text(
                '详细分析',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            compatibility['message'] ?? '专业八字合盘分析结果',
            style: TextStyle(height: 1.6, color: Colors.white.withAlpha(179)),
          ),
        ],
      ),
    );
  }
}