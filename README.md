# YiShun 玄学出海App

## 项目状态

| 模块 | 状态 | 说明 |
|------|------|------|
| Git仓库 + CI/CD | ✅ 完成 | 已配置GitHub Actions自动部署 |
| 八字排盘算法 | ✅ 完成 | bazi.py - 含真太阳时、十神分析 |
| 运势分析算法 | ✅ 完成 | fortune.py - 五行平衡、性格分析 |
| Flutter App界面 | ✅ 完成 | lib/ - 可离线本地计算 |
| 后端API | 🔄 规划中 | 待设计 + 部署 |
| iOS构建 | ⏳ 需Xcode | Xcode未安装，无法打包iOS |

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

### Flutter App (lib/)

#### main.dart
- ✅ 入口 + 主题配置（橙色主题）

#### screens/home_screen.dart
- ✅ 八字输入表单（姓名、年月日时、经度）
- ✅ 本地计算fallback（API不可用时）
- ✅ 结果展示（八字、五行分布）
- ✅ Material Design 3界面

#### services/api_service.dart
- ✅ API客户端封装
- ✅ 八字排盘API调用
- ✅ 运势分析API调用

### 底层逻辑知识
- ✅ 真太阳时计算原理
- ✅ 五行生克关系
- ✅ 十神含义详解（正官、七杀、正印、偏印、正财、偏财、食神、伤官、比肩、劫财）

## 待完成任务

### 1. iOS开发环境配置
- [ ] 安装Xcode（阻塞）
- [ ] 安装CocoaPods
- [ ] iOS真机/模拟器测试

### 2. 后端API
- [ ] API架构设计（FastAPI/Flask）
- [ ] 数据库设计（八字数据、用户数据）
- [ ] 服务器部署（CI/CD自动部署）
- [ ] 域名解析（api.11263.com）

### 3. App增强
- [ ] 运势分析详情页
- [ ] 流年运势
- [ ] 合盘分析
- [ ] 用户登录/数据存储

### 4. 商城功能
- [ ] 玄学增强运势产品
- [ ] 支付集成
- [ ] 订单管理

## 技术栈

- **后端**: Python (八字算法、运势分析)
- **前端**: Flutter 3.41.7
- **部署**: GitHub Actions → VPS
- **域名**: 11263.com

## 快速测试

```bash
cd ~/Downloads/A股策略交易/yishun-app

# 测试八字排盘（后端）
python3 src/bazi.py

# 测试运势分析（后端）
python3 src/fortune.py

# Flutter分析代码
export PATH="/opt/homebrew/bin:$HOME/flutter/bin:$PATH"
flutter analyze
```

## Git提交记录

```
3677d9a feat: Flutter App界面 + 八字输入 + 本地计算 fallback
64d3d59 docs: 更新项目状态和待办清单
4b15b3a feat: 真太阳时计算 + 十神分析算法 V2.0
31d9b2a feat: 运势分析算法 V1.0 - 五行平衡+性格+十神
311ed95 feat: 八字排盘核心算法初始版本
a94b56e Add CI/CD workflow for YiShun deployment
255ecb0 Update to YiShun brand
65aa9a4 Initial commit - Stellari 玄学出海App
```

## 进度概览

```
已完成: ✅✅✅✅🔄⏳⏳⏳
进度约: 35-40%
```

---

**最后更新**: 2026-04-20
**阻塞**: Xcode未安装
# YiShun - 玄学出海
# Updated
