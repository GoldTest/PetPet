---
status: planned
created: 2026-07-25
priority: high
tags:
- garden
- timing
- rhythm
depends_on: []
parent: 011-garden-entertainment-overhaul
created_at: 2026-07-25T13:25:14.999437200Z
updated_at: 2026-07-25T13:25:14.999437200Z
---
# 花园节奏重构：30分钟基准循环

## 概述

将花园种植循环从数小时缩短至30分钟基准，使花园从被动等待变为主动循环。常规树30min，特殊树2-4h，浇水/施肥加速按新基准重新计算，收获次数上限降至合理值。

## 需求

- [ ] 常规树（果树、护理树、礼物树）基准生长时间调整为30分钟
- [ ] 摇钱树基准生长时间调整为2小时
- [ ] 金苹果树基准生长时间调整为4小时
- [ ] 浇水加速百分比重新计算（基准缩短比例适配30min）
- [ ] 施肥加速百分比重新计算（基准缩短比例适配30min）
- [ ] 天气/季节倍率重新调整（适配短周期）
- [ ] 收获次数上限从999降至合理值（常规树8-12次，特殊树5-8次）
- [ ] 枯树判定时间调整（适配新节奏）
- [ ] Partner Schedule技能加速倍率重新适配
- [ ] BoostCard花园加成重新适配

## 非目标

- 不改变树种类型和掉落池内容（仅调整时间参数）
- 不改变地块解锁机制
- 不引入新的操作机制（由garden-mini-games负责）

## 技术方案

- 修改`garden.ts`中的时间常量：growDurationMs、harvestCooldownMs、maxHarvests
- 修改`partnerScheduleEffects.ts`中的gardenTimeMultiplier
- 修改`boostCards.ts`中的gardenGrowTimeMultiplier
- 修改天气/季节倍率表
- 数据迁移：已种植的树木时间按比例换算

## 验收标准

1. 常规树从种植到首次收获≤30分钟（无加速）
2. 施肥+浇水加速后≤15分钟
3. 收获次数上限合理
4. 天气/季节效果正确应用
5. 存档迁移后已种植树木时间正确换算
6. 构建通过
