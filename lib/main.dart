import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const YiShunApp());
}

class YiShunApp extends StatelessWidget {
  const YiShunApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'YiShun 玄学',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFF6B35),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        fontFamily: 'PingFang SC',
      ),
      home: const HomeScreen(),
    );
  }
}