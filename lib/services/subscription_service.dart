import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';
import 'analytics_service.dart';

enum SubscriptionPlan { monthly, yearly }
enum SubscriptionStatus { none, active, cancelled, expired }

class SubscriptionService extends ChangeNotifier {
  final AuthService _authService;
  final AnalyticsService _analyticsService;
  
  static const String _baseUrl = 'http://34.102.18.91:8000';
  
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

  /// Initialize Stripe with publishable key
  /// If no key provided, will use stub mode (for testing)
  Future<void> initialize([String publishableKey = ""]) async {
    if (publishableKey == null || publishableKey.isEmpty) {
      debugPrint('Stripe: no publishable key provided, using stub mode');
      return;
    }
    try {
      Stripe.publishableKey = publishableKey;
      await Stripe.instance.applySettings();
    } catch (e) {
      debugPrint('Stripe initialization failed: $e');
    }
  }

  /// Create payment intent and return client secret
  Future<String?> createPaymentIntent(SubscriptionPlan plan) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/subscription/create-intent'),
        headers: _authService.authHeaders,
        body: jsonEncode({
          'plan': plan.name,
          'success_url': 'yishun://payment-success',
          'cancel_url': 'yishun://payment-cancel',
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _isLoading = false;
        notifyListeners();
        return data['client_secret'];
      } else {
        final errorData = jsonDecode(response.body);
        _error = errorData['detail'] ?? 'Failed to create payment';
        _isLoading = false;
        notifyListeners();
        return null;
      }
    } catch (e) {
      _error = 'Network error: $e';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  /// Present Stripe payment sheet
  Future<bool> processPayment(String clientSecret) async {
    try {
      final billingDetails = BillingDetails();
      
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          billingDetails: billingDetails,
          merchantDisplayName: 'YiShun Fortune',
        ),
      );

      await Stripe.instance.presentPaymentSheet();
      
      // Payment successful
      await _onPaymentSuccess();
      return true;
    } catch (e) {
      if (e is StripeException) {
        _error = e.error.message;
      } else {
        _error = 'Payment failed: $e';
      }
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Handle successful payment
  Future<void> _onPaymentSuccess() async {
    // Fetch updated subscription status
    await checkSubscriptionStatus();
    
    // Log analytics
    await _analyticsService.logSubscriptionStart(
      plan: _currentPlanId ?? 'unknown',
    );
    
    _isLoading = false;
    notifyListeners();
  }

  /// Check current subscription status from backend
  Future<void> checkSubscriptionStatus() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/subscription/status'),
        headers: _authService.authHeaders,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _status = _parseStatus(data['status']);
        _expireDate = data['expire_date'] != null 
            ? DateTime.parse(data['expire_date']) 
            : null;
        _currentPlanId = data['plan_id'];
      }
    } catch (e) {
      debugPrint('Failed to check subscription: $e');
    }
    notifyListeners();
  }

  /// Restore previous purchases (for iOS/Android)
  Future<bool> restorePurchases() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/subscription/restore'),
        headers: _authService.authHeaders,
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        await checkSubscriptionStatus();
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = 'Restore failed: $e';
    }
    
    _isLoading = false;
    notifyListeners();
    return false;
  }

  /// Cancel current subscription
  Future<bool> cancelSubscription() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/subscription/cancel'),
        headers: _authService.authHeaders,
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        await _analyticsService.logSubscriptionCancel();
        await checkSubscriptionStatus();
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = 'Cancel failed: $e';
    }
    
    _isLoading = false;
    notifyListeners();
    return false;
  }

  SubscriptionStatus _parseStatus(String? status) {
    switch (status) {
      case 'active':
        return SubscriptionStatus.active;
      case 'cancelled':
        return SubscriptionStatus.cancelled;
      case 'expired':
        return SubscriptionStatus.expired;
      default:
        return SubscriptionStatus.none;
    }
  }
}