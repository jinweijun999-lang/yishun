import 'package:flutter/foundation.dart';
import 'package:firebase_analytics/firebase_analytics.dart';

class AnalyticsService extends ChangeNotifier {
  FirebaseAnalytics? _analytics;
  bool _isEnabled = true;

  AnalyticsService() {
    _initialize();
  }

  bool get isEnabled => _isEnabled;

  Future<void> _initialize() async {
    try {
      _analytics = FirebaseAnalytics.instance;
    } catch (e) {
      debugPrint('Firebase Analytics initialization failed: $e');
      _isEnabled = false;
    }
  }

  // ============ User Analytics ============

  Future<void> logLogin({String? method}) async {
    await _analytics?.logLogin(
      loginMethod: method ?? 'email',
    );
  }

  Future<void> logSignUp({String? method}) async {
    await _analytics?.logSignUp(
      signUpMethod: method ?? 'email',
    );
  }

  Future<void> logLogout() async {
    await _analytics?.logEvent(name: 'logout');
  }

  // ============ App Usage Analytics ============

  Future<void> logScreenView({
    required String screenName,
    String? screenClass,
  }) async {
    await _analytics?.logScreenView(
      screenName: screenName,
    );
  }

  Future<void> logAppOpen() async {
    await _analytics?.logAppOpen();
  }

  // ============ Bazi/Fortune Analytics ============

  Future<void> logBaziCalculation({
    required int year,
    required int month,
    required int day,
    required int hour,
    bool isPremium = false,
  }) async {
    await _analytics?.logEvent(
      name: 'bazi_calculation',
      parameters: {
        'birth_year': year,
        'birth_month': month,
        'birth_day': day,
        'birth_hour': hour,
        'is_premium': isPremium,
      },
    );
  }

  Future<void> logFortuneView({
    required String aspect,
    bool isPremium = false,
  }) async {
    await _analytics?.logEvent(
      name: 'fortune_view',
      parameters: {
        'aspect': aspect,
        'is_premium': isPremium,
      },
    );
  }

  Future<void> logDailyFortuneView() async {
    await _analytics?.logEvent(name: 'daily_fortune_view');
  }

  // ============ Subscription Analytics ============

  Future<void> logSubscriptionStart({
    required String plan,
    String? coupon,
  }) async {
    await _analytics?.logEvent(
      name: 'subscription_start',
      parameters: {
        'plan': plan,
        if (coupon != null) 'coupon': coupon,
      },
    );
  }

  Future<void> logSubscriptionCancel() async {
    await _analytics?.logEvent(name: 'subscription_cancel');
  }

  Future<void> logAdWatched({required bool completed}) async {
    await _analytics?.logEvent(
      name: 'ad_watched',
      parameters: {'completed': completed},
    );
  }

  Future<void> logPremiumUnlock({required String method}) async {
    await _analytics?.logEvent(
      name: 'premium_unlock',
      parameters: {'method': method},
    );
  }

  // ============ General Analytics ============

  Future<void> logEvent(String name, [Map<String, dynamic>? parameters]) async {
    if (!_isEnabled || _analytics == null) return;
    
    try {
      await _analytics!.logEvent(
        name: name,
        parameters: parameters != null 
            ? Map<String, Object>.from(parameters) 
            : null,
      );
    } catch (e) {
      debugPrint('Analytics log error: $e');
    }
  }

  Future<void> setUserProperty(String name, String value) async {
    await _analytics?.setUserProperty(name: name, value: value);
  }

  void setAnalyticsEnabled(bool enabled) {
    _isEnabled = enabled;
    notifyListeners();
  }
}
