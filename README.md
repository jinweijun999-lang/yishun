# YiShun 玄学出海App

## 项目状态

| 模块 | 状态 | 说明 |
|------|------|------|
| Git仓库 + CI/CD | ✅ 完成 | 已配置GitHub Actions自动部署 |
| 八字排盘算法 | ✅ 完成 | bazi.py - 含真太阳时、十神分析 |
| 运势分析算法 | ✅ 完成 | fortune.py - 五行平衡、性格分析 |
| Flutter App | ⏳ 待安装 | Flutter未安装，需配置开发环境 |
| 后端API | 🔄 规划中 | 待设计 |

## 已完成功能

### 后端算法 (src/)

#### bazi.py - 八字排盘核心
- ✅ 天干地支计算
- ✅ 五虎遁（月干）
- ✅ 五鼠遁（时干）
- ✅ 真太阳时计算（经度修正 + 时差）
- ✅ 十神分析（基于日干）
- ✅ 地支藏干
- ✅ 五行统计

#### fortune.py - 运势分析
- ✅ 五行平衡计算
- ✅ 性格特征分析
- ✅ 十神影响力分析
- ✅ 调理建议生成
- ✅ 运势评分系统

### 底层逻辑知识
- ✅ 真太阳时计算原理
- ✅ 五行生克关系
- ✅ 十神含义详解（正官、七杀、正印、偏印、正财、偏财、食神、伤官、比肩、劫财）

## 待完成任务

### 1. Flutter环境配置
- [ ] 安装Flutter SDK
- [ ] 配置iOS/Android开发环境
- [ ] 创建App项目结构

### 2. App界面开发
- [ ] 首页 - 八字输入
- [ ] 八字结果显示页
- [ ] 运势分析详情页
- [ ] 个人中心

### 3. 后端API
- [ ] API架构设计
- [ ] 数据库设计
- [ ] 部署配置

### 4. 高级功能
- [ ] 流年运势
- [ ] 合盘分析
- [ ] 商城功能（玄学增强运势产品）

## 技术栈

- **后端**: Python (八字算法、运势分析)
- **前端**: Flutter
- **部署**: GitHub Actions → VPS
- **域名**: 11263.com

## 快速测试

```bash
cd ~/Downloads/A股策略交易/yishun-app/src

# 测试八字排盘
python3 bazi.py

# 测试运势分析
python3 fortune.py
```

## Git提交记录

```
4b15b3a feat: 真太阳时计算 + 十神分析算法 V2.0
31d9b2a feat: 运势分析算法 V1.0 - 五行平衡+性格+十神
311ed95 feat: 八字排盘核心算法初始版本
a94b56e Add CI/CD workflow for YiShun deployment
255ecb0 Update to YiShun brand
65aa9a4 Initial commit - Stellari 玄学出海App
```

---

**最后更新**: 2026-04-20
**进度**: ~25%
**阻塞**: Flutter SDK未安装
