---
status: in-progress
created: 2026-07-24
priority: high
tags:
  - neighbor
  - daily-progression
  - inherit
created_at: 2026-07-24T21:00:00Z
updated_at: 2026-07-24T22:30:00Z
---

# Neighbor 事件系统与每日进度继承

## Overview

继承上游 PocPet 的 Neighbor 事件系统与每日进度功能，在不破坏当前 PetPet 分支的前提下完成适配。

上游相关提交: `3d8649c`, `9905826`, `1033be6`, `83b0676`, `0efbaea`

上游引入了以下模块需评估继承:
- `src/core/neighbors.ts` — 邻居宠物社交系统
- `src/core/neighborGifts.ts` — 邻居礼物系统
- `src/core/dailyReset.ts` — 每日重置逻辑
- `src/core/dailyWishes.ts` — 每日愿望系统
- `src/core/petEvents.ts` — 邻居事件类型扩展

PetPet 当前已有部分对应功能: `PartnerScheduleDock`, `usePetSession`, `useRewardController`, `partner-schedule.css`, `home.css`。

## Requirements

- [x] 评估上游 neighbors.ts 与 PetPet 现有伴侣日程系统的差异
- [x] 评估上游 dailyReset.ts 与 PetPet 现有日常逻辑的兼容性
- [x] 设计不破坏当前分支的集成方案
- [x] 实现 Neighbor 社交事件系统（自行实现或参考上游）
- [ ] 实现每日进度更新机制

## Non-Goals

- 不引入抽卡/终极系统（Gacha/Ultimate）
- 不改变当前 PetPet 架构风格

## Technical Notes

- 上游邻居系统涉及 `src/core/neighbors.ts`, `neighborGifts.ts`, `dailyReset.ts`, `dailyWishes.ts`
- PetPet 已有: PartnerScheduleDock, usePetSession, useRewardController
- 日检脚本: `scripts/check-partner-schedule.ts`

## Acceptance Criteria

- Neighbor 事件系统与 PetPet 现有架构兼容
- 每日进度机制完整实现
- 不引入 Gacha 或终极系统
