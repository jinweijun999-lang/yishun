# YiShun 八字排盘核心模块 V2.0

import math
from datetime import datetime, timedelta

## 天干地支常量
TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

# 五行
WUXING = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
}

# 五行生克
WUXING_RELATIONS = {
    '生': {'木生火', '火生土', '土生金', '金生水', '水生木'},
    '克': {'木克土', '土克水', '水克火', '火克金', '金克木'}
}

# 日干推算表（甲子日起于甲己日子时）
RI_GAN_INDEX = {
    '甲': 0, '己': 0,
    '乙': 1, '庚': 1,
    '丙': 2, '辛': 2,
    '丁': 3, '壬': 3,
    '戊': 4, '癸': 4
}

# 月干推算表（年干起）
YUE_GAN_INDEX = {
    '甲': 2, '丙': 2, '戊': 2, '庚': 2, '壬': 2,
    '乙': 3, '丁': 3, '己': 3, '辛': 3, '癸': 3,
    '丙': 4, '戊': 4, '庚': 4, '壬': 4, '甲': 4,
    '丁': 5, '己': 5, '辛': 5, '癸': 5, '乙': 5,
    '戊': 6, '庚': 6, '壬': 6, '甲': 6, '丙': 6,
    '己': 7, '辛': 7, '癸': 7, '乙': 7, '丁': 7,
    '庚': 8, '壬': 8, '甲': 8, '丙': 8, '戊': 8,
    '辛': 9, '癸': 9, '乙': 9, '丁': 9, '己': 9
}

# 地支藏干（主气）
DIZHI_CANGGAN = {
    '子': '癸', '丑': '己', '寅': '甲', '卯': '乙',
    '辰': '戊', '巳': '丙', '午': '丁', '未': '己',
    '申': '庚', '酉': '辛', '戌': '戊', '亥': '壬'
}

# 十神定义（基于日干）
SHISHEN = {
    # 生我者为印
    ('甲', '壬'): '偏印', ('甲', '癸'): '正印',
    ('乙', '癸'): '偏印', ('乙', '壬'): '正印',
    ('丙', '甲'): '偏印', ('丙', '乙'): '正印',
    ('丁', '乙'): '偏印', ('丁', '甲'): '正印',
    ('戊', '丙'): '偏印', ('戊', '丁'): '正印',
    ('己', '丁'): '偏印', ('己', '丙'): '正印',
    ('庚', '戊'): '偏印', ('庚', '己'): '正印',
    ('辛', '己'): '偏印', ('辛', '戊'): '正印',
    ('壬', '庚'): '偏印', ('壬', '辛'): '正印',
    ('癸', '辛'): '偏印', ('癸', '庚'): '正印',
    # 同我者为比劫
    ('甲', '甲'): '比肩', ('甲', '乙'): '劫财',
    ('乙', '乙'): '比肩', ('乙', '甲'): '劫财',
    ('丙', '丙'): '比肩', ('丙', '丁'): '劫财',
    ('丁', '丁'): '比肩', ('丁', '丙'): '劫财',
    ('戊', '戊'): '比肩', ('戊', '己'): '劫财',
    ('己', '己'): '比肩', ('己', '戊'): '劫财',
    ('庚', '庚'): '比肩', ('庚', '辛'): '劫财',
    ('辛', '辛'): '比肩', ('辛', '庚'): '劫财',
    ('壬', '壬'): '比肩', ('壬', '癸'): '劫财',
    ('癸', '癸'): '比肩', ('癸', '壬'): '劫财',
    # 我生者为食伤
    ('甲', '丙'): '食神', ('甲', '丁'): '伤官',
    ('乙', '丁'): '食神', ('乙', '丙'): '伤官',
    ('丙', '戊'): '食神', ('丙', '己'): '伤官',
    ('丁', '己'): '食神', ('丁', '戊'): '伤官',
    ('戊', '庚'): '食神', ('戊', '辛'): '伤官',
    ('己', '辛'): '食神', ('己', '庚'): '伤官',
    ('庚', '壬'): '食神', ('庚', '癸'): '伤官',
    ('辛', '癸'): '食神', ('辛', '壬'): '伤官',
    ('壬', '甲'): '食神', ('壬', '乙'): '伤官',
    ('癸', '乙'): '食神', ('癸', '甲'): '伤官',
    # 我克者为财
    ('甲', '戊'): '偏财', ('甲', '己'): '正财',
    ('乙', '己'): '偏财', ('乙', '戊'): '正财',
    ('丙', '庚'): '偏财', ('丙', '辛'): '正财',
    ('丁', '辛'): '偏财', ('丁', '庚'): '正财',
    ('戊', '壬'): '偏财', ('戊', '癸'): '正财',
    ('己', '癸'): '偏财', ('己', '壬'): '正财',
    ('庚', '甲'): '偏财', ('庚', '乙'): '正财',
    ('辛', '乙'): '偏财', ('辛', '甲'): '正财',
    ('壬', '丙'): '偏财', ('壬', '丁'): '正财',
    ('癸', '丁'): '偏财', ('癸', '丙'): '正财',
    # 克我者为官杀
    ('甲', '庚'): '七杀', ('甲', '辛'): '正官',
    ('乙', '辛'): '七杀', ('乙', '庚'): '正官',
    ('丙', '壬'): '七杀', ('丙', '癸'): '正官',
    ('丁', '癸'): '七杀', ('丁', '壬'): '正官',
    ('戊', '甲'): '七杀', ('戊', '乙'): '正官',
    ('己', '乙'): '七杀', ('己', '甲'): '正官',
    ('庚', '丙'): '七杀', ('庚', '丁'): '正官',
    ('辛', '丁'): '七杀', ('辛', '丙'): '正官',
    ('壬', '戊'): '七杀', ('壬', '己'): '正官',
    ('癸', '己'): '七杀', ('癸', '戊'): '正官',
}

