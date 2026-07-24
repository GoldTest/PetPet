---
status: complete
created: 2026-07-24
priority: high
tags:
- lookup
- tables
- ai
- refactor
created_at: 2026-07-24T09:50:35.834577200Z
updated_at: 2026-07-24T10:12:01.927958400Z
completed_at: 2026-07-24T10:12:01.927958400Z
transitions:
- status: in-progress
  at: 2026-07-24T09:53:56.914227400Z
- status: complete
  at: 2026-07-24T10:12:01.927958400Z
---

# 快查表统一化

> **Status**: planned · **Priority**: high · **Created**: 2026-07-24

## Overview

当前游戏事件/状态/物品/天气/季节/动作分散在多个文件中（`petEvents.ts`、`petTypes.ts`、`items.ts`、`weather.ts`、`season.ts`、`petActions.ts`），AI 难以快速定位全局数据。

新建 `src/core/lookups/` 目录，存放 6 张快查表，将杂乱数据统一为结构化 JSON/TS 常量表，供 AI 读写。表格式为纯数据，无需人类可读性优化。

## Design

- 位置：`src/core/lookups/`，每张表独立文件
- 格式：TypeScript `as const` 数组或 Record，纯数据，无逻辑，无 UI 导入
- 数据来源：从现有代码抽取并去重，不改变原有运行时行为
- 每张表包含：ID、名称/标签、数值、描述、来源文件引用
- 后续可通过 harnspec 子 spec 逐步迁移消费方

## Tables

### 1. status.ts — 状态表

从 `petTypes.ts:PetStatus`、`petState.ts:getPrimaryStatus()` 抽取。

```ts
export const STATUS_TABLE = [
  { id: 'content', label: ' contentment', thresholds: { happiness: 60 }, effects: [], triggers: [] },
  { id: 'hungry', label: '饥饿', thresholds: { hunger: 30 }, effects: [{ stat: 'happiness', delta: -1 }], triggers: ['feed'] },
  { id: 'sad', label: '悲伤', thresholds: { happiness: 30 }, effects: [{ stat: 'hunger', delta: -2 }], triggers: ['play', 'gift'] },
  { id: 'dirty', label: '肮脏', thresholds: { cleanliness: 30 }, effects: [{ stat: 'happiness', delta: -1 }], triggers: ['clean'] },
  { id: 'tired', label: '疲倦', thresholds: { energy: 20 }, effects: [{ stat: 'happiness', delta: -1 }], triggers: ['sleep'] },
  { id: 'sick', label: '生病', thresholds: { health: 20 }, effects: [{ stat: 'happiness', delta: -3 }, { stat: 'health', delta: -1 }], triggers: ['medicine'] },
  { id: 'sleeping', label: '睡眠中', thresholds: {}, effects: [{ stat: 'energy', delta: 5 }], triggers: [] },
] as const;
```

### 2. events.ts — 事件表

从 `petEvents.ts`（DailyEncounter、TimedEvent、离线事件、梦境事件）、`petCommon.ts`（健康意外）、`achievements.ts` 抽取。

```ts
export const EVENT_TABLE = [
  // Daily encounters
  { id: 'encounter_morning', type: 'daily_encounter', label: '晨间问候', weight: 1, effects: { happiness: 3 }, conditions: { time: 'morning' } },
  // ... 所有 7+ daily encounters
  // Offline events
  { id: 'offline_dream', type: 'offline', label: '做了好梦', weight: 2, effects: { energy: 10, happiness: 2 } },
  // ...
  // Dream events
  { id: 'dream_flying', type: 'dream', label: '飞翔梦', weight: 1, effects: { happiness: 5 } },
  // ...
] as const;
```

### 3. items.json — 物品表

从 `items.ts`（shopItems、specialItems、inventoryItems）抽取。

```json
[
  { "id": "pig_trotter", "name": "猪蹄", "category": "food", "price": 88, "effects": { "hunger": 30, "happiness": 5 }, "tags": ["favorite"] },
  { "id": "strawberry_cake", "name": "草莓蛋糕", "category": "food", "price": 128, "effects": { "hunger": 25, "happiness": 15 }, "tags": ["favorite", "gift"] },
  ...
]
```

### 4. weather.json — 天气表

从 `weather.ts`（weatherInfo、weatherTypes）抽取。

```json
[
  { "id": "sunny", "label": "晴天", "effects": { "work_gold_bonus": 0, "play_happiness_bonus": 2, "clean_cost_reduction": 0 } },
  { "id": "cloudy", "label": "多云", "effects": { "work_gold_bonus": 0, "play_happiness_bonus": 0, "clean_cost_reduction": 2 } },
  { "id": "rainy", "label": "雨天", "effects": { "work_gold_bonus": -5, "play_happiness_bonus": -2, "clean_cost_reduction": 5 } },
  { "id": "breezy", "label": "微风", "effects": { "work_gold_bonus": 3, "play_happiness_bonus": 1, "clean_cost_reduction": 0 } }
]
```

