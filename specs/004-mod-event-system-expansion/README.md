---
status: planned
created: 2026-07-22
priority: high
tags:
- mod
- events
- schema-v3
- umbrella
created_at: 2026-07-22T16:03:23.874838600Z
updated_at: 2026-07-22T16:03:23.874838600Z
---

# Mod 事件系统拓展

## Overview

当前 PetPet 的 Mod 系统仅支持外观和文本覆写（宠物 sprite、物品图片、名称文本），无法影响游戏行为。本 spec 是系统性拓展的 umbrella，让 Mod 能定义自定义活动/动画事件和自定义触发条件+奖励，并引入 Manifest schema v3 来承载这些新能力。

## Requirements

- [ ] 定义 Manifest schema v3，在 v2 基础上扩展 events、activities、triggers 等字段
- [ ] schema v3 保持向后兼容——无 activities/triggers 定义的 v3 manifest 等同于 v2
- [ ] Mod 加载流程支持解析 v3 新增的 events/activities/triggers 定义
- [x] child: 005-mod-custom-activities — 自定义活动/动作
- [x] child: 006-mod-custom-event-triggers — 自定义事件触发+奖励

## Non-Goals

- 不涉及 Mod 脚本系统（JavaScript/TypeScript 可执行代码）
- 不涉及 Mod 在线商店或远程下载
- 不涉及 UI 主题/皮肤覆写
- 不涉及音频系统（留待后续独立 spec）

## Technical Notes

- 当前 RecentActivity 类型定义在 src/core/petTypes.ts:122-134，为固定 union type
- 当前事件系统集中在 src/core/petEvents.ts：DailyEncounter、TimedEvent 接口及其处理逻辑
- 活动渲染在 src/ui/PetDisplay.tsx，通过 petActivityImageKeys 映射图片
- 需要引入 schema v3（Manifest schemaVersion: 3），扩展 PetModManifestV3 接口
- 自定义活动 ID 需使用 modId:localId 命名空间（类似 custom items）

## Acceptance Criteria

- Umbrella 下的所有 child spec 完成后关闭
- schema v3 定义完整并通过 validatePetModManifest 验证
- 现有 v1/v2 mod 不受影响
