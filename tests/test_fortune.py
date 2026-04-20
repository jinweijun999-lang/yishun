"""YiShun运势分析测试用例"""
import unittest
import sys
sys.path.insert(0, 'src')
from fortune import WUXING, WUXING_PERSONALITY, calc_wuxing_balance, calc_fortune_score
from bazi import WUXING as BAZI_WUXING

class TestFortuneAnalyzer(unittest.TestCase):
    
    def test_wuxing_constants(self):
        """测试五行常量 - WUXING是天干到五行的映射"""
        self.assertEqual(BAZI_WUXING['甲'], '木')
        self.assertEqual(BAZI_WUXING['丙'], '火')  
    
    def test_wuxing_personalities(self):
        """测试五行性格特征"""
        self.assertIn('优点', WUXING_PERSONALITY['木'])
        self.assertIn('缺点', WUXING_PERSONALITY['木'])
        self.assertIn('职业', WUXING_PERSONALITY['木'])
    
    def test_wuxing_balance(self):
        """测试五行平衡计算"""
        wuxing_count = {'木': 2, '火': 1, '土': 1, '金': 1, '水': 1}
        result = calc_wuxing_balance(wuxing_count)
        self.assertIsInstance(result, dict)
        self.assertIn('balance_score', result)
    
    def test_fortune_score(self):
        """测试运势评分"""
        bazi = {
            'year': {'gan': '甲', 'zhi': '子'},
            'month': {'gan': '丙', 'zhi': '寅'},
            'day': {'gan': '戊', 'zhi': '辰'},
            'hour': {'gan': '庚', 'zhi': '午'}
        }
        # 需要添加wuxing字段
        for key in bazi:
            bazi[key]['wuxing'] = BAZI_WUXING[bazi[key]['gan']]
        
        result = calc_fortune_score(bazi)
        self.assertIsInstance(result, dict)

if __name__ == '__main__':
    unittest.main()