def get_year_gan(year: int) -> str:
    """计算年干"""
    gan_index = (year - 4) % 10
    return TIANGAN[gan_index]

def get_year_zhi(year: int) -> str:
    """计算年支"""
    zhi_index = (year - 4) % 12
    return DIZHI[zhi_index]

def get_month_gan(year_gan: str, month: int) -> str:
    """计算月干（五虎遁）"""
    base_gan = YUE_GAN_INDEX.get(year_gan, 2)
    gan_index = (base_gan + month - 1) % 10
    return TIANGAN[gan_index]

def get_day_gan_index(year: int, month: int, day: int) -> int:
    """计算日干索引（基于儒略日）"""
    # 简化计算：使用已知基准日（2020-01-01 = 庚子日，日干索引6）
    base_date = datetime(2020, 1, 1)
    target_date = datetime(year, month, day)
    days_diff = (target_date - base_date).days
    # 庚子日索引为6（癸庚辛壬癸...循环）
    return (6 + days_diff) % 10

def get_day_zhi_index(year: int, month: int, day: int) -> int:
    """计算日支索引"""
    base_date = datetime(2020, 1, 1)
    target_date = datetime(year, month, day)
    days_diff = (target_date - base_date).days
    # 子日索引为0
    return (days_diff) % 12

def get_shichen_gan(day_gan: str, hour: int) -> str:
    """计算时干（五鼠遁）"""
    base_index = RI_GAN_INDEX.get(day_gan, 0)
    shi_zhi_index = (hour + 1) // 2 % 12
    gan_index = (base_index + shi_zhi_index) % 10
    return TIANGAN[gan_index]

def get_day_zhi(hour: int) -> str:
    """获取时支"""
    zhi_index = (hour + 1) // 2 % 12
    return DIZHI[zhi_index]

def calc_equation_of_time(date: datetime) -> float:
    """
    计算时差（分钟）
    真太阳时与平太阳时之间的差值
    """
    # 简化计算：基于日期的一年中的位置
    day_of_year = date.timetuple().tm_yday
    
    # 时差近似值（度）
    B = 2 * math.pi * (day_of_year - 81) / 365
    EOT = 9.87 * math.sin(2 * B) - 7.53 * math.cos(B) - 1.5 * math.sin(B)
    return EOT

def calc_longitude_correction(longitude: float, timezone_offset: float) -> float:
    """
    计算经度修正（分钟）
    每偏离时区中心经度1度，时间差4分钟
    """
    # 时区中心经度（如北京时区中心为120°E）
    timezone_center = 120.0  # 东八区
    return (timezone_center - longitude) * 4

