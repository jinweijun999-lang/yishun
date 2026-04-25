import 'package:flutter/foundation.dart';
import 'auth_service.dart';
import 'analytics_service.dart';

enum SubscriptionPlan { monthly, yearly }
enum SubscriptionStatus { none, active, cancelled, expired }

class SubscriptionService extends ChangeNotifier {
  // ignore: unused_field
  final AuthService _authService;
  // ignore: unused_field
  final AnalyticsService _analyticsService;
  // ignore: unused_field
  final SubscriptionStatus _status = SubscriptionStatus.none;
  DateTime? _expireDate;
  // ignore: unused_field
  String? _currentPlanId;
  final bool _isLoading = false;
  String? _error;

  SubscriptionService([AuthService? authService, AnalyticsService? analyticsService])
      : _authService = authService ?? AuthService(),
        _analyticsService = analyticsService ?? AnalyticsService();

  SubscriptionStatus get status => _status;
  DateTime? get expireDate => _expireDate;
  bool get isActive => _status == SubscriptionStatus.active;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Stripe integration pending - API key received but SDK has build conflicts
  // Publishable Key: pk_test_51SuY1EEDoEbJp6om4kOVaCCWS6aLzCwr6ntUDDvI4MnOcgMD4FYzstD0zVNheGx6jKLxXmtujetAst6Ah7XDC1Y000kasC3ZyZ
  // Secret Key stored securely, not committed to repo

  Future<void> initialize([String publishableKey = ""]) async {
    debugPrint('Subscription: Stripe SDK disabled due to build conflict, using stub');
    debugPrint('API Key available but Gradle configuration needs adjustment');
  }

  Future<void> checkSubscriptionStatus() async {
    debugPrint('Subscription: check status - stub');
  }

  Future<String?> createPaymentIntent(SubscriptionPlan plan) async {
    debugPrint('Subscription: createPaymentIntent - stub');
    return null;
  }

  Future<bool> processPayment(String clientSecret) async {
    debugPrint('Subscription: processPayment - stub');
    return false;
  }

  Future<void> purchaseSubscription(SubscriptionPlan plan) async {
    debugPrint('Subscription: purchase - stub');
  }

  Future<bool> restorePurchases() async {
    return false;
  }
}
