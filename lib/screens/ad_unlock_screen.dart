import 'dart:async';
import 'package:flutter/material.dart';
import '../utils/theme.dart';

/// 广告解锁界面
/// 用户观看15-30秒广告后解锁完整报告
class AdUnlockScreen extends StatefulWidget {
  /// 完整报告数据（解锁后返回给 result_screen）
  final Map<String, dynamic> fullReportData;

  /// 解锁成功后返回的路由名称
  final String? successRoute;

  const AdUnlockScreen({
    super.key,
    required this.fullReportData,
    this.successRoute,
  });

  @override
  State<AdUnlockScreen> createState() => _AdUnlockScreenState();
}

class _AdUnlockScreenState extends State<AdUnlockScreen>
    with TickerProviderStateMixin {
  /// 广告观看倒计时（秒）
  static const int _adDuration = 20;

  int _secondsRemaining = _adDuration;
  bool _adCompleted = false;
  bool _isUnlocking = false;

  late AnimationController _progressController;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  Timer? _countdownTimer;

  @override
  void initState() {
    super.initState();
    _startAdSimulation();
    _initAnimations();
  }

  void _initAnimations() {
    _progressController = AnimationController(
      duration: Duration(seconds: _adDuration),
      vsync: this,
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          _onAdCompleted();
        }
      });

    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _progressController.forward();
  }

  /// 模拟广告观看（stub 实现，后续接入真实 SDK）
  void _startAdSimulation() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        if (_secondsRemaining > 0) {
          _secondsRemaining--;
        }
      });
      if (_secondsRemaining <= 0) {
        timer.cancel();
      }
    });
  }

  void _onAdCompleted() {
    if (!mounted) return;
    setState(() => _adCompleted = true);
  }

  void _unlockReport() async {
    if (_isUnlocking) return;
    setState(() => _isUnlocking = true);

    // 模拟解锁动画
    await Future.delayed(const Duration(milliseconds: 800));

    if (!mounted) return;

    // 返回 result_screen，并携带完整报告数据
    Navigator.of(context).pop({
      'unlocked': true,
      'fullReport': widget.fullReportData,
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _progressController.dispose();
    _pulseController.dispose();
    super.dispose();
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
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // App Bar
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(25),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.close, color: Colors.white),
                      ),
                    ),
                    const Spacer(),
                  ],
                ),

                const Spacer(),

                // 中心内容
                _buildContent(),

                const Spacer(),

                // 底部操作区
                _buildBottomAction(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_adCompleted) {
      return _buildCompletedContent();
    }
    return _buildAdWatchingContent();
  }

  /// 观看广告中状态
  Widget _buildAdWatchingContent() {
    final progress = 1.0 - (_secondsRemaining / _adDuration);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 装饰图标
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: YiShunTheme.brandAmber.withAlpha(25),
            border: Border.all(
              color: YiShunTheme.brandAmber.withAlpha(76),
              width: 2,
            ),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // 圆形进度
              SizedBox(
                width: 100,
                height: 100,
                child: CircularProgressIndicator(
                  value: progress,
                  strokeWidth: 4,
                  backgroundColor: Colors.white.withAlpha(25),
                  valueColor: const AlwaysStoppedAnimation(YiShunTheme.brandAmber),
                ),
              ),
              // 倒计时数字
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$_secondsRemaining',
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const Text(
                    'seconds',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white54,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 40),

        // 标题
        const Text(
          '📺 Watching Ad',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),

        const SizedBox(height: 12),

        // 副标题
        Text(
          'Please wait while the ad plays',
          style: TextStyle(
            fontSize: 14,
            color: Colors.white.withAlpha(179),
          ),
        ),

        const SizedBox(height: 32),

        // 模拟广告占位
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 60),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(13),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withAlpha(25)),
          ),
          child: Column(
            children: [
              const Icon(
                Icons.smart_display,
                size: 48,
                color: Colors.white38,
              ),
              const SizedBox(height: 12),
              Text(
                '[ Ad Placeholder - Stub Implementation ]',
                style: TextStyle(
                  color: Colors.white.withAlpha(76),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Admob / Facebook Audience SDK will be integrated here',
                style: TextStyle(
                  color: Colors.white.withAlpha(51),
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // 进度条
        Container(
          height: 4,
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(25),
            borderRadius: BorderRadius.circular(2),
          ),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: progress,
            child: Container(
              decoration: BoxDecoration(
                color: YiShunTheme.brandAmber,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        ),

        const SizedBox(height: 8),

        Text(
          '${(_secondsRemaining * 100 / _adDuration).round()}% remaining',
          style: const TextStyle(
            fontSize: 11,
            color: Colors.white38,
          ),
        ),
      ],
    );
  }

  /// 广告观看完成状态
  Widget _buildCompletedContent() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 完成图标
        ScaleTransition(
          scale: _pulseAnimation,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF4CAF50).withAlpha(25),
              border: Border.all(
                color: const Color(0xFF4CAF50).withAlpha(127),
                width: 2,
              ),
            ),
            child: const Icon(
              Icons.check_circle,
              size: 64,
              color: Color(0xFF4CAF50),
            ),
          ),
        ),

        const SizedBox(height: 40),

        const Text(
          '🎉 Ad Completed!',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),

        const SizedBox(height: 12),

        Text(
          'You can now unlock the full report',
          style: TextStyle(
            fontSize: 14,
            color: Colors.white.withAlpha(179),
          ),
        ),

        const SizedBox(height: 32),

        // 奖励预览
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(13),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: YiShunTheme.brandAmber.withAlpha(76)),
          ),
          child: Column(
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_open, color: YiShunTheme.brandAmber, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Full Report Unlocked',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: YiShunTheme.brandAmber,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Complete fortune analysis • Career • Love • Health • Wealth',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withAlpha(153),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// 底部操作区
  Widget _buildBottomAction() {
    if (_isUnlocking) {
      return Column(
        children: [
          const CircularProgressIndicator(
            color: YiShunTheme.brandAmber,
          ),
          const SizedBox(height: 12),
          Text(
            'Unlocking...',
            style: TextStyle(color: Colors.white.withAlpha(153)),
          ),
        ],
      );
    }

    if (!_adCompleted) {
      return Text(
        'Please wait for the ad to finish',
        style: TextStyle(color: Colors.white.withAlpha(76)),
      );
    }

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _unlockReport,
        style: ElevatedButton.styleFrom(
          backgroundColor: YiShunTheme.brandAmber,
          foregroundColor: Colors.black,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_open, size: 20),
            SizedBox(width: 8),
            Text(
              'Unlock Full Report',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
