import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';
import '../services/analytics_service.dart';

enum SubscriptionPlan { monthly, yearly }
enum SubscriptionStatus { none, active, cancelled, expired }

class SubscriptionService extends ChangeNotifier {
  final AuthService? _authService;
  final AnalyticsService? _analyticsService;
  
  SubscriptionStatus _status = SubscriptionStatus.none;
  DateTime? _expireDate;
  String? _currentPlanId;
  bool _isLoading = false;
  String? _error;

  SubscriptionService(this._authService, this._analyticsService);

  SubscriptionStatus get status => _status;
  DateTime? get expireDate => _expireDate;
  bool get isActive => _status == SubscriptionStatus.active;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Initialize Stripe (stub)
  Future<void> initialize() async {
    debugPrint('Stripe: using stub (no real key)');
  }

  /// Create payment intent (stub)
  Future<String?> createPaymentIntent(SubscriptionPlan plan) async {
    debugPrint('Stripe: createPaymentIntent stub for $plan');
    _error = 'Stripe stub: not connected to backend';
    return null;
  }

  /// Process payment (stub)
  Future<bool> processPayment(String clientSecret) async {
    debugPrint('Stripe: processPayment stub');
    return false;
  }

  /// Check subscription status (stub)
  Future<void> checkSubscriptionStatus() async {
    debugPrint('Stripe: checkSubscriptionStatus stub');
  }

  /// Restore purchases (stub)
  Future<bool> restorePurchases() async {
    debugPrint('Stripe: restorePurchases stub');
    return false;
  }

  /// Cancel subscription (stub)
  Future<bool> cancelSubscription() async {
    debugPrint('Stripe: cancelSubscription stub');
    return false;
  }
}