def true_solar_time(year: int, month: int, day: int, hour: int, minute: int,
                    longitude: float = 116.4, timezone_offset: float = 8) -> dict:
    """
    计算真太阳时
    
    参数:
        year, month, day, hour, minute: 出生时间（北京时间）
        longitude: 经度（默认北京116.4°）
        timezone_offset: 时区偏移（默认东八区+8）
    
    返回:
        平太阳时、时差、经度修正、真太阳时
    """
    local_time = datetime(year, month, day, hour, minute)
    
    # 时差计算
    eot = calc_equation_of_time(local_time)
    
    # 经度修正
    lon_correction = calc_longitude_correction(longitude, timezone_offset)
    
    # 真太阳时 = 北京时间 + 时差 + 经度修正
    true_solar_minutes = hour * 60 + minute + eot + lon_correction
    
    # 转换回小时和分钟
    true_hour = int(true_solar_minutes // 60) % 24
    true_minute = int(true_solar_minutes % 60)
    
    return {
        '北京时间': f"{hour:02d}:{minute:02d}",
        '时差(分钟)': round(eot, 2),
        '经度修正(分钟)': round(lon_correction, 2),
        '真太阳时': f"{true_hour:02d}:{true_minute:02d}",
        '真太阳时小时': true_hour,
        '真太阳时分钟': true_minute
    }

def get_shichen(zhi: str) -> str:
    """时支转时辰名称"""
    shichen_map = {
        '子': '子时(23-1)', '丑': '丑时(1-3)', '寅': '寅时(3-5)', '卯': '卯时(5-7)',
        '辰': '辰时(7-9)', '巳': '巳时(9-11)', '午': '午时(11-13)', '未': '未时(13-15)',
        '申': '申时(15-17)', '酉': '酉时(17-19)', '戌': '戌时(19-21)', '亥': '亥时(21-23)'
    }
    return shichen_map.get(zhi, zhi)

def calc_bazi(year: int, month: int, day: int, hour: int, minute: int = 0,
              longitude: float = 116.4) -> dict:
    """八字排盘主函数（含真太阳时）"""
    
    # 计算真太阳时
    true_solar = true_solar_time(year, month, day, hour, minute, longitude)
    true_hour = true_solar['真太阳时小时']
    
    # 年干支
    year_gan = get_year_gan(year)
    year_zhi = get_year_zhi(year)
    
    # 月干支
    month_gan = get_month_gan(year_gan, month)
    month_zhi = DIZHI[(month - 1) % 12]
    
    # 日干支
    day_gan_index = get_day_gan_index(year, month, day)
    day_zhi_index = get_day_zhi_index(year, month, day)
    day_gan = TIANGAN[day_gan_index]
    day_zhi = DIZHI[day_zhi_index]
    
    # 时干支
    hour_gan = get_shichen_gan(day_gan, true_hour)
    hour_zhi = get_day_zhi(true_hour)
    
    # 构建八字
    bazi = {
        'year': {'gan': year_gan, 'zhi': year_zhi, 'wuxing': WUXING[year_gan]},
        'month': {'gan': month_gan, 'zhi': month_zhi, 'wuxing': WUXING[month_gan]},
        'day': {'gan': day_gan, 'zhi': day_zhi, 'wuxing': WUXING[day_gan]},
        'hour': {'gan': hour_gan, 'zhi': hour_zhi, 'wuxing': WUXING[hour_gan]}
    }
    
    # 十神分析（日干为基准）
    day_gan_char = bazi['day']['gan']
    bazi['十神'] = {
        '年柱': get_shichen_relation(day_gan_char, bazi['year']['gan']),
        '月柱': get_shichen_relation(day_gan_char, bazi['month']['gan']),
        '日柱': {'天干': '日主', '地支主气': get_shichen_relation(day_gan_char, DIZHI_CANGGAN.get(bazi['day']['zhi'], ''))},
        '时柱': get_shichen_relation(day_gan_char, bazi['hour']['gan'])
    }
    
    # 五行统计
    wuxing_count = {}
    for pos in ['year', 'month', 'day', 'hour']:
        wx = bazi[pos]['wuxing']
        wuxing_count[wx] = wuxing_count.get(wx, 0) + 1
    
    bazi['五行统计'] = wuxing_count
    
    # 真太阳时信息
    bazi['真太阳时'] = true_solar
    
    return bazi

def get_shichen_relation(day_gan: str, other_gan: str) -> str:
    """获取十神关系"""
    return SHISHEN.get((day_gan, other_gan), '')

def format_bazi_report(bazi: dict) -> str:
    """格式化八字报告"""
    lines = []
    lines.append("=" * 50)
    lines.append("📜 八字排盘报告")
    lines.append("=" * 50)
    lines.append(f"\n🌅 真太阳时信息:")
    solar = bazi['真太阳时']
    lines.append(f"   北京时间: {solar['北京时间']}")
    lines.append(f"   时差: {solar['时差(分钟)']} 分钟")
    lines.append(f"   经度修正: {solar['经度修正(分钟)']} 分钟")
    lines.append(f"   真太阳时: {solar['真太阳时']}")
    
    lines.append(f"\n🎯 八字:")
    lines.append(f"   年柱: {bazi['year']['gan']}{bazi['year']['zhi']} ({bazi['year']['wuxing']})")
    lines.append(f"   月柱: {bazi['month']['gan']}{bazi['month']['zhi']} ({bazi['month']['wuxing']})")
    lines.append(f"   日柱: {bazi['day']['gan']}{bazi['day']['zhi']} ({bazi['day']['wuxing']}) [日主]")
    lines.append(f"   时柱: {bazi['hour']['gan']}{bazi['hour']['zhi']} ({bazi['hour']['wuxing']})")
    
    lines.append(f"\n🔮 十神分析:")
    for col, info in bazi['十神'].items():
        if isinstance(info, dict):
            lines.append(f"   {col}: {info}")
        else:
            lines.append(f"   {col}: {info}")
    
    lines.append(f"\n⚖️ 五行统计:")
    for wx, count in bazi['五行统计'].items():
        lines.append(f"   {wx}: {count}个")
    
    lines.append("\n" + "=" * 50)
    return "\n".join(lines)

if __name__ == '__main__':
    # 测试
    print("测试1: 1990年8月15日 10:30 北京")
    result = calc_bazi(1990, 8, 15, 10, 30, longitude=116.4)
    print(format_bazi_report(result))
    
    print("\n" + "=" * 50)
    print("\n测试2: 2000年1月1日 12:00 北京")
    result2 = calc_bazi(2000, 1, 1, 12, 0, longitude=116.4)
    print(format_bazi_report(result2))