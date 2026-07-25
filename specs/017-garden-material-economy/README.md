---
status: complete
created: 2026-07-25
priority: medium
tags:
- garden
- material
- economy
- backpack
depends_on:
- garden-time-rhythm
parent: 011-garden-entertainment-overhaul
created_at: 2026-07-25T13:26:08.744368500Z
updated_at: 2026-07-25T16:00:00.000000000Z
---
# 花园双轨素材经济

## 概述

建立双轨素材经济：宠物成长轨道（经验药水、能量浓缩、技能果实）和内容解锁轨道（许愿碎片、花园代币）。新素材整合进现有背包系统，不创建独立货币体系。

## 需求

- [ ] 定义新素材类型（作为物品添加到items.ts）：
  - 宠物成长类：经验药水、能量浓缩、技能果实
  - 内容解锁类：许愿碎片、花园代币
- [ ] 素材产出来源：
  - 特定树种掉落（调整掉落池）
  - 堆肥桶产出
  - 共生加成触发
  - 成就奖励
- [ ] 素材消耗用途：
  - 经验药水：宠物获得经验
  - 能量浓缩：恢复体力
  - 技能果实：解锁/升级Partner Schedule技能
  - 许愿碎片：解锁装饰/外观（预留接口）
  - 花园代币：花园专属消费（新地块装饰等）
- [ ] 素材整合进背包系统（kind: 'material'）
- [ ] 背包UI支持新物品类型分类显示
- [ ] 素材产出/消耗平衡（不过度通胀）

## 非目标

- 不创建独立于背包的货币系统
- 不引入素材交易/市场机制
- 不改变现有物品的经济平衡

## 技术方案

- 修改`src/core/items.ts` — 添加新素材物品定义
- 修改`src/core/mod.ts` — 允许新素材物品的效果类型
- 修改`src/core/garden.ts` — 调整掉落池添加新素材
- 修改`src/core/compostBin.ts` — 堆肥桶产出新素材
- 修改`src/ui/InventoryModal.tsx` — 背包支持material分类
- 修改`src/i18n/zh-CN.json`和`en-US.json` — 新物品文案

## 验收标准

1. 新素材物品在背包中正确显示
2. 特定树种掉落包含新素材
3. 堆肥桶可产出新素材
4. 素材消耗效果正确应用
5. 背包分类显示正确
6. 数值平衡（产出量合理，消耗有去处）
7. 构建通过
