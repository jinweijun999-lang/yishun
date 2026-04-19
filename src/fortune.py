# YiShun 运势分析算法 V1.0

from bazi import calc_bazi, WUXING, TIANGAN, DIZHI

## 五行强度权重
WUXING_STRENGTH = {
    '木': {'生': '火', '克': '土', '被生': '水', '被克': '金'},
    '火': {'生': '土', '克': '金', '被生': '木', '被克': '水'},
    '土': {'生': '金', '克': '水', '被生': '火', '被克': '木'},
    '金': {'生': '水', '克': '木', '被生': '土', '被克': '火'},
    '水': {'生': '木', '克': '火', '被生': '金', '被克': '土'}
}

## 性格特征描述
WUXING_PERSONALITY = {
    '木': {
        '优点': ['仁慈', '善良', '有上进心', '正直', '有同情心'],
        '缺点': ['固执', '倔强', '易冲动'],
        '职业': ['教育', '出版', '文化', '艺术', '林业']
    },
    '火': {
        '优点': ['热情', '积极', '有活力', '有创造力', '果断'],
        '缺点': ['急躁', '易怒', '缺乏耐心'],
        '职业': ['餐饮', '娱乐', '演艺', '能源', '电器']
    },
    '土': {
        '优点': ['稳重', '踏实', '有耐心', '忠诚', '守信'],
        '缺点': ['保守', '固执', '缺乏变通'],
        '职业': ['房地产', '建筑', '农业', '仓储', '政府']
    },
    '金': {
        '优点': ['果断', '正义', '有领导力', '坚强', '自律'],
        '缺点': ['冷酷', '固执', '不近人情'],
        '职业': ['金融', '法律', '政治', '军事', '机械']
    },
    '水': {
        '优点': ['聪明', '灵活', '有智慧', '善良', '有包容心'],
        '缺点': ['易变', '优柔寡断', '缺乏主见'],
        '职业': ['贸易', '运输', '旅游', '咨询', 'IT']
    }
}

## 十神性格特征
SHISHEN_PERSONALITY = {
    '正官': {'正面': ['正直', '有责任心', '守法', '勤奋'], '负面': ['压力大', '死板']},
    '七杀': {'正面': ['有魄力', '果断', '勇于挑战'], '负面': ['冲动', '易惹是非']},
    '正印': {'正面': ['有爱心', '慈悲', '有福气'], '负面': ['依赖', '懒散']},
    '偏印': {'正面': ['聪明', '悟性高', '独立'], '负面': ['固执', '疑心重']},
    '正财': {'正面': ['务实', '勤劳', '会理财'], '负面': ['小气', '保守']},
    '偏财': {'正面': ['大方', '豪爽', '人缘好'], '负面': ['挥霍', '花心']},
    '食神': {'正面': ['温和', '有口福', '聪明'], '负面': ['软弱', '不争']},
    '伤官': {'正面': ['聪明', '有才华', '创新能力'], '负面': ['叛逆', '清高']},
    '比肩': {'正面': ['独立', '自信', '坚定'], '负面': ['固执', '自我']},
    '劫财': {'正面': ['热情', '豪爽', '讲义气'], '负面': ['冲动', '破财']
    }
}

## 运势等级
FORTUNE_LEVELS = {
    90: '⭐⭐⭐⭐⭐ 大吉',
    75: '⭐⭐⭐⭐ 吉',
    60: '⭐⭐⭐ 平',
    45: '⭐⭐ 略差',
    0: '⭐ 需注意'
}

def calc_wuxing_balance(wuxing_count: dict) -> dict:
    """计算五行平衡"""
    total = sum(wuxing_count.values())
    if total == 0:
        return {'balance_score': 0, 'strong': [], 'weak': [], '建议': []}
    
    # 计算各五行占比
    ratios = {k: v / total * 100 for k, v in wuxing_count.items()}
    
    # 判断强弱（占比 > 25% 为强，< 15% 为弱）
    strong = [k for k, v in ratios.items() if v > 25]
    weak = [k for k, v in ratios.items() if v < 15]
    
    # 平衡分数（越均衡越高）
    balance_score = 100 - sum(abs(v - 20) for v in ratios.values()) / 2
    
    # 建议
    suggestions = []
    for w in weak:
        # 弱什么补什么
        suggestions.append(f"{w}较弱，建议多接触{w}属性的事物")
    for w in strong:
        # 过强则泄
        sheng = WUXING_STRENGTH[w]['生']
        suggestions.append(f"{w}较强，宜多接触{sheng}属性的事物调和")
    
    return {
        'balance_score': round(balance_score, 1),
        'strong': strong,
        'weak': weak,
        '建议': suggestions
    }

