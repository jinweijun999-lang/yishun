# YiShun 合盘分析算法 V1.0

"""
八字合盘分析（合婚/合作）
评估两人八字配合度
"""

from bazi import calc_bazi, WUXING, TIANGAN, DIZHI
from fortune import WUXING_PERSONALITY

# 合婚评分标准
HEPING_SCORE = {
    ('木', '木'): 70, ('木', '火'): 90, ('木', '土'): 50, ('木', '金'): 40, ('木', '水'): 80,
    ('火', '木'): 90, ('火', '火'): 60, ('火', '土'): 85, ('火', '金'): 45, ('火', '水'): 70,
    ('土', '木'): 50, ('土', '火'): 85, ('土', '土'): 60, ('土', '金'): 90, ('土', '水'): 55,
    ('金', '木'): 40, ('金', '火'): 45, ('金', '土'): 90, ('金', '金'): 60, ('金', '水'): 85,
    ('水', '木'): 80, ('水', '火'): 70, ('水', '土'): 55, ('水', '金'): 85, ('水', '水'): 65
}

# 六亲关系
LIUQIN = {
    '正官': '女命丈夫/男命女儿', '七杀': '女命情人/男命儿子',
    '正印': '女命母亲/男命母亲', '偏印': '女命继母/男命继母',
    '正财': '男命妻子/女命父亲', '偏财': '男命妾/女命母亲',
    '食神': '女命儿子/男命孙女', '伤官': '女命女儿/男命孙子',
    '比肩': '兄弟姐妹', '劫财': '异性兄弟姐妹'
}

# 生肖配对吉凶
SHENGXIAO_PAI = {
    ('鼠', '牛'): 85, ('鼠', '龙'): 90, ('鼠', '猴'): 75,
    ('牛', '鼠'): 85, ('牛', '蛇'): 90, ('牛', '鸡'): 85,
    ('虎', '猪'): 90, ('虎', '马'): 85, ('虎', '狗'): 90,
    ('兔', '羊'): 90, ('兔', '猪'): 85, ('兔', '狗'): 75,
    ('龙', '猴'): 90, ('龙', '鼠'): 90, ('龙', '鸡'): 85,
    ('蛇', '牛'): 90, ('蛇', '鸡'): 85, ('蛇', '猴'): 75,
    ('马', '虎'): 85, ('马', '狗'): 90, ('马', '羊'): 85,
    ('羊', '兔'): 90, ('羊', '马'): 85, ('羊', '猪'): 75,
    ('猴', '龙'): 90, ('猴', '鼠'): 75, ('猴', '蛇'): 65,
    ('鸡', '牛'): 85, ('鸡', '蛇'): 85, ('鸡', '龙'): 85,
    ('狗', '虎'): 90, ('狗', '马'): 90, ('狗', '兔'): 75,
    ('猪', '虎'): 90, ('猪', '兔'): 85, ('猪', '羊'): 75
}

def get_zodiac(year: int) -> str:
    """获取生肖"""
    zodiac_list = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
    return zodiac_list[(year - 1900) % 12]

def get_shengan(zhi: str) -> str:
    """获取地支藏干"""
    zanggan = {
        '子': '癸', '丑': '己癸辛', '寅': '甲丙戊', '卯': '乙',
        '辰': '戊乙癸', '巳': '丙庚戊', '午': '丁己', '未': '己丁乙',
        '申': '庚壬戊', '酉': '辛', '戌': '戊辛丁', '亥': '壬甲'
    }
    return zanggan.get(zhi, '')

def calc_wuxing_heping(w1: str, w2: str) -> dict:
    """计算五行合评"""
    score = HEPING_SCORE.get((w1, w2), HEPING_SCORE.get((w2, w1), 60))
    
    # 生克关系
    if w1 == w2:
        relation = '同命相连'
    elif (w1 == '木' and w2 == '火') or (w1 == '火' and w2 == '木'):
        relation = '木火相生'
    elif (w1 == '土' and w2 == '金') or (w1 == '金' and w2 == '土'):
        relation = '土金相生'
    elif (w1 == '水' and w2 == '木') or (w1 == '木' and w2 == '水'):
        relation = '水木相生'
    elif (w1 == '火' and w2 == '土') or (w1 == '土' and w2 == '火'):
        relation = '火土相生'
    elif (w1 == '金' and w2 == '水') or (w1 == '水' and w2 == '金'):
        relation = '金水相生'
    elif (w1 == '木' and w2 == '土') or (w1 == '土' and w2 == '木'):
        relation = '木克土'
    elif (w1 == '火' and w2 == '金') or (w1 == '金' and w2 == '火'):
        relation = '火克金'
    elif (w1 == '土' and w2 == '水') or (w1 == '水' and w2 == '土'):
        relation = '土克水'
    elif (w1 == '金' and w2 == '木') or (w1 == '木' and w2 == '金'):
        relation = '金克木'
    elif (w1 == '水' and w2 == '火') or (w1 == '火' and w2 == '水'):
        relation = '水克火'
    else:
        relation = '关系一般'
    
    return {'score': score, 'relation': relation}

