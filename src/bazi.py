# YiShun 八字排盘核心模块

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
    '甲': 2, '丙': 2, '戊': 2, '庚': 2, '壬': 2,  # 丙
    '乙': 3, '丁': 3, '己': 3, '辛': 3, '癸': 3,  # 丁
    '丙': 4, '戊': 4, '庚': 4, '壬': 4, '甲': 4,  # 戊
    '丁': 5, '己': 5, '辛': 5, '癸': 5, '乙': 5,  # 己
    '戊': 6, '庚': 6, '壬': 6, '甲': 6, '丙': 6,  # 庚
    '己': 7, '辛': 7, '癸': 7, '乙': 7, '丁': 7,  # 辛
    '庚': 8, '壬': 8, '甲': 8, '丙': 8, '戊': 8,  # 壬
    '辛': 9, '癸': 9, '乙': 9, '丁': 9, '己': 9   # 癸
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

def get_day_gan(day_gan_index: int) -> str:
    """根据日干索引获取天干"""
    return TIANGAN[day_gan_index % 10]

def get_day_zhi(hour: int) -> str:
    """获取时支"""
    zhi_index = (hour + 1) // 2 % 12
    return DIZHI[zhi_index]

def get_shichen_gan(day_gan: str, hour: int) -> str:
    """计算时干（五鼠遁）"""
    base_index = RI_GAN_INDEX.get(day_gan, 0)
    shi_zhi_index = (hour + 1) // 2 % 12
    gan_index = (base_index + shi_zhi_index) % 10
    return TIANGAN[gan_index]

def calc_bazi(year: int, month: int, day: int, hour: int, minute: int = 0) -> dict:
    """八字排盘主函数"""
    year_gan = get_year_gan(year)
    year_zhi = get_year_zhi(year)
    month_gan = get_month_gan(year_gan, month)
    month_zhi = DIZHI[(month - 1) % 12]
    
    # 日干需要基于日历计算，这里简化为占位
    day_gan = TIANGAN[(year * 10 + month * 30 + day) % 10]
    day_zhi = DIZHI[(year * 12 + month * 30 + day) % 12]
    
    hour_gan = get_shichen_gan(day_gan, hour)
    hour_zhi = get_day_zhi(hour)
    
    return {
        'year': {'gan': year_gan, 'zhi': year_zhi},
        'month': {'gan': month_gan, 'zhi': month_zhi},
        'day': {'gan': day_gan, 'zhi': day_zhi},
        'hour': {'gan': hour_gan, 'zhi': hour_zhi}
    }

if __name__ == '__main__':
    # 测试
    result = calc_bazi(1990, 8, 15, 10, 30)
    print(f"八字: {result['year']['gan']}{result['year']['zhi']} {result['month']['gan']}{result['month']['zhi']} {result['day']['gan']}{result['day']['zhi']} {result['hour']['gan']}{result['hour']['zhi']}")
