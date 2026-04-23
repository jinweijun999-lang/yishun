import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/subscription_service.dart';
import '../services/analytics_service.dart';
import '../services/ad_service.dart';
import '../models/user_model.dart';
import '../utils/theme.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _checkSubscriptionStatus();
  }

  Future<void> _checkSubscriptionStatus() async {
    final authService = context.read<AuthService>();
    final analytics = context.read<AnalyticsService>();
    final subscriptionService = SubscriptionService(authService, analytics);
    
    await subscriptionService.checkSubscriptionStatus();
    
    if (mounted && subscriptionService.isActive) {
      // Already subscribed
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You already have an active subscription!'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _subscribeMonthly() async {
    await _processSubscription(SubscriptionPlan.monthly);
  }

  Future<void> _subscribeYearly() async {
    await _processSubscription(SubscriptionPlan.yearly);
  }

  Future<void> _processSubscription(SubscriptionPlan plan) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authService = context.read<AuthService>();
      final analytics = context.read<AnalyticsService>();
      final subscriptionService = SubscriptionService(authService, analytics);
      
      // Initialize Stripe (use test key for now)
      await subscriptionService.initialize(
        'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx',  // Replace with real key
      );

      // Create payment intent
      final clientSecret = await subscriptionService.createPaymentIntent(plan);
      
      if (clientSecret == null) {
        setState(() {
          _error = subscriptionService.error ?? 'Failed to create payment';
          _isLoading = false;
        });
        return;
      }

      // Process payment
      final success = await subscriptionService.processPayment(clientSecret);
      
      if (success && mounted) {
        final user = context.read<UserModel>();
        user.setMemberStatus(MemberStatus.premium);
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 Subscription activated! Welcome to Premium!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else {
        setState(() {
          _error = subscriptionService.error ?? 'Payment failed';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Subscription error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: YiShunTheme.surfaceLight,
      appBar: AppBar(
        backgroundColor: YiShunTheme.primaryColor,
        title: const Text('Upgrade to Premium'),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    YiShunTheme.accentColor,
                    YiShunTheme.accentColor.withAlpha(204),
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Column(
                children: [
                  Text('👑', style: TextStyle(fontSize: 70)),
                  SizedBox(height: 16),
                  Text(
                    'YiShun Premium',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Unlock unlimited fortune analyses',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.black54,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Features
            _buildFeatureItem(Icons.all_inclusive, 'Unlimited Analyses', 'No daily limits'),
            _buildFeatureItem(Icons.history, 'Full History', 'Access all your readings'),
            _buildFeatureItem(Icons.insights, 'Advanced Insights', 'Deeper fortune analysis'),
            _buildFeatureItem(Icons.adb, 'No Ads', 'Clean, uninterrupted experience'),

            const SizedBox(height: 32),

            // Pricing cards
            _buildPricingCard(
              title: 'Monthly',
              price: '\$9.99',
              period: '/month',
              features: ['Unlimited access', 'Cancel anytime', 'Billed monthly'],
              isPopular: false,
              onSubscribe: _isLoading ? null : _subscribeMonthly,
            ),
            const SizedBox(height: 16),
            _buildPricingCard(
              title: 'Yearly',
              price: '\$59.99',
              period: '/year',
              features: ['Unlimited access', 'Save 50%', 'Best value'],
              isPopular: true,
              onSubscribe: _isLoading ? null : _subscribeYearly,
            ),

            // Error message
            if (_error != null) ...[
              const SizedBox(height: 16),
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
            ],

            // Loading indicator
            if (_isLoading) ...[
              const SizedBox(height: 16),
              const Center(child: CircularProgressIndicator()),
            ],

            const SizedBox(height: 24),

            // Restore purchases
            TextButton(
              onPressed: _isLoading ? null : _restorePurchases,
              child: const Text('Restore Previous Purchases'),
            ),

            const SizedBox(height: 16),

            // Terms
            Text(
              'By subscribing, you agree to our Terms of Service and Privacy Policy. '
              'Subscriptions auto-renew unless cancelled 24 hours before the period ends.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: YiShunTheme.primaryColor.withAlpha(25),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: YiShunTheme.primaryColor, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.check_circle, color: Colors.green, size: 24),
        ],
      ),
    );
  }

  Widget _buildPricingCard({
    required String title,
    required String price,
    required String period,
    required List<String> features,
    required bool isPopular,
    required VoidCallback? onSubscribe,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPopular ? YiShunTheme.accentColor : Colors.transparent,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(13),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          if (isPopular)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 6),
              decoration: const BoxDecoration(
                color: YiShunTheme.accentColor,
                borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
              ),
              child: const Text(
                'BEST VALUE',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      price,
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: YiShunTheme.primaryColor,
                      ),
                    ),
                    Text(
                      period,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ...features.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      const Icon(Icons.check, color: Colors.green, size: 18),
                      const SizedBox(width: 8),
                      Text(f, style: TextStyle(color: Colors.grey.shade700)),
                    ],
                  ),
                )),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: onSubscribe,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isPopular 
                          ? YiShunTheme.accentColor 
                          : YiShunTheme.primaryColor,
                      foregroundColor: isPopular ? Colors.black : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'Subscribe',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _restorePurchases() async {
    setState(() => _isLoading = true);
    
    try {
      final authService = context.read<AuthService>();
      final analytics = context.read<AnalyticsService>();
      final subscriptionService = SubscriptionService(authService, analytics);
      
      final success = await subscriptionService.restorePurchases();
      
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Purchases restored successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else {
        setState(() {
          _error = 'No previous purchases found';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Restore failed: $e';
        _isLoading = false;
      });
    }
  }
}