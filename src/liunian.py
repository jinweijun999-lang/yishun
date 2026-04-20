# YiShun 流年运势算法 V1.0

"""
流年运势分析
包含：流年、大运、小限
"""

from bazi import TIANGAN, DIZHI, WUXING

# 起大运岁数（根据阴历男阳女）
START_DAYUN_AGE = {
    '阳男': 8, '阴男': 9, '阳女': 9, '阴女': 8
}

# 流年地支对应年龄（从出生年开始算）
ZHI_TO_AGE = {
    0: '子', 1: '丑', 2: '寅', 3: '卯',
    4: '辰', 5: '巳', 6: '午', 7: '未',
    8: '申', 9: '酉', 10: '戌', 11: '亥'
}

# 流年吉凶（天干+地支组合）
LIUNIAN_JIXIONG = {
    ('甲子', '海中金'): '吉', ('甲子', '炉中火'): '平',
    ('乙丑', '海中金'): '平', ('乙丑', '炉中火'): '凶',
    ('丙寅', '炉中火'): '吉', ('丙寅', '大林木'): '吉',
    ('丁卯', '炉中火'): '平', ('丁卯', '大林木'): '平',
    ('戊辰', '大林木'): '吉', ('戊辰', '路旁土'): '平',
    ('己巳', '大林木'): '平', ('己巳', '路旁土'): '凶',
    ('庚午', '路旁土'): '吉', ('庚午', '剑锋金'): '吉',
    ('辛未', '路旁土'): '平', ('辛未', '剑锋金'): '凶',
    ('壬申', '剑锋金'): '吉', ('壬申', '石榴木'): '吉',
    ('癸酉', '剑锋金'): '平', ('癸酉', '石榴木'): '平',
    ('甲戌', '石榴木'): '吉', ('甲戌', '大海水'): '凶',
    ('乙亥', '石榴木'): '平', ('乙亥', '大海水'): '平',
}

def get_ganzhi_year(year: int) -> tuple:
    """计算年柱干支"""
    gan = TIANGAN[(year - 4) % 10]
    zhi = DIZHI[(year - 4) % 12]
    return f"{gan}{zhi}", gan, zhi

def get_nayin(ganzhi: str) -> str:
    """计算纳音五行"""
    # 简化版纳音
    ganzhi_list = [
        '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
        '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
        '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
        '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸丑',
        '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
        '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'
    ]
    # 纳音对照表
    nayin_map = [
        '海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木', '路旁土', '路旁土', '剑锋金', '剑锋金',
        '石榴木', '石榴木', '大海水', '大海水', '城墙土', '城墙土', '白蜡金', '白蜡金', '杨柳木', '杨柳木',
        '井泉水', '井泉水', '沙中土', '沙中土', '天上火', '天上火', '山下火', '山下火', '平地木', '平地木',
        '壁上土', '壁上土', '金箔金', '金箔金', '覆灯火', '覆灯火', '砂石金', '砂石金', '山下火', '山下火',
        '城头土', '城头土', '路傍土', '路傍土', '屋上土', '屋上土', '涧下水', '涧下水', '大溪水', '大溪水',
        '砂中土', '砂中土', '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水'
    ]
    for i, gz in enumerate(ganzhi_list):
        if gz == ganzhi:
            return nayin_map[i]
    return '未知'

def calc_liucheng(birth_year: int, birth_month: int, birth_day: int, target_year: int) -> dict:
    """计算流年运势"""
    age = target_year - birth_year
    
    # 出生年柱
    birth_ganzhi, birth_gan, birth_zhi = get_ganzhi_year(birth_year)
    
    # 流年干支
    liunian_ganzhi, liunian_gan, liunian_zhi = get_ganzhi_year(target_year)
    nayin = get_nayin(liunian_ganzhi)
    
    # 流年五行
    liunian_wuxing = WUXING.get(liunian_gan, '')
    
    # 基本判断
    birth_wuxing = WUXING.get(birth_gan, '')
    
    # 流年与年支的关系
    gan_zhi_key = (liunian_ganzhi, nayin)
    jixiong = LIUNIAN_JIXIONG.get(gan_zhi_key, '平')
    
    # 简单吉凶判断
    if jixiong == '平':
        # 根据五行生克判断
        if liunian_wuxing == birth_wuxing:
            jixiong = '平'
        elif liunian_wuxing == '水' and birth_wuxing in ['火', '土', '金', '木']:
            jixiong = '吉'
        else:
            jixiong = '平'
    
    return {
        'age': age,
        'liunian': liunian_ganzhi,
        'nayin': nayin,
        'wuxing': liunian_wuxing,
        'jixiong': jixiong
    }

def analyze_liunian_detail(birth_year: int, birth_month: int, birth_day: int, target_year: int) -> str:
    """生成流年详细分析"""
    result = calc_liucheng(birth_year, birth_month, birth_day, target_year)
    
    report = f"""
🌟 {target_year}年 流年运势
{'='*25}

📅 年龄：{result['age']}岁
🧮 流年：{result['liunian']}
💫 纳音：{result['nayin']}
⚡ 五行：{result['wuxing']}
🔮 吉凶：{result['jixiong']}

"""
    
    # 流年特征
    if result['jixiong'] == '吉':
        report += f"""
✨ 总体评价：吉年
💰 财运：有机会，适宜投资理财
💼 事业：有望升职加薪或创业
❤️ 感情：感情运势不错
📚 学习：学习运较好
"""
    elif result['jixiong'] == '凶':
        report += f"""
⚠️ 总体评价：需谨慎
💰 财运：不宜大额投资，保守为主
💼 事业：可能有小人或阻碍
❤️ 感情：需多沟通理解
📚 学习：学习较吃力
"""
    else:
        report += f"""
➖ 总体评价：平稳
💰 财运：收支平衡，稳扎稳打
💼 事业：平稳发展，暂无大变动
❤️ 感情：平淡是真
📚 学习：正常发挥
"""
    
    return report

def generate_10_liunian(birth_year: int, birth_month: int, birth_day: int, start_year: int = 2026) -> str:
    """生成10年流年运势"""
    report = f"""
🏮 YiShun 十年流年运势
{'='*30}

出生年份：{birth_year}年
"""
    
    for i in range(10):
        year = start_year + i
        result = calc_liucheng(birth_year, birth_month, birth_day, year)
        emoji = '🟢' if result['jixiong'] == '吉' else ('🔴' if result['jixiong'] == '凶' else '🟡')
        report += f"""
{emoji} {year}年 | {result['liunian']} | {result['jixiong']} | {result['wuxing']} | {result['age']}岁
"""
    
    return report

if __name__ == '__main__':
    # 测试：1990年出生，2026年运势
    print(analyze_liunian_detail(1990, 8, 15, 2026))
    print('---')
    print(generate_10_liunian(1990, 8, 15, 2026))