def analyze_hepan(
    person1: dict,  # {'name': str, 'year': int, 'month': int, 'day': int, 'hour': int}
    person2: dict   # {'name': str, 'year': int, 'month': int, 'day': int, 'hour': int}
) -> dict:
    """合盘分析主函数"""
    # 计算八字
    bazi1 = calc_bazi(person1['year'], person1['month'], person1['day'], person1['hour'])
    bazi2 = calc_bazi(person2['year'], person2['month'], person2['day'], person2['hour'])
    
    # 生肖
    zodiac1 = get_zodiac(person1['year'])
    zodiac2 = get_zodiac(person2['year'])
    
    # 日干五行
    day_wuxing1 = WUXING[bazi1['day']['gan']]
    day_wuxing2 = WUXING[bazi2['day']['gan']]
    
    # 五行合评
    wuxing_result = calc_wuxing_heping(day_wuxing1, day_wuxing2)
    
    # 生肖配对
    shengxiao_score = SHENGXIAO_PAI.get((zodiac1, zodiac2), SHENGXIAO_PAI.get((zodiac2, zodiac1), 60))
    
    # 综合评分
    total_score = (wuxing_result['score'] * 0.5 + shengxiao_score * 0.5)
    
    # 评级
    if total_score >= 85:
        rating = '⭐⭐⭐⭐⭐ 极佳'
    elif total_score >= 75:
        rating = '⭐⭐⭐⭐ 优良'
    elif total_score >= 65:
        rating = '⭐⭐⭐ 一般'
    elif total_score >= 55:
        rating = '⭐⭐ 较差'
    else:
        rating = '⭐ 不宜'
    
    return {
        'person1': {
            'name': person1['name'],
            'bazi': bazi1,
            'zodiac': zodiac1,
            'day_wuxing': day_wuxing1
        },
        'person2': {
            'name': person2['name'],
            'bazi': bazi2,
            'zodiac': zodiac2,
            'day_wuxing': day_wuxing2
        },
        'wuxing_heping': wuxing_result,
        'shengxiao_score': shengxiao_score,
        'total_score': round(total_score, 1),
        'rating': rating
    }

def generate_hepan_report(person1: dict, person2: dict) -> str:
    """生成合盘报告"""
    result = analyze_hepan(person1, person2)
    
    p1 = result['person1']
    p2 = result['person2']
    
    bazi1_str = f"{p1['bazi']['year']['gan']}{p1['bazi']['year']['zhi']} {p1['bazi']['month']['gan']}{p1['bazi']['month']['zhi']} {p1['bazi']['day']['gan']}{p1['bazi']['day']['zhi']} {p1['bazi']['hour']['gan']}{p1['bazi']['hour']['zhi']}"
    bazi2_str = f"{p2['bazi']['year']['gan']}{p2['bazi']['year']['zhi']} {p2['bazi']['month']['gan']}{p2['bazi']['month']['zhi']} {p2['bazi']['day']['gan']}{p2['bazi']['day']['zhi']} {p2['bazi']['hour']['gan']}{p2['bazi']['hour']['zhi']}"
    
    report = f"""
💑 YiShun 合盘分析报告
{'='*30}

👤 {p1['name']} | {p1['zodiac']}年生 | {p1['day_wuxing']}命
🧮 八字：{bazi1_str}

👤 {p2['name']} | {p2['zodiac']}年生 | {p2['day_wuxing']}命
🧮 八字：{bazi2_str}

{'='*30}
📊 合盘评分

🌟 五行配合：{result['wuxing_heping']['relation']} | {result['wuxing_heping']['score']}分
🐾 生肖配合：{p1['zodiac']}+{p2['zodiac']} | {result['shengxiao_score']}分

💯 综合评分：{result['total_score']}分
🏆 评级：{result['rating']}

{'='*30}
📝 详细分析
"""
    
    if result['total_score'] >= 85:
        report += """
✨ **极佳配合**
两人五行相生相助，性格互补，运势相互促进。
感情深厚，沟通顺畅，适合长久相伴。
"""
    elif result['total_score'] >= 75:
        report += """
👍 **优良配合**
两人虽有差异但能互补，相处融洽。
需要适度包容对方不足。
"""
    elif result['total_score'] >= 65:
        report += """
➖ **一般配合**
两人各有特点，需要多沟通理解。
建议多关注对方需求。
"""
    else:
        report += """
⚠️ **需谨慎**
两人命理存在冲突，需要更多磨合。
建议深入了解后再做决定。
"""
    
    return report

if __name__ == '__main__':
    # 测试：1990年男 vs 1992年女
    print(generate_hepan_report(
        {'name': '小明', 'year': 1990, 'month': 8, 'day': 15, 'hour': 10},
        {'name': '小红', 'year': 1992, 'month': 3, 'day': 20, 'hour': 14}
    ))
