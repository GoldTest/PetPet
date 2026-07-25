---
status: planned
created: 2026-07-25
priority: high
tags:
- garden
- collection
- species-book
depends_on:
- garden-time-rhythm
parent: 011-garden-entertainment-overhaul
created_at: 2026-07-25T13:25:48.594392200Z
updated_at: 2026-07-25T13:25:48.594392200Z
---
# 全树种图鉴收集系统

## 概述

新增全树种图鉴，所有树种纳入收集体系。第一次收获某树种即解锁图鉴条目，条目包含树种详情、掉落池、偏好季节、共生关系等。全收集有额外奖励。

## 需求

- [ ] 图鉴入口：花园页面内可进入图鉴面板
- [ ] 每种树一个图鉴条目，包含：名称、描述、偏好季节、掉落池列表、收获次数统计、共生关系
- [ ] 收获即解锁：第一次收获某树种自动解锁对应条目
- [ ] 已解锁条目显示完整信息，未解锁条目显示剪影+问号
- [ ] 图鉴进度显示（已解锁/总数）
- [ ] 全收集奖励：解锁所有树种后获得特殊奖励（稀有肥料/装饰/称号等）
- [ ] 图鉴条目支持i18n（中英文）
- [ ] 图鉴状态持久化（保存到存档）

## 非目标

- 不改变树种本身的掉落机制
- 不引入过于复杂的收集分支（线性收集即可）
- 图鉴不做成就系统（成就系统已有独立机制）

## 技术方案

- 新建`src/core/speciesBook.ts` — 图鉴状态管理、解锁逻辑、奖励发放
- 新建`src/ui/SpeciesBookModal.tsx` — 图鉴UI面板（模态弹窗）
- 修改`src/core/petTypes.ts` — 扩展PetState添加speciesBook字段
- 修改`src/core/garden.ts` — harvestTree触发图鉴解锁检查
- 修改`src/core/saveCodec.ts` — 数据迁移兼容
- 修改`src/ui/GardenPage.tsx` — 添加图鉴入口按钮

## 验收标准

1. 花园页面有图鉴入口按钮
2. 点击进入图鉴面板，显示所有树种条目
3. 未解锁条目显示剪影，已解锁显示详情
4. 第一次收获新树种后图鉴自动解锁
5. 图鉴进度正确统计
6. 全收集奖励正确发放
7. 图鉴状态持久化
8. 构建通过
