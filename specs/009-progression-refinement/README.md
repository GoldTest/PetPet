---
status: in-progress
created: 2026-07-24
priority: medium
tags:
  - progression
  - reference-approach
  - upstream-analysis
created_at: 2026-07-24T21:00:00Z
updated_at: 2026-07-24T23:00:00Z
---

# Progression 精炼（参考上游思路）

## Overview

参考上游 PocPet 的 Progression 精炼方案，在 PetPet 中借鉴其设计思路但自行实现。

上游相关提交: `3185b62` (feat: refine progression and release 1.4.7)

上游对以下模块进行了精炼:
- `src/core/classicEndgame.ts` — 经典结局流程优化
- `src/core/dateRewards.ts` — 日期奖励系统改进
- `src/core/garden.ts` — 花园系统增强
- `src/core/goldenAppleGacha.ts` — 抽卡系统（仅参考设计思路，不实现抽卡功能）
- `src/core/pet.ts` — 进度相关逻辑调整
- `src/core/petActions.ts` — 动作系统精炼
- `src/core/petEvents.ts` — 事件系统改进
- `src/core/petLifecycle.ts` — 生命周期阶段调整
- `src/core/petState.ts` — 状态机精炼
- `src/core/petTypes.ts` — 类型定义扩展
- `src/i18n/en-US.json`, `zh-CN.json` — 国际化文本更新

## Requirements

- [x] 分析上游 progression 精炼的设计思路
- [x] 评估哪些精炼点适用于 PetPet 当前架构
- [x] 借鉴日期奖励和花园系统的改进思路（排除抽卡相关）
- [x] 在不引入 Gacha/终极系统的前提下精炼进度逻辑
- [x] 确保与现有 Partner Schedule 系统兼容

## Non-Goals

- 不引入抽卡系统（Golden Apple Gacha）
- 不引入终极系统（Classic Golden Apple Exchange, Classic Trophy Cabinet）
- 不改变 PetPet 现有的进度核心逻辑

## Technical Notes

- 上游进度精炼涉及多个核心模块，需逐一评估差异
- PetPot 已有部分对应功能（PartnerSchedulePage, GardenPage, SettingsModal）
- 参考 `src/core/progression` 相关逻辑的改进方向

## Acceptance Criteria

- 进度精炼改进已应用且兼容现有架构
- 抽卡和终极系统未引入
- 现有功能不受破坏