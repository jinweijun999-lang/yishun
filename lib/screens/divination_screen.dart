import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/analytics_service.dart';
import '../services/history_service.dart';
import '../models/user_model.dart';
import '../utils/theme.dart';

class DivinationScreen extends StatefulWidget {
  const DivinationScreen({super.key});

  @override
  State<DivinationScreen> createState() => _DivinationScreenState();
}

class _DivinationScreenState extends State<DivinationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  
  // Birth info
  int _birthYear = 1990;
  int _birthMonth = 1;
  int _birthDay = 1;
  int _birthHour = 12;
  double _longitude = 116.4;
  
  // State
  bool _isLoading = false;
  Map<String, dynamic>? _result;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Set default to current date context
    final now = DateTime.now();
    _birthYear = now.year - 25;
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _analyze() async {
    if (!_formKey.currentState!.validate()) return;

    // Check free credits or premium
    final user = context.read<UserModel>();
    if (!user.isPremium && !user.useFreeCredit()) {
      _showUpgradeDialog();
      return;
    }

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

      // Log analytics
      await analytics.logBaziCalculation(
        year: _birthYear,
        month: _birthMonth,
        day: _birthDay,
        hour: _birthHour,
        isPremium: user.isPremium,
      );

      // Save to history
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

      // Navigate to result screen
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
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('👑', style: TextStyle(fontSize: 60)),
            const SizedBox(height: 16),
            const Text(
              'Free Credits Exhausted',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'You\'ve used all 3 free analyses today. Subscribe to Premium for unlimited access!',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Watch Ad'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      // Navigate to subscription
                    },
                    child: const Text('Subscribe \$9.9'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: YiShunTheme.surfaceLight,
      appBar: AppBar(
        backgroundColor: YiShunTheme.primaryColor,
        title: const Text('四柱排盘', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      YiShunTheme.primaryColor,
                      YiShunTheme.primaryColor.withAlpha(204),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Column(
                  children: [
                    Text('☯️', style: TextStyle(fontSize: 50)),
                    SizedBox(height: 8),
                    Text(
                      'Four Pillars Divination',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Enter your birth information',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Name input
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: 'Name (optional)',
                  prefixIcon: const Icon(Icons.person_outline),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 16),

              // Birth date card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.cake_outlined, color: YiShunTheme.primaryColor),
                          SizedBox(width: 8),
                          Text(
                            'Birth Date',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
              ),
              const SizedBox(height: 16),

              // Birth hour card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.access_time, color: YiShunTheme.primaryColor),
                          SizedBox(width: 8),
                          Text(
                            'Birth Hour',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildHourPicker(),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Longitude card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.location_on_outlined, color: YiShunTheme.primaryColor),
                          SizedBox(width: 8),
                          Text(
                            'Longitude for True Solar Time',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Beijing default 116.4°E',
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: Slider(
                              value: _longitude,
                              min: 73,
                              max: 135,
                              divisions: 124,
                              label: '${_longitude.toStringAsFixed(1)}°E',
                              onChanged: (v) => setState(() => _longitude = v),
                            ),
                          ),
                          SizedBox(
                            width: 70,
                            child: Text(
                              '${_longitude.toStringAsFixed(1)}°',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
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
                      color: YiShunTheme.accentColor.withAlpha(25),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, color: YiShunTheme.secondaryColor),
                        const SizedBox(width: 8),
                        Text(
                          '${user.freeUsesRemaining} free analyses remaining today',
                          style: const TextStyle(color: YiShunTheme.secondaryColor),
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
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: Colors.red.shade700),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _error!,
                          style: TextStyle(color: Colors.red.shade700),
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
                    backgroundColor: YiShunTheme.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.auto_awesome),
                            SizedBox(width: 8),
                            Text(
                              'Start Analysis',
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
    );
  }

  Widget _buildYearPicker() {
    final currentYear = DateTime.now().year;
    return DropdownButtonFormField<int>(
      value: _birthYear,
      decoration: InputDecoration(
        labelText: 'Year',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: List.generate(100, (i) => currentYear - 50 + i)
          .map((y) => DropdownMenuItem(value: y, child: Text('$y')))
          .toList(),
      onChanged: (v) => setState(() => _birthYear = v!),
    );
  }

  Widget _buildMonthPicker() {
    return DropdownButtonFormField<int>(
      value: _birthMonth,
      decoration: InputDecoration(
        labelText: 'Month',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: List.generate(12, (i) => i + 1)
          .map((m) => DropdownMenuItem(value: m, child: Text('$m')))
          .toList(),
      onChanged: (v) => setState(() => _birthMonth = v!),
    );
  }

  Widget _buildDayPicker() {
    return DropdownButtonFormField<int>(
      value: _birthDay,
      decoration: InputDecoration(
        labelText: 'Day',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: List.generate(31, (i) => i + 1)
          .map((d) => DropdownMenuItem(value: d, child: Text('$d')))
          .toList(),
      onChanged: (v) => setState(() => _birthDay = v!),
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
            width: 56,
            height: 40,
            decoration: BoxDecoration(
              color: isSelected ? YiShunTheme.primaryColor : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '$h',
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.black87,
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
