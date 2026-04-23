import 'package:flutter/foundation.dart';

// AdService is temporarily disabled due to google_mobile_ads AGP compatibility issues
class AdService extends ChangeNotifier {
  bool _isInitialized = false;
  bool isRewardedAdReady = false;

  Future<void> initialize() async {
    _isInitialized = false;
  }

  Future<void> loadAd() async {
    // Temporarily disabled
  }

  Future<void> preloadAd() async {
    // Temporarily disabled
  }

  Future<bool> showRewardedAd() async {
    // Temporarily disabled - return false to indicate ad not available
    return false;
  }

  bool get isInitialized => _isInitialized;
}
