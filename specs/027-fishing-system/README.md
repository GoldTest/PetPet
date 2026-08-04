---
status: in-progress
created: 2026-07-27
priority: high
updated_at: 2026-08-04T13:53:00.000000000Z
---

# 钓鱼系统：水域休闲采集

## Overview

真实水域钓鱼体验——实时水体动画、拟真垂钓环境、丰富的鱼竿/鱼饵/鱼种生态、钓鱼技能升级制度。作为农业加工链的水线补充，为厨房提供蛋白质食材，同时打造沉浸式放松玩法。

## 核心架构

```
core/fishing.ts           ← 纯逻辑：鱼种定义、状态机、钓鱼计算、概率
core/fishing-actions.ts   ← 动作函数：castRod / reelIn / setBait / upgradeRod
core/items.ts             ← 新增鱼竿/鱼饵/鱼类物品
petTypes.ts / petState.ts ← PetState.fishing 子状态
ui/FishingPage.tsx        ← 实时水体+环境 UI
ui/app/useFishingController.ts ← Controller hook
styles/fishing.css        ← 水体动画/天气/季节主题
```

## 子 spec 关系
- 027a-fishing-core → 核心机制+水域+鱼种+状态机
- 027b-fishing-gear → 鱼竿/鱼饵/工具升级
- 027c-fishing-skill → 钓鱼技能Lv+QTE
- 027d-fishing-encyclopedia → 图鉴+收集
- 027e-fishing-economy → 厨房联动+经济

## Requirements
- [x] 核心钓鱼逻辑模块 `core/fishing.ts`（鱼种定义、概率、状态机、天气/季节修正）
- [x] PetState 扩展：`FishingState` + `FishingSlot` + 默认值 + normalize
- [x] 物品扩展：鱼竿(6级) + 鱼饵(5种) + 鱼(15+种) + 杂物
- [x] 钓鱼动作：`castFishingRod` / `reelInFish` / `selectRod` / `selectBait` / `changeBait`
- [x] 实时水体动画 UI：波纹/光斑/气泡/天气粒子/季节天空
- [x] 拟真环境：4个水域(池塘/河流/湖泊/深海) + 4时段 + 4天气 + 4季节
- [x] 钓鱼状态机：idle → casting → waiting → bitten → reeling → caught/jammed/lost
- [x] Controller hook + 页面集成
- [x] 导航入口 + 成就计数
- [x] i18n 双语 (zh-CN + en-US)
- [x] 全局快查表同步

## Non-Goals
- 不涉及宠物直接下水
- 不涉及 Mod 系统变更
- 不涉及物理引擎（用状态机+概率模拟）
- 不涉及多人竞技
- 不涉及 3D 渲染
