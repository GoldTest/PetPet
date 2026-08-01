---
status: complete
created: 2026-07-26
priority: high
parent: 018-agricultural-processing-chain
created_at: 2026-07-26T15:29:31.994555100Z
updated_at: 2026-08-01T16:01:00.902246500Z
completed_at: 2026-08-01T16:01:00.902246500Z
transitions:
- status: complete
  at: 2026-08-01T16:01:00.902246500Z
---

# 菜园：游戏化种植体验

## Overview

菜园重设计为「游戏化种菜体验」：三排大地块（每排 36 格 = 108 格小格子），删除 12 格解锁机制，所有格子默认即土地形态。核心是界面美观度与操作手感——成片绿地、作物摇曳、点击收获的即时反馈。

## 核心设计

### 地块系统
- 布局：3 排 × 36 格 = 108 格，删除旧 12 格 6 列布局
- 所有格子默认可用（删除 `unlocked` 解锁机制）
- 每格状态：土地(empty) → 生长中(growing) → 成熟(ready) → 收获后回土地
- 无枯萎机制，一次种植一次收获

### 作物种类（保留）
6 种作物不变：番茄/胡萝卜/卷心菜/洋葱/土豆/辣椒，生长 10-30 分钟，季节加成（当季 0.8 倍），土豆 dropCount 2，其余 1

### 种子袋
- 商店按袋出售：1 袋 = 9 颗种子，90 金币（9 × 单颗 10 金）
- 库存按颗计，播种 1 格消耗 1 颗
- 实现：物品定义加 `packSize: 9`，`buyItem` 支持批量购买
- 收获 30% 概率返 1 颗种子（保留）

### 玩家操作
| 操作 | 效果 | 限制 |
|------|------|------|
| 播种 | 播种模式下点击/拖动连续播种 | 每格 1 颗种子，可混种 |
| 浇水 | 水壶模式点击格子，-8% 剩余时间 | 每格每日 1 次，20% 掉 garden_token |
| 收获 | 点击成熟格，获得产物 + 浮字动画 | 收获后回土地 |

## Requirements
- [x] 3 排 × 36 格布局，删除解锁机制，数据 schema v2 迁移
- [x] 6 种作物定义保留，单次收获（删除多次收获/枯萎）
- [x] 种子袋：物品 `packSize: 9` + `buyItem` 批量购买（90 金/袋）
- [x] 播种模式：点击 + 拖动连续播种，可混种
- [x] 水壶模式：逐格浇水（每日每格一次）
- [x] 收获：点击成熟格 + `+N` 浮字动画
- [x] 视觉：土地形态默认、成片绿地、作物 sway 摇曳动画（slotIndex 派生随机延迟）
- [x] 菜园页面 UI 重写（三排田埂地块、工具模式工具栏、种子选择条）
- [x] i18n 双语支持更新

## Non-Goals
- 不修改树园逻辑
- 不做枯萎/清除/施肥机制
- 不做整排/一键浇水
- 不引入新作物或新物品类型（种子袋用 packSize 实现）
- 不涉及厨房逻辑

## Technical Notes
- 复用 `advanceVegGarden()` 模式与季节加成逻辑
- 独立 `vegetableGarden.ts` 模块，不与 `garden.ts` 耦合
- `VegetableSlot` 类型简化：删除 `unlocked/harvestsUsed/maxHarvests`（或保留字段做兼容迁移）
- UI 重写 `VegetableGardenPage.tsx`：工具模式状态机（idle/planting/watering）
- CSS 摇曳动画：`@keyframes sway`，每格 `animation-delay` 用 slotIndex 哈希派生
- 收获浮字：轻量绝对定位动画元素
