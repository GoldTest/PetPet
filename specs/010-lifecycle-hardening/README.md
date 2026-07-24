---
status: in-progress
created: 2026-07-24
priority: medium
tags:
- lifecycle
- hardening
- reference-approach
- stability
created_at: 2026-07-24T21:00:00Z
updated_at: 2026-07-24T13:06:24.057731800Z
transitions:
- status: in-progress
  at: 2026-07-24T13:05:27.016804600Z
---
# Lifecycle 加固（参考上游思路）

## Overview

参考上游 PocPet 的 Lifecycle 加固方案，在 PetPet 中借鉴其设计思路提升系统稳定性与存档恢复能力。

上游相关提交: `db50abb` (fix: harden lifecycle timing and save recovery), `4df68e3` (fix: refine pet interaction scaling and cooldown)

上游对以下模块进行了加固:
- `src/core/petLifecycle.ts` — 生命周期时序优化与加固
- `src/core/saveCodec.ts` — 存档恢复逻辑增强
- `src/core/gameClock.ts` — 游戏时钟稳定性
- `src/core/pet.ts` — 核心时序逻辑调整
- `src/core/petActions.ts` — 动作冷却与交互缩放优化
- `src/core/petCommon.ts` — 公共时序逻辑统一
- `src/core/achievements.ts` — 成就生命周期对齐
- `src/core/dailyWishes.ts` — 日常愿望与生命周期同步
- `src/core/dateRewards.ts` — 日期奖励与生命周期对齐
- `src/core/garden.ts` — 花园与生命周期的时序协调
- `src/core/partnerSchedule.ts` — 伙伴日程与生命周期的时序协调
- `src/core/petEvents.ts` — 事件触发时序加固
- `src/core/petState.ts` — 状态转换时序优化
- `src/core/petTypes.ts` — 类型定义补充
- `src/core/petStats.ts` — 属性统计与生命周期对齐
- `src/core/promodoro.ts` — 番茄计时与生命周期协调
- `src/core/yearlyStats.ts` — 年度统计与生命周期对齐
- 多处 UI 文件同步更新

## Requirements

- [x] Replace getLocalDateKey with getEffectiveDailyDateKey in petLifecycle
- [x] Add getPetEnergyCap + getPetStatThreshold + scalePetStatDelta imports from petStats
- [x] Add resetSleepSnapshot + wakePet to petEvents imports
- [ ] Add canClaimBoostCardDailyReward import from boostCards
- [x] Add roundPetStatDisplayAmount for display rounding
- [ ] Refine advancePet loop with clock reconciliation and slice-based advancement
- [ ] Enhance save recovery logic in saveCodec.ts
- [ ] Add normalizeLegacyDailyDateKey for legacy compat
- [ ] Remove Gacha-related imports (goldenAppleGacha)
- [ ] Remove neighborGiftDailyLimit import (neighbors.ts not present yet)

## Non-Goals

- 不引入抽卡相关导入（goldenAppleGachaDailyTicketLimit, resolveDailyGachaTicket）
- 不引入 neighborGiftDailyLimit（neighbors.ts 尚未实现）
- 不改变 PetPet 现有的存档数据格式

## Technical Notes

- 上游生命周期加固覆盖面大，需聚焦核心时序问题
- PetPet 已有部分对应基础设施: `src/core/petLifecycle.ts`, `saveCodec.ts`
- 重点参考方向: save recovery, lifecycle timing, interaction cooldown scaling
- 日检脚本参考: `scripts/check-save-recovery.ts`, `scripts/check-time-guard.ts`, `scripts/check-offline-lifecycle.ts`, `scripts/check-sleep-settlement.ts`

## Acceptance Criteria

- 存档恢复逻辑增强，崩溃后状态一致
- 生命周期阶段转换稳定可预测
- 动作冷却与交互缩放优化生效
- 现有存档数据格式保持向后兼容