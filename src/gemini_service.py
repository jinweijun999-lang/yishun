# YiShun Gemini AI Fortune Service
# 使用 Google Gemini API 生成个性化运势分析

import os
import json
from typing import Optional

# 延迟导入，运行时检测
_genai_client = None

def _get_client():
    """延迟加载 google.genai Client"""
    global _genai_client
    if _genai_client is None:
        try:
            from google import genai
            api_key = os.environ.get('GOOGLE_API_KEY', '')
            if api_key:
                _genai_client = genai.Client(api_key=api_key)
            else:
                return None
        except ImportError:
            return None
    return _genai_client

# 获取 API key（从环境变量）
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')

def is_available() -> bool:
    """检查 Gemini 是否可用"""
    if not GOOGLE_API_KEY:
        return False
    client = _get_client()
    return client is not None

def generate_ai_fortune(bazi: dict, name: str = '', aspect: str = '综合') -> dict:
    """
    使用 Gemini AI 生成个性化运势分析
    
    Args:
        bazi: 八字数据字典
        name: 用户姓名（可选）
        aspect: 分析方面（综合/事业/爱情/财富/健康）
    
    Returns:
        包含完整运势分析结果的字典
    """
    client = _get_client()
    if client is None:
        return None  # 回退到本地算法
    
    try:
        year_pillar = f"{bazi['year']['gan']}{bazi['year']['zhi']}"
        month_pillar = f"{bazi['month']['gan']}{bazi['month']['zhi']}"
        day_pillar = f"{bazi['day']['gan']}{bazi['day']['zhi']}"
        hour_pillar = f"{bazi['hour']['gan']}{bazi['hour']['zhi']}"
        
        wuxing = bazi.get('五行统计', {})
        
        prompt = f"""你是专业的八字命理大师。请根据以下八字信息，提供专业的运势分析。

八字排盘：
- 年柱: {year_pillar}
- 月柱: {month_pillar}
- 日柱: {day_pillar}（日主）
- 时柱: {hour_pillar}

五行分布: {json.dumps(wuxing, ensure_ascii=False)}

分析方面: {aspect}
{f'姓名: {name}' if name else ''}

请以JSON格式返回以下字段（必须严格遵守格式，不要有额外文本）：
{{
  "fortune": "总运势描述（2-3句话）",
  "career": "事业运势（1-2句话）",
  "love": "感情运势（1-2句话）",
  "health": "健康运势（1-2句话）",
  "wealth": "财富运势（1-2句话）",
  "lucky_color": "幸运颜色",
  "lucky_number": 幸运数字,
  "lucky_direction": "幸运方向",
  "lucky_time": "幸运时间（如：上午9-11点）",
  "tips": ["建议1", "建议2", "建议3"],
  "compatibility": "最佳配对五行",
  "day_master": "日主五行",
  "day_strength": "日主强弱描述",
  "strong_element": "命中最旺五行",
  "weak_element": "命中最弱五行",
  "tiaohou": "调候用神建议"
}}

请用中文回复，只返回JSON，不要有其他文字。"""
        
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        
        # 解析 JSON 响应
        text = response.text.strip()
        # 尝试提取 JSON（可能包含在 markdown code block 中）
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            text = text.split('```')[1].split('```')[0]
        
        result = json.loads(text)
        result['source'] = 'gemini'
        return result
        
    except Exception as e:
        print(f"Gemini API error: {e}")
        return None


def generate_ai_bazi_description(bazi: dict, name: str = '') -> str:
    """
    使用 Gemini 生成八字命盘的专业描述
    """
    client = _get_client()
    if client is None:
        return None
    
    try:
        year_pillar = f"{bazi['year']['gan']}{bazi['year']['zhi']}"
        month_pillar = f"{bazi['month']['gan']}{bazi['month']['zhi']}"
        day_pillar = f"{bazi['day']['gan']}{bazi['day']['zhi']}"
        hour_pillar = f"{bazi['hour']['gan']}{bazi['hour']['zhi']}"
        
        wuxing = bazi.get('五行统计', {})
        shishen = bazi.get('十神', {})
        
        prompt = f"""你是专业的八字命理大师。请为以下八字提供专业的命盘解读。

八字：{year_pillar} {month_pillar} {day_pillar} {hour_pillar}
五行分布: {json.dumps(wuxing, ensure_ascii=False)}
十神: {json.dumps(shishen, ensure_ascii=False)}
{f'姓名: {name}' if name else ''}

请生成一段专业的命盘解读（200字以内），涵盖：
1. 命局特点
2. 性格倾向
3. 适合的发展方向

请用中文回复。"""
        
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        return response.text.strip()
        
    except Exception as e:
        print(f"Gemini description error: {e}")
        return None


if __name__ == '__main__':
    # 测试
    if is_available():
        print("✅ Gemini 可用")
        # 模拟八字数据测试
        test_bazi = {
            'year': {'gan': '甲', 'zhi': '辰', 'wuxing': '木'},
            'month': {'gan': '庚', 'zhi': '申', 'wuxing': '金'},
            'day': {'gan': '丙', 'zhi': '寅', 'wuxing': '火'},
            'hour': {'gan': '壬', 'zhi': '子', 'wuxing': '水'},
            '五行统计': {'木': 2, '金': 1, '火': 1, '水': 1, '土': 1},
            '十神': {'年柱': '偏印', '月柱': '七杀', '日柱': '日主', '时柱': '正官'}
        }
        result = generate_ai_fortune(test_bazi, aspect='综合')
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("❌ Gemini 不可用，请设置 GOOGLE_API_KEY 环境变量")