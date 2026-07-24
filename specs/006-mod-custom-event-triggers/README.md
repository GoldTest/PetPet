---
status: planned
created: 2026-07-22
priority: high
tags:
- mod
- events
- triggers
- schema-v3
parent: 004-mod-event-system-expansion
created_at: 2026-07-22T16:04:00.420571600Z
updated_at: 2026-07-22T16:04:08.887810500Z
---

# Mod 自定义事件触发+奖励

## Overview

当前 PetPet 的随机事件（DailyEncounter、TimedEvent）是硬编码在 src/core/petEvents.ts 中的。本 spec 让 Mod 能定义自定义触发条件和对应奖励，使 Mod 可以注入专属的随机事件到游戏循环中。

## Requirements

- [ ] Manifest schema v3 新增 `events` 字段，允许 Mod 声明自定义事件池
- [ ] 自定义事件定义包含：触发时机（如 daily_encounter、offline、sleep、timed）、条件判断、奖励内容、文案模板
- [ ] 支持的触发时机：daily_encounter（每日邂逅池）、offline（离线回归池）、sleep（睡眠结算池）
- [ ] 条件判断支持：pet 等级 ≥ N、好感度 ≥ N、特定物品持有、特定季节/天气、概率权重
- [ ] 奖励类型支持：coins、hearts、item（+数量）、stat effects（hunger/mood/cleanliness/energy/health ± 值）
- [ ] Mod 的自定义事件与内置事件混合，按权重随机选取
- [ ] 文案支持 {name}、{amount}、{hearts} 等变量插值
- [ ] schema v3 中 events 是可选字段，不定义时不影响原有事件系统
- [ ] Mod 切换/卸载时，自定义事件从事件池中移除

## Non-Goals

- 不涉及 Mod 自定义游戏循环 hook（如 tick 回调）
- 不涉及 Mod 修改内置事件池（只能新增，不能删除/修改内置事件）
- 不涉及条件表达式脚本（仅预定义条件类型）
- 不涉及 Mod 自定义 UI/弹窗

## Technical Notes

- 当前事件池函数：getRandomDailyEncounter()、getRandomOfflineEvent()、getRandomDreamEvent() 在 petEvents.ts:32-123
- 事件应用函数：applyTimedEvent() 在 petEvents.ts:125-144，处理 coins/hearts/items/effects + recentEvent 文案
- 需在 manifest 中定义类似以下结构：
  ```json
  {
    "events": {
      "daily_encounter": [
        {
          "weight": 10,
          "conditions": { "minLevel": 3, "weather": "rainy" },
          "rewards": { "coins": 25, "effect": { "mood": 5 } },
          "textKey": "myMod.event.rainyDay"
        }
      ]
    }
  }
  ```
- i18n 文案在 mod 的 texts 中定义，event 引用 textKey
- saveCodec.ts 需确保自定义事件不参与存档序列化（事件定义在 manifest 中，存档只存状态）

## Acceptance Criteria

- Mod 可声明 1 个或多个自定义事件，注入到对应触发时机的事件池中
- 条件判断正确（不满足条件的事件不被选中）
- 游戏运行时事件系统随机选取包含自定义事件在内的结果
- 奖励正确应用（coins/hearts/items/effects）
- 文案正确渲染变量插值
- 卸载 Mod 后自定义事件消失
- 内置事件的概率和体验不受影响
