import 'package:flutter/foundation.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:yishun_app/config/stripe_config.dart';
import 'auth_service.dart';
import 'analytics_service.dart';

enum SubscriptionPlan { monthly, yearly }
enum SubscriptionStatus { none, active, cancelled, expired }

class SubscriptionService extends ChangeNotifier {
  final AuthService _authService;
  final AnalyticsService _analyticsService;
  
  SubscriptionStatus _status = SubscriptionStatus.none;
  DateTime? _expireDate;
  bool _isLoading = false;
  String? _error;

  // Backend API base URL
  static const String _backendBaseUrl = StripeConfig.backendUrl;

  // Price IDs (configured on Stripe Dashboard)
  static const String _monthlyPriceId = StripeConfig.monthlyPriceId;
  static const String _yearlyPriceId = StripeConfig.yearlyPriceId;

  SubscriptionService(this._authService, this._analyticsService);

  SubscriptionStatus get status => _status;
  DateTime? get expireDate => _expireDate;
  bool get isActive => _status == SubscriptionStatus.active;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Initialize Stripe with publishable key
  /// The publishable key is safe to be in client-side code
  /// Secret key must NEVER be in client code - handled by backend
  Future<void> initialize([String publishableKey = ""]) async {
    try {
      // Use the provided publishable key or fallback to config
      final key = publishableKey.isNotEmpty 
          ? publishableKey 
          : StripeConfig.publishableKey;
      
      Stripe.publishableKey = key;
      
      if (kDebugMode) {
        debugPrint('Stripe initialized with publishable key: ${key.substring(0, 20)}...');
      }
    } catch (e) {
      debugPrint('Stripe initialization failed: $e');
      _error = 'Stripe 初始化失败';
    }
  }

  Future<void> checkSubscriptionStatus() async {
    try {
      setLoading(true);
      
      final token = _authService.token;
      if (token == null) {
        _error = '用户未登录';
        return;
      }

      final response = await http.get(
        Uri.parse('$_backendBaseUrl/api/subscription/status'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _status = _parseStatus(data['status']);
        _expireDate = data['expireDate'] != null 
            ? DateTime.parse(data['expireDate']) 
            : null;
      } else {
        _error = '获取订阅状态失败';
      }
    } catch (e) {
      debugPrint('Check subscription status failed: $e');
      _error = '网络错误，请检查连接';
    } finally {
      setLoading(false);
    }
  }

  /// Create payment intent via backend API
  /// Secret key is only used on the backend - never exposed to client
  Future<String?> createPaymentIntent(SubscriptionPlan plan) async {
    try {
      setLoading(true);
      _error = null;

      final token = _authService.token;
      if (token == null) {
        _error = '用户未登录';
        return null;
      }

      final priceId = plan == SubscriptionPlan.monthly ? _monthlyPriceId : _yearlyPriceId;

      // Call backend to create payment intent
      // Backend uses Secret Key to create PaymentIntent server-side
      final response = await http.post(
        Uri.parse('$_backendBaseUrl/api/subscription/create-payment-intent'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'priceId': priceId,
          'plan': plan.name,
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['clientSecret'];
      } else {
        final errorData = json.decode(response.body);
        _error = errorData['error'] ?? '创建支付失败';
        return null;
      }
    } catch (e) {
      debugPrint('Create payment intent failed: $e');
      _error = '网络错误，请检查连接';
      return null;
    } finally {
      setLoading(false);
    }
  }

  /// Process payment using Stripe SDK
  /// Uses the client secret from createPaymentIntent to confirm payment
  Future<bool> processPayment(String clientSecret) async {
    try {
      setLoading(true);
      _error = null;

      // Use Stripe SDK to confirm payment
      final result = await Stripe.instance.confirmPayment(
        paymentIntentClientSecret: clientSecret,
      );

      if (result.status == PaymentIntentsStatus.Succeeded) {
        // Payment successful - notify backend
        await _notifyPaymentSuccess(result.id);
        _status = SubscriptionStatus.active;
        return true;
      } else {
        _error = '支付未完成';
        return false;
      }
    } catch (e) {
      debugPrint('Process payment failed: $e');
      _error = _parseStripeError(e);
      return false;
    } finally {
      setLoading(false);
    }
  }

  Future<void> purchaseSubscription(SubscriptionPlan plan) async {
    try {
      setLoading(true);
      _error = null;

      final clientSecret = await createPaymentIntent(plan);
      if (clientSecret == null) {
        return;
      }

      final success = await processPayment(clientSecret);
      if (success) {
        await _analyticsService.logSubscriptionStart(plan: plan.name);
      }
    } catch (e) {
      debugPrint('Purchase subscription failed: $e');
      _error = '订阅失败';
    } finally {
      setLoading(false);
    }
  }

  Future<bool> restorePurchases() async {
    try {
      setLoading(true);
      _error = null;

      final token = _authService.token;
      if (token == null) {
        _error = '用户未登录';
        return false;
      }

      final response = await http.post(
        Uri.parse('$_backendBaseUrl/api/subscription/restore'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['restored'] == true) {
          _status = SubscriptionStatus.active;
          _expireDate = data['expireDate'] != null 
              ? DateTime.parse(data['expireDate']) 
              : null;
          return true;
        }
      }
      
      _error = '未找到之前的购买记录';
      return false;
    } catch (e) {
      debugPrint('Restore purchases failed: $e');
      _error = '恢复失败，请检查网络';
      return false;
    } finally {
      setLoading(false);
    }
  }

  Future<void> _notifyPaymentSuccess(String paymentIntentId) async {
    try {
      final token = _authService.token;
      if (token == null) return;

      await http.post(
        Uri.parse('$_backendBaseUrl/api/subscription/confirm'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'paymentIntentId': paymentIntentId,
        }),
      ).timeout(const Duration(seconds: 10));
    } catch (e) {
      debugPrint('Notify payment success failed: $e');
    }
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

  String _parseStripeError(dynamic e) {
    if (e is Map) {
      final error = e['error'] as Map?;
      if (error != null) {
        final message = error['message'];
        if (message != null) return message.toString();
      }
    }
    if (e.toString().contains('canceled')) {
      return '支付已取消';
    }
    if (e.toString().contains('failed')) {
      return '支付失败，请检查卡信息';
    }
    return '支付错误，请重试';
  }

  void setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}