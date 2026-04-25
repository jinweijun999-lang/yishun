import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/analytics_service.dart';
import '../services/ad_service.dart';
import '../services/history_service.dart';
import '../models/user_model.dart';
import '../utils/theme.dart';

class DivinationScreen extends StatefulWidget {
  const DivinationScreen({super.key});

  @override
  State<DivinationScreen> createState() => _DivinationScreenState();
}

class _DivinationScreenState extends State<DivinationScreen>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();

  // Birth info
  int _birthYear = 1990;
  int _birthMonth = 1;
  int _birthDay = 1;
  int _birthHour = 12;
  double _longitude = 116.4;
  int _gender = 0; // 0=male, 1=female

  // State
  bool _isLoading = false;
  Map<String, dynamic>? _result;
  String? _error;

  // Animation
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _birthYear = now.year - 25;

    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _pulseController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _analyze() async {
    if (!_formKey.currentState!.validate()) return;

    final user = context.read<UserModel>();

    if (!user.isPremium && !user.useFreeCredit()) {
      _showUpgradeDialog();
      return;
    }

    await _performAnalysis();
  }

  Future<void> _performAnalysis() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authService = context.read<AuthService>();
      final apiService = ApiService(authService);
      final analytics = context.read<AnalyticsService>();

      final result = await apiService.getBazi(
        year: _birthYear,
        month: _birthMonth,
        day: _birthDay,
        hour: _birthHour,
        longitude: _longitude,
        name: _nameController.text.isNotEmpty ? _nameController.text : null,
      );

      // Access user model before async operations
      context.read<UserModel>();
      await analytics.logBaziCalculation(
        birthTime: "$_birthYear-$_birthMonth-$_birthDay $_birthHour"
      );

      final historyService = HistoryService();
      await historyService.saveBaziToHistory(
        bazi: result,
        name: _nameController.text.isNotEmpty ? _nameController.text : '未命名',
        birthDate: DateTime(_birthYear, _birthMonth, _birthDay),
        createdAt: DateTime.now(),
      );

      setState(() {
        _result = result;
        _isLoading = false;
      });

      if (mounted) {
        Navigator.pushNamed(context, '/result', arguments: _result);
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  void _showUpgradeDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _UpgradeBottomSheet(
        onWatchAd: _handleWatchAd,
        onSubscribe: _handleSubscribe,
      ),
    );
  }

  Future<void> _handleWatchAd() async {
    Navigator.pop(context);

    final adService = context.read<AdService>();
    final user = context.read<UserModel>();
    final analytics = context.read<AnalyticsService>();

    setState(() => _isLoading = true);

    try {
      if (!adService.isRewardedAdReady) {
        await adService.preloadAd();
        await Future.delayed(const Duration(seconds: 2));
      }

      final success = await adService.showRewardedAd();

      if (success) {
        await analytics.logAdWatched(completed: true);
        await analytics.logPremiumUnlock(method: 'ad');
        user.useFreeCredit();
        await _performAnalysis();
      } else {
        await analytics.logAdWatched(completed: false);
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ad not completed. Please try again.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      debugPrint('Ad error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to load ad. Please try again.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _handleSubscribe() {
    Navigator.pop(context);
    Navigator.pushNamed(context, '/subscription');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: YiShunTheme.backgroundDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: YiShunTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Custom App Bar
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Text(
                      '四柱排盘',
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
                        color: Colors.white.withAlpha(25),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        '☯️ 完整八字',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Header with Yin Yang
                        ScaleTransition(
                          scale: _pulseAnimation,
                          child: Container(
                            padding: const EdgeInsets.all(28),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [YiShunTheme.purpleMystic, Color(0xFF2D5280)],
                              ),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white.withAlpha(25)),
                              boxShadow: [
                                BoxShadow(
                                  color: YiShunTheme.purpleMystic.withAlpha(128),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withAlpha(25),
                                    borderRadius: BorderRadius.circular(50),
                                  ),
                                  child: const Text('☯️', style: TextStyle(fontSize: 48)),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  '四柱八字排盘',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '输入出生信息，获取精准命盘分析',
                                  style: TextStyle(color: Colors.white.withAlpha(179), fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Name input
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(13),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withAlpha(25)),
                          ),
                          child: TextFormField(
                            controller: _nameController,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              labelText: '姓名（可选）',
                              labelStyle: const TextStyle(color: Colors.white54),
                              prefixIcon: const Icon(Icons.person_outline, color: Colors.white54),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              filled: false,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Birth date card
                        Container(
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
                                  Icon(Icons.cake_outlined, color: YiShunTheme.goldPrimary),
                                  SizedBox(width: 8),
                                  Text(
                                    '出生日期',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(child: _buildYearPicker()),
                                  const SizedBox(width: 8),
                                  Expanded(child: _buildMonthPicker()),
                                  const SizedBox(width: 8),
                                  Expanded(child: _buildDayPicker()),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Birth hour card
                        Container(
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
                                  Icon(Icons.access_time, color: YiShunTheme.goldPrimary),
                                  SizedBox(width: 8),
                                  Text(
                                    '出生时辰',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '传统命理以时辰(2小时)为单位',
                                style: TextStyle(color: Colors.white.withAlpha(128), fontSize: 12),
                              ),
                              const SizedBox(height: 16),
                              _buildHourPicker(),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Gender card
                        Container(
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
                                  Icon(Icons.wc, color: YiShunTheme.goldPrimary),
                                  SizedBox(width: 8),
                                  Text(
                                    '性别',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildGenderOption(0, '男', '乾'),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildGenderOption(1, '女', '坤'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Longitude card
                        Container(
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
                                  Icon(Icons.location_on_outlined, color: YiShunTheme.goldPrimary),
                                  SizedBox(width: 8),
                                  Text(
                                    '出生经度（真太阳时）',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '用于精确计算地方时，默认北京116.4°E',
                                style: TextStyle(color: Colors.white.withAlpha(128), fontSize: 12),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: SliderTheme(
                                      data: SliderThemeData(
                                        activeTrackColor: YiShunTheme.goldPrimary,
                                        inactiveTrackColor: Colors.white.withAlpha(51),
                                        thumbColor: YiShunTheme.goldPrimary,
                                        overlayColor: YiShunTheme.goldPrimary.withAlpha(51),
                                      ),
                                      child: Slider(
                                        value: _longitude,
                                        min: 73,
                                        max: 135,
                                        divisions: 124,
                                        onChanged: (v) => setState(() => _longitude = v),
                                      ),
                                    ),
                                  ),
                                  Container(
                                    width: 70,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: YiShunTheme.goldPrimary.withAlpha(51),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      '${_longitude.toStringAsFixed(1)}°E',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: YiShunTheme.goldPrimary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Free credits info
                        Consumer<UserModel>(
                          builder: (context, user, _) {
                            if (user.isPremium) return const SizedBox.shrink();
                            return Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: YiShunTheme.goldPrimary.withAlpha(25),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: YiShunTheme.goldPrimary.withAlpha(51)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.info_outline, color: YiShunTheme.goldPrimary),
                                  const SizedBox(width: 8),
                                  Text(
                                    '今日剩余 ${user.freeUsesRemaining} 次免费分析',
                                    style: const TextStyle(color: YiShunTheme.goldPrimary),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 16),

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
                                  child: Text(
                                    _error!,
                                    style: const TextStyle(color: Colors.red),
                                  ),
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
                              backgroundColor: YiShunTheme.wuXingFire,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              elevation: 8,
                              shadowColor: YiShunTheme.wuXingFire.withAlpha(128),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 24,
                                    width: 24,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text('☯️', style: TextStyle(fontSize: 20)),
                                      SizedBox(width: 8),
                                      Text(
                                        '排出命盘',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                          ),
                        ),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGenderOption(int value, String label, String gua) {
    final isSelected = _gender == value;
    return GestureDetector(
      onTap: () => setState(() => _gender = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: isSelected
              ? YiShunTheme.goldPrimary.withAlpha(51)
              : Colors.white.withAlpha(13),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? YiShunTheme.goldPrimary
                : Colors.white.withAlpha(51),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Text(
              gua,
              style: TextStyle(
                fontSize: 24,
                color: isSelected ? YiShunTheme.goldPrimary : Colors.white54,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.white54,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildYearPicker() {
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
          value: _birthYear,
          isExpanded: true,
          dropdownColor: YiShunTheme.backgroundDark,
          style: const TextStyle(color: Colors.white),
          items: List.generate(100, (i) => currentYear - 50 + i)
              .map((y) => DropdownMenuItem(value: y, child: Text('$y')))
              .toList(),
          onChanged: (v) => setState(() => _birthYear = v!),
        ),
      ),
    );
  }

  Widget _buildMonthPicker() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withAlpha(51)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: _birthMonth,
          isExpanded: true,
          dropdownColor: YiShunTheme.backgroundDark,
          style: const TextStyle(color: Colors.white),
          items: List.generate(12, (i) => i + 1)
              .map((m) => DropdownMenuItem(value: m, child: Text('$m')))
              .toList(),
          onChanged: (v) => setState(() => _birthMonth = v!),
        ),
      ),
    );
  }

  Widget _buildDayPicker() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withAlpha(51)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: _birthDay,
          isExpanded: true,
          dropdownColor: YiShunTheme.backgroundDark,
          style: const TextStyle(color: Colors.white),
          items: List.generate(31, (i) => i + 1)
              .map((d) => DropdownMenuItem(value: d, child: Text('$d')))
              .toList(),
          onChanged: (v) => setState(() => _birthDay = v!),
        ),
      ),
    );
  }

  Widget _buildHourPicker() {
    final hours = List.generate(24, (i) => i);
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: hours.map((h) {
        final isSelected = _birthHour == h;
        return GestureDetector(
          onTap: () => setState(() => _birthHour = h),
          child: Container(
            width: 52,
            height: 40,
            decoration: BoxDecoration(
              color: isSelected
                  ? YiShunTheme.goldPrimary.withAlpha(76)
                  : Colors.white.withAlpha(13),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected
                    ? YiShunTheme.goldPrimary
                    : Colors.white.withAlpha(51),
              ),
            ),
            child: Center(
              child: Text(
                '$h',
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white54,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

/// Bottom sheet widget for upgrade options
class _UpgradeBottomSheet extends StatelessWidget {
  final VoidCallback onWatchAd;
  final VoidCallback onSubscribe;

  const _UpgradeBottomSheet({
    required this.onWatchAd,
    required this.onSubscribe,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Color(0xFF1A3A5C),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(51),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),
          const Text('📺', style: TextStyle(fontSize: 60)),
          const SizedBox(height: 16),
          const Text(
            '今日免费次数已用完',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '观看短视频解锁1次免费分析，或开通会员获得无限次数',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withAlpha(179)),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onWatchAd,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white54),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Column(
                    children: [
                      Icon(Icons.play_circle_outline, size: 28),
                      SizedBox(height: 4),
                      Text('看广告'),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: onSubscribe,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: YiShunTheme.wuXingFire,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Column(
                    children: [
                      Icon(Icons.star, size: 28),
                      SizedBox(height: 4),
                      Text('¥28/月'),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              '取消',
              style: TextStyle(color: Colors.white54),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}