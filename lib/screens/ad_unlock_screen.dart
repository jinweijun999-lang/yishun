import 'dart:async';
import 'package:flutter/material.dart';
import '../utils/theme.dart';
import '../widgets/decorations.dart';

/// 广告解锁界面
/// 神秘东方色彩，玄学风格
/// 用户观看广告后解锁完整报告
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
    _initAnimations();
    _startAdSimulation();
  }

  void _initAnimations() {
    _progressController = AnimationController(
      duration: const Duration(seconds: _adDuration),
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

  void _startAdSimulation() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        if (_secondsRemaining > 0) _secondsRemaining--;
      });
      if (_secondsRemaining <= 0) timer.cancel();
    });
  }

  void _onAdCompleted() {
    if (!mounted) return;
    setState(() => _adCompleted = true);
  }

  void _unlockReport() async {
    if (_isUnlocking) return;
    setState(() => _isUnlocking = true);

    await Future.delayed(const Duration(milliseconds: 800));

    if (!mounted) return;

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
      backgroundColor: YiShunTheme.backgroundDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: YiShunTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // 顶部装饰
              const MysticTopDecoration(height: 80),

              // App Bar
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: YiShunTheme.space4,
                ),
                child: Row(
                  children: [
                    MysticIconBtn(
                      icon: Icons.close,
                      onTap: () => Navigator.pop(context),
                    ),
                    const Spacer(),
                  ],
                ),
              ),

              const Spacer(),

              // 中心内容
              _AdContent(
                secondsRemaining: _secondsRemaining,
                adDuration: _adDuration,
                adCompleted: _adCompleted,
                progressController: _progressController,
                pulseAnimation: _pulseAnimation,
              ),

              const Spacer(),

              // 底部操作区
              _BottomAction(
                adCompleted: _adCompleted,
                isUnlocking: _isUnlocking,
                onUnlock: _unlockReport,
              ),

              const SizedBox(height: YiShunTheme.space8),
            ],
          ),
        ),
      ),
    );
  }
}

// === 广告观看内容 ===
class _AdContent extends StatelessWidget {
  final int secondsRemaining;
  final int adDuration;
  final bool adCompleted;
  final AnimationController progressController;
  final Animation<double> pulseAnimation;

  const _AdContent({
    required this.secondsRemaining,
    required this.adDuration,
    required this.adCompleted,
    required this.progressController,
    required this.pulseAnimation,
  });

  @override
  Widget build(BuildContext context) {
    if (adCompleted) {
      return _CompletedContent(pulseAnimation: pulseAnimation);
    }
    return _WatchingContent(
      secondsRemaining: secondsRemaining,
      adDuration: adDuration,
      progressController: progressController,
    );
  }
}

class _WatchingContent extends StatelessWidget {
  final int secondsRemaining;
  final int adDuration;
  final AnimationController progressController;

  const _WatchingContent({
    required this.secondsRemaining,
    required this.adDuration,
    required this.progressController,
  });

