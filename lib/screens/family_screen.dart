import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/analytics_service.dart';
import '../utils/theme.dart';
import '../widgets/decorations.dart';

/// 家庭计划界面
/// 神秘东方色彩，玄学风格
class FamilyScreen extends StatefulWidget {
  const FamilyScreen({super.key});

  @override
  State<FamilyScreen> createState() => _FamilyScreenState();
}

class _FamilyScreenState extends State<FamilyScreen> {
  final List<Map<String, dynamic>> _familyMembers = [
    {'name': '爸爸', 'relation': '父亲', 'isOwner': true},
    {'name': '妈妈', 'relation': '母亲', 'isOwner': false},
  ];

  int get _memberCount => _familyMembers.length;
  int get _maxMembers => 5;
  bool get _canAddMember => _memberCount < _maxMembers;

  @override
  void initState() {
    super.initState();
    context.read<AnalyticsService>().logScreenView(screenName: 'FamilyScreen');
  }

  Future<void> _addMember() async {
    if (!_canAddMember) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ 家庭成员最多5人'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final nameController = TextEditingController();
    String selectedRelation = '配偶';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: YiShunTheme.backgroundMid,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(YiShunTheme.radiusLg),
        ),
        title: const Text(
          '添加家庭成员',
          style: TextStyle(color: YiShunTheme.textPrimary),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              style: const TextStyle(color: YiShunTheme.textPrimary),
              decoration: InputDecoration(
                labelText: '姓名',
                labelStyle: TextStyle(color: Colors.white.withAlpha(153)),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                  borderSide: BorderSide(color: Colors.white.withAlpha(51)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                  borderSide: const BorderSide(
                    color: YiShunTheme.goldPrimary,
                    width: 1.5,
                  ),
                ),
                filled: true,
                fillColor: YiShunTheme.backgroundLight,
              ),
            ),
            const SizedBox(height: 16),
            StatefulBuilder(
              builder: (context, setDialogState) {
                return DropdownButtonFormField<String>(
                  initialValue: selectedRelation,
                  dropdownColor: YiShunTheme.backgroundDark,
                  style: const TextStyle(color: YiShunTheme.textPrimary),
                  decoration: InputDecoration(
                    labelText: '关系',
                    labelStyle: TextStyle(color: Colors.white.withAlpha(153)),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                      borderSide: BorderSide(color: Colors.white.withAlpha(51)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
                      borderSide: const BorderSide(
                        color: YiShunTheme.goldPrimary,
                        width: 1.5,
                      ),
                    ),
                    filled: true,
                    fillColor: YiShunTheme.backgroundLight,
                  ),
                  items: ['配偶', '子女', '父母', '兄弟姐妹', '其他']
                      .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                      .toList(),
                  onChanged: (v) => setDialogState(() => selectedRelation = v ?? selectedRelation),
                );
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              if (nameController.text.trim().isEmpty) return;
              Navigator.pop(context, true);
            },
            child: const Text(
              '添加',
              style: TextStyle(color: YiShunTheme.goldPrimary),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() {
        _familyMembers.add({
          'name': nameController.text.trim(),
          'relation': selectedRelation,
          'isOwner': false,
        });
      });
    }
  }

  Future<void> _removeMember(int index) async {
    final member = _familyMembers[index];
    if (member['isOwner'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ 无法移除户主'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: YiShunTheme.backgroundMid,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(YiShunTheme.radiusLg),
        ),
        title: const Text(
          '移除成员',
          style: TextStyle(color: YiShunTheme.textPrimary),
        ),
        content: Text(
          '确定要移除 ${member['name']} 吗？',
          style: const TextStyle(color: YiShunTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              '确认移除',
              style: TextStyle(color: YiShunTheme.error),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _familyMembers.removeAt(index));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: YiShunTheme.backgroundDark,
      body: Container(
        decoration: const BoxDecoration(
          gradient: YiShunTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // 顶部装饰
              const MysticTopDecoration(height: 80),

              // App Bar
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: YiShunTheme.space4,
                ),
                child: Row(
                  children: [
                    MysticIconBtn(
                      icon: Icons.arrow_back,
                      onTap: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: YiShunTheme.space4),
                    const Expanded(
                      child: Text(
                        '家庭计划',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: YiShunTheme.textPrimary,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: YiShunTheme.space4),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(YiShunTheme.space4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Info Card
                      _buildInfoCard(),
                      const SizedBox(height: YiShunTheme.space5),

                      // Members Header
                      MysticTitle(
                        title: '家庭成员',
                        subtitle: '',
                        icon: Icons.people,
                        showDivider: true,
                      ),
                      const SizedBox(height: YiShunTheme.space3),

                      // Members List
                      _buildMembersList(),
                      const SizedBox(height: YiShunTheme.space5),

                      // Add Button
                      if (_canAddMember) _buildAddButton(),

                      const SizedBox(height: YiShunTheme.space8),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return MysticGoldCard(
      padding: const EdgeInsets.all(YiShunTheme.space5),
      child: Column(
        children: [
          // 图标
          Container(
            padding: const EdgeInsets.all(YiShunTheme.space4),
            decoration: BoxDecoration(
              color: YiShunTheme.goldPrimary.withAlpha(38),
              shape: BoxShape.circle,
              border: Border.all(
                color: YiShunTheme.goldPrimary.withAlpha(76),
              ),
            ),
            child: const Text('👨‍👩‍👧‍👦', style: TextStyle(fontSize: 40)),
          ),
          const SizedBox(height: YiShunTheme.space4),

          const Text(
            '家庭计划',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: YiShunTheme.textPrimary,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '最多邀请$_maxMembers位家庭成员共享高级功能',
            style: TextStyle(
              fontSize: 13,
              color: YiShunTheme.textMuted,
            ),
          ),
          const SizedBox(height: YiShunTheme.space4),

          // 进度指示
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$_memberCount',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: YiShunTheme.goldPrimary,
                ),
              ),
              Text(
                ' / $_maxMembers 人',
                style: TextStyle(
                  fontSize: 14,
                  color: YiShunTheme.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: YiShunTheme.space3),

          // 进度条
          Container(
            height: 6,
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(13),
              borderRadius: BorderRadius.circular(3),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: (_memberCount / _maxMembers).clamp(0.0, 1.0),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      YiShunTheme.goldPrimary,
                      YiShunTheme.goldPrimary.withAlpha(179),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(3),
                  boxShadow: [
                    BoxShadow(
                      color: YiShunTheme.goldPrimary.withAlpha(76),
                      blurRadius: 4,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMembersList() {
    return MysticCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: _familyMembers.asMap().entries.map((entry) {
          final index = entry.key;
          final member = entry.value;
          return Column(
            children: [
              if (index > 0)
                Container(
                  height: 1,
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        Colors.white.withAlpha(13),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              _buildMemberTile(member, index),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildMemberTile(Map<String, dynamic> member, int index) {
    final isOwner = member['isOwner'] == true;
    final avatarColor = YiShunTheme.getWuXingColor(
      YiShunTheme.wuXingCycle[index % YiShunTheme.wuXingCycle.length],
    );

    return Padding(
      padding: const EdgeInsets.all(YiShunTheme.space4),
      child: Row(
        children: [
          // 头像
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: avatarColor.withAlpha(38),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: avatarColor.withAlpha(76),
                width: 1.5,
              ),
            ),
            child: Center(
              child: Text(
                (member['name'] as String).isNotEmpty
                    ? (member['name'] as String)[0]
                    : '?',
                style: TextStyle(
                  color: avatarColor,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: YiShunTheme.space3),

          // 信息
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      member['name'] as String,
                      style: const TextStyle(
                        color: YiShunTheme.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (isOwner) ...[
                      const SizedBox(width: YiShunTheme.space2),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: YiShunTheme.space2,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: YiShunTheme.goldPrimary.withAlpha(38),
                          borderRadius: BorderRadius.circular(
                            YiShunTheme.radiusSm,
                          ),
                          border: Border.all(
                            color: YiShunTheme.goldPrimary.withAlpha(76),
                          ),
                        ),
                        child: const Text(
                          '户主',
                          style: TextStyle(
                            color: YiShunTheme.goldPrimary,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  member['relation'] as String,
                  style: TextStyle(
                    color: YiShunTheme.textMuted,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),

          // 删除按钮
          if (!isOwner)
            IconButton(
              onPressed: () => _removeMember(index),
              icon: Icon(
                Icons.remove_circle_outline,
                color: YiShunTheme.error.withAlpha(178),
                size: 22,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildAddButton() {
    return SizedBox(
      height: 52,
      child: ElevatedButton.icon(
        onPressed: _addMember,
        style: ElevatedButton.styleFrom(
          backgroundColor: YiShunTheme.goldPrimary,
          foregroundColor: YiShunTheme.backgroundDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(YiShunTheme.radiusMd),
          ),
        ),
        icon: const Icon(Icons.person_add, size: 20),
        label: const Text(
          '添加家庭成员',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