### 5. season.json — 季节表

从 `season.ts`（getSeasonInfo、修饰函数）抽取。

```json
[
  { "id": "spring", "label": "春天", "months": [3,4,5], "effects": { "happiness_decay": 0.8, "cleanliness_decay": 1.0, "work_gold_bonus": 1.0, "energy_recovery": 1.0 } },
  { "id": "summer", "label": "夏天", "months": [6,7,8], "effects": { "happiness_decay": 1.2, "cleanliness_decay": 1.5, "work_gold_bonus": 1.0, "energy_recovery": 0.8 } },
  { "id": "autumn", "label": "秋天", "months": [9,10,11], "effects": { "happiness_decay": 1.0, "cleanliness_decay": 0.8, "work_gold_bonus": 1.2, "energy_recovery": 1.0 } },
  { "id": "winter", "label": "冬天", "months": [12,1,2], "effects": { "happiness_decay": 1.0, "cleanliness_decay": 0.8, "work_gold_bonus": 0.8, "energy_recovery": 1.2 } }
]
```

### 6. actions.ts — 可操作事件表

从 `petActions.ts`（applyPetAction、interactWithPet 等）、`petTypes.ts:CareActionKey` 抽取。

```ts
export const ACTION_TABLE = [
  { id: 'play', label: '玩耍', category: 'care', effects: { happiness: 10, cleanliness: -5, energy: -8 }, cooldown: 0 },
  { id: 'clean', label: '清洁', category: 'care', effects: { cleanliness: 25, energy: -5 }, cooldown: 0, weather_bonus: 'rainy' },
  { id: 'feed', label: '喂食', category: 'care', effects: { hunger: 20 }, cooldown: 0 },
  { id: 'work', label: '工作', category: 'care', effects: { gold: 15, energy: -15, happiness: -3 }, cooldown: 0, weather_bonus: 'breezy' },
  { id: 'sleep', label: '睡眠', category: 'care', effects: { energy: 40, hunger: -5 }, cooldown: 0 },
  { id: 'gift', label: '送礼', category: 'care', effects: { happiness: 8 }, cooldown: 0 },
  { id: 'touch', label: '抚摸', category: 'interact', effects: { happiness: 3 }, cooldown: 30000 },
  { id: 'medicine', label: '喂药', category: 'care', effects: { health: 20 }, cooldown: 0 },
  // Inventory actions
  { id: 'use_item', label: '使用物品', category: 'inventory', effects: 'dynamic' },
  { id: 'buy_item', label: '购买物品', category: 'shop', effects: 'dynamic' },
] as const;
```

## Plan

- [ ] 创建 `src/core/lookups/` 目录
- [ ] 创建 `src/core/lookups/status.ts` — 状态表，从 `petTypes.ts`/`petState.ts` 抽取
- [ ] 创建 `src/core/lookups/events.ts` — 事件表，从 `petEvents.ts`/`petCommon.ts`/`achievements.ts` 抽取
- [ ] 创建 `src/core/lookups/items.json` — 物品表，从 `items.ts` 抽取
- [ ] 创建 `src/core/lookups/weather.json` — 天气表，从 `weather.ts` 抽取
- [ ] 创建 `src/core/lookups/season.json` — 季节表，从 `season.ts` 抽取
- [ ] 创建 `src/core/lookups/actions.ts` — 可操作事件表，从 `petActions.ts`/`petTypes.ts` 抽取
- [ ] 更新 `src/core/lookups/index.ts` — 统一导出
- [ ] 更新 `AGENTS.md` — 添加"全局快查表"章节，说明位置、作用、读取/写入规范

## Non-Goals

- 不改写现有运行时逻辑（保持原有 `petEvents.ts`、`items.ts` 等不变）
- 不迁移消费者到新表（下个迭代）
- 不添加 UI
- 不添加测试
- 不修改 mod 系统

## Acceptance Criteria

1. `src/core/lookups/` 下 7 个文件（6 表 + 1 索引）全部创建
2. 每张表数据与现有代码一致（不引入新数据）
3. `npm run build` 通过（类型检查 + vite 构建）
4. `AGENTS.md` 新增"全局快查表"章节
5. `harnspec validate` 通过

## Notes

- 这些表专为 AI 设计：纯结构化数据，便于程序化读写
- 所有表放在 `src/core/` 下，遵循模块边界（不导入 `src/ui/` 或 `src/platform/`）
- JSON 文件用于纯数据（物品、天气、季节），TS 文件用于含类型的结构化数据（状态、事件、动作）
- 后续迭代再逐步将消费方迁移到这些表