  @override
  Widget build(BuildContext context) {
    final progress = 1.0 - (secondsRemaining / adDuration);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 圆形进度计时器
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: YiShunTheme.goldPrimary.withAlpha(25),
            border: Border.all(
              color: YiShunTheme.goldPrimary.withAlpha(76),
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: YiShunTheme.goldPrimary.withAlpha(38),
                blurRadius: 20,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 100,
                height: 100,
                child: CircularProgressIndicator(
                  value: progress,
                  strokeWidth: 4,
                  backgroundColor: Colors.white.withAlpha(25),
                  valueColor: const AlwaysStoppedAnimation(YiShunTheme.goldPrimary),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$secondsRemaining',
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      color: YiShunTheme.textPrimary,
                    ),
                  ),
                  Text(
                    '秒',
                    style: TextStyle(
                      fontSize: 12,
                      color: YiShunTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: YiShunTheme.space8),

        // 标题
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.smart_display,
              color: YiShunTheme.goldPrimary,
              size: 22,
            ),
            const SizedBox(width: 8),
            Text(
              '观看广告',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: YiShunTheme.goldPrimary,
                letterSpacing: 2,
              ),
            ),
          ],
        ),

        const SizedBox(height: YiShunTheme.space2),

        Text(
          '请稍候，广告即将播放完成',
          style: TextStyle(
            fontSize: 14,
            color: YiShunTheme.textSecondary,
          ),
        ),

        const SizedBox(height: YiShunTheme.space8),

        // 模拟广告占位
        MysticCard(
          padding: const EdgeInsets.symmetric(vertical: YiShunTheme.space8),
          child: Column(
            children: [
              Icon(
                Icons.smart_display,
                size: 52,
                color: YiShunTheme.purpleMystic.withAlpha(127),
              ),
              const SizedBox(height: YiShunTheme.space3),
              Text(
                '广告播放中...',
                style: TextStyle(
                  color: YiShunTheme.textMuted,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Admob / Facebook Audience SDK 将接入此处',
                style: TextStyle(
                  color: YiShunTheme.textMuted.withAlpha(127),
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: YiShunTheme.space6),

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
                color: YiShunTheme.goldPrimary,
                borderRadius: BorderRadius.circular(2),
                boxShadow: [
                  BoxShadow(
                    color: YiShunTheme.goldPrimary.withAlpha(127),
                    blurRadius: 4,
                  ),
                ],
              ),
            ),
          ),
        ),

        const SizedBox(height: YiShunTheme.space2),

        Text(
          '${(secondsRemaining * 100 / adDuration).round()}% 剩余',
          style: TextStyle(
            fontSize: 11,
            color: YiShunTheme.textMuted,
          ),
        ),
      ],
    );
  }
}

class _CompletedContent extends StatelessWidget {
  final Animation<double> pulseAnimation;

  const _CompletedContent({required this.pulseAnimation});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 完成图标
        ScaleTransition(
          scale: pulseAnimation,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: YiShunTheme.success.withAlpha(25),
              border: Border.all(
                color: YiShunTheme.success.withAlpha(127),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: YiShunTheme.success.withAlpha(51),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: const Icon(
              Icons.check_circle,
              size: 64,
              color: YiShunTheme.success,
            ),
          ),
        ),

        const SizedBox(height: YiShunTheme.space8),

        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.auto_awesome,
              color: YiShunTheme.goldPrimary,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              '广告观看完成',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: YiShunTheme.goldPrimary,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.auto_awesome,
              color: YiShunTheme.goldPrimary,
              size: 20,
            ),
          ],
        ),

        const SizedBox(height: YiShunTheme.space2),

        Text(
          '现在可以解锁完整报告',
          style: TextStyle(
            fontSize: 14,
            color: YiShunTheme.textSecondary,
          ),
        ),

        const SizedBox(height: YiShunTheme.space8),

        // 奖励预览
        MysticGoldCard(
          padding: const EdgeInsets.all(YiShunTheme.space5),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_open, color: YiShunTheme.goldPrimary, size: 20),
                  const SizedBox(width: YiShunTheme.space2),
                  Text(
                    '完整报告已解锁',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: YiShunTheme.goldPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: YiShunTheme.space3),
              Text(
                '包含事业·姻缘·健康·财富完整分析',
                style: TextStyle(
                  fontSize: 12,
                  color: YiShunTheme.textMuted,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// === 底部操作区 ===
class _BottomAction extends StatelessWidget {
  final bool adCompleted;
  final bool isUnlocking;
  final VoidCallback onUnlock;

  const _BottomAction({
    required this.adCompleted,
    required this.isUnlocking,
    required this.onUnlock,
  });

  @override
  Widget build(BuildContext context) {
    if (isUnlocking) {
      return Column(
        children: [
          const SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(
              color: YiShunTheme.goldPrimary,
              strokeWidth: 2.5,
            ),
          ),
          const SizedBox(height: YiShunTheme.space3),
          Text(
            '正在解锁...',
            style: TextStyle(color: YiShunTheme.textSecondary),
          ),
        ],
      );
    }

    if (!adCompleted) {
      return Text(
        '请等待广告播放完成',
        style: TextStyle(color: YiShunTheme.textMuted),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: YiShunTheme.space4),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: onUnlock,
          style: ElevatedButton.styleFrom(
            backgroundColor: YiShunTheme.goldPrimary,
            foregroundColor: YiShunTheme.backgroundDark,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_open, size: 20),
              const SizedBox(width: YiShunTheme.space2),
              const Text(
                '解锁完整报告',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
