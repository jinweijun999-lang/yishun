import 'package:flutter/material.dart';
import '../utils/theme.dart';

/// 十神图鉴 - Ten Gods Guide Page
/// 独立的十神说明页，用户可随时查阅
class TenGodsGuidePage extends StatelessWidget {
  const TenGodsGuidePage({super.key});

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
                    const Text(
                      '十神图鉴',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Introduction
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(13),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withAlpha(25)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Text('☯️', style: TextStyle(fontSize: 20)),
                              SizedBox(width: 8),
                              Text(
                                '什么是十神？',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '十神是以日主为中心，根据天干之间的生克关系推算出来的十种关系符号。'
                            '它们代表不同的社会关系、性格特质和人生运势。',
                            style: TextStyle(
                              color: Colors.white.withAlpha(179),
                              fontSize: 13,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Ten Gods List
                    ...TenGodInfo.allGods.map((god) => _buildTenGodCard(god)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTenGodCard(TenGodInfo god) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(13),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: god.color.withAlpha(76)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: god.color.withAlpha(51),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: god.color.withAlpha(128)),
                ),
                child: Center(
                  child: Text(
                    god.symbol,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: god.color,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      god.name,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: god.color,
                      ),
                    ),
                    Text(
                      '${god.yinYang} · ${god.wuxing}行',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withAlpha(153),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: god.color.withAlpha(51),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  god.category,
                  style: TextStyle(fontSize: 11, color: god.color),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Basic Description
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: god.color.withAlpha(25),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              god.basicDesc,
              style: TextStyle(
                color: Colors.white.withAlpha(204),
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Metaphor (比喻辅助)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.people, size: 16, color: god.color),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '现实比喻',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: god.color,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      god.metaphor,
                      style: TextStyle(
                        color: Colors.white.withAlpha(179),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Personality Traits
          Row(
            children: [
              Icon(Icons.psychology, size: 16, color: god.color),
              const SizedBox(width: 8),
              Text(
                '性格特点',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: god.color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: god.personalityTraits.map((trait) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(13),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  trait,
                  style: const TextStyle(fontSize: 11, color: Colors.white70),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),

          // Career/Life Impact
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.work, size: 16, color: god.color),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '事业/财运影响',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: god.color,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      god.careerImpact,
                      style: TextStyle(
                        color: Colors.white.withAlpha(179),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Love Impact
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.favorite, size: 16, color: god.color),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '感情/人际关系',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: god.color,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      god.loveImpact,
                      style: TextStyle(
                        color: Colors.white.withAlpha(179),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// 十神数据模型
class TenGodInfo {
  final String name;
  final String symbol;
  final String yinYang;
  final String wuxing;
  final String category; // 同性/异性
  final Color color;
  final String basicDesc;
  final String metaphor;
  final List<String> personalityTraits;
  final String careerImpact;
  final String loveImpact;

  const TenGodInfo({
    required this.name,
    required this.symbol,
    required this.yinYang,
    required this.wuxing,
    required this.category,
    required this.color,
    required this.basicDesc,
    required this.metaphor,
    required this.personalityTraits,
    required this.careerImpact,
    required this.loveImpact,
  });

  static const List<TenGodInfo> allGods = [
    TenGodInfo(
      name: '比肩',
      symbol: '比',
      yinYang: '阳',
      wuxing: '木',
      category: '同我',
      color: YiShunTheme.wuXingWood,
      basicDesc: '比肩是与日主相同五行的阳性干，代表兄弟姐妹、同事朋友、合作伙伴。表示独立、自信、竞争的关系。',
      metaphor: '如同兄弟姐妹之间的关系，平等互助但也可能产生竞争。比肩旺的人通常自尊心强，喜欢独自承担责任。',
      personalityTraits: ['独立自主', '自尊心强', '有竞争意识', '重友情', '固执己见'],
      careerImpact: '适合独立创业或自由职业，能在团队中扮演核心角色，但需注意与他人合作时避免过于强势。',
      loveImpact: '在感情中倾向于平等伙伴关系，不喜欢依赖对方，但也可能因为过于独立而让伴侣感到疏离。',
    ),
    TenGodInfo(
      name: '劫财',
      symbol: '劫',
      yinYang: '阴',
      wuxing: '木',
      category: '异我',
      color: YiShunTheme.wuXingWood,
      basicDesc: '劫财是与日主相同五行的阴性干，代表异性兄弟姐妹、竞争者、合作伙伴。表示竞争、破财、果断的关系。',
      metaphor: '如同竞争激烈的商业伙伴，既是合作伙伴又是竞争对手。劫财旺的人敢于冒险，但也容易冲动破财。',
      personalityTraits: ['敢于冒险', '果断决绝', '有赌性', '竞争心强', '易冲动'],
      careerImpact: '适合投资、销售、金融等高风险高回报领域，需注意财务管理和风险控制。',
      loveImpact: '在感情中容易出现争夺，或因竞争心态影响关系稳定，需学会妥协和包容。',
    ),
    TenGodInfo(
      name: '食神',
      symbol: '食',
      yinYang: '阳',
      wuxing: '火',
      category: '泄我',
      color: YiShunTheme.wuXingFire,
      basicDesc: '食神是日主所生的阳性干，代表表达、创意、吃喝享乐。表示才华流露、温和友善的关系。',
      metaphor: '如同艺术家将内心情感通过作品表达出来。食神旺的人通常才华横溢、温和有礼、懂得享受生活。',
      personalityTraits: ['才华横溢', '温和友善', '善于表达', '重生活质量', '有时懒散'],
      careerImpact: '适合教育、设计、餐饮、艺术创作等领域，能通过专业技能获得认可和财富。',
      loveImpact: '在感情中温柔体贴，善于营造浪漫氛围，能让伴侣感受到生活的美好和情趣。',
    ),
    TenGodInfo(
      name: '伤官',
      symbol: '伤',
      yinYang: '阴',
      wuxing: '火',
      category: '异泄',
      color: YiShunTheme.wuXingFire,
      basicDesc: '伤官是日主所生的阴性干，代表才华、叛逆、口才、伤病。表示才华出众但易招是非的关系。',
      metaphor: '如同直言不讳的谏臣，才华横溢但锋芒太露容易得罪人。伤官旺的人聪明过人但言语犀利。',
      personalityTraits: ['聪明过人', '口才犀利', '叛逆创新', '爱表现', '有时尖酸刻薄'],
      careerImpact: '适合需要创意和口才的工作，如律师、主持人、自媒体等，但需注意人际关系的处理。',
      loveImpact: '在感情中敢说敢做，有时言语过于直接容易伤害伴侣，需学会委婉表达情感。',
    ),
    TenGodInfo(
      name: '偏财',
      symbol: '偏',
      yinYang: '阳',
      wuxing: '金',
      category: '我克',
      color: const Color(0xFF8D6E63),
      basicDesc: '偏财是日主所克阳性干，代表意外之财、投资、投机、情人。表示财务流动、慷慨大方的关系。',
      metaphor: '如同突然而来的横财，可能一夜暴富也可能一夜破产。偏财旺的人善于理财，敢于投资。',
      personalityTraits: ['善于理财', '慷慨大方', '敢于投资', '交际广阔', '有时挥霍'],
      careerImpact: '适合投资理财、商务谈判、销售等与金钱打交道的工作，财运较好但波动也大。',
      loveImpact: '在感情中浪漫大方，愿意为伴侣花钱，但有时过于风流招桃花，需注意分寸。',
    ),
    TenGodInfo(
      name: '正财',
      symbol: '正',
      yinYang: '阴',
      wuxing: '金',
      category: '我克',
      color: YiShunTheme.wuXingEarth,
      basicDesc: '正财是日主所克阴性干，代表正当收入、理财、妻子（男性）。表示稳定务实、诚信的关系。',
      metaphor: '如同稳定的工作收入或婚姻中的妻子，代表踏实可靠的生活基础。正财旺的人勤俭持家。',
      personalityTraits: ['勤俭持家', '踏实务实', '诚信正直', '量入为出', '有时吝啬'],
      careerImpact: '适合财务会计、稳定职业或传统行业，通过努力工作和合理理财积累财富。',
      loveImpact: '在感情中忠诚专一，是理想的结婚对象，但有时过于保守缺乏浪漫情趣。',
    ),
    TenGodInfo(
      name: '七杀',
      symbol: '杀',
      yinYang: '阴',
      wuxing: '水',
      category: '克我',
      color: YiShunTheme.wuXingFire,
      basicDesc: '七杀是克日主阴性干，代表挑战、压力、权威、小人。表示严苛激烈、果断勇敢的关系。',
      metaphor: '如同严苛的上司或强大的对手，给你巨大压力但也逼你成长。七杀旺的人能扛住压力。',
      personalityTraits: ['果断勇敢', '有魄力', '抗压能力强', '要求严格', '有时冷酷'],
      careerImpact: '适合需要魄力和决断力的管理工作，如管理岗位、公检法、军警等，能成为领导者。',
      loveImpact: '在感情中倾向于主导地位，有时给对方压力大，但能承担家庭责任，是可靠的依靠。',
    ),
    TenGodInfo(
      name: '正官',
      symbol: '官',
      yinYang: '阳',
      wuxing: '金',
      category: '克我',
      color: YiShunTheme.wuXingWater,
      basicDesc: '正官是克日主阳性干，代表地位、权力、约束、丈夫（女性）。表示正当名望、正直守法。',
      metaphor: '如同循规蹈矩的领导或合法的权威，代表社会认可和正当秩序。正官旺的人遵纪守法。',
      personalityTraits: ['正直守法', '有责任心', '注重名誉', '循规蹈矩', '有时刻板'],
      careerImpact: '适合公务员、法律、政府机构等稳定职业，能通过正当途径获得社会地位和晋升。',
      loveImpact: '在感情中负责任顾家，是典型的模范伴侣，但有时过于注重形式而缺乏情趣。',
    ),
    TenGodInfo(
      name: '偏印',
      symbol: '偏',
      yinYang: '阴',
      wuxing: '水',
      category: '生我',
      color: const Color(0xFF9E9E9E),
      basicDesc: '偏印是生日主阴性干，代表独创、思考、继母、偏门学术。表示独特思考、孤独但有智慧。',
      metaphor: '如同独来独往的学者，不走寻常路却自有一套。偏印旺的人善于独立思考，擅长偏门学问。',
      personalityTraits: ['独立思考', '有独特见解', '擅长偏门', '有时孤僻', '洞察力强'],
      careerImpact: '适合研究开发、策划设计、玄学命理等需要独特思维的领域，能在专业上有突破。',
      loveImpact: '在感情中较内敛，不善于表达情感，有时给人冷漠感，但一旦认定会很专一。',
    ),
    TenGodInfo(
      name: '正印',
      symbol: '印',
      yinYang: '阳',
      wuxing: '土',
      category: '生我',
      color: YiShunTheme.wuXingMetal,
      basicDesc: '正印是生日主阳性干，代表学业、智慧、母亲、庇护。表示善良仁慈、贵人相助。',
      metaphor: '如同慈祥的母亲给予无条件的爱和支持，代表贵人运和学业成就。正印旺的人心地善良。',
      personalityTraits: ['心地善良', '有爱心', '学业优秀', '贵人运好', '有时过于仁慈'],
      careerImpact: '适合教育、学术、医疗等需要爱心和专业的领域，能得到师长和上级的赏识和提拔。',
      loveImpact: '在感情中给予伴侣充分的包容和支持，是理想的倾听者和陪伴者，但有时过于付出而失去自我。',
    ),
  ];
}

/// 十神详解弹窗
class TenGodDetailDialog extends StatelessWidget {
  final String shishenName;

  const TenGodDetailDialog({super.key, required this.shishenName});

  @override
  Widget build(BuildContext context) {
    final god = TenGodInfo.allGods.firstWhere(
      (g) => g.name == shishenName,
      orElse: () => TenGodInfo.allGods.first,
    );

    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400),
        decoration: BoxDecoration(
          color: YiShunTheme.backgroundDark,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: god.color.withAlpha(128)),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: god.color.withAlpha(51),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        god.symbol,
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: god.color,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          god.name,
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: god.color,
                          ),
                        ),
                        Text(
                          '${god.yinYang} · ${god.wuxing}行 · ${god.category}',
                          style: const TextStyle(fontSize: 12, color: Colors.white54),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: Colors.white54),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Basic Description
              Text(
                god.basicDesc,
                style: TextStyle(
                  color: Colors.white.withAlpha(204),
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 16),

              // Metaphor
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: god.color.withAlpha(25),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('💡', style: TextStyle(fontSize: 16)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        god.metaphor,
                        style: TextStyle(
                          color: Colors.white.withAlpha(204),
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Traits
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: god.personalityTraits.map((trait) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: god.color.withAlpha(38),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      trait,
                      style: TextStyle(fontSize: 12, color: god.color),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // Career & Love
              _buildImpactSection('💼 事业影响', god.careerImpact, god.color),
              const SizedBox(height: 12),
              _buildImpactSection('💕 感情影响', god.loveImpact, god.color),
              const SizedBox(height: 16),

              // Close Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: god.color.withAlpha(51),
                    foregroundColor: god.color,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('关闭'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImpactSection(String title, String content, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          content,
          style: TextStyle(
            color: Colors.white.withAlpha(179),
            fontSize: 12,
            height: 1.4,
          ),
        ),
      ],
    );
  }
}

/// 获取十神颜色
Color getTenGodsColor(String shishen) {
  switch (shishen) {
    case '比肩':
    case '劫财':
      return YiShunTheme.wuXingWood;
    case '食神':
    case '伤官':
      return YiShunTheme.wuXingFire;
    case '正财':
      return YiShunTheme.wuXingEarth;
    case '偏财':
      return const Color(0xFF8D6E63);
    case '正官':
      return YiShunTheme.wuXingWater;
    case '偏官':
    case '七杀':
      return YiShunTheme.wuXingFire;
    case '正印':
      return YiShunTheme.wuXingMetal;
    case '偏印':
      return const Color(0xFF9E9E9E);
    default:
      return Colors.grey;
  }
}
