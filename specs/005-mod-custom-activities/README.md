---
status: planned
created: 2026-07-22
priority: high
tags:
- mod
- activities
- schema-v3
parent: 004-mod-event-system-expansion
created_at: 2026-07-22T16:03:43.177299Z
updated_at: 2026-07-22T16:04:08.624029600Z
---

# Mod 自定义活动/动作

## Overview

当前 PetPet 的宠物活动（RecentActivity）是固定的 11 种 + idle，Mod 只能覆写这些活动的图片。本 spec 让 Mod 能定义全新的活动类型，包括自定义 sprite 图片、注册到活动系统、以及在 UI 中正确渲染。

## Requirements

- [ ] Manifest schema v3 新增 `activities` 字段，允许 Mod 声明自定义活动
- [ ] 自定义活动定义包含：id（mod命名空间）、label（i18n 文案 key）、durationMs（默认动画时长）、images（所需 sprite 帧）
- [ ] 游戏核心允许自定义活动作为合法的 RecentActivity，参与状态流转
- [ ] 活动中断/覆盖机制：自定义活动可被用户交互或更重要事件正常中断
- [ ] schema v3 中 activities 是可选字段，不定义时表现与 v2 相同
- [ ] 自定义活动 ID 使用 modId:localId 命名空间避免冲突
- [ ] 活动图片按命名规则放在 zip 的 pet/ 目录下（如 pet/activity_dance.png）
- [ ] Mod 切换/卸载时，自定义活动 clean up（不再出现在活动列表中）

## Non-Goals

- 不支持逐帧动画或多帧序列（仅单图 sprite，静态显示）
- 不涉及自定义活动触发条件（见 mod-custom-event-triggers）
- 不涉及活动专属音效（留待音频系统 spec）

## Technical Notes

- 当前 RecentActivity 是 union type（src/core/petTypes.ts:122-134），需要改为可扩展机制
- petActions.ts 中 withActivity() 和 item 默认活动映射需要支持自定义活动
- PetDisplay.tsx 通过 petActivityImageKeys（mod.ts:26-38）映射活动到图片，需扩展
- mod.ts 的 petActivityImageKeys 静态数组需改为运行时从 active mod 动态合并
- saveCodec.ts 序列化/反序列化需兼容自定义活动 ID

## Acceptance Criteria

- 为 Mod 编写者可声明 `activities: [{ id: "official.mint:dance", labelKey: "activity.dance", durationMs: 5000 }]`
- 游戏运行时能识别并显示自定义活动
- 自定义活动图片从 mod zip 中正确加载
- 切换 mod 后旧 mod 的自定义活动不再可用
- 所有现有活动（11种）不受影响
