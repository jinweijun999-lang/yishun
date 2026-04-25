import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/analytics_service.dart';
import '../utils/theme.dart';

class FamilyScreen extends StatefulWidget {
  const FamilyScreen({super.key});

  @override
  State<FamilyScreen> createState() => _FamilyScreenState();
}

class _FamilyScreenState extends State<FamilyScreen> {
  final bool _isLoading = false;
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
        backgroundColor: YiShunTheme.backgroundDark,
        title: const Text('添加家庭成员', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: '姓名',
                labelStyle: TextStyle(color: Colors.white.withAlpha(153)),
                enabledBorder: const OutlineInputBorder(
                  borderSide: BorderSide(color: Colors.white38),
                ),
                focusedBorder: const OutlineInputBorder(
                  borderSide: BorderSide(color: YiShunTheme.goldPrimary),
                ),
              ),
            ),
            const SizedBox(height: 16),
            StatefulBuilder(
              builder: (context, setDialogState) {
                return DropdownButtonFormField<String>(
                  initialValue: selectedRelation,
                  dropdownColor: YiShunTheme.backgroundDark,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: '关系',
                    labelStyle: TextStyle(color: Colors.white.withAlpha(153)),
                    enabledBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: Colors.white38),
                    ),
                    focusedBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: YiShunTheme.goldPrimary),
                    ),
                  ),
                  items: ['配偶', '子女', '父母', '兄弟姐妹', '其他']
                      .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                      .toList(),
                  onChanged: (v) => setDialogState(() => selectedRelation = v!),
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
            child: const Text('添加', style: TextStyle(color: YiShunTheme.goldPrimary)),
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
        backgroundColor: YiShunTheme.backgroundDark,
        title: const Text('移除成员', style: TextStyle(color: Colors.white)),
        content: Text(
          '确定要移除 ${member['name']} 吗？',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('确认移除', style: TextStyle(color: Colors.red)),
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
              // App Bar
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(25),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.arrow_back, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Text(
                        '家庭计划',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Info Card
                      _buildInfoCard(),
                      const SizedBox(height: 24),

                      // Members Header
                      _buildMembersHeader(),
                      const SizedBox(height: 12),

                      // Members List
                      _buildMembersList(),
                      const SizedBox(height: 24),

                      // Add Button
                      if (_canAddMember) _buildAddButton(),
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
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            YiShunTheme.goldPrimary.withAlpha(51),
            YiShunTheme.goldPrimary.withAlpha(26),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: YiShunTheme.goldPrimary.withAlpha(51)),
      ),
      child: Column(
        children: [
          const Text('👨‍👩‍👧‍👦', style: TextStyle(fontSize: 40)),
          const SizedBox(height: 12),
          const Text(
            '家庭计划',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '最多邀请$_maxMembers位家庭成员共享高级功能',
            style: TextStyle(
              fontSize: 13,
              color: Colors.white.withAlpha(153),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$_memberCount',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: YiShunTheme.goldPrimary,
                ),
              ),
              Text(
                ' / $_maxMembers 人',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white.withAlpha(128),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMembersHeader() {
    return Row(
      children: [
        const Icon(Icons.people, color: Colors.white70, size: 20),
        const SizedBox(width: 8),
        const Text(
          '家庭成员',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const Spacer(),
        if (_isLoading)
          const SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          ),
      ],
    );
  }

  Widget _buildMembersList() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withAlpha(25)),
      ),
      child: Column(
        children: _familyMembers.asMap().entries.map((entry) {
          final index = entry.key;
          final member = entry.value;
          return Column(
            children: [
              if (index > 0) const Divider(color: Colors.white24, height: 1),
              _buildMemberTile(member, index),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildMemberTile(Map<String, dynamic> member, int index) {
    final isOwner = member['isOwner'] == true;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: YiShunTheme.purpleMystic.withAlpha(51),
              borderRadius: BorderRadius.circular(22),
            ),
            child: Center(
              child: Text(
                (member['name'] as String).isNotEmpty
                    ? (member['name'] as String)[0]
                    : '?',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      member['name'] as String,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (isOwner) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: YiShunTheme.goldPrimary.withAlpha(51),
                          borderRadius: BorderRadius.circular(6),
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
                    color: Colors.white.withAlpha(102),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (!isOwner)
            IconButton(
              onPressed: () => _removeMember(index),
              icon: const Icon(Icons.remove_circle_outline, color: Colors.redAccent, size: 22),
            ),
        ],
      ),
    );
  }

  Widget _buildAddButton() {
    return SizedBox(
      height: 48,
      child: ElevatedButton.icon(
        onPressed: _addMember,
        style: ElevatedButton.styleFrom(
          backgroundColor: YiShunTheme.goldPrimary,
          foregroundColor: Colors.black,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        icon: const Icon(Icons.person_add, size: 20),
        label: const Text(
          '添加家庭成员',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
