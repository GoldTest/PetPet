---
status: complete
created: 2026-07-21
priority: high
tags:
- mod
- ui
- hotload
created_at: 2026-07-21T13:49:54.687196500Z
updated_at: 2026-07-21T14:07:28.246432700Z
completed_at: 2026-07-21T14:00:50.722330200Z
transitions:
- status: in-progress
  at: 2026-07-21T13:50:36.913989500Z
- status: complete
  at: 2026-07-21T14:00:50.722330200Z
---

# Mod Hotload 切换面板

## Overview

目前 PetPet 只支持存储**一个** mod，切换 mod 需要重新导入 zip 文件，操作路径深（在设置页面里），且没有直观的切换界面。本 spec 实现多 mod 存储与运行时热切换，并提供一个美观的切换面板。

## Requirements

- [x] 多 mod 存储：modStorage 支持同时存储多个 mod（而非仅当前一个）
- [x] 切换面板组件：独立于设置的专用面板，用于浏览和切换 mod
- [x] 面板显示信息：每个 mod 卡片展示 mod 图标（pet 形象）、标题（manifest.name）、路径（文件名/来源标识）、来源（手动导入）
- [x] 面板区分 mod 来源：内置 mod（mod-mint, mod-doro）vs 用户导入的 mod
- [x] 面板入口：主界面常驻入口（如顶部栏图标或侧边按钮），而非仅藏在设置中
- [x] 热切换逻辑：切换 mod 后，pet 身份（name, birthday, recentEvent）、物品图片、状态图片、CG 图片、自定义物品均保持一致更新
- [x] 切换后无需重载页面：移除当前 PetApp 的 key remount 依赖，实现原地热切换
- [x] 面板动画：出现/消失有平滑过渡动画
- [x] 面板内支持快速导入新 mod（拖拽或文件选择）
- [x] 面板内支持删除已安装的 mod
- [x] i18n：新增切换面板相关文案，同步 zh-CN 和 en-US

## Non-Goals

- 不涉及 mod 在线商店或远程下载
- 不涉及 mod 配置（mod 自身设置页面）
- 不涉及同时加载多个 mod 叠加效果

## Technical Notes

- 当前 modStorage 使用 IndexedDB 的 "pet-mod" object store 存储图片 + localStorage 存 manifest。改为按 modId 分 key 存储多个 mod。
- 内置 mod（mod-mint, mod-doro）在构建时已有文件，运行时可通过内置列表发现。
- 切换面板使用 DialogShell 作为容器，与现有对话框风格一致（参考 SettingsModal）。

## Acceptance Criteria

- 可以安装 ≥2 个 mod，并在它们之间自由切换
- 切换面板展示每个 mod 的 pet 头像、名称、来源、路径
- 切换后所有 pet 视觉（status/activity 图片）立即更新
- 切换后物品栏、商店显示新 mod 的物品覆写
- 切换后 pet 默认名称和生日更新为 mod 配置值
- 面板打开/关闭有动画效果
