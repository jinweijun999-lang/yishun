import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('zh'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'YiShun Fortune'**
  String get appTitle;

  /// No description provided for @homeTab.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get homeTab;

  /// No description provided for @divinationTab.
  ///
  /// In en, this message translates to:
  /// **'Divination'**
  String get divinationTab;

  /// No description provided for @profileTab.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profileTab;

  /// No description provided for @dailyFortune.
  ///
  /// In en, this message translates to:
  /// **'Daily Fortune'**
  String get dailyFortune;

  /// No description provided for @fourPillarsDivination.
  ///
  /// In en, this message translates to:
  /// **'Four Pillars'**
  String get fourPillarsDivination;

  /// No description provided for @fiveElementsAnalysis.
  ///
  /// In en, this message translates to:
  /// **'Five Elements'**
  String get fiveElementsAnalysis;

  /// No description provided for @tenGodAnalysis.
  ///
  /// In en, this message translates to:
  /// **'Ten Gods'**
  String get tenGodAnalysis;

  /// No description provided for @inputBirthInfo.
  ///
  /// In en, this message translates to:
  /// **'Enter Birth Information'**
  String get inputBirthInfo;

  /// No description provided for @name.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get name;

  /// No description provided for @nameHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your name (optional)'**
  String get nameHint;

  /// No description provided for @birthYear.
  ///
  /// In en, this message translates to:
  /// **'Year'**
  String get birthYear;

  /// No description provided for @birthMonth.
  ///
  /// In en, this message translates to:
  /// **'Month'**
  String get birthMonth;

  /// No description provided for @birthDay.
  ///
  /// In en, this message translates to:
  /// **'Day'**
  String get birthDay;

  /// No description provided for @birthHour.
  ///
  /// In en, this message translates to:
  /// **'Hour'**
  String get birthHour;

  /// No description provided for @birthPlaceLongitude.
  ///
  /// In en, this message translates to:
  /// **'Birthplace Longitude'**
  String get birthPlaceLongitude;

  /// No description provided for @longitudeHint.
  ///
  /// In en, this message translates to:
  /// **'For solar time calculation (Beijing default 116.4°)'**
  String get longitudeHint;

  /// No description provided for @startAnalysis.
  ///
  /// In en, this message translates to:
  /// **'Start Analysis'**
  String get startAnalysis;

  /// No description provided for @analyzing.
  ///
  /// In en, this message translates to:
  /// **'Analyzing...'**
  String get analyzing;

  /// No description provided for @result.
  ///
  /// In en, this message translates to:
  /// **'Result'**
  String get result;

  /// No description provided for @yearPillar.
  ///
  /// In en, this message translates to:
  /// **'Year Pillar'**
  String get yearPillar;

  /// No description provided for @monthPillar.
  ///
  /// In en, this message translates to:
  /// **'Month Pillar'**
  String get monthPillar;

  /// No description provided for @dayPillar.
  ///
  /// In en, this message translates to:
  /// **'Day Pillar'**
  String get dayPillar;

  /// No description provided for @hourPillar.
  ///
  /// In en, this message translates to:
  /// **'Hour Pillar'**
  String get hourPillar;

  /// No description provided for @solarTime.
  ///
  /// In en, this message translates to:
  /// **'True Solar Time'**
  String get solarTime;

  /// No description provided for @fiveElements.
  ///
  /// In en, this message translates to:
  /// **'Five Elements'**
  String get fiveElements;

  /// No description provided for @tenGods.
  ///
  /// In en, this message translates to:
  /// **'Ten Gods'**
  String get tenGods;

  /// No description provided for @fortune.
  ///
  /// In en, this message translates to:
  /// **'Fortune'**
  String get fortune;

  /// No description provided for @career.
  ///
  /// In en, this message translates to:
  /// **'Career'**
  String get career;

  /// No description provided for @love.
  ///
  /// In en, this message translates to:
  /// **'Love'**
  String get love;

  /// No description provided for @health.
  ///
  /// In en, this message translates to:
  /// **'Health'**
  String get health;

  /// No description provided for @wealth.
  ///
  /// In en, this message translates to:
  /// **'Wealth'**
  String get wealth;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @membership.
  ///
  /// In en, this message translates to:
  /// **'Membership'**
  String get membership;

  /// No description provided for @memberStatus.
  ///
  /// In en, this message translates to:
  /// **'Member Status'**
  String get memberStatus;

  /// No description provided for @freeUser.
  ///
  /// In en, this message translates to:
  /// **'Free User'**
  String get freeUser;

  /// No description provided for @premiumMember.
  ///
  /// In en, this message translates to:
  /// **'Premium Member'**
  String get premiumMember;

  /// No description provided for @subscribeNow.
  ///
  /// In en, this message translates to:
  /// **'Subscribe Now'**
  String get subscribeNow;

  /// No description provided for @monthlyPrice.
  ///
  /// In en, this message translates to:
  /// **'\$9.9/month'**
  String get monthlyPrice;

  /// No description provided for @watchAdUnlock.
  ///
  /// In en, this message translates to:
  /// **'Watch Ad to Unlock'**
  String get watchAdUnlock;

  /// No description provided for @adMustWatchFull.
  ///
  /// In en, this message translates to:
  /// **'Must watch complete ad to receive reward'**
  String get adMustWatchFull;

  /// No description provided for @watchAd.
  ///
  /// In en, this message translates to:
  /// **'Watch Ad'**
  String get watchAd;

  /// No description provided for @dailyFortuneTitle.
  ///
  /// In en, this message translates to:
  /// **'Today\'s Fortune'**
  String get dailyFortuneTitle;

  /// No description provided for @luckyColor.
  ///
  /// In en, this message translates to:
  /// **'Lucky Color'**
  String get luckyColor;

  /// No description provided for @luckyNumber.
  ///
  /// In en, this message translates to:
  /// **'Lucky Number'**
  String get luckyNumber;

  /// No description provided for @luckyDirection.
  ///
  /// In en, this message translates to:
  /// **'Lucky Direction'**
  String get luckyDirection;

  /// No description provided for @godOfDay.
  ///
  /// In en, this message translates to:
  /// **'God of the Day'**
  String get godOfDay;

  /// No description provided for @error.
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get error;

  /// No description provided for @networkError.
  ///
  /// In en, this message translates to:
  /// **'Network error, please try again'**
  String get networkError;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @privacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get privacyPolicy;

  /// No description provided for @termsOfService.
  ///
  /// In en, this message translates to:
  /// **'Terms of Service'**
  String get termsOfService;

  /// No description provided for @version.
  ///
  /// In en, this message translates to:
  /// **'Version'**
  String get version;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// No description provided for @register.
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get register;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @confirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm Password'**
  String get confirmPassword;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot Password?'**
  String get forgotPassword;

  /// No description provided for @noAccount.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account?'**
  String get noAccount;

  /// No description provided for @hasAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get hasAccount;

  /// No description provided for @adLoading.
  ///
  /// In en, this message translates to:
  /// **'Loading advertisement...'**
  String get adLoading;

  /// No description provided for @adError.
  ///
  /// In en, this message translates to:
  /// **'Ad failed to load, please try again'**
  String get adError;

  /// No description provided for @adRewardReceived.
  ///
  /// In en, this message translates to:
  /// **'Reward received!'**
  String get adRewardReceived;

  /// No description provided for @adNotCompleted.
  ///
  /// In en, this message translates to:
  /// **'Please watch the complete ad'**
  String get adNotCompleted;

  /// No description provided for @features.
  ///
  /// In en, this message translates to:
  /// **'Features'**
  String get features;

  /// No description provided for @baziCalculation.
  ///
  /// In en, this message translates to:
  /// **'Bazi Calculation'**
  String get baziCalculation;

  /// No description provided for @wuxingAnalysis.
  ///
  /// In en, this message translates to:
  /// **'Five Elements Analysis'**
  String get wuxingAnalysis;

  /// No description provided for @fortuneReading.
  ///
  /// In en, this message translates to:
  /// **'Fortune Reading'**
  String get fortuneReading;

  /// No description provided for @compatibility.
  ///
  /// In en, this message translates to:
  /// **'Compatibility'**
  String get compatibility;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
