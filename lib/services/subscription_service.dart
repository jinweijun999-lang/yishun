import 'package:flutter/foundation.dart';
import 'auth_service.dart';
import 'analytics_service.dart';

enum SubscriptionPlan { monthly, yearly }
enum SubscriptionStatus { none, active, cancelled, expired }

class SubscriptionService extends ChangeNotifier {
  final AuthService _authService;
  final AnalyticsService _analyticsService;
  
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

  Future<void> initialize([String publishableKey = ""]) async {
    debugPrint('Subscription: stub mode (Stripe integration pending)');
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
