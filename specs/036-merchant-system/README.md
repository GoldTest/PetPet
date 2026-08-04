---
status: in-progress
created: 2026-07-27
priority: medium
created_at: 2026-07-27T14:45:35.250827100Z
updated_at: 2026-08-02T12:03:02.638669500Z
---

# 商人系统：市场常驻商人（流浪商人延后）

> **Status**: in-progress · **Priority**: medium · **Created**: 2026-07-27 · **Updated**: 2026-08-02

## Overview

商人系统分为**常驻商人**与**流浪商人**两部分。本次实施范围：新增「市场」入口，市场内布置多个商人摊位（常驻商人 + 预留摊位），每个商人有独立 sprite，点击可对话交互；常驻商人出售**礼物、清洁用品、简易食物**三类物品。流浪商人（随机来访、稀有交易）**暂不实施**，延后评估。

市场交易系统（035 NPC 收购）未开始，市场内相关摊位先留空位。

## 核心设计

### 市场入口
- 新增「市场」入口按钮（FeatureRow），点击进入市场总览页面
- 总览页：市场大门场景背景 + 三个集市入口（古风集市 / 星语集市 / 霓虹夜市）
- 点击入口跳转对应集市页，每页独立场景背景 + 一位商人立绘

### 集市场景（三风格并存）
- 三个集市页面各有整幅 RPG 场景背景（现代网游环境美术风格，无人）：
  - 古风集市：红灯笼、木摊、旗幡（商人：花见·园艺，交易未开放）
  - 星语集市：帐篷、火把、石板路（商人：夜纱·神秘，交易未开放）
  - 霓虹夜市：灯牌摊位、串灯夜市（商人：珍妮·常驻，可交易）
- 商人立绘以绝对定位叠放于场景中（网游立绘风美女，6+ 头身，非像素），点击人物触发对话

### 常驻商人
- 常驻商人摊位可交互：点击弹出对话气泡 + 商品面板
- 出售分类（复用现有 `shopItems`，不新增物品）：
  - 礼物：`small_bouquet`、`shiny_sticker`、`soft_cloud_doll`、`ribbon_bell`、`toy_ball`、`picture_book`
  - 清洁用品：`shampoo`、`wet_wipes`、`vitamin_tablet`、`blanket`、`energy_drink`
  - 简易食物：`emergency_biscuit`（免费领取）、`bento`、`orange`、`apple`、`banana`、`strawberry_milk`
- 购买走现有 `buyItem` 流程（金币、免费饼干领取、购买成就计数均复用）
- 每日折扣与商店共享逻辑，不在常驻商人处重复展示

### 预留摊位
- 花见（古风集市）与夜纱（星语集市）可对话，但交易功能标注"暂未开放"
- 预留摊位展示：市场交易系统（035）、流浪商人（延后）、其他后续经济系统

### 商人 sprite
- 每人一张全身立绘 PNG（现代网游精致立绘风美女，6+ 头身，品红背景抠图，scripts/chroma_key.py）
- 每个集市一张场景背景 PNG（16:9 无人物）
- 总览页一张市场大门背景 PNG

## Requirements
- [x] 市场入口按钮（FeatureRow）
- [x] 市场总览页：大门场景 + 三风格集市入口（古风/星语/霓虹）
- [x] 三集市场景页：独立场景背景 + 商人立绘定位渲染
- [x] 常驻商人（珍妮·霓虹夜市）：礼物/清洁用品/简易食物出售（复用 buyItem）
- [x] 商人点击对话（speech bubble）
- [x] 预留商人（花见/夜纱，交易未开放提示）
- [x] 商人立绘（网游立绘风美女 6+ 头身，抠图）与场景背景
- [x] i18n 双语支持 (zh-CN + en-US)

## Non-Goals
- 不实施流浪商人（随机来访/稀有交易/以物易物）——延后，另行评估
- 不实施市场交易系统（035：每日 NPC 收购订单、价格波动、声望）
- 不新增物品定义（复用现有 shopItems）
- 不改动现有商店（ShopModal）

## Technical Notes
- 核心定义：`src/core/merchant.ts`（商人信息、对话、出售分类、集市区定义）
- UI：`src/ui/MarketPage.tsx`（总览入口 + 集市场景 + 对话 + 商品面板）
- 资产：`src/assets/market/`（gate 总览背景、district_* 三场景、merchant_* 三立绘）
- 购买复用 `buyItem`（src/core/petActions.ts），无新 PetState 字段
- 入口：`FeatureRow` 新增按钮 → App.tsx `activePage` 增加 'market'
- 对话文本支持 i18n，`pick()` 随机选句
