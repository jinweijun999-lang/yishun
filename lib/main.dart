import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'screens/home_screen.dart';
import 'screens/divination_screen.dart';
import 'screens/result_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/history_screen.dart';
import 'screens/compatibility_screen.dart';
import 'screens/subscription_screen.dart';
import 'screens/paywall_screen.dart';
import 'screens/membership_screen.dart';
import 'screens/family_screen.dart';
import 'screens/ten_gods_guide.dart';
import 'screens/dayun_liunian_page.dart';
import 'screens/report_purchase_screen.dart';
import 'screens/report_view_screen.dart';
import 'services/auth_service.dart';
import 'services/ad_service.dart';
import 'services/analytics_service.dart';
import 'models/user_model.dart';
import 'utils/theme.dart';
import 'widgets/decorations.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Firebase disabled for CI compatibility
  final authService = AuthService();
  final adService = AdService();
  final analyticsService = AnalyticsService();
  await adService.initialize();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => authService),
        ChangeNotifierProvider(create: (_) => adService),
        ChangeNotifierProvider(create: (_) => analyticsService),
        ChangeNotifierProvider(create: (_) => UserModel()),
      ],
      child: const YiShunApp(),
    ),
  );
}

/// ============================================
/// 导航控制器 - 用于跨组件通信
/// ============================================
class NavigationController extends ChangeNotifier {
  int _currentIndex = 0;
  
  int get currentIndex => _currentIndex;
  
  void navigateTo(int index) {
    if (_currentIndex != index) {
      _currentIndex = index;
      notifyListeners();
    }
  }
  
  void navigateToDivination() => navigateTo(1);
}

class YiShunApp extends StatefulWidget {
  const YiShunApp({super.key});

  @override
  State<YiShunApp> createState() => _YiShunAppState();
}

class _YiShunAppState extends State<YiShunApp> {
  final Locale _locale = const Locale('en');
  final _navController = NavigationController();

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _navController,
      child: MaterialApp(
        title: 'YiShun Fortune',
        debugShowCheckedModeBanner: false,
        theme: YiShunTheme.lightTheme,
        darkTheme: YiShunTheme.lightTheme,
        themeMode: ThemeMode.light,
        locale: _locale,
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [Locale('en'), Locale('zh')],
        routes: {
          '/': (context) => const MainNavigation(),
          '/auth': (context) => const AuthScreen(),
          '/result': (context) => const ResultScreen(),
          '/history': (context) => const HistoryScreen(),
          '/compatibility': (context) => const CompatibilityScreen(),
          '/subscription': (context) => const SubscriptionScreen(),
          '/paywall': (context) => const PaywallScreen(),
          '/membership': (context) => const MembershipScreen(),
          '/family': (context) => const FamilyScreen(),
          '/ten_gods_guide': (context) => const TenGodsGuidePage(),
          '/dayun_liunian': (context) => DaYunLiuNianPage(
            baziResult: ModalRoute.of(context)?.settings.arguments
                    as Map<String, dynamic>? ??
                {},
          ),
          '/report_purchase': (context) => const ReportPurchaseScreen(),
          '/report_view': (context) => const ReportViewScreen(),
        },
      ),
    );
  }
}

/// ============================================
/// MainNavigation - 底部导航 (4个按钮)
/// Home | Chart | Consult | Profile
/// ============================================
class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  @override
  void initState() {
    super.initState();
    // 监听导航控制器变化
    final navController = context.read<NavigationController>();
    navController.addListener(_onNavIndexChanged);
  }

  @override
  void dispose() {
    final navController = context.read<NavigationController>();
    navController.removeListener(_onNavIndexChanged);
    super.dispose();
  }

  void _onNavIndexChanged() {
    setState(() {});
  }

  int get _currentIndex => context.read<NavigationController>().currentIndex;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          HomeScreen(),
          DivinationScreen(),
          // Consult 页面暂用 Placeholder，后续添加
          _ConsultPlaceholder(),
          ProfileScreen(),
        ],
      ),
      bottomNavigationBar: YiShunBottomNav(
        currentIndex: _currentIndex,
        onTap: (index) => context.read<NavigationController>().navigateTo(index),
      ),
    );
  }
}

/// Consult 页面占位符
class _ConsultPlaceholder extends StatelessWidget {
  const _ConsultPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: YiShunTheme.background,
      appBar: AppBar(
        backgroundColor: YiShunTheme.background,
        title: const Text('Consult'),
        centerTitle: true,
      ),
      body: const Center(
        child: Text('Consult - Coming Soon'),
      ),
    );
  }
}