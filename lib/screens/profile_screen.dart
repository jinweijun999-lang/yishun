import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/analytics_service.dart';
import '../models/user_model.dart';
import '../utils/theme.dart';
import '../widgets/decorations.dart';

/// 个人中心 - 精美简洁风格
/// Profile Screen - Clean & Refined
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: YiShunTheme.backgroundDark,
      body: Container(
        decoration: const BoxDecoration(gradient: YiShunTheme.backgroundGradient),
        child: SafeArea(
          child: Consumer<UserModel>(
            builder: (context, user, _) {
              if (!user.isLoggedIn) {
                return _buildLoggedOutView(context);
              }
              return _buildLoggedInView(context, user);
            },
          ),
        ),
      ),
    );
  }

  Widget _buildLoggedOutView(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: YiShunTheme.goldPrimary.withAlpha(25),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.person_outline, size: 72, color: YiShunTheme.goldPrimary),
            ),
            const SizedBox(height: 32),
            const Text(
              '欢迎使用易顺',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: YiShunTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '登录以同步数据，解锁会员功能',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: YiShunTheme.textSecondary),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/auth'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: YiShunTheme.goldPrimary,
                  foregroundColor: YiShunTheme.backgroundDark,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                  ),
                ),
                child: const Text(
                  '登录 / 注册',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoggedInView(BuildContext context, UserModel user) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 24),

          // 用户信息卡片
          AppCard(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: YiShunTheme.goldPrimary.withAlpha(25),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(Icons.person, size: 28, color: YiShunTheme.goldPrimary),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.name ?? user.email ?? '用户',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                          color: YiShunTheme.textPrimary,
                        ),
                      ),
                      if (user.email != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          user.email!,
                          style: const TextStyle(fontSize: 13, color: YiShunTheme.textMuted),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 会员卡片
          AppCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _MembershipStatus(user: user),
                if (!user.isPremium) ...[
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/paywall'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: YiShunTheme.goldPrimary,
                        foregroundColor: YiShunTheme.backgroundDark,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                        ),
                      ),
                      child: const Text(
                        '开通会员',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 设置列表
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _SettingsTile(icon: Icons.notifications_outlined, title: '通知设置', onTap: () {}),
                const Divider(height: 1, indent: 56),
                _SettingsTile(icon: Icons.language, title: '语言', trailing: const Text('中文', style: TextStyle(color: YiShunTheme.textMuted)), onTap: () {}),
                const Divider(height: 1, indent: 56),
                _SettingsTile(icon: Icons.privacy_tip_outlined, title: '隐私政策', onTap: () {}),
                const Divider(height: 1, indent: 56),
                _SettingsTile(icon: Icons.description_outlined, title: '服务条款', onTap: () {}),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 版本 + 退出
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _SettingsTile(
                  icon: Icons.info_outline,
                  title: '版本',
                  trailing: const Text('1.0.0', style: TextStyle(color: YiShunTheme.textMuted)),
                  onTap: () {},
                ),
                const Divider(height: 1, indent: 56),
                _SettingsTile(
                  icon: Icons.logout,
                  title: '退出登录',
                  textColor: YiShunTheme.error,
                  onTap: () async {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        backgroundColor: YiShunTheme.backgroundCard,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(YiShunTheme.radiusLg),
                        ),
                        title: const Text('退出登录', style: TextStyle(color: YiShunTheme.textPrimary)),
                        content: const Text('确定要退出登录吗？', style: TextStyle(color: YiShunTheme.textSecondary)),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, true),
                            child: const Text('退出', style: TextStyle(color: YiShunTheme.error)),
                          ),
                        ],
                      ),
                    );
                    if (confirmed == true && context.mounted) {
                      await context.read<AuthService>().logout();
                      context.read<AnalyticsService>().logLogout();
                      context.read<UserModel>().logout();
                    }
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 48),
        ],
      ),
    );
  }
}

// === 会员状态 ===
class _MembershipStatus extends StatelessWidget {
  final UserModel user;

  const _MembershipStatus({required this.user});

  @override
  Widget build(BuildContext context) {
    final isPremium = user.isPremium;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isPremium
              ? [YiShunTheme.goldPrimary, YiShunTheme.goldPrimary.withAlpha(204)]
              : [YiShunTheme.backgroundLight, YiShunTheme.backgroundCard],
        ),
        borderRadius: BorderRadius.circular(YiShunTheme.radiusLg),
      ),
      child: Row(
        children: [
          Text(isPremium ? '👑' : '⭐', style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isPremium ? '会员用户' : '免费用户',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: isPremium ? YiShunTheme.backgroundDark : YiShunTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isPremium ? '全部功能已解锁' : '今日剩余 ${user.freeUsesRemaining} 次免费分析',
                  style: TextStyle(
                    fontSize: 12,
                    color: isPremium ? YiShunTheme.backgroundDark.withAlpha(179) : YiShunTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// === 设置项 ===
class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Color? textColor;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.trailing,
    this.onTap,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: textColor ?? YiShunTheme.textSecondary, size: 22),
      title: Text(
        title,
        style: TextStyle(fontSize: 15, color: textColor ?? YiShunTheme.textPrimary),
      ),
      trailing: trailing ?? const Icon(Icons.chevron_right, color: YiShunTheme.textMuted, size: 20),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }
}
