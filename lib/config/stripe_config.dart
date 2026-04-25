// Stripe configuration
// Publishable key is safe to be in client code (Flutter)
// Secret key must NEVER be here - use backend with environment variables/CI secrets

class StripeConfig {
  // Test publishable key - safe for client-side
  static const String publishableKey = 'pk_test_51SuY1EEDoEbJp6om4kOVaCCWS6aLzCwr6ntUDDvI4MnOcgMD4FYzstD0zVNheGx6jKLxXmtujetAst6Ah7XDC1Y000kasC3ZyZ';
  
  // Backend API URL
  static const String backendUrl = 'http://34.102.18.91:8000';
  
  // Price IDs (configured on Stripe Dashboard)
  static const String monthlyPriceId = 'price_monthly';  // TODO: Replace with actual Stripe Price ID
  static const String yearlyPriceId = 'price_yearly';    // TODO: Replace with actual Stripe Price ID
}