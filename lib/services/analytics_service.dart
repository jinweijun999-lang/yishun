import 'package:flutter/foundation.dart';

class AnalyticsService extends ChangeNotifier {
  final bool _isEnabled = true;

  AnalyticsService() {
    _initialize();
  }

  bool get isEnabled => _isEnabled;

  Future<void> _initialize() async {
    // Analytics disabled for CI compatibility
  }

  Future<void> initialize() async {
    await _initialize();
  }

  Future<void> logLogin({String? method}) async {
    debugPrint('Analytics: logLogin - method: $method');
  }

  Future<void> logSignUp({String? method}) async {
    debugPrint('Analytics: logSignUp - method: $method');
  }

  Future<void> logLogout() async {
    debugPrint('Analytics: logLogout');
  }

  Future<void> logScreenView({required String screenName, String? screenClass}) async {
    debugPrint('Analytics: screenView - $screenName');
  }

  Future<void> logAdWatched({required bool completed}) async {
    debugPrint('Analytics: adWatched - completed: $completed');
  }

  Future<void> logPremiumUnlock({String? method}) async {
    debugPrint('Analytics: premiumUnlock - method: $method');
  }

  Future<void> logSubscriptionStart({String? plan}) async {
    debugPrint('Analytics: subscriptionStart - plan: $plan');
  }

  Future<void> logBaziCalculation({String? birthTime}) async {
    debugPrint('Analytics: baziCalculation - birthTime: $birthTime');
  }

  Future<void> logSubscriptionCancel() async {
    debugPrint('Analytics: subscriptionCancel');
  }
}
