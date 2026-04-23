import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/analytics_service.dart';
import '../models/user_model.dart';
import '../utils/theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: YiShunTheme.surfaceLight,
      appBar: AppBar(
        backgroundColor: YiShunTheme.primaryColor,
        title: const Text('Profile'),
        centerTitle: true,
        elevation: 0,
      ),
      body: Consumer<UserModel>(
        builder: (context, user, _) {
          if (!user.isLoggedIn) {
            return _buildLoggedOutView(context);
          }
          return _buildLoggedInView(context, user);
        },
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
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: YiShunTheme.primaryColor.withAlpha(25),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.person_outline,
                size: 80,
                color: YiShunTheme.primaryColor,
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Welcome to YiShun',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Sign in to sync your data and unlock premium features',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/auth'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: YiShunTheme.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'Sign In / Register',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // User info card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: YiShunTheme.primaryColor.withAlpha(25),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.person,
                      size: 40,
                      color: YiShunTheme.primaryColor,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.name ?? user.email ?? 'User',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user.email ?? '',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Membership card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildMembershipStatus(user),
                  const SizedBox(height: 16),
                  if (!user.isPremium) ...[
                    const Divider(),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pushNamed(context, '/subscription'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: YiShunTheme.accentColor,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Upgrade to Premium - \$9.9/mo',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Settings
          Card(
            child: Column(
              children: [
                _buildSettingsTile(
                  icon: Icons.notifications_outlined,
                  title: 'Notifications',
                  onTap: () {},
                ),
                const Divider(height: 1),
                _buildSettingsTile(
                  icon: Icons.language,
                  title: 'Language',
                  trailing: const Text('English'),
                  onTap: () {},
                ),
                const Divider(height: 1),
                _buildSettingsTile(
                  icon: Icons.privacy_tip_outlined,
                  title: 'Privacy Policy',
                  onTap: () {},
                ),
                const Divider(height: 1),
                _buildSettingsTile(
                  icon: Icons.description_outlined,
                  title: 'Terms of Service',
                  onTap: () {},
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Version & Logout
          Card(
            child: Column(
              children: [
                _buildSettingsTile(
                  icon: Icons.info_outline,
                  title: 'Version',
                  trailing: const Text('1.0.0'),
                  onTap: () {},
                ),
                const Divider(height: 1),
                _buildSettingsTile(
                  icon: Icons.logout,
                  title: 'Logout',
                  textColor: Colors.red,
                  onTap: () async {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Logout'),
                        content: const Text('Are you sure you want to logout?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, false),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(ctx, true),
                            child: const Text('Logout',
                                style: TextStyle(color: Colors.red)),
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
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildMembershipStatus(UserModel user) {
    final isPremium = user.isPremium;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isPremium
              ? [YiShunTheme.accentColor, YiShunTheme.accentColor.withAlpha(204)]
              : [Colors.grey.shade300, Colors.grey.shade400],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Text(isPremium ? '👑' : '⭐', style: const TextStyle(fontSize: 32)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isPremium ? 'Premium Member' : 'Free User',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isPremium
                      ? 'All features unlocked'
                      : '${user.freeUsesRemaining} free analyses left today',
                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    Widget? trailing,
    VoidCallback? onTap,
    Color? textColor,
  }) {
    return ListTile(
      leading: Icon(icon, color: textColor ?? YiShunTheme.secondaryColor),
      title: Text(
        title,
        style: TextStyle(
          color: textColor,
          fontSize: 15,
        ),
      ),
      trailing: trailing ??
          const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: onTap,
    );
  }
}
