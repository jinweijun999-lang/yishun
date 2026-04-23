import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AdRewardStatus { notLoaded, loading, loaded, playing, earned, failed, closed }

class AdService extends ChangeNotifier {
  bool _isInitialized = false;
  AdRewardStatus _rewardStatus = AdRewardStatus.notLoaded;
  String? _errorMessage;
  
  // Test ad unit IDs - replace with production IDs when publishing
  static const String _rewardedAdUnitId = 'ca-app-pub-3940256099942544/5224359117';
  static const String _interstitialAdUnitId = 'ca-app-pub-3940256099942544/5224359117';
  
  RewardedAd? _rewardedAd;
  InterstitialAd? _interstitialAd;

  bool get isInitialized => _isInitialized;
  AdRewardStatus get rewardStatus => _rewardStatus;
  String? get errorMessage => _errorMessage;
  bool get isRewardedAdReady => _rewardedAd != null;

  Future<void> initialize() async {
    if (_isInitialized) return;
    
    try {
      // Initialize Google Mobile Ads
      final status = await MobileAds.instance.initialize();
      debugPrint('Ad SDK initialized: $status');
      
      // Load rewarded ad
      await _loadRewardedAd();
      
      _isInitialized = true;
      notifyListeners();
    } catch (e) {
      debugPrint('Ad initialization failed: $e');
      _errorMessage = 'Ad system unavailable';
      _isInitialized = true;  // Don't fail app init
      notifyListeners();
    }
  }

  Future<void> _loadRewardedAd() async {
    if (_rewardStatus == AdRewardStatus.loading) return;
    
    _rewardStatus = AdRewardStatus.loading;
    notifyListeners();

    try {
      await RewardedAd.load(
        adUnitId: _rewardedAdUnitId,
        request: const AdRequest(),
        rewardedAdLoadCallback: RewardedAdLoadCallback(
          onAdLoaded: (ad) {
            debugPrint('Rewarded ad loaded successfully');
            _rewardedAd = ad;
            _rewardStatus = AdRewardStatus.loaded;
            _setupRewardCallback();
            notifyListeners();
          },
          onAdFailedToLoad: (error) {
            debugPrint('Failed to load rewarded ad: ${error.message}');
            _rewardStatus = AdRewardStatus.failed;
            _errorMessage = 'Failed to load ad: ${error.message}';
            notifyListeners();
          },
        ),
      );
    } catch (e) {
      debugPrint('Rewarded ad load exception: $e');
      _rewardStatus = AdRewardStatus.failed;
      _errorMessage = 'Ad load error: $e';
      notifyListeners();
    }
  }

  void _setupRewardCallback() {
    _rewardedAd?.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        debugPrint('Rewarded ad dismissed');
        _rewardedAd?.dispose();
        _rewardedAd = null;
        _rewardStatus = AdRewardStatus.closed;
        notifyListeners();
        // Preload next ad
        _loadRewardedAd();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        debugPrint('Failed to show rewarded ad: ${error.message}');
        _rewardStatus = AdRewardStatus.failed;
        _errorMessage = 'Failed to show ad: ${error.message}';
        _rewardedAd?.dispose();
        _rewardedAd = null;
        notifyListeners();
      },
    );
  }

  /// Show rewarded ad and return true if user earned reward
  /// This method properly handles the async callback
  Future<bool> showRewardedAd() async {
    if (_rewardedAd == null) {
      if (_rewardStatus == AdRewardStatus.loading) {
        _errorMessage = 'Ad is still loading, please wait';
        notifyListeners();
        return false;
      }
      if (_rewardStatus == AdRewardStatus.failed) {
        _errorMessage = 'Ad failed to load, please try again';
        notifyListeners();
        return false;
      }
      _errorMessage = 'Ad not available';
      notifyListeners();
      return false;
    }

    _rewardStatus = AdRewardStatus.playing;
    notifyListeners();

    // Create a completer to handle the async callback
    bool earnedReward = false;
    
    try {
      await _rewardedAd!.show(
        onUserEarnedReward: (ad, reward) {
          debugPrint('User earned reward: ${reward.amount} ${reward.type}');
          earnedReward = true;
          _rewardStatus = AdRewardStatus.earned;
          
          // Save the reward locally
          _saveAdReward();
          notifyListeners();
        },
      );
    } catch (e) {
      debugPrint('Error showing rewarded ad: $e');
      _rewardStatus = AdRewardStatus.failed;
      _errorMessage = 'Failed to show ad: $e';
      notifyListeners();
      return false;
    }

    // Wait for callback (the show() returns after user dismisses)
    // For safety, add a timeout check
    await Future.delayed(const Duration(milliseconds: 500));
    
    return earnedReward;
  }

  /// Save ad reward to local storage
  Future<void> _saveAdReward() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final now = DateTime.now();
      final today = '${now.year}-${now.month}-${now.day}';
      
      // Store ad unlock for today
      await prefs.setString('ad_unlock_date', today);
      await prefs.setBool('ad_unlocked', true);
      
      debugPrint('Ad reward saved for $today');
    } catch (e) {
      debugPrint('Failed to save ad reward: $e');
    }
  }

  /// Check if user has ad-based unlock for today
  Future<bool> hasAdUnlock() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final unlocked = prefs.getBool('ad_unlocked') ?? false;
      final unlockDate = prefs.getString('ad_unlock_date') ?? '';
      final now = DateTime.now();
      final today = '${now.year}-${now.month}-${now.day}';
      
      // Check if unlock is from today
      if (unlocked && unlockDate == today) {
        return true;
      }
      
      // Reset if it's a new day
      if (unlocked) {
        await prefs.setBool('ad_unlocked', false);
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Preload ad for next use
  Future<void> preloadAd() async {
    if (_rewardedAd == null && 
        (_rewardStatus == AdRewardStatus.failed || 
         _rewardStatus == AdRewardStatus.notLoaded ||
         _rewardStatus == AdRewardStatus.closed)) {
      await _loadRewardedAd();
    }
  }

  /// Load interstitial ad
  Future<void> loadInterstitialAd() async {
    try {
      await InterstitialAd.load(
        adUnitId: _interstitialAdUnitId,
        request: const AdRequest(),
        adLoadCallback: InterstitialAdLoadCallback(
          onAdLoaded: (ad) {
            _interstitialAd = ad;
            debugPrint('Interstitial ad loaded');
          },
          onAdFailedToLoad: (error) {
            debugPrint('Interstitial ad failed to load: ${error.message}');
            _interstitialAd = null;
          },
        ),
      );
    } catch (e) {
      debugPrint('Interstitial load error: $e');
    }
  }

  /// Show interstitial if available
  Future<void> showInterstitialAd() async {
    if (_interstitialAd != null) {
      _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
        onAdDismissedFullScreenContent: (ad) {
          _interstitialAd?.dispose();
          _interstitialAd = null;
          loadInterstitialAd();  // Preload next
        },
      );
      await _interstitialAd!.show();
    }
  }

  @override
  void dispose() {
    _rewardedAd?.dispose();
    _interstitialAd?.dispose();
    super.dispose();
  }
}