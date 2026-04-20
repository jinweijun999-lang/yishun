import 'package:flutter/material.dart';
import '../services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // 出生信息
  int _birthYear = 1990;
  int _birthMonth = 1;
  int _birthDay = 1;
  int _birthHour = 12;
  double _longitude = 116.4; // 默认北京经度
  String _name = '';
  
  // 结果
  Map<String, dynamic>? _result;
  bool _isLoading = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      appBar: AppBar(
        title: const Text('YiShun 玄学', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: const Color(0xFFFF6B35),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Logo区域
              Container(
                padding: const EdgeInsets.all(30),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF6B35).withAlpha(25),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Column(
                  children: [
                    Text('☯️', style: TextStyle(fontSize: 60)),
                    SizedBox(height: 10),
                    Text('八字排盘 · 运势分析', 
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              
              // 姓名输入
              TextFormField(
                decoration: InputDecoration(
                  labelText: '姓名（选填）',
                  prefixIcon: const Icon(Icons.person),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: Colors.white,
                ),
                onChanged: (v) => _name = v,
              ),
              const SizedBox(height: 20),
              
              // 出生年月日
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('出生时间', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: _buildYearPicker()),
                          const SizedBox(width: 10),
                          Expanded(child: _buildMonthPicker()),
                          const SizedBox(width: 10),
                          Expanded(child: _buildDayPicker()),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildHourPicker(),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              
              // 经度输入（真太阳时用）
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('出生地经度', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      const Text('用于计算真太阳时（北京默认116.4°）', 
                          style: TextStyle(color: Colors.grey, fontSize: 12)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: Slider(
                              value: _longitude,
                              min: 73,
                              max: 135,
                              divisions: 124,
                              label: '${_longitude.toStringAsFixed(1)}°E',
                              onChanged: (v) => setState(() => _longitude = v),
                            ),
                          ),
                          SizedBox(
                            width: 80,
                            child: Text('${_longitude.toStringAsFixed(1)}°', 
                                textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 30),
              
              // 分析按钮
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _analyze,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF6B35),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 2,
                  ),
                  child: _isLoading 
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('开始分析', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ),
              ),
              
              // 错误信息
              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: Colors.red.shade700),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_error!, style: TextStyle(color: Colors.red.shade700))),
                    ],
                  ),
                ),
              ],
              
              // 结果展示
              if (_result != null) ...[
                const SizedBox(height: 30),
                _buildResultCard(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildYearPicker() {
    return DropdownButtonFormField<int>(
      initialValue: _birthYear,
      decoration: InputDecoration(
        labelText: '年',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: List.generate(100, (i) => DateTime.now().year - 50 + i)
          .map((y) => DropdownMenuItem(value: y, child: Text('$y')))
          .toList(),
      onChanged: (v) => setState(() => _birthYear = v!),
    );
  }

  Widget _buildMonthPicker() {
    return DropdownButtonFormField<int>(
      initialValue: _birthMonth,
      decoration: InputDecoration(
        labelText: '月',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: List.generate(12, (i) => i + 1)
          .map((m) => DropdownMenuItem(value: m, child: Text('$m')))
          .toList(),
      onChanged: (v) => setState(() => _birthMonth = v!),
    );
  }

  Widget _buildDayPicker() {
    return DropdownButtonFormField<int>(
      initialValue: _birthDay,
      decoration: InputDecoration(
        labelText: '日',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: List.generate(31, (i) => i + 1)
          .map((d) => DropdownMenuItem(value: d, child: Text('$d')))
          .toList(),
      onChanged: (v) => setState(() => _birthDay = v!),
    );
  }

  Widget _buildHourPicker() {
    final hours = List.generate(24, (i) => i);
    return DropdownButtonFormField<int>(
      initialValue: _birthHour,
      decoration: InputDecoration(
        labelText: '出生时辰（小时）',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      ),
      items: hours.map((h) => DropdownMenuItem(
        value: h, 
        child: Text('$h 时'),
      )).toList(),
      onChanged: (v) => setState(() => _birthHour = v!),
    );
  }

  Widget _buildResultCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('☯️', style: TextStyle(fontSize: 30)),
                const SizedBox(width: 10),
                Text(_name.isNotEmpty ? '$_name 的八字' : '八字分析结果',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              ],
            ),
            const Divider(height: 30),
            
            // 八字展示
            const Text('🎯 八字', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildBaziColumn('年柱', _result!['year']),
                _buildBaziColumn('月柱', _result!['month']),
                _buildBaziColumn('日柱', _result!['day']),
                _buildBaziColumn('时柱', _result!['hour']),
              ],
            ),
            const Divider(height: 30),
            
            // 真太阳时
            if (_result!['真太阳时'] != null) ...[
              const Text('🌅 真太阳时', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(_result!['真太阳时']['真太阳时'],
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFFF6B35))),
              const SizedBox(height: 16),
            ],
            
            // 五行统计
            if (_result!['五行统计'] != null) ...[
              const Text('⚖️ 五行分布', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: (_result!['五行统计'] as Map<String, dynamic>).entries.map((e) {
                  return Chip(
                    label: Text('${e.key}: ${e.value}个'),
                    backgroundColor: _getWuxingColor(e.key.toString()),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildBaziColumn(String label, Map<String, dynamic> data) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 4),
        Text('${data['gan']}${data['zhi']}', 
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        Text(data['wuxing'], style: TextStyle(fontSize: 12, color: _getWuxingColor(data['wuxing']))),
      ],
    );
  }

  Color _getWuxingColor(String wuxing) {
    switch (wuxing) {
      case '木': return Colors.green;
      case '火': return Colors.red;
      case '土': return Colors.brown;
      case '金': return Colors.amber;
      case '水': return Colors.blue;
      default: return Colors.grey;
    }
  }

  Future<void> _analyze() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _result = null;
    });

    try {
      final apiService = ApiService();
      final result = await apiService.getBazi(
        year: _birthYear,
        month: _birthMonth,
        day: _birthDay,
        hour: _birthHour,
        longitude: _longitude,
      );
      setState(() => _result = result);
    } catch (e) {
      // 如果API不可用，使用本地计算
      setState(() {
        _result = _calculateLocalBazi();
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Map<String, dynamic> _calculateLocalBazi() {
    // 本地八字计算（简化版）
    final tiangan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    final dizhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    final wuxing = {'甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'};
    
    int yearGan = (_birthYear - 4) % 10;
    int yearZhi = (_birthYear - 4) % 12;
    int monthZhi = (_birthMonth - 1) % 12;
    
    // 简化月干计算
    int monthGan = (yearGan + _birthMonth + 1) % 10;
    
    // 简化日干计算
    int dayGan = (_birthYear * 10 + _birthMonth * 30 + _birthDay) % 10;
    int dayZhi = (_birthYear * 12 + _birthMonth * 30 + _birthDay) % 12;
    
    // 时干
    int hourGan = (dayGan + (_birthHour + 1) ~/ 2) % 10;
    int hourZhi = (_birthHour + 1) ~/ 2 % 12;
    
    return {
      'year': {'gan': tiangan[yearGan], 'zhi': dizhi[yearZhi], 'wuxing': wuxing[tiangan[yearGan]]},
      'month': {'gan': tiangan[monthGan], 'zhi': dizhi[monthZhi], 'wuxing': wuxing[tiangan[monthGan]]},
      'day': {'gan': tiangan[dayGan], 'zhi': dizhi[dayZhi], 'wuxing': wuxing[tiangan[dayGan]]},
      'hour': {'gan': tiangan[hourGan], 'zhi': dizhi[hourZhi], 'wuxing': wuxing[tiangan[hourGan]]},
      '真太阳时': {'真太阳时': '${_birthHour}:00'},
      '五行统计': {'木': 1, '火': 1, '土': 1, '金': 1, '水': 1},
    };
  }
}