def analyze_personality(bazi: dict) -> dict:
    """分析性格特征"""
    day_gan = bazi['day']['gan']
    day_wuxing = bazi['day']['wuxing']
    
    # 基础五行性格
    base_personality = WUXING_PERSONALITY.get(day_wuxing, {})
    
    # 十神影响
    shishen_influence = []
    for pos, info in bazi.get('十神', {}).items():
        if isinstance(info, str) and info in SHISHEN_PERSONALITY:
            shishen_influence.append({
                '位置': pos,
                '十神': info,
                '特征': SHISHEN_PERSONALITY[info]
            })
    
    return {
        '日主五行': day_wuxing,
        '基础性格': base_personality,
        '十神影响': shishen_influence
    }

def calc_fortune_score(bazi: dict, aspect: str = '综合') -> dict:
    """计算运势分数"""
    wuxing_count = bazi.get('五行统计', {})
    balance = calc_wuxing_balance(wuxing_count)
    
    # 基础分数 = 平衡分数
    base_score = balance['balance_score']
    
    # 十神加成/减分
    shishen_modifier = 0
    for pos, info in bazi.get('十神', {}).items():
        if isinstance(info, str):
            if info in ['正官', '正印', '正财', '食神']:
                shishen_modifier += 5  # 正向十神加分
            elif info in ['七杀', '偏印', '劫财']:
                shishen_modifier -= 5  # 偏性十神减分
    
    # 综合分数
    total_score = max(0, min(100, base_score + shishen_modifier))
    
    # 判断等级
    fortune_level = '⭐ 需注意'
    for threshold, level in FORTUNE_LEVELS.items():
        if total_score >= threshold:
            fortune_level = level
            break
    
    return {
        'aspect': aspect,
        'score': round(total_score, 1),
        'level': fortune_level,
        'balance': balance
    }

def generate_fortune_report(bazi: dict, name: str = '') -> str:
    """生成完整运势报告"""
    lines = []
    fortune = calc_fortune_score(bazi)
    personality = analyze_personality(bazi)
    balance = fortune['balance']
    
    lines.append("=" * 50)
    lines.append(f"🔮 {name} 运势分析报告" if name else "🔮 运势分析报告")
    lines.append("=" * 50)
    
    # 基础信息
    lines.append(f"\n📋 八字基础:")
    lines.append(f"   日主: {bazi['day']['gan']} ({bazi['day']['wuxing']})")
    lines.append(f"   日支: {bazi['day']['zhi']}")
    
    # 运势评分
    lines.append(f"\n📊 {fortune['aspect']}运势:")
    lines.append(f"   评分: {fortune['score']}分")
    lines.append(f"   等级: {fortune['level']}")
    
    # 五行平衡
    lines.append(f"\n⚖️ 五行平衡分析:")
    lines.append(f"   平衡度: {balance['balance_score']}分")
    if balance['strong']:
        lines.append(f"   偏强: {', '.join(balance['strong'])}")
    if balance['weak']:
        lines.append(f"   偏弱: {', '.join(balance['weak'])}")
    
    # 调理建议
    if balance['建议']:
        lines.append(f"\n💡 调理建议:")
        for suggestion in balance['建议']:
            lines.append(f"   • {suggestion}")
    
    # 性格分析
    lines.append(f"\n🧠 性格特点:")
    wx = personality['日主五行']
    if wx in WUXING_PERSONALITY:
        traits = WUXING_PERSONALITY[wx]
        lines.append(f"   优点: {', '.join(traits['优点'][:3])}")
        lines.append(f"   缺点: {', '.join(traits['缺点'][:2])}")
    
    # 十神影响
    if personality['十神影响']:
        lines.append(f"\n🔮 十神影响力:")
        for inf in personality['十神影响'][:3]:  # 只显示前3个
            pos = inf['位置']
            ss = inf['十神']
            traits = SHISHEN_PERSONALITY.get(ss, {})
            positive = ', '.join(traits.get('正面', [])[:2])
            lines.append(f"   {pos} {ss}: {positive}")
    
    lines.append("\n" + "=" * 50)
    return "\n".join(lines)

if __name__ == '__main__':
    # 测试运势分析
    print("测试运势分析:")
    bazi = calc_bazi(1990, 8, 15, 10, 30)
    print(generate_fortune_report(bazi, "测试用户"))
    
    print("\n" + "=" * 50)
    print("\n测试2:")
    bazi2 = calc_bazi(2000, 1, 1, 12, 0)
    print(generate_fortune_report(bazi2, "测试用户2